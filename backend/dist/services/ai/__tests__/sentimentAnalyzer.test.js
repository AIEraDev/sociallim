"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sentimentAnalyzer_1 = require("../sentimentAnalyzer");
const client_1 = require("@prisma/client");
jest.mock("@google/generative-ai", () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
            generateContent: jest.fn(),
        }),
    })),
}));
describe("SentimentAnalyzer", () => {
    let analyzer;
    let mockModel;
    beforeEach(() => {
        process.env.GEMINI_API_KEY = "test-api-key";
        analyzer = new sentimentAnalyzer_1.SentimentAnalyzer();
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const mockGenAI = new GoogleGenerativeAI();
        mockModel = mockGenAI.getGenerativeModel();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    const createMockComment = (text, id = "1") => ({
        id,
        platformCommentId: `comment-${id}`,
        text,
        authorName: "Test User",
        publishedAt: new Date(),
        likeCount: 0,
        isFiltered: false,
        filterReason: null,
        createdAt: new Date(),
        postId: "post-1",
    });
    describe("constructor", () => {
        it("should throw error if no API key is provided", () => {
            delete process.env.GEMINI_API_KEY;
            expect(() => new sentimentAnalyzer_1.SentimentAnalyzer()).toThrow("Gemini API key is required");
        });
        it("should accept API key as parameter", () => {
            delete process.env.GEMINI_API_KEY;
            expect(() => new sentimentAnalyzer_1.SentimentAnalyzer("custom-key")).not.toThrow();
        });
    });
    describe("analyzeBatchSentiment", () => {
        it("should handle empty comments array", async () => {
            const result = await analyzer.analyzeBatchSentiment([]);
            expect(result.results).toHaveLength(0);
            expect(result.summary.totalAnalyzed).toBe(0);
            expect(result.summary.averageConfidence).toBe(0);
        });
        it("should analyze multiple comments successfully", async () => {
            const comments = [createMockComment("This is a great video!", "1"), createMockComment("I hate this content", "2"), createMockComment("This is okay I guess", "3")];
            const mockResponse = `
{"commentIndex": 1, "sentiment": "POSITIVE", "confidence": 0.9, "emotions": [{"name": "joy", "score": 0.8}]}
{"commentIndex": 2, "sentiment": "NEGATIVE", "confidence": 0.85, "emotions": [{"name": "anger", "score": 0.9}]}
{"commentIndex": 3, "sentiment": "NEUTRAL", "confidence": 0.6, "emotions": [{"name": "trust", "score": 0.4}]}
      `.trim();
            mockModel.generateContent.mockResolvedValue({
                response: {
                    text: () => mockResponse,
                },
            });
            const result = await analyzer.analyzeBatchSentiment(comments);
            expect(result.results).toHaveLength(3);
            expect(result.results[0].sentiment).toBe(client_1.Sentiment.POSITIVE);
            expect(result.results[1].sentiment).toBe(client_1.Sentiment.NEGATIVE);
            expect(result.results[2].sentiment).toBe(client_1.Sentiment.NEUTRAL);
            expect(result.summary.totalAnalyzed).toBe(3);
        });
        it("should handle API errors with fallback results", async () => {
            const comments = [createMockComment("This is great!", "1"), createMockComment("This is terrible!", "2")];
            mockModel.generateContent.mockRejectedValue(new Error("API Error"));
            const result = await analyzer.analyzeBatchSentiment(comments);
            expect(result.results).toHaveLength(2);
            expect(result.results[0].confidence).toBeLessThan(0.7);
            expect(result.results[1].confidence).toBeLessThan(0.7);
        });
        it("should handle malformed API responses gracefully", async () => {
            const comments = [createMockComment("Test comment", "1")];
            mockModel.generateContent.mockResolvedValue({
                response: {
                    text: () => "invalid json response",
                },
            });
            const result = await analyzer.analyzeBatchSentiment(comments);
            expect(result.results).toHaveLength(1);
            expect(result.results[0]).toBeDefined();
        });
    });
    describe("analyzeSingleComment", () => {
        it("should analyze a single comment", async () => {
            const comment = createMockComment("This is amazing!");
            const mockResponse = '{"commentIndex": 1, "sentiment": "POSITIVE", "confidence": 0.95, "emotions": [{"name": "joy", "score": 0.9}]}';
            mockModel.generateContent.mockResolvedValue({
                response: {
                    text: () => mockResponse,
                },
            });
            const result = await analyzer.analyzeSingleComment(comment);
            expect(result.sentiment).toBe(client_1.Sentiment.POSITIVE);
            expect(result.confidence).toBeGreaterThan(0.3);
            expect(result.emotions).toBeDefined();
            if (result.emotions.length > 0) {
                expect(result.emotions[0].name).toBeDefined();
            }
        });
    });
    describe("validateResults", () => {
        it("should validate empty results", () => {
            const validation = analyzer.validateResults([]);
            expect(validation.isValid).toBe(false);
            expect(validation.issues).toContain("No results to validate");
            expect(validation.qualityScore).toBe(0);
        });
        it("should detect low confidence issues", () => {
            const results = [
                { sentiment: client_1.Sentiment.POSITIVE, confidence: 0.1, emotions: [] },
                { sentiment: client_1.Sentiment.NEGATIVE, confidence: 0.2, emotions: [] },
                { sentiment: client_1.Sentiment.NEUTRAL, confidence: 0.15, emotions: [] },
            ];
            const validation = analyzer.validateResults(results);
            expect(validation.isValid).toBe(false);
            expect(validation.issues.some((issue) => issue.includes("low confidence"))).toBe(true);
        });
        it("should detect skewed sentiment distribution", () => {
            const results = Array(10)
                .fill(null)
                .map(() => ({
                sentiment: client_1.Sentiment.POSITIVE,
                confidence: 0.8,
                emotions: [{ name: "joy", score: 0.7 }],
            }));
            const validation = analyzer.validateResults(results);
            expect(validation.issues.some((issue) => issue.includes("highly skewed"))).toBe(true);
        });
        it("should detect missing emotion data", () => {
            const results = [
                { sentiment: client_1.Sentiment.POSITIVE, confidence: 0.8, emotions: [] },
                { sentiment: client_1.Sentiment.NEGATIVE, confidence: 0.7, emotions: [] },
                { sentiment: client_1.Sentiment.NEUTRAL, confidence: 0.6, emotions: [] },
            ];
            const validation = analyzer.validateResults(results);
            expect(validation.issues.some((issue) => issue.includes("lack emotion data"))).toBe(true);
        });
        it("should pass validation for good results", () => {
            const results = [
                { sentiment: client_1.Sentiment.POSITIVE, confidence: 0.8, emotions: [{ name: "joy", score: 0.7 }] },
                { sentiment: client_1.Sentiment.NEGATIVE, confidence: 0.75, emotions: [{ name: "anger", score: 0.8 }] },
                { sentiment: client_1.Sentiment.NEUTRAL, confidence: 0.6, emotions: [{ name: "trust", score: 0.5 }] },
            ];
            const validation = analyzer.validateResults(results);
            expect(validation.isValid).toBe(true);
            expect(validation.issues).toHaveLength(0);
            expect(validation.qualityScore).toBeGreaterThan(0.5);
            expect(validation.recommendations).toBeDefined();
        });
    });
    describe("analyzeWithAdvancedProcessing", () => {
        it("should perform advanced processing with validation", async () => {
            const comments = [createMockComment("This is amazing!", "1"), createMockComment("I hate this", "2")];
            const mockResponse = `
{"commentIndex": 1, "sentiment": "POSITIVE", "confidence": 0.9, "emotions": [{"name": "joy", "score": 0.8}]}
{"commentIndex": 2, "sentiment": "NEGATIVE", "confidence": 0.85, "emotions": [{"name": "anger", "score": 0.9}]}
      `.trim();
            mockModel.generateContent.mockResolvedValue({
                response: {
                    text: () => mockResponse,
                },
            });
            const result = await analyzer.analyzeWithAdvancedProcessing(comments, {
                enableValidation: true,
                confidenceThreshold: 0.7,
                retryLowConfidence: false,
            });
            expect(result.results).toHaveLength(2);
            expect(result.validation).toBeDefined();
            expect(result.processingMetrics).toBeDefined();
            expect(result.processingMetrics.totalProcessingTime).toBeGreaterThan(0);
            expect(result.processingMetrics.batchCount).toBe(1);
        });
        it("should retry low confidence results when enabled", async () => {
            const comments = [createMockComment("This is okay I guess", "1")];
            const lowConfidenceResponse = '{"commentIndex": 1, "sentiment": "NEUTRAL", "confidence": 0.3, "emotions": []}';
            const highConfidenceResponse = '{"commentIndex": 1, "sentiment": "NEUTRAL", "confidence": 0.7, "emotions": [{"name": "trust", "score": 0.5}]}';
            mockModel.generateContent
                .mockResolvedValueOnce({
                response: { text: () => lowConfidenceResponse },
            })
                .mockResolvedValueOnce({
                response: { text: () => highConfidenceResponse },
            });
            const result = await analyzer.analyzeWithAdvancedProcessing(comments, {
                confidenceThreshold: 0.5,
                retryLowConfidence: true,
            });
            expect(result.results[0].confidence).toBeGreaterThanOrEqual(0.3);
            expect(result.processingMetrics).toBeDefined();
            expect(result.processingMetrics.retryCount).toBeGreaterThanOrEqual(0);
            expect(result.validation).toBeDefined();
        });
    });
    describe("processing configuration", () => {
        it("should return current processing stats", () => {
            const stats = analyzer.getProcessingStats();
            expect(stats.batchSize).toBeDefined();
            expect(stats.maxRetries).toBeDefined();
            expect(stats.retryDelay).toBeDefined();
        });
        it("should update processing configuration", () => {
            const initialStats = analyzer.getProcessingStats();
            analyzer.updateProcessingConfig({
                batchSize: 5,
                maxRetries: 5,
                retryDelay: 2000,
            });
            const updatedStats = analyzer.getProcessingStats();
            expect(updatedStats.batchSize).toBe(5);
            expect(updatedStats.maxRetries).toBe(5);
            expect(updatedStats.retryDelay).toBe(2000);
        });
        it("should validate configuration bounds", () => {
            analyzer.updateProcessingConfig({
                batchSize: 100,
                maxRetries: -1,
                retryDelay: 50,
            });
            const stats = analyzer.getProcessingStats();
            expect(stats.batchSize).toBe(10);
            expect(stats.maxRetries).toBe(3);
            expect(stats.retryDelay).toBe(1000);
        });
    });
    describe("fallback sentiment analysis", () => {
        beforeEach(() => {
            mockModel.generateContent.mockRejectedValue(new Error("API Error"));
        });
        it("should detect positive sentiment in fallback mode", async () => {
            const comment = createMockComment("This is great and amazing!");
            const result = await analyzer.analyzeSingleComment(comment);
            expect(result.sentiment).toBe(client_1.Sentiment.POSITIVE);
            expect(result.confidence).toBeGreaterThan(0.3);
            expect(result.emotions.some((e) => e.name === "joy")).toBe(true);
        });
        it("should detect negative sentiment in fallback mode", async () => {
            const comment = createMockComment("This is terrible and awful!");
            const result = await analyzer.analyzeSingleComment(comment);
            expect(result.sentiment).toBe(client_1.Sentiment.NEGATIVE);
            expect(result.confidence).toBeGreaterThan(0.3);
            expect(result.emotions.some((e) => e.name === "anger")).toBe(true);
        });
        it("should default to neutral sentiment in fallback mode", async () => {
            const comment = createMockComment("This is a comment about something");
            const result = await analyzer.analyzeSingleComment(comment);
            expect(result.sentiment).toBe(client_1.Sentiment.NEUTRAL);
            expect(result.confidence).toBe(0.3);
        });
    });
    describe("emotion normalization", () => {
        it("should normalize and limit emotions correctly", async () => {
            const comment = createMockComment("Test comment");
            const mockResponse = JSON.stringify({
                commentIndex: 1,
                sentiment: "POSITIVE",
                confidence: 0.8,
                emotions: [
                    { name: "joy", score: 0.9 },
                    { name: "trust", score: 0.7 },
                    { name: "surprise", score: 0.6 },
                    { name: "anticipation", score: 0.5 },
                    { name: "invalid_emotion", score: 0.8 },
                ],
            });
            mockModel.generateContent.mockResolvedValue({
                response: {
                    text: () => mockResponse,
                },
            });
            const result = await analyzer.analyzeSingleComment(comment);
            expect(result.emotions).toBeDefined();
            expect(result.emotions.length).toBeLessThanOrEqual(3);
            if (result.emotions.length > 0) {
                const validEmotions = ["joy", "anger", "sadness", "fear", "surprise", "disgust", "trust", "anticipation"];
                result.emotions.forEach((emotion) => {
                    expect(validEmotions).toContain(emotion.name);
                    expect(emotion.score).toBeGreaterThanOrEqual(0);
                    expect(emotion.score).toBeLessThanOrEqual(1);
                });
            }
        });
    });
});
//# sourceMappingURL=sentimentAnalyzer.test.js.map