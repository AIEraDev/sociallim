"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryGenerator = void 0;
const generative_ai_1 = require("@google/generative-ai");
const client_1 = require("@prisma/client");
class SummaryGenerator {
    constructor(apiKey) {
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.targetWordRange = [75, 150];
        this.maxSummaryLength = 500;
        this.minQualityScore = 0.6;
        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) {
            throw new Error("Gemini API key is required. Set GEMINI_API_KEY environment variable.");
        }
        this.genAI = new generative_ai_1.GoogleGenerativeAI(key);
        this.model = this.genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL,
            generationConfig: {
                temperature: 0.3,
                topP: 0.9,
                topK: 40,
                maxOutputTokens: 1024,
            },
        });
    }
    async generateSummary(summaryData) {
        if (summaryData.totalComments === 0) {
            return this.createEmptySummary();
        }
        let attempt = 0;
        let lastError = null;
        while (attempt < this.maxRetries) {
            try {
                const summaryText = await this.generateMainSummary(summaryData);
                const emotions = await this.analyzeEmotions(summaryData);
                const keyInsights = await this.generateKeyInsights(summaryData);
                const recommendations = await this.generateRecommendations(summaryData);
                const result = {
                    summary: summaryText,
                    emotions,
                    keyInsights,
                    recommendations,
                    qualityScore: 0,
                    wordCount: summaryText.split(/\s+/).length,
                };
                const validation = this.validateSummary(result, summaryData);
                result.qualityScore = validation.qualityScore;
                if (validation.isValid || attempt === this.maxRetries - 1) {
                    return result;
                }
                console.warn(`Summary quality below threshold (${validation.qualityScore}), retrying...`);
                attempt++;
                await this.delay(this.retryDelay * attempt);
            }
            catch (error) {
                attempt++;
                lastError = error;
                console.error(`Summary generation attempt ${attempt} failed:`, error);
                if (attempt >= this.maxRetries) {
                    console.error(`All ${this.maxRetries} attempts failed. Generating fallback summary.`);
                    return this.generateFallbackSummary(summaryData, lastError?.message);
                }
                await this.delay(this.retryDelay * attempt);
            }
        }
        return this.generateFallbackSummary(summaryData, lastError?.message);
    }
    async generateMainSummary(summaryData) {
        const prompt = this.createSummaryPrompt(summaryData);
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        if (!text || text.length < 10) {
            throw new Error("Empty or invalid AI response");
        }
        return this.cleanSummaryText(text);
    }
    createSummaryPrompt(summaryData) {
        const { sentimentBreakdown, themes, keywords, totalComments, filteredComments } = summaryData;
        const validComments = totalComments - filteredComments;
        const positivePercent = Math.round(sentimentBreakdown.positive * 100);
        const negativePercent = Math.round(sentimentBreakdown.negative * 100);
        const neutralPercent = Math.round(sentimentBreakdown.neutral * 100);
        const topThemes = themes
            .slice(0, 3)
            .map((theme) => `"${theme.name}" (${theme.frequency} comments, ${theme.sentiment.toLowerCase()} sentiment)`)
            .join(", ");
        const topKeywords = keywords
            .slice(0, 5)
            .map((kw) => kw.word)
            .join(", ");
        return `You are an expert content analyst. Generate a concise, insightful summary of audience sentiment based on the following comment analysis data.

ANALYSIS DATA:
- Total Comments Analyzed: ${validComments}
- Sentiment Distribution: ${positivePercent}% positive, ${negativePercent}% negative, ${neutralPercent}% neutral
- Top Themes: ${topThemes}
- Key Keywords: ${topKeywords}

REQUIREMENTS:
1. Write exactly 3-5 sentences (75-150 words)
2. Start with overall sentiment assessment
3. Highlight the most significant themes or patterns
4. Mention specific audience reactions or concerns
5. Use professional, actionable language
6. Focus on insights that help content creators understand their audience

EXAMPLE STRUCTURE:
"The audience response shows [overall sentiment] with [percentage] expressing [dominant reaction]. The most prominent themes include [key themes], indicating [audience insight]. [Specific pattern or concern]. This suggests [actionable insight for creator]."

Generate the summary now:`;
    }
    async analyzeEmotions(summaryData) {
        const emotionCounts = new Map();
        summaryData.themes.forEach((theme) => {
            const emotion = this.inferEmotionFromTheme(theme);
            if (emotion) {
                const current = emotionCounts.get(emotion.name) || { count: 0, comments: [] };
                current.count += theme.frequency;
                current.comments.push(...theme.representativeComments.slice(0, 2).map((c) => c.text));
                emotionCounts.set(emotion.name, current);
            }
        });
        const totalComments = summaryData.totalComments - summaryData.filteredComments;
        const emotions = [];
        emotionCounts.forEach((data, emotionName) => {
            const prevalence = totalComments > 0 ? (data.count / totalComments) * 100 : 0;
            emotions.push({
                name: emotionName,
                prevalence: Math.round(prevalence * 10) / 10,
                description: this.getEmotionDescription(emotionName),
                representativeComments: data.comments.slice(0, 3),
            });
        });
        return emotions.sort((a, b) => b.prevalence - a.prevalence).slice(0, 3);
    }
    inferEmotionFromTheme(theme) {
        const keywords = theme.keywords.join(" ").toLowerCase();
        const sentiment = theme.sentiment;
        if (sentiment === client_1.Sentiment.POSITIVE) {
            if (keywords.includes("love") || keywords.includes("amazing") || keywords.includes("great")) {
                return { name: "joy", score: 0.8 };
            }
            if (keywords.includes("excited") || keywords.includes("wow") || keywords.includes("incredible")) {
                return { name: "excitement", score: 0.7 };
            }
            return { name: "satisfaction", score: 0.6 };
        }
        if (sentiment === client_1.Sentiment.NEGATIVE) {
            if (keywords.includes("angry") || keywords.includes("hate") || keywords.includes("terrible")) {
                return { name: "anger", score: 0.8 };
            }
            if (keywords.includes("sad") || keywords.includes("disappointed") || keywords.includes("upset")) {
                return { name: "disappointment", score: 0.7 };
            }
            if (keywords.includes("confused") || keywords.includes("worried") || keywords.includes("concerned")) {
                return { name: "concern", score: 0.6 };
            }
            return { name: "frustration", score: 0.5 };
        }
        if (keywords.includes("question") || keywords.includes("wondering") || keywords.includes("curious")) {
            return { name: "curiosity", score: 0.5 };
        }
        return null;
    }
    getEmotionDescription(emotionName) {
        const descriptions = {
            joy: "Positive excitement and happiness",
            excitement: "High energy and enthusiasm",
            satisfaction: "Content and pleased with the content",
            anger: "Strong negative reaction and frustration",
            disappointment: "Unmet expectations and sadness",
            concern: "Worry and apprehension about issues raised",
            frustration: "Irritation with content or situation",
            curiosity: "Interest and desire to learn more",
        };
        return descriptions[emotionName] || "Mixed emotional response";
    }
    async generateKeyInsights(summaryData) {
        const insights = [];
        const { positive, negative, neutral } = summaryData.sentimentBreakdown;
        const dominantSentiment = Math.max(positive, negative, neutral);
        if (dominantSentiment === positive && positive > 0.6) {
            insights.push(`Strong positive reception with ${Math.round(positive * 100)}% positive sentiment`);
        }
        else if (dominantSentiment === negative && negative > 0.4) {
            insights.push(`Significant negative feedback requiring attention (${Math.round(negative * 100)}% negative)`);
        }
        else if (neutral > 0.5) {
            insights.push(`Mixed audience reaction with ${Math.round(neutral * 100)}% neutral responses`);
        }
        if (summaryData.themes.length > 0) {
            const topTheme = summaryData.themes[0];
            const themePercentage = Math.round((topTheme.frequency / (summaryData.totalComments - summaryData.filteredComments)) * 100);
            insights.push(`"${topTheme.name}" is the dominant discussion topic (${themePercentage}% of comments)`);
        }
        if (summaryData.keywords.length > 0) {
            const topKeyword = summaryData.keywords[0];
            insights.push(`"${topKeyword.word}" appears ${topKeyword.frequency} times, indicating strong audience focus`);
        }
        if (summaryData.filteredComments > summaryData.totalComments * 0.2) {
            insights.push(`High spam/toxic content filtered (${summaryData.filteredComments} comments removed)`);
        }
        return insights.slice(0, 4);
    }
    async generateRecommendations(summaryData) {
        const recommendations = [];
        const { sentimentBreakdown, themes } = summaryData;
        if (sentimentBreakdown.positive > 0.7) {
            recommendations.push("Leverage this positive momentum by creating similar content");
        }
        else if (sentimentBreakdown.negative > 0.4) {
            recommendations.push("Address the concerns raised in negative feedback");
            recommendations.push("Consider clarifying or improving content based on criticism");
        }
        if (themes.length > 0) {
            const topTheme = themes[0];
            if (topTheme.sentiment === client_1.Sentiment.POSITIVE) {
                recommendations.push(`Expand on the "${topTheme.name}" topic that resonates well with your audience`);
            }
            else if (topTheme.sentiment === client_1.Sentiment.NEGATIVE) {
                recommendations.push(`Address concerns about "${topTheme.name}" in future content`);
            }
        }
        const totalValid = summaryData.totalComments - summaryData.filteredComments;
        if (totalValid < 10) {
            recommendations.push("Encourage more audience engagement through questions or calls-to-action");
        }
        if (summaryData.filteredComments > summaryData.totalComments * 0.3) {
            recommendations.push("Consider moderating comments more actively to improve discussion quality");
        }
        return recommendations.slice(0, 3);
    }
    cleanSummaryText(text) {
        let cleaned = text.replace(/[*_`#]/g, "");
        cleaned = cleaned.replace(/\s+/g, " ").trim();
        cleaned = cleaned.replace(/([.!?])\s*([a-z])/g, "$1 $2");
        if (cleaned.length > 0) {
            cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }
        if (cleaned.length > 0 && !/[.!?]$/.test(cleaned)) {
            cleaned += ".";
        }
        return cleaned;
    }
    validateSummary(summary, originalData) {
        const issues = [];
        const recommendations = [];
        let qualityScore = 1.0;
        const wordCount = summary.wordCount;
        const isWithinRange = wordCount >= this.targetWordRange[0] && wordCount <= this.targetWordRange[1];
        if (!isWithinRange) {
            if (wordCount < this.targetWordRange[0]) {
                issues.push(`Summary too short: ${wordCount} words (minimum ${this.targetWordRange[0]})`);
                recommendations.push("Expand summary with more specific insights");
                qualityScore -= 0.2;
            }
            else if (wordCount > this.targetWordRange[1]) {
                issues.push(`Summary too long: ${wordCount} words (maximum ${this.targetWordRange[1]})`);
                recommendations.push("Condense summary to focus on key points");
                qualityScore -= 0.1;
            }
        }
        if (summary.summary.length < 50) {
            issues.push("Summary content appears too brief");
            qualityScore -= 0.3;
        }
        if (!summary.summary.includes("%") && originalData.totalComments > 0) {
            issues.push("Summary lacks specific percentage data");
            recommendations.push("Include specific sentiment percentages");
            qualityScore -= 0.1;
        }
        if (summary.emotions.length === 0 && originalData.totalComments > 5) {
            issues.push("No emotions detected despite sufficient comment volume");
            recommendations.push("Improve emotion detection methodology");
            qualityScore -= 0.15;
        }
        const totalPrevalence = summary.emotions.reduce((sum, emotion) => sum + emotion.prevalence, 0);
        if (totalPrevalence > 100) {
            issues.push("Emotion prevalence percentages exceed 100%");
            qualityScore -= 0.2;
        }
        if (summary.keyInsights.length === 0) {
            issues.push("No key insights generated");
            recommendations.push("Enhance insight generation logic");
            qualityScore -= 0.1;
        }
        if (summary.recommendations.length === 0 && originalData.totalComments > 0) {
            issues.push("No actionable recommendations provided");
            recommendations.push("Generate content creator recommendations");
            qualityScore -= 0.1;
        }
        qualityScore = Math.max(0, Math.min(1, qualityScore));
        return {
            isValid: issues.length === 0 && qualityScore >= this.minQualityScore,
            issues,
            qualityScore,
            recommendations,
            lengthCheck: {
                wordCount,
                isWithinRange,
                targetRange: this.targetWordRange,
            },
        };
    }
    createEmptySummary() {
        return {
            summary: "No comments available for analysis. Consider encouraging audience engagement through questions or calls-to-action.",
            emotions: [],
            keyInsights: ["No comment data available for analysis"],
            recommendations: ["Encourage audience engagement", "Ask questions in your content", "Use calls-to-action to prompt responses"],
            qualityScore: 0.5,
            wordCount: 15,
        };
    }
    generateFallbackSummary(summaryData, errorMessage) {
        const { sentimentBreakdown, themes, totalComments, filteredComments } = summaryData;
        const validComments = totalComments - filteredComments;
        if (validComments === 0) {
            return this.createEmptySummary();
        }
        const positivePercent = Math.round(sentimentBreakdown.positive * 100);
        const negativePercent = Math.round(sentimentBreakdown.negative * 100);
        const neutralPercent = Math.round(sentimentBreakdown.neutral * 100);
        let dominantSentiment = "mixed";
        if (sentimentBreakdown.positive > 0.5)
            dominantSentiment = "positive";
        else if (sentimentBreakdown.negative > 0.4)
            dominantSentiment = "negative";
        else if (sentimentBreakdown.neutral > 0.5)
            dominantSentiment = "neutral";
        const topTheme = themes.length > 0 ? themes[0].name : "general discussion";
        const fallbackSummary = `The audience response shows ${dominantSentiment} sentiment with ${positivePercent}% positive, ${negativePercent}% negative, and ${neutralPercent}% neutral reactions across ${validComments} comments. The most prominent theme is "${topTheme}" which indicates key areas of audience interest. This analysis provides insights into how your content resonates with viewers.`;
        const emotions = [];
        if (sentimentBreakdown.positive > 0.3) {
            emotions.push({
                name: "satisfaction",
                prevalence: positivePercent,
                description: "Content and pleased with the content",
                representativeComments: [],
            });
        }
        if (sentimentBreakdown.negative > 0.2) {
            emotions.push({
                name: "concern",
                prevalence: negativePercent,
                description: "Worry and apprehension about issues raised",
                representativeComments: [],
            });
        }
        console.warn(`Using fallback summary generation due to error: ${errorMessage}`);
        return {
            summary: fallbackSummary,
            emotions: emotions.slice(0, 3),
            keyInsights: [`${dominantSentiment.charAt(0).toUpperCase() + dominantSentiment.slice(1)} audience sentiment detected`, `"${topTheme}" is the primary discussion topic`],
            recommendations: [dominantSentiment === "positive" ? "Continue creating similar content" : "Address audience concerns", "Monitor comment patterns for content optimization"],
            qualityScore: 0.4,
            wordCount: fallbackSummary.split(/\s+/).length,
        };
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    getConfiguration() {
        return {
            maxRetries: this.maxRetries,
            retryDelay: this.retryDelay,
            targetWordRange: this.targetWordRange,
            maxSummaryLength: this.maxSummaryLength,
            minQualityScore: this.minQualityScore,
        };
    }
    updateConfiguration(config) {
        if (config.targetWordRange && config.targetWordRange[0] > 0 && config.targetWordRange[1] > config.targetWordRange[0]) {
            this.targetWordRange = config.targetWordRange;
        }
        if (config.maxSummaryLength && config.maxSummaryLength > 100) {
            this.maxSummaryLength = config.maxSummaryLength;
        }
        if (config.minQualityScore && config.minQualityScore >= 0 && config.minQualityScore <= 1) {
            this.minQualityScore = config.minQualityScore;
        }
    }
}
exports.SummaryGenerator = SummaryGenerator;
//# sourceMappingURL=summaryGenerator.js.map