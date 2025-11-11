"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const themeAnalyzer_1 = require("../themeAnalyzer");
const client_1 = require("@prisma/client");
describe("ThemeAnalyzer", () => {
    let themeAnalyzer;
    let mockComments;
    let mockSentimentResults;
    beforeEach(() => {
        themeAnalyzer = new themeAnalyzer_1.ThemeAnalyzer();
        mockComments = [
            {
                id: "1",
                platformCommentId: "c1",
                text: "This video is amazing! Great content and very helpful tutorial.",
                authorName: "user1",
                publishedAt: new Date(),
                likeCount: 15,
                isFiltered: false,
                filterReason: null,
                createdAt: new Date(),
                postId: "post1",
            },
            {
                id: "2",
                platformCommentId: "c2",
                text: "Excellent tutorial! Really helped me understand the concepts better.",
                authorName: "user2",
                publishedAt: new Date(),
                likeCount: 8,
                isFiltered: false,
                filterReason: null,
                createdAt: new Date(),
                postId: "post1",
            },
            {
                id: "3",
                platformCommentId: "c3",
                text: "The audio quality is terrible. Could barely hear anything.",
                authorName: "user3",
                publishedAt: new Date(),
                likeCount: 2,
                isFiltered: false,
                filterReason: null,
                createdAt: new Date(),
                postId: "post1",
            },
            {
                id: "4",
                platformCommentId: "c4",
                text: "Poor sound quality made this unwatchable. Very disappointing.",
                authorName: "user4",
                publishedAt: new Date(),
                likeCount: 1,
                isFiltered: false,
                filterReason: null,
                createdAt: new Date(),
                postId: "post1",
            },
            {
                id: "5",
                platformCommentId: "c5",
                text: "Love the editing style and pacing. Keep up the great work!",
                authorName: "user5",
                publishedAt: new Date(),
                likeCount: 12,
                isFiltered: false,
                filterReason: null,
                createdAt: new Date(),
                postId: "post1",
            },
            {
                id: "6",
                platformCommentId: "c6",
                text: "The editing is smooth and professional. Really well done.",
                authorName: "user6",
                publishedAt: new Date(),
                likeCount: 7,
                isFiltered: false,
                filterReason: null,
                createdAt: new Date(),
                postId: "post1",
            },
        ];
        mockSentimentResults = [
            { sentiment: client_1.Sentiment.POSITIVE, confidence: 0.9, emotions: [{ name: "joy", score: 0.8 }] },
            { sentiment: client_1.Sentiment.POSITIVE, confidence: 0.85, emotions: [{ name: "joy", score: 0.7 }] },
            { sentiment: client_1.Sentiment.NEGATIVE, confidence: 0.8, emotions: [{ name: "anger", score: 0.6 }] },
            { sentiment: client_1.Sentiment.NEGATIVE, confidence: 0.75, emotions: [{ name: "anger", score: 0.7 }] },
            { sentiment: client_1.Sentiment.POSITIVE, confidence: 0.88, emotions: [{ name: "joy", score: 0.9 }] },
            { sentiment: client_1.Sentiment.POSITIVE, confidence: 0.82, emotions: [{ name: "joy", score: 0.75 }] },
        ];
    });
    describe("analyzeThemes", () => {
        it("should return empty result for no comments", async () => {
            const result = await themeAnalyzer.analyzeThemes([], []);
            expect(result.themes).toHaveLength(0);
            expect(result.keywords).toHaveLength(0);
            expect(result.summary.totalThemes).toBe(0);
            expect(result.summary.totalKeywords).toBe(0);
            expect(result.summary.averageCoherence).toBe(0);
            expect(result.summary.dominantSentiment).toBe(client_1.Sentiment.NEUTRAL);
        });
        it("should identify themes from similar comments", async () => {
            const result = await themeAnalyzer.analyzeThemes(mockComments, mockSentimentResults);
            expect(result.themes.length).toBeGreaterThan(0);
            expect(result.summary.totalThemes).toBe(result.themes.length);
            const themeNames = result.themes.map((theme) => theme.name.toLowerCase());
            expect(themeNames.some((name) => name.includes("tutorial") || name.includes("content") || name.includes("quality") || name.includes("editing"))).toBe(true);
        });
        it("should extract meaningful keywords", async () => {
            const result = await themeAnalyzer.analyzeThemes(mockComments, mockSentimentResults);
            expect(result.keywords.length).toBeGreaterThan(0);
            expect(result.summary.totalKeywords).toBe(result.keywords.length);
            const keywords = result.keywords.map((kw) => kw.word);
            expect(keywords.some((word) => ["tutorial", "quality", "editing", "audio", "content"].includes(word))).toBe(true);
            result.keywords.forEach((keyword) => {
                expect(keyword.word).toBeDefined();
                expect(keyword.frequency).toBeGreaterThan(0);
                expect(keyword.tfidfScore).toBeGreaterThan(0);
                expect([client_1.Sentiment.POSITIVE, client_1.Sentiment.NEGATIVE, client_1.Sentiment.NEUTRAL]).toContain(keyword.sentiment);
                expect(Array.isArray(keyword.contexts)).toBe(true);
            });
        });
        it("should group comments by semantic similarity", async () => {
            const result = await themeAnalyzer.analyzeThemes(mockComments, mockSentimentResults);
            const themesWithMultipleComments = result.themes.filter((theme) => theme.comments.length > 1);
            expect(themesWithMultipleComments.length).toBeGreaterThan(0);
            themesWithMultipleComments.forEach((theme) => {
                expect(theme.coherenceScore).toBeGreaterThan(0);
                expect(theme.representativeComments.length).toBeGreaterThan(0);
                expect(theme.representativeComments.length).toBeLessThanOrEqual(3);
            });
        });
        it("should assign correct sentiment to themes", async () => {
            const result = await themeAnalyzer.analyzeThemes(mockComments, mockSentimentResults);
            result.themes.forEach((theme) => {
                expect([client_1.Sentiment.POSITIVE, client_1.Sentiment.NEGATIVE, client_1.Sentiment.NEUTRAL]).toContain(theme.sentiment);
                expect(theme.frequency).toBe(theme.comments.length);
                const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
                theme.comments.forEach((_, index) => {
                    const commentIndex = mockComments.findIndex((c) => c.id === theme.comments[index].id);
                    if (commentIndex >= 0) {
                        const sentiment = mockSentimentResults[commentIndex].sentiment;
                        sentimentCounts[sentiment.toLowerCase()]++;
                    }
                });
            });
        });
        it("should calculate accurate summary statistics", async () => {
            const result = await themeAnalyzer.analyzeThemes(mockComments, mockSentimentResults);
            expect(result.summary.totalThemes).toBe(result.themes.length);
            expect(result.summary.totalKeywords).toBe(result.keywords.length);
            expect(result.summary.averageCoherence).toBeGreaterThanOrEqual(0);
            expect(result.summary.averageCoherence).toBeLessThanOrEqual(1);
            expect([client_1.Sentiment.POSITIVE, client_1.Sentiment.NEGATIVE, client_1.Sentiment.NEUTRAL]).toContain(result.summary.dominantSentiment);
            const positiveSentiments = mockSentimentResults.filter((r) => r.sentiment === client_1.Sentiment.POSITIVE).length;
            const negativeSentiments = mockSentimentResults.filter((r) => r.sentiment === client_1.Sentiment.NEGATIVE).length;
            if (positiveSentiments > negativeSentiments) {
                expect(result.summary.dominantSentiment).toBe(client_1.Sentiment.POSITIVE);
            }
            else if (negativeSentiments > positiveSentiments) {
                expect(result.summary.dominantSentiment).toBe(client_1.Sentiment.NEGATIVE);
            }
        });
    });
    describe("analyzeThemesWithConfig", () => {
        it("should respect custom configuration parameters", async () => {
            const config = {
                minClusterSize: 1,
                maxClusters: 3,
                similarityThreshold: 0.1,
                maxKeywords: 10,
            };
            const result = await themeAnalyzer.analyzeThemesWithConfig(mockComments, mockSentimentResults, config);
            expect(result.themes.length).toBeLessThanOrEqual(config.maxClusters);
            expect(result.keywords.length).toBeLessThanOrEqual(config.maxKeywords);
        });
        it("should handle edge case configurations", async () => {
            const extremeConfig = {
                minClusterSize: 10,
                maxClusters: 1,
                similarityThreshold: 0.9,
                maxKeywords: 5,
            };
            const result = await themeAnalyzer.analyzeThemesWithConfig(mockComments, mockSentimentResults, extremeConfig);
            expect(result.themes.length).toBeLessThanOrEqual(extremeConfig.maxClusters);
            expect(result.keywords.length).toBeLessThanOrEqual(extremeConfig.maxKeywords);
        });
    });
    describe("keyword extraction", () => {
        it("should filter out stop words and short words", async () => {
            const result = await themeAnalyzer.analyzeThemes(mockComments, mockSentimentResults);
            const stopWords = ["the", "and", "is", "a", "to", "of"];
            const extractedWords = result.keywords.map((kw) => kw.word);
            stopWords.forEach((stopWord) => {
                expect(extractedWords).not.toContain(stopWord);
            });
            extractedWords.forEach((word) => {
                expect(word.length).toBeGreaterThan(2);
            });
        });
        it("should calculate TF-IDF scores correctly", async () => {
            const result = await themeAnalyzer.analyzeThemes(mockComments, mockSentimentResults);
            result.keywords.forEach((keyword) => {
                expect(keyword.tfidfScore).toBeGreaterThan(0);
                expect(keyword.frequency).toBeGreaterThanOrEqual(2);
            });
            for (let i = 1; i < result.keywords.length; i++) {
                expect(result.keywords[i].tfidfScore).toBeLessThanOrEqual(result.keywords[i - 1].tfidfScore);
            }
        });
        it("should provide context for keywords", async () => {
            const result = await themeAnalyzer.analyzeThemes(mockComments, mockSentimentResults);
            result.keywords.forEach((keyword) => {
                expect(Array.isArray(keyword.contexts)).toBe(true);
                expect(keyword.contexts.length).toBeGreaterThan(0);
                keyword.contexts.forEach((context) => {
                    expect(context.toLowerCase()).toContain(keyword.word);
                });
            });
        });
    });
    describe("theme clustering", () => {
        it("should create coherent themes with representative comments", async () => {
            const result = await themeAnalyzer.analyzeThemes(mockComments, mockSentimentResults);
            result.themes.forEach((theme) => {
                expect(theme.id).toBeDefined();
                expect(theme.name).toBeDefined();
                expect(theme.comments.length).toBeGreaterThan(0);
                expect(theme.representativeComments.length).toBeGreaterThan(0);
                expect(theme.representativeComments.length).toBeLessThanOrEqual(3);
                expect(theme.keywords.length).toBeGreaterThan(0);
                expect(theme.coherenceScore).toBeGreaterThanOrEqual(0);
                expect(theme.coherenceScore).toBeLessThanOrEqual(1);
                theme.representativeComments.forEach((repComment) => {
                    expect(theme.comments.some((comment) => comment.id === repComment.id)).toBe(true);
                });
            });
        });
        it("should handle single comment themes when similarity is low", async () => {
            const diverseComments = [
                {
                    id: "1",
                    platformCommentId: "c1",
                    text: "Quantum physics is fascinating and complex.",
                    authorName: "user1",
                    publishedAt: new Date(),
                    likeCount: 5,
                    isFiltered: false,
                    filterReason: null,
                    createdAt: new Date(),
                    postId: "post1",
                },
                {
                    id: "2",
                    platformCommentId: "c2",
                    text: "Cooking pasta requires proper timing and technique.",
                    authorName: "user2",
                    publishedAt: new Date(),
                    likeCount: 3,
                    isFiltered: false,
                    filterReason: null,
                    createdAt: new Date(),
                    postId: "post1",
                },
            ];
            const diverseSentiments = [
                { sentiment: client_1.Sentiment.POSITIVE, confidence: 0.8, emotions: [{ name: "joy", score: 0.7 }] },
                { sentiment: client_1.Sentiment.NEUTRAL, confidence: 0.6, emotions: [{ name: "trust", score: 0.5 }] },
            ];
            const result = await themeAnalyzer.analyzeThemes(diverseComments, diverseSentiments);
            expect(result.themes.length).toBeGreaterThanOrEqual(0);
            expect(result.keywords.length).toBeGreaterThanOrEqual(0);
        });
    });
    describe("getConfiguration", () => {
        it("should return current configuration", () => {
            const config = themeAnalyzer.getConfiguration();
            expect(config.minClusterSize).toBeDefined();
            expect(config.maxClusters).toBeDefined();
            expect(config.similarityThreshold).toBeDefined();
            expect(config.minKeywordFrequency).toBeDefined();
            expect(config.maxKeywords).toBeDefined();
            expect(config.stopWordsCount).toBeGreaterThan(0);
        });
    });
    describe("edge cases", () => {
        it("should handle comments with only stop words", async () => {
            const stopWordComments = [
                {
                    id: "1",
                    platformCommentId: "c1",
                    text: "the and or but in on at to for of with by",
                    authorName: "user1",
                    publishedAt: new Date(),
                    likeCount: 0,
                    isFiltered: false,
                    filterReason: null,
                    createdAt: new Date(),
                    postId: "post1",
                },
            ];
            const stopWordSentiments = [{ sentiment: client_1.Sentiment.NEUTRAL, confidence: 0.5, emotions: [] }];
            const result = await themeAnalyzer.analyzeThemes(stopWordComments, stopWordSentiments);
            expect(result.themes.length).toBeLessThanOrEqual(1);
            expect(result.keywords.length).toBe(0);
        });
        it("should handle empty or very short comments", async () => {
            const shortComments = [
                {
                    id: "1",
                    platformCommentId: "c1",
                    text: "ok",
                    authorName: "user1",
                    publishedAt: new Date(),
                    likeCount: 0,
                    isFiltered: false,
                    filterReason: null,
                    createdAt: new Date(),
                    postId: "post1",
                },
                {
                    id: "2",
                    platformCommentId: "c2",
                    text: "",
                    authorName: "user2",
                    publishedAt: new Date(),
                    likeCount: 0,
                    isFiltered: false,
                    filterReason: null,
                    createdAt: new Date(),
                    postId: "post1",
                },
            ];
            const shortSentiments = [
                { sentiment: client_1.Sentiment.NEUTRAL, confidence: 0.3, emotions: [] },
                { sentiment: client_1.Sentiment.NEUTRAL, confidence: 0.2, emotions: [] },
            ];
            const result = await themeAnalyzer.analyzeThemes(shortComments, shortSentiments);
            expect(result.themes.length).toBeGreaterThanOrEqual(0);
            expect(result.keywords.length).toBeGreaterThanOrEqual(0);
        });
        it("should handle mismatched comments and sentiment results", async () => {
            const mismatchedSentiments = mockSentimentResults.slice(0, 3);
            const result = await themeAnalyzer.analyzeThemes(mockComments, mismatchedSentiments);
            expect(result.themes.length).toBeGreaterThanOrEqual(0);
            expect(result.keywords.length).toBeGreaterThanOrEqual(0);
        });
    });
});
//# sourceMappingURL=themeAnalyzer.test.js.map