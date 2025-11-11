"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeAnalyzer = void 0;
const client_1 = require("@prisma/client");
class ThemeAnalyzer {
    constructor() {
        this.minClusterSize = 2;
        this.maxClusters = 10;
        this.similarityThreshold = 0.15;
        this.minKeywordFrequency = 2;
        this.maxKeywords = 50;
        this.stopWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can", "this", "that", "these", "those", "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them", "my", "your", "his", "her", "its", "our", "their", "mine", "yours", "hers", "ours", "theirs", "am", "so", "very", "just", "now", "then", "here", "there", "where", "when", "why", "how", "what", "who", "which", "all", "any", "some", "no", "not", "only", "own", "other", "such", "same", "different", "new", "old", "first", "last", "long", "short", "high", "low", "big", "small", "large", "little", "good", "bad", "right", "wrong", "true", "false"]);
    }
    async analyzeThemes(comments, sentimentResults) {
        if (comments.length === 0) {
            return {
                themes: [],
                keywords: [],
                summary: {
                    totalThemes: 0,
                    totalKeywords: 0,
                    averageCoherence: 0,
                    dominantSentiment: client_1.Sentiment.NEUTRAL,
                },
            };
        }
        const preprocessedComments = this.preprocessCommentsForClustering(comments);
        const keywords = this.extractKeywords(preprocessedComments, sentimentResults);
        const similarityMatrix = this.calculateSimilarityMatrix(preprocessedComments);
        const clusters = this.performClustering(preprocessedComments, similarityMatrix, sentimentResults);
        const themes = await this.generateThemeMetadata(clusters, keywords);
        const summary = this.calculateSummary(themes, keywords);
        return {
            themes,
            keywords: keywords.slice(0, this.maxKeywords),
            summary,
        };
    }
    preprocessCommentsForClustering(comments) {
        return comments.map((comment) => {
            const normalizedText = comment.text
                .toLowerCase()
                .replace(/[^\w\s]/g, " ")
                .replace(/\s+/g, " ")
                .trim();
            const tokens = normalizedText.split(" ").filter((token) => token.length > 2 && !this.stopWords.has(token) && !/^\d+$/.test(token));
            return {
                ...comment,
                tokens,
                normalizedText,
            };
        });
    }
    extractKeywords(preprocessedComments, sentimentResults) {
        const termFrequencies = new Map();
        const documentFrequencies = new Map();
        const termSentiments = new Map();
        const termContexts = new Map();
        preprocessedComments.forEach((comment, commentIndex) => {
            const uniqueTerms = new Set(comment.tokens);
            const sentiment = sentimentResults[commentIndex]?.sentiment || client_1.Sentiment.NEUTRAL;
            comment.tokens.forEach((token) => {
                if (!termFrequencies.has(token)) {
                    termFrequencies.set(token, new Map());
                }
                const commentTF = termFrequencies.get(token);
                commentTF.set(commentIndex, (commentTF.get(commentIndex) || 0) + 1);
                if (!termSentiments.has(token)) {
                    termSentiments.set(token, { positive: 0, negative: 0, neutral: 0 });
                }
                const sentimentCount = termSentiments.get(token);
                sentimentCount[sentiment.toLowerCase()]++;
                if (!termContexts.has(token)) {
                    termContexts.set(token, new Set());
                }
                const tokenIndex = comment.tokens.indexOf(token);
                const contextStart = Math.max(0, tokenIndex - 2);
                const contextEnd = Math.min(comment.tokens.length, tokenIndex + 3);
                const context = comment.tokens.slice(contextStart, contextEnd).join(" ");
                termContexts.get(token).add(context);
            });
            uniqueTerms.forEach((token) => {
                documentFrequencies.set(token, (documentFrequencies.get(token) || 0) + 1);
            });
        });
        const keywords = [];
        const totalDocuments = preprocessedComments.length;
        termFrequencies.forEach((commentTFs, term) => {
            const documentFreq = documentFrequencies.get(term) || 0;
            const totalTermFreq = Array.from(commentTFs.values()).reduce((sum, freq) => sum + freq, 0);
            if (totalTermFreq < this.minKeywordFrequency || term.length <= 2)
                return;
            const tf = totalTermFreq / preprocessedComments.reduce((sum, comment) => sum + comment.tokens.length, 0);
            const idf = Math.log(totalDocuments / documentFreq);
            const tfidfScore = tf * idf;
            const sentimentCounts = termSentiments.get(term);
            const maxSentimentCount = Math.max(sentimentCounts.positive, sentimentCounts.negative, sentimentCounts.neutral);
            let dominantSentiment;
            let sentimentScore;
            if (maxSentimentCount === sentimentCounts.positive) {
                dominantSentiment = client_1.Sentiment.POSITIVE;
                sentimentScore = sentimentCounts.positive / (sentimentCounts.positive + sentimentCounts.negative + sentimentCounts.neutral);
            }
            else if (maxSentimentCount === sentimentCounts.negative) {
                dominantSentiment = client_1.Sentiment.NEGATIVE;
                sentimentScore = sentimentCounts.negative / (sentimentCounts.positive + sentimentCounts.negative + sentimentCounts.neutral);
            }
            else {
                dominantSentiment = client_1.Sentiment.NEUTRAL;
                sentimentScore = sentimentCounts.neutral / (sentimentCounts.positive + sentimentCounts.negative + sentimentCounts.neutral);
            }
            keywords.push({
                word: term,
                frequency: totalTermFreq,
                sentiment: dominantSentiment,
                contexts: Array.from(termContexts.get(term) || []).slice(0, 5),
                tfidfScore,
                sentimentScore,
            });
        });
        return keywords.sort((a, b) => b.tfidfScore - a.tfidfScore).slice(0, this.maxKeywords);
    }
    calculateSimilarityMatrix(preprocessedComments) {
        const matrix = [];
        for (let i = 0; i < preprocessedComments.length; i++) {
            matrix[i] = [];
            for (let j = 0; j < preprocessedComments.length; j++) {
                if (i === j) {
                    matrix[i][j] = 1.0;
                }
                else {
                    matrix[i][j] = this.calculateJaccardSimilarity(preprocessedComments[i].tokens, preprocessedComments[j].tokens);
                }
            }
        }
        return matrix;
    }
    calculateJaccardSimilarity(tokens1, tokens2) {
        const set1 = new Set(tokens1);
        const set2 = new Set(tokens2);
        const intersection = new Set([...set1].filter((token) => set2.has(token)));
        const union = new Set([...set1, ...set2]);
        return union.size === 0 ? 0 : intersection.size / union.size;
    }
    performClustering(preprocessedComments, similarityMatrix, sentimentResults) {
        const clusters = [];
        const assigned = new Set();
        for (let i = 0; i < preprocessedComments.length; i++) {
            if (assigned.has(i))
                continue;
            const cluster = {
                comments: [preprocessedComments[i]],
                avgSimilarity: 0,
                dominantSentiment: sentimentResults[i]?.sentiment || client_1.Sentiment.NEUTRAL,
            };
            const clusterIndices = [i];
            assigned.add(i);
            for (let j = i + 1; j < preprocessedComments.length; j++) {
                if (assigned.has(j))
                    continue;
                const similarity = similarityMatrix[i][j];
                if (similarity >= this.similarityThreshold) {
                    cluster.comments.push(preprocessedComments[j]);
                    clusterIndices.push(j);
                    assigned.add(j);
                }
            }
            if (cluster.comments.length === 1) {
                for (let j = i + 1; j < preprocessedComments.length; j++) {
                    if (assigned.has(j))
                        continue;
                    const sharedTokens = preprocessedComments[i].tokens.filter((token) => preprocessedComments[j].tokens.includes(token));
                    const sameSentiment = (sentimentResults[i]?.sentiment || client_1.Sentiment.NEUTRAL) === (sentimentResults[j]?.sentiment || client_1.Sentiment.NEUTRAL);
                    if (sharedTokens.length >= 1 && (sameSentiment || sharedTokens.length >= 2)) {
                        cluster.comments.push(preprocessedComments[j]);
                        clusterIndices.push(j);
                        assigned.add(j);
                    }
                }
            }
            const hasMeaningfulTokens = preprocessedComments[i].tokens.length > 0;
            const shouldKeepCluster = cluster.comments.length >= this.minClusterSize || (preprocessedComments.length <= 6 && cluster.comments.length >= 1 && hasMeaningfulTokens);
            if (shouldKeepCluster) {
                let totalSimilarity = 0;
                let pairCount = 0;
                for (let x = 0; x < clusterIndices.length; x++) {
                    for (let y = x + 1; y < clusterIndices.length; y++) {
                        totalSimilarity += similarityMatrix[clusterIndices[x]][clusterIndices[y]];
                        pairCount++;
                    }
                }
                cluster.avgSimilarity = pairCount > 0 ? totalSimilarity / pairCount : 0.5;
                const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
                clusterIndices.forEach((index) => {
                    const sentiment = sentimentResults[index]?.sentiment || client_1.Sentiment.NEUTRAL;
                    sentimentCounts[sentiment.toLowerCase()]++;
                });
                const maxCount = Math.max(sentimentCounts.positive, sentimentCounts.negative, sentimentCounts.neutral);
                if (maxCount === sentimentCounts.positive) {
                    cluster.dominantSentiment = client_1.Sentiment.POSITIVE;
                }
                else if (maxCount === sentimentCounts.negative) {
                    cluster.dominantSentiment = client_1.Sentiment.NEGATIVE;
                }
                else {
                    cluster.dominantSentiment = client_1.Sentiment.NEUTRAL;
                }
                clusters.push(cluster);
            }
            if (clusters.length >= this.maxClusters)
                break;
        }
        return clusters.sort((a, b) => b.comments.length - a.comments.length);
    }
    async generateThemeMetadata(clusters, keywords) {
        const themes = [];
        for (let i = 0; i < clusters.length; i++) {
            const cluster = clusters[i];
            const themeName = this.generateThemeName(cluster.comments, keywords);
            const representativeComments = this.selectRepresentativeComments(cluster.comments, 3);
            const themeKeywords = this.extractThemeKeywords(cluster.comments, keywords);
            themes.push({
                id: `theme_${i + 1}`,
                name: themeName,
                comments: cluster.comments,
                sentiment: cluster.dominantSentiment,
                frequency: cluster.comments.length,
                representativeComments,
                keywords: themeKeywords,
                coherenceScore: cluster.avgSimilarity,
            });
        }
        return themes;
    }
    generateThemeName(comments, keywords) {
        const wordFreq = new Map();
        comments.forEach((comment) => {
            const words = comment.text
                .toLowerCase()
                .replace(/[^\w\s]/g, " ")
                .split(/\s+/)
                .filter((word) => word.length > 2 && !this.stopWords.has(word) && !/^\d+$/.test(word));
            words.forEach((word) => {
                wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
            });
        });
        const topWords = Array.from(wordFreq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([word]) => word);
        const relevantKeywords = keywords
            .filter((kw) => topWords.includes(kw.word))
            .slice(0, 2)
            .map((kw) => kw.word);
        if (relevantKeywords.length > 0) {
            return relevantKeywords.join(" & ").replace(/\b\w/g, (l) => l.toUpperCase());
        }
        if (topWords.length > 0) {
            return topWords
                .slice(0, 2)
                .join(" & ")
                .replace(/\b\w/g, (l) => l.toUpperCase());
        }
        return `Theme ${Math.random().toString(36).substr(2, 5)}`;
    }
    selectRepresentativeComments(comments, maxCount) {
        if (comments.length <= maxCount) {
            return [...comments];
        }
        const scored = comments.map((comment) => ({
            comment,
            score: comment.text.length * 0.7 + comment.likeCount * 0.3,
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, maxCount).map((item) => item.comment);
    }
    extractThemeKeywords(comments, allKeywords) {
        const themeText = comments.map((c) => c.text.toLowerCase()).join(" ");
        return allKeywords
            .filter((keyword) => themeText.includes(keyword.word))
            .sort((a, b) => b.tfidfScore - a.tfidfScore)
            .slice(0, 5)
            .map((kw) => kw.word);
    }
    calculateSummary(themes, keywords) {
        const totalThemes = themes.length;
        const totalKeywords = keywords.length;
        const averageCoherence = themes.length > 0 ? themes.reduce((sum, theme) => sum + theme.coherenceScore, 0) / themes.length : 0;
        const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
        themes.forEach((theme) => {
            sentimentCounts[theme.sentiment.toLowerCase()] += theme.frequency;
        });
        let dominantSentiment = client_1.Sentiment.NEUTRAL;
        const maxCount = Math.max(sentimentCounts.positive, sentimentCounts.negative, sentimentCounts.neutral);
        if (maxCount === sentimentCounts.positive) {
            dominantSentiment = client_1.Sentiment.POSITIVE;
        }
        else if (maxCount === sentimentCounts.negative) {
            dominantSentiment = client_1.Sentiment.NEGATIVE;
        }
        return {
            totalThemes,
            totalKeywords,
            averageCoherence,
            dominantSentiment,
        };
    }
    async analyzeThemesWithConfig(comments, sentimentResults, config = {}) {
        const originalConfig = {
            minClusterSize: this.minClusterSize,
            maxClusters: this.maxClusters,
            similarityThreshold: this.similarityThreshold,
            maxKeywords: this.maxKeywords,
        };
        if (config.minClusterSize !== undefined) {
            this.minClusterSize = Math.max(1, config.minClusterSize);
        }
        if (config.maxClusters !== undefined) {
            this.maxClusters = Math.max(1, Math.min(20, config.maxClusters));
        }
        if (config.similarityThreshold !== undefined) {
            this.similarityThreshold = Math.max(0.1, Math.min(0.9, config.similarityThreshold));
        }
        if (config.maxKeywords !== undefined) {
            this.maxKeywords = Math.max(10, Math.min(100, config.maxKeywords));
        }
        try {
            const result = await this.analyzeThemes(comments, sentimentResults);
            return result;
        }
        finally {
            this.minClusterSize = originalConfig.minClusterSize;
            this.maxClusters = originalConfig.maxClusters;
            this.similarityThreshold = originalConfig.similarityThreshold;
            this.maxKeywords = originalConfig.maxKeywords;
        }
    }
    getConfiguration() {
        return {
            minClusterSize: this.minClusterSize,
            maxClusters: this.maxClusters,
            similarityThreshold: this.similarityThreshold,
            minKeywordFrequency: this.minKeywordFrequency,
            maxKeywords: this.maxKeywords,
            stopWordsCount: this.stopWords.size,
        };
    }
}
exports.ThemeAnalyzer = ThemeAnalyzer;
//# sourceMappingURL=themeAnalyzer.js.map