"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SentimentAnalyzer = void 0;
const generative_ai_1 = require("@google/generative-ai");
const client_1 = require("@prisma/client");
class SentimentAnalyzer {
    constructor(apiKey) {
        this.batchSize = 10;
        this.maxRetries = 3;
        this.retryDelay = 1000;
        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) {
            throw new Error("Gemini API key is required. Set GEMINI_API_KEY environment variable.");
        }
        this.genAI = new generative_ai_1.GoogleGenerativeAI(key);
        this.model = this.genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL,
            generationConfig: {
                temperature: 0.1,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 2048,
            },
        });
        this.promptTemplates = this.initializePromptTemplates();
    }
    async analyzeBatchSentiment(comments) {
        if (comments.length === 0) {
            return {
                results: [],
                summary: {
                    totalAnalyzed: 0,
                    averageConfidence: 0,
                    sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
                },
            };
        }
        const results = [];
        for (let i = 0; i < comments.length; i += this.batchSize) {
            const batch = comments.slice(i, i + this.batchSize);
            const batchResults = await this.processBatch(batch);
            results.push(...batchResults);
            if (i + this.batchSize < comments.length) {
                await this.delay(500);
            }
        }
        const summary = this.calculateSummary(results);
        return {
            results,
            summary,
        };
    }
    async analyzeSingleComment(comment) {
        const results = await this.analyzeBatchSentiment([comment]);
        return results.results[0];
    }
    async processBatch(comments) {
        const prompt = this.createBatchSentimentPrompt(comments);
        let attempt = 0;
        let lastError = null;
        while (attempt < this.maxRetries) {
            try {
                const startTime = Date.now();
                const result = (await Promise.race([this.model.generateContent(prompt), new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 30000))]));
                const response = await result.response;
                const text = response.text();
                const processingTime = Date.now() - startTime;
                console.log(`Batch processing completed in ${processingTime}ms for ${comments.length} comments`);
                const results = this.parseBatchSentimentResponse(text, comments);
                const validation = this.validateBatchResults(results, comments);
                if (!validation.isValid && validation.qualityScore < 0.5) {
                    console.warn(`Low quality results detected (score: ${validation.qualityScore}):`, validation.issues);
                }
                return results;
            }
            catch (error) {
                attempt++;
                lastError = error;
                console.error(`Sentiment analysis attempt ${attempt} failed:`, error);
                const isRateLimit = error instanceof Error && (error.message.includes("rate limit") || error.message.includes("quota"));
                if (attempt >= this.maxRetries) {
                    console.error(`All ${this.maxRetries} attempts failed. Last error:`, lastError);
                    return comments.map((comment) => this.createFallbackResult(comment, lastError?.message));
                }
                const baseDelay = isRateLimit ? this.retryDelay * 5 : this.retryDelay;
                const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
                await this.delay(delay);
            }
        }
        return comments.map((comment) => this.createFallbackResult(comment, lastError?.message));
    }
    initializePromptTemplates() {
        return {
            batchSentiment: `You are an expert sentiment analysis AI. Analyze the sentiment and emotions of the following comments with high accuracy.

For each comment, provide:
1. Sentiment: POSITIVE, NEGATIVE, or NEUTRAL (be precise - neutral should only be used for truly ambiguous content)
2. Confidence: A score from 0.0 to 1.0 (be conservative - only use high confidence for clear sentiment)
3. Emotions: Up to 3 primary emotions with scores from this list: joy, anger, sadness, fear, surprise, disgust, trust, anticipation

Guidelines:
- Consider context, sarcasm, and implied meaning
- Account for emojis and internet slang
- Be consistent across similar comments
- Higher confidence for clear emotional language
- Lower confidence for subtle or mixed sentiment

Comments to analyze:
{COMMENTS}

Respond with one JSON object per line in this exact format:
{"commentIndex": 1, "sentiment": "POSITIVE", "confidence": 0.85, "emotions": [{"name": "joy", "score": 0.8}]}

No additional text or formatting.`,
            singleSentiment: `Analyze this single comment for sentiment and emotions with high precision:

Comment: "{COMMENT}"

Provide detailed analysis considering:
- Explicit emotional language
- Implicit sentiment through context
- Sarcasm or irony detection
- Cultural and linguistic nuances

Respond in JSON format:
{"sentiment": "POSITIVE|NEGATIVE|NEUTRAL", "confidence": 0.85, "emotions": [{"name": "emotion", "score": 0.8}]}`,
            validation: `Review these sentiment analysis results for quality and consistency:

{RESULTS}

Identify any issues with:
- Inconsistent sentiment classification
- Unrealistic confidence scores
- Missing or inappropriate emotions
- Potential analysis errors

Provide validation feedback in JSON format:
{"isValid": true, "issues": [], "qualityScore": 0.9, "recommendations": []}`,
        };
    }
    createBatchSentimentPrompt(comments) {
        const commentsText = comments.map((comment, index) => `${index + 1}. "${comment.text}"`).join("\n");
        return this.promptTemplates.batchSentiment.replace("{COMMENTS}", commentsText);
    }
    parseBatchSentimentResponse(response, comments) {
        const results = [];
        const lines = response.trim().split("\n");
        for (const line of lines) {
            if (!line.trim())
                continue;
            try {
                const parsed = JSON.parse(line.trim());
                const commentIndex = parsed.commentIndex - 1;
                if (commentIndex >= 0 && commentIndex < comments.length) {
                    const sentiment = this.normalizeSentiment(parsed.sentiment);
                    const confidence = Math.max(0, Math.min(1, parsed.confidence || 0.5));
                    const emotions = this.normalizeEmotions(parsed.emotions || []);
                    results[commentIndex] = {
                        sentiment,
                        confidence,
                        emotions,
                    };
                }
            }
            catch (error) {
                console.error("Failed to parse sentiment response line:", line, error);
            }
        }
        for (let i = 0; i < comments.length; i++) {
            if (!results[i]) {
                results[i] = this.createFallbackResult(comments[i]);
            }
        }
        return results;
    }
    normalizeSentiment(sentiment) {
        const normalized = sentiment?.toUpperCase();
        switch (normalized) {
            case "POSITIVE":
                return client_1.Sentiment.POSITIVE;
            case "NEGATIVE":
                return client_1.Sentiment.NEGATIVE;
            case "NEUTRAL":
            default:
                return client_1.Sentiment.NEUTRAL;
        }
    }
    normalizeEmotions(emotions) {
        const validEmotions = ["joy", "anger", "sadness", "fear", "surprise", "disgust", "trust", "anticipation"];
        return emotions
            .filter((emotion) => emotion.name && validEmotions.includes(emotion.name.toLowerCase()))
            .map((emotion) => ({
            name: emotion.name.toLowerCase(),
            score: Math.max(0, Math.min(1, emotion.score || 0)),
        }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
    }
    validateBatchResults(results, comments) {
        const issues = [];
        const recommendations = [];
        let qualityScore = 1.0;
        if (results.length !== comments.length) {
            issues.push(`Result count mismatch: expected ${comments.length}, got ${results.length}`);
            qualityScore -= 0.5;
        }
        const confidenceScores = results.map((r) => r.confidence);
        const avgConfidence = confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length;
        const lowConfidenceCount = confidenceScores.filter((conf) => conf < 0.3).length;
        if (avgConfidence < 0.5) {
            issues.push(`Low average confidence: ${avgConfidence.toFixed(2)}`);
            recommendations.push("Consider using more specific prompts or preprocessing comments");
            qualityScore -= 0.2;
        }
        if (lowConfidenceCount > results.length * 0.4) {
            issues.push(`${lowConfidenceCount} results have very low confidence (<0.3)`);
            recommendations.push("Review low-confidence results manually");
            qualityScore -= 0.1;
        }
        const sentimentCounts = results.reduce((counts, result) => {
            counts[result.sentiment]++;
            return counts;
        }, { [client_1.Sentiment.POSITIVE]: 0, [client_1.Sentiment.NEGATIVE]: 0, [client_1.Sentiment.NEUTRAL]: 0 });
        const maxSentimentRatio = Math.max(...Object.values(sentimentCounts)) / results.length;
        if (maxSentimentRatio > 0.95) {
            issues.push(`Extremely skewed sentiment distribution: ${maxSentimentRatio.toFixed(2)}`);
            recommendations.push("Verify comment diversity and analysis accuracy");
            qualityScore -= 0.15;
        }
        const resultsWithEmotions = results.filter((r) => r.emotions.length > 0).length;
        if (resultsWithEmotions < results.length * 0.7) {
            issues.push(`${results.length - resultsWithEmotions} results missing emotion data`);
            recommendations.push("Improve emotion detection in prompts");
            qualityScore -= 0.1;
        }
        return {
            isValid: issues.length === 0,
            issues,
            qualityScore: Math.max(0, qualityScore),
            recommendations,
        };
    }
    createFallbackResult(comment, errorMessage) {
        const text = comment.text.toLowerCase();
        let sentiment = client_1.Sentiment.NEUTRAL;
        let confidence = 0.3;
        const positiveWords = ["good", "great", "awesome", "love", "like", "amazing", "excellent", "fantastic", "wonderful"];
        const negativeWords = ["bad", "hate", "terrible", "awful", "horrible", "disgusting", "stupid", "worst"];
        const positiveCount = positiveWords.filter((word) => text.includes(word)).length;
        const negativeCount = negativeWords.filter((word) => text.includes(word)).length;
        if (positiveCount > negativeCount) {
            sentiment = client_1.Sentiment.POSITIVE;
            confidence = Math.min(0.6, 0.3 + positiveCount * 0.1);
        }
        else if (negativeCount > positiveCount) {
            sentiment = client_1.Sentiment.NEGATIVE;
            confidence = Math.min(0.6, 0.3 + negativeCount * 0.1);
        }
        const emotions = [];
        if (sentiment === client_1.Sentiment.POSITIVE) {
            emotions.push({ name: "joy", score: confidence });
        }
        else if (sentiment === client_1.Sentiment.NEGATIVE) {
            emotions.push({ name: "anger", score: confidence });
        }
        const result = {
            sentiment,
            confidence,
            emotions,
        };
        console.warn(`Using fallback analysis for comment: "${comment.text.substring(0, 50)}..."`, {
            errorMessage,
            resultSentiment: sentiment,
            resultConfidence: confidence,
        });
        return result;
    }
    calculateSummary(results) {
        if (results.length === 0) {
            return {
                totalAnalyzed: 0,
                averageConfidence: 0,
                sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
            };
        }
        const totalConfidence = results.reduce((sum, result) => sum + result.confidence, 0);
        const averageConfidence = totalConfidence / results.length;
        const sentimentCounts = results.reduce((counts, result) => {
            counts[result.sentiment.toLowerCase()]++;
            return counts;
        }, { positive: 0, negative: 0, neutral: 0 });
        const total = results.length;
        const sentimentDistribution = {
            positive: sentimentCounts.positive / total,
            negative: sentimentCounts.negative / total,
            neutral: sentimentCounts.neutral / total,
        };
        return {
            totalAnalyzed: total,
            averageConfidence,
            sentimentDistribution,
        };
    }
    validateResults(results) {
        const issues = [];
        const recommendations = [];
        let qualityScore = 1.0;
        if (results.length === 0) {
            return {
                isValid: false,
                issues: ["No results to validate"],
                qualityScore: 0,
                recommendations: ["Ensure comments are provided for analysis"],
            };
        }
        const lowConfidenceCount = results.filter((r) => r.confidence < 0.3).length;
        const lowConfidenceRatio = lowConfidenceCount / results.length;
        if (lowConfidenceRatio > 0.5) {
            issues.push("More than 50% of results have low confidence scores");
            recommendations.push("Consider improving comment preprocessing or using more specific prompts");
            qualityScore -= 0.3;
        }
        const sentimentCounts = results.reduce((counts, result) => {
            counts[result.sentiment]++;
            return counts;
        }, { [client_1.Sentiment.POSITIVE]: 0, [client_1.Sentiment.NEGATIVE]: 0, [client_1.Sentiment.NEUTRAL]: 0 });
        const maxSentimentRatio = Math.max(...Object.values(sentimentCounts)) / results.length;
        if (maxSentimentRatio > 0.9) {
            issues.push("Sentiment distribution is highly skewed - may indicate analysis issues");
            recommendations.push("Review comment diversity and analysis methodology");
            qualityScore -= 0.2;
        }
        const resultsWithoutEmotions = results.filter((r) => r.emotions.length === 0).length;
        if (resultsWithoutEmotions > results.length * 0.3) {
            issues.push("More than 30% of results lack emotion data");
            recommendations.push("Enhance emotion detection in analysis prompts");
            qualityScore -= 0.1;
        }
        const emotionScores = results.flatMap((r) => r.emotions.map((e) => e.score));
        const avgEmotionScore = emotionScores.length > 0 ? emotionScores.reduce((sum, score) => sum + score, 0) / emotionScores.length : 0;
        if (avgEmotionScore < 0.3) {
            issues.push("Emotion scores are consistently low");
            recommendations.push("Review emotion detection thresholds");
            qualityScore -= 0.05;
        }
        const invalidConfidenceCount = results.filter((r) => r.confidence < 0 || r.confidence > 1).length;
        if (invalidConfidenceCount > 0) {
            issues.push(`${invalidConfidenceCount} results have invalid confidence scores`);
            qualityScore -= 0.2;
        }
        const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
        qualityScore = Math.max(0, qualityScore * averageConfidence);
        if (qualityScore < 0.7) {
            recommendations.push("Consider manual review of results");
        }
        if (qualityScore < 0.5) {
            recommendations.push("Results may need significant improvement - consider reprocessing");
        }
        return {
            isValid: issues.length === 0,
            issues,
            qualityScore,
            recommendations,
        };
    }
    async analyzeWithAdvancedProcessing(comments, options = {}) {
        const startTime = Date.now();
        const { enableValidation = true, confidenceThreshold = 0.5, retryLowConfidence = true } = options;
        let retryCount = 0;
        let fallbackCount = 0;
        const batchResult = await this.analyzeBatchSentiment(comments);
        let results = batchResult.results;
        if (retryLowConfidence) {
            const lowConfidenceIndices = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.confidence < confidenceThreshold)
                .map(({ index }) => index);
            if (lowConfidenceIndices.length > 0) {
                console.log(`Retrying ${lowConfidenceIndices.length} low confidence results`);
                for (const index of lowConfidenceIndices) {
                    try {
                        const retryResult = await this.analyzeSingleComment(comments[index]);
                        if (retryResult.confidence > results[index].confidence) {
                            results[index] = retryResult;
                            retryCount++;
                        }
                    }
                    catch (error) {
                        console.warn(`Retry failed for comment ${index}:`, error);
                        fallbackCount++;
                    }
                }
            }
        }
        const validation = enableValidation ? this.validateResults(results) : { isValid: true, issues: [], qualityScore: 1.0, recommendations: [] };
        const processingTime = Date.now() - startTime;
        const batchCount = Math.ceil(comments.length / this.batchSize);
        return {
            results,
            summary: batchResult.summary,
            validation,
            processingMetrics: {
                totalProcessingTime: processingTime,
                batchCount,
                retryCount,
                fallbackCount,
            },
        };
    }
    getProcessingStats() {
        return {
            batchSize: this.batchSize,
            maxRetries: this.maxRetries,
            retryDelay: this.retryDelay,
        };
    }
    updateProcessingConfig(config) {
        if (config.batchSize && config.batchSize > 0 && config.batchSize <= 50) {
            this.batchSize = config.batchSize;
        }
        if (config.maxRetries && config.maxRetries > 0 && config.maxRetries <= 10) {
            this.maxRetries = config.maxRetries;
        }
        if (config.retryDelay && config.retryDelay >= 100 && config.retryDelay <= 10000) {
            this.retryDelay = config.retryDelay;
        }
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.SentimentAnalyzer = SentimentAnalyzer;
//# sourceMappingURL=sentimentAnalyzer.js.map