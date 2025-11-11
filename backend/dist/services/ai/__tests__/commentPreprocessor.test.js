"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commentPreprocessor_1 = require("../commentPreprocessor");
describe("CommentPreprocessor", () => {
    let preprocessor;
    beforeEach(() => {
        preprocessor = new commentPreprocessor_1.CommentPreprocessor();
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
    describe("preprocessComments", () => {
        it("should filter out spam comments", async () => {
            const comments = [createMockComment("This is a normal comment", "1"), createMockComment("SUBSCRIBE TO MY CHANNEL NOW!!!", "2"), createMockComment("Check out my website for free money!", "3"), createMockComment("Great video, thanks for sharing!", "4")];
            const result = await preprocessor.preprocessComments(comments);
            expect(result.filteredComments).toHaveLength(2);
            expect(result.spamComments).toHaveLength(2);
            expect(result.filterStats.total).toBe(4);
            expect(result.filterStats.spam).toBe(2);
            expect(result.filterStats.filtered).toBe(2);
        });
        it("should filter out toxic comments", async () => {
            const comments = [createMockComment("This is a normal comment", "1"), createMockComment("You are so stupid and worthless", "2"), createMockComment("I hate this garbage content", "3"), createMockComment("Nice work on this project!", "4")];
            const result = await preprocessor.preprocessComments(comments);
            expect(result.filteredComments).toHaveLength(2);
            expect(result.toxicComments).toHaveLength(2);
            expect(result.filterStats.toxic).toBe(2);
        });
        it("should detect duplicate comments", async () => {
            const comments = [
                createMockComment("This is a great video", "1"),
                createMockComment("This is a great video", "2"),
                createMockComment("This is great video", "3"),
                createMockComment("Completely different comment", "4"),
            ];
            const result = await preprocessor.preprocessComments(comments);
            expect(result.filteredComments).toHaveLength(2);
            expect(result.filterStats.duplicate).toBe(1);
        });
        it("should handle empty comments array", async () => {
            const result = await preprocessor.preprocessComments([]);
            expect(result.filteredComments).toHaveLength(0);
            expect(result.spamComments).toHaveLength(0);
            expect(result.toxicComments).toHaveLength(0);
            expect(result.filterStats.total).toBe(0);
        });
    });
    describe("spam detection", () => {
        it("should detect excessive caps as spam", async () => {
            const comments = [createMockComment("THIS IS ALL CAPS AND SHOULD BE SPAM")];
            const result = await preprocessor.preprocessComments(comments);
            expect(result.spamComments).toHaveLength(1);
        });
        it("should detect spam keywords", async () => {
            const spamComments = [createMockComment("Subscribe to my channel for more!"), createMockComment("Click here for free money"), createMockComment("Check out my website"), createMockComment("Follow me for amazing content")];
            const result = await preprocessor.preprocessComments(spamComments);
            expect(result.spamComments.length).toBeGreaterThan(0);
        });
        it("should detect comments that are too short", async () => {
            const comments = [createMockComment("ok"), createMockComment("k")];
            const result = await preprocessor.preprocessComments(comments);
            expect(result.spamComments).toHaveLength(2);
        });
        it("should detect URLs as spam", async () => {
            const comments = [createMockComment("Check out https://example.com"), createMockComment("Visit www.example.com for more"), createMockComment("Go to example.com")];
            const result = await preprocessor.preprocessComments(comments);
            expect(result.spamComments.length).toBeGreaterThan(0);
        });
        it("should detect excessive repetition", async () => {
            const comments = [createMockComment("aaaaaaaa this is spam"), createMockComment("!!!!!!! excessive punctuation"), createMockComment("great great great great great great")];
            const result = await preprocessor.preprocessComments(comments);
            expect(result.spamComments.length).toBeGreaterThan(0);
        });
    });
    describe("toxicity detection", () => {
        it("should detect toxic keywords", async () => {
            const toxicComments = [createMockComment("You are so stupid"), createMockComment("This is garbage content"), createMockComment("I hate this video"), createMockComment("You are pathetic and worthless")];
            const result = await preprocessor.preprocessComments(toxicComments);
            expect(result.toxicComments.length).toBeGreaterThan(0);
        });
        it("should detect hate speech patterns", async () => {
            const comments = [createMockComment("You should die"), createMockComment("Go kill yourself"), createMockComment("I hate you so much")];
            const result = await preprocessor.preprocessComments(comments);
            expect(result.toxicComments.length).toBeGreaterThan(0);
        });
    });
    describe("text cleaning and normalization", () => {
        it("should clean and normalize text properly", async () => {
            const comments = [createMockComment("This   has    excessive   spaces!!!"), createMockComment("This@#$%^&*()has special characters"), createMockComment("   Leading and trailing spaces   ")];
            const result = await preprocessor.preprocessComments(comments);
            expect(result.filterStats.total).toBe(3);
        });
    });
    describe("edge cases", () => {
        it("should handle very long comments", async () => {
            const longText = "a".repeat(6000);
            const comments = [createMockComment(longText)];
            const result = await preprocessor.preprocessComments(comments);
            expect(result.spamComments).toHaveLength(1);
        });
        it("should handle comments with only special characters", async () => {
            const comments = [createMockComment("!@#$%^&*()"), createMockComment("😀😀😀😀😀😀😀😀😀😀")];
            const result = await preprocessor.preprocessComments(comments);
            expect(result.spamComments.length).toBeGreaterThan(0);
        });
        it("should handle mixed language content", async () => {
            const comments = [createMockComment("Great video! This is good content"), createMockComment("Excelente contenido, gracias for sharing!")];
            const result = await preprocessor.preprocessComments(comments);
            expect(result.filteredComments.length).toBe(2);
            expect(result.spamComments.length).toBe(0);
            expect(result.toxicComments.length).toBe(0);
        });
    });
});
//# sourceMappingURL=commentPreprocessor.test.js.map