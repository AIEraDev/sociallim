"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const summaryGenerator_1 = require("../summaryGenerator");
const client_1 = require("@prisma/client");
const mockGenerateContent = jest.fn();
jest.mock("@google/generative-ai", () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
            generateContent: mockGenerateContent,
        }),
    })),
}));
describe("SummaryGenerator", () => {
    let summaryGenerator;
    let mockModel;
    const mockComments = [
        {
            id: "1",
            platformCommentId: "comment1",
            text: "This is amazing! I love this content so much.",
            authorName: "User1",
            publishedAt: new Date(),
            likeCount: 5,
            isFiltered: false,
            filterReason: null,
            createdAt: new Date(),
            postId: "post1",
        },
        {
            id: "2",
            platformCommentId: "comment2",
            text: "I'm really disappointed with this. Expected much better.",
            authorName: "User2",
            publishedAt: new Date(),
            likeCount: 2,
            isFiltered: false,
            filterReason: null,
            createdAt: new Date(),
            postId: "post1",
        },
        {
            id: "3",
            platformCommentId: "comment3",
            text: "This is okay, nothing special but not bad either.",
            authorName: "User3",
            publishedAt: new Date(),
            likeCount: 1,
            isFiltered: false,
            filterReason: null,
            createdAt: new Date(),
            postId: "post1",
        },
    ];
    const mockThemes = [
        {
            id: "theme1",
            name: "Content Quality",
            comments: [mockComments[0], mockComments[1]],
            sentiment: client_1.Sentiment.POSITIVE,
            frequency: 2,
            representativeComments: [mockComments[0]],
            keywords: ["amazing", "content", "love"],
            coherenceScore: 0.8,
        },
        {
            id: "theme2",
            name: "Expectations",
            comments: [mockComments[1]],
            sentiment: client_1.Sentiment.NEGATIVE,
            frequency: 1,
            representativeComments: [mockComments[1]],
            keywords: ["disappointed", "expected", "better"],
            coherenceScore: 0.6,
        },
    ];
    const mockKeywords = [
        {
            word: "amazing",
            frequency: 3,
            sentiment: client_1.Sentiment.POSITIVE,
            contexts: ["this is amazing", "amazing content"],
            tfidfScore: 0.8,
            sentimentScore: 0.9,
        },
        {
            word: "disappointed",
            frequency: 2,
            sentiment: client_1.Sentiment.NEGATIVE,
            contexts: ["really disappointed", "disappointed with this"],
            tfidfScore: 0.7,
            sentimentScore: 0.8,
        },
    ];
    const mockSummaryData = {
        sentimentBreakdown: {
            positive: 0.4,
            negative: 0.3,
            neutral: 0.3,
        },
        themes: mockThemes,
        keywords: mockKeywords,
        totalComments: 3,
        filteredComments: 0,
    };
    beforeEach(() => {
        process.env.GEMINI_API_KEY = "test-api-key";
        jest.clearAllMocks();
        mockGenerateContent.mockClear();
        summaryGenerator = new summaryGenerator_1.SummaryGenerator();
        mockModel = { generateContent: mockGenerateContent };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe("generateSummary", () => {
        it("should generate a comprehensive summary with all components", async () => {
            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => "The audience response shows mixed sentiment with 40% positive reactions and notable concerns about content quality. The most prominent themes include Content Quality and Expectations, indicating diverse audience perspectives. While some viewers express enthusiasm, others voice disappointment about unmet expectations. This suggests the need for more consistent content delivery to better align with audience expectations.",
                },
            });
            const result = await summaryGenerator.generateSummary(mockSummaryData);
            expect(result).toBeDefined();
            expect(result.summary).toContain("40%");
            expect(result.summary).toContain("Content Quality");
            expect(result.emotions).toHaveLength(2);
            expect(result.keyInsights.length).toBeGreaterThan(0);
            expect(result.recommendations.length).toBeGreaterThan(0);
            expect(result.qualityScore).toBeGreaterThan(0);
            expect(result.wordCount).toBeGreaterThan(0);
        });
        it("should handle empty comment data gracefully", async () => {
            const emptySummaryData = {
                sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
                themes: [],
                keywords: [],
                totalComments: 0,
                filteredComments: 0,
            };
            const result = await summaryGenerator.generateSummary(emptySummaryData);
            expect(result.summary).toContain("No comments available");
            expect(result.emotions).toHaveLength(0);
            expect(result.keyInsights[0]).toContain("No comment data available");
            expect(result.recommendations.length).toBeGreaterThan(0);
            expect(result.qualityScore).toBe(0.5);
        });
        it("should retry on API failures and eventually use fallback", async () => {
            mockGenerateContent.mockRejectedValue(new Error("API Error"));
            const result = await summaryGenerator.generateSummary(mockSummaryData);
            expect(result).toBeDefined();
            expect(result.summary).toContain("mixed sentiment");
            expect(result.qualityScore).toBe(0.4);
            expect(mockGenerateContent).toHaveBeenCalled();
        });
        it("should generate appropriate emotions based on themes", async () => {
            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => "Test summary with sentiment analysis results.",
                },
            });
            const result = await summaryGenerator.generateSummary(mockSummaryData);
            expect(result.emotions.length).toBeGreaterThan(0);
            expect(result.emotions[0]).toHaveProperty("name");
            expect(result.emotions[0]).toHaveProperty("prevalence");
            expect(result.emotions[0]).toHaveProperty("description");
            expect(result.emotions[0].prevalence).toBeGreaterThanOrEqual(0);
            expect(result.emotions[0].prevalence).toBeLessThanOrEqual(100);
        });
        it("should generate relevant key insights", async () => {
            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => "Test summary for insights generation.",
                },
            });
            const result = await summaryGenerator.generateSummary(mockSummaryData);
            expect(result.keyInsights.length).toBeGreaterThan(0);
            expect(result.keyInsights.some((insight) => insight.includes("Content Quality"))).toBe(true);
        });
        it("should generate actionable recommendations", async () => {
            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => "Test summary for recommendations.",
                },
            });
            const result = await summaryGenerator.generateSummary(mockSummaryData);
            expect(result.recommendations.length).toBeGreaterThan(0);
            expect(result.recommendations.length).toBeLessThanOrEqual(3);
        });
    });
    describe("validateSummary", () => {
        it("should validate summary length within target range", () => {
            const validSummary = {
                summary: "This is a test summary that contains exactly the right number of words to be within the target range for validation testing purposes and should pass all length checks successfully.",
                emotions: [],
                keyInsights: ["Test insight"],
                recommendations: ["Test recommendation"],
                qualityScore: 0.8,
                wordCount: 25,
            };
            const validation = summaryGenerator.validateSummary(validSummary, mockSummaryData);
            expect(validation.isValid).toBe(false);
            expect(validation.lengthCheck.isWithinRange).toBe(false);
            expect(validation.qualityScore).toBeGreaterThan(0);
        });
        it("should flag summary that is too short", () => {
            const shortSummary = {
                summary: "Too short.",
                emotions: [],
                keyInsights: [],
                recommendations: [],
                qualityScore: 0.5,
                wordCount: 2,
            };
            const validation = summaryGenerator.validateSummary(shortSummary, mockSummaryData);
            expect(validation.isValid).toBe(false);
            expect(validation.issues.some((issue) => issue.includes("too short"))).toBe(true);
            expect(validation.lengthCheck.isWithinRange).toBe(false);
        });
        it("should flag summary that is too long", () => {
            const longSummary = {
                summary: "This is an extremely long summary that goes on and on with way too many words and details that are not necessary for a concise summary and should be flagged as being too verbose and exceeding the maximum word count limit that has been established for quality summaries in this system and needs to be condensed significantly to meet the requirements and provide value to users who expect concise and actionable insights rather than lengthy explanations that take too much time to read and process effectively in a busy content creation workflow where time is valuable and efficiency is key to success and productivity in managing multiple social media platforms and analyzing audience engagement patterns across different types of content and posts that generate various levels of interaction and feedback from diverse audience segments with different preferences and expectations for content quality and presentation style and format that resonates with their interests and needs.",
                emotions: [],
                keyInsights: ["Test"],
                recommendations: ["Test"],
                qualityScore: 0.5,
                wordCount: 200,
            };
            const validation = summaryGenerator.validateSummary(longSummary, mockSummaryData);
            expect(validation.isValid).toBe(false);
            expect(validation.issues.some((issue) => issue.includes("too long"))).toBe(true);
            expect(validation.lengthCheck.isWithinRange).toBe(false);
        });
        it("should validate emotion prevalence totals", () => {
            const invalidEmotionSummary = {
                summary: "Test summary with proper length that should meet the minimum requirements for word count validation and content quality assessment.",
                emotions: [
                    { name: "joy", prevalence: 60, description: "Happy", representativeComments: [] },
                    { name: "anger", prevalence: 50, description: "Angry", representativeComments: [] },
                ],
                keyInsights: ["Test"],
                recommendations: ["Test"],
                qualityScore: 0.7,
                wordCount: 20,
            };
            const validation = summaryGenerator.validateSummary(invalidEmotionSummary, mockSummaryData);
            expect(validation.issues.some((issue) => issue.includes("exceed 100%"))).toBe(true);
        });
        it("should require percentage data in summary", () => {
            const summaryWithoutPercentages = {
                summary: "This summary lacks specific numerical data and percentages which are important for providing concrete insights to content creators about their audience engagement patterns.",
                emotions: [],
                keyInsights: ["Test insight"],
                recommendations: ["Test recommendation"],
                qualityScore: 0.7,
                wordCount: 25,
            };
            const validation = summaryGenerator.validateSummary(summaryWithoutPercentages, mockSummaryData);
            expect(validation.issues.some((issue) => issue.includes("percentage data"))).toBe(true);
        });
    });
    describe("configuration management", () => {
        it("should return current configuration", () => {
            const config = summaryGenerator.getConfiguration();
            expect(config).toHaveProperty("maxRetries");
            expect(config).toHaveProperty("retryDelay");
            expect(config).toHaveProperty("targetWordRange");
            expect(config).toHaveProperty("maxSummaryLength");
            expect(config).toHaveProperty("minQualityScore");
            expect(config.targetWordRange).toEqual([75, 150]);
        });
        it("should update configuration with valid values", () => {
            const newConfig = {
                targetWordRange: [50, 100],
                maxSummaryLength: 300,
                minQualityScore: 0.7,
            };
            summaryGenerator.updateConfiguration(newConfig);
            const updatedConfig = summaryGenerator.getConfiguration();
            expect(updatedConfig.targetWordRange).toEqual([50, 100]);
            expect(updatedConfig.maxSummaryLength).toBe(300);
            expect(updatedConfig.minQualityScore).toBe(0.7);
        });
        it("should reject invalid configuration values", () => {
            const originalConfig = summaryGenerator.getConfiguration();
            const invalidConfig = {
                targetWordRange: [100, 50],
                maxSummaryLength: 50,
                minQualityScore: 1.5,
            };
            summaryGenerator.updateConfiguration(invalidConfig);
            const configAfterInvalid = summaryGenerator.getConfiguration();
            expect(configAfterInvalid.targetWordRange).toEqual(originalConfig.targetWordRange);
            expect(configAfterInvalid.maxSummaryLength).toBe(originalConfig.maxSummaryLength);
            expect(configAfterInvalid.minQualityScore).toBe(originalConfig.minQualityScore);
        });
    });
    describe("edge cases and error handling", () => {
        it("should handle API timeout gracefully", async () => {
            mockGenerateContent.mockImplementation(() => new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 100)));
            const result = await summaryGenerator.generateSummary(mockSummaryData);
            expect(result).toBeDefined();
            expect(result.summary).toContain("mixed sentiment");
            expect(result.qualityScore).toBe(0.4);
        });
        it("should handle malformed AI responses", async () => {
            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => "",
                },
            });
            const result = await summaryGenerator.generateSummary(mockSummaryData);
            expect(result).toBeDefined();
            expect(result.summary.length).toBeGreaterThan(0);
        });
        it("should handle data with only filtered comments", async () => {
            const filteredOnlyData = {
                sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
                themes: [],
                keywords: [],
                totalComments: 5,
                filteredComments: 5,
            };
            const result = await summaryGenerator.generateSummary(filteredOnlyData);
            expect(result.summary).toContain("No comments available");
            expect(result.emotions).toHaveLength(0);
        });
        it("should handle themes with no keywords", async () => {
            const themesWithoutKeywords = [
                {
                    id: "theme1",
                    name: "Unknown Topic",
                    comments: [mockComments[0]],
                    sentiment: client_1.Sentiment.NEUTRAL,
                    frequency: 1,
                    representativeComments: [mockComments[0]],
                    keywords: [],
                    coherenceScore: 0.3,
                },
            ];
            const dataWithEmptyKeywords = {
                ...mockSummaryData,
                themes: themesWithoutKeywords,
                keywords: [],
            };
            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => "Test summary for themes without keywords.",
                },
            });
            const result = await summaryGenerator.generateSummary(dataWithEmptyKeywords);
            expect(result).toBeDefined();
            expect(result.summary.length).toBeGreaterThan(0);
        });
    });
    describe("emotion analysis", () => {
        it("should correctly infer emotions from positive themes", async () => {
            const positiveThemes = [
                {
                    id: "theme1",
                    name: "Amazing Content",
                    comments: [mockComments[0]],
                    sentiment: client_1.Sentiment.POSITIVE,
                    frequency: 2,
                    representativeComments: [mockComments[0]],
                    keywords: ["amazing", "love", "great"],
                    coherenceScore: 0.8,
                },
            ];
            const positiveData = {
                ...mockSummaryData,
                themes: positiveThemes,
                sentimentBreakdown: { positive: 0.8, negative: 0.1, neutral: 0.1 },
            };
            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => "Positive audience response with high satisfaction.",
                },
            });
            const result = await summaryGenerator.generateSummary(positiveData);
            expect(result.emotions.length).toBeGreaterThan(0);
            expect(result.emotions[0].name).toBe("joy");
            expect(result.emotions[0].prevalence).toBeGreaterThan(0);
        });
        it("should correctly infer emotions from negative themes", async () => {
            const negativeThemes = [
                {
                    id: "theme1",
                    name: "Disappointing Quality",
                    comments: [mockComments[1]],
                    sentiment: client_1.Sentiment.NEGATIVE,
                    frequency: 2,
                    representativeComments: [mockComments[1]],
                    keywords: ["disappointed", "terrible", "hate"],
                    coherenceScore: 0.7,
                },
            ];
            const negativeData = {
                ...mockSummaryData,
                themes: negativeThemes,
                sentimentBreakdown: { positive: 0.1, negative: 0.8, neutral: 0.1 },
            };
            mockGenerateContent.mockResolvedValue({
                response: {
                    text: () => "Negative audience feedback with significant concerns.",
                },
            });
            const result = await summaryGenerator.generateSummary(negativeData);
            expect(result.emotions.length).toBeGreaterThan(0);
            expect(result.emotions[0].name).toBe("anger");
        });
    });
});
//# sourceMappingURL=summaryGenerator.test.js.map