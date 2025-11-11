"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentPreprocessor = void 0;
class CommentPreprocessor {
    constructor() {
        this.spamKeywords = ["subscribe", "follow me", "check out my", "click here", "free money", "make money fast", "work from home", "get rich quick", "buy now", "limited time", "act now", "call now", "visit my channel"];
        this.toxicKeywords = [
            "hate",
            "stupid",
            "idiot",
            "moron",
            "loser",
            "pathetic",
            "disgusting",
            "trash",
            "garbage",
            "worthless",
            "useless",
            "kill yourself",
            "die",
        ];
        this.excessiveCapsThreshold = 0.7;
        this.duplicateThreshold = 0.9;
        this.minCommentLength = 3;
        this.maxCommentLength = 5000;
    }
    async preprocessComments(comments) {
        const preprocessedComments = [];
        const spamComments = [];
        const toxicComments = [];
        const duplicateComments = [];
        for (const comment of comments) {
            const preprocessed = this.preprocessSingleComment(comment);
            preprocessedComments.push(preprocessed);
        }
        const duplicateIndices = this.detectDuplicates(preprocessedComments);
        const filteredComments = [];
        for (let i = 0; i < preprocessedComments.length; i++) {
            const comment = preprocessedComments[i];
            const isDuplicate = duplicateIndices.has(i);
            if (comment.isSpam) {
                spamComments.push(comment);
            }
            else if (comment.isToxic) {
                toxicComments.push(comment);
            }
            else if (isDuplicate) {
                duplicateComments.push(comment);
            }
            else {
                filteredComments.push(comment);
            }
        }
        return {
            filteredComments,
            spamComments,
            toxicComments,
            filterStats: {
                total: comments.length,
                spam: spamComments.length,
                toxic: toxicComments.length,
                duplicate: duplicateComments.length,
                filtered: filteredComments.length,
            },
        };
    }
    preprocessSingleComment(comment) {
        const cleanedText = this.cleanText(comment.text);
        const normalizedText = this.normalizeText(cleanedText);
        const spamReasons = [];
        const toxicReasons = [];
        const isSpam = this.detectSpam(cleanedText, normalizedText, spamReasons);
        const isToxic = this.detectToxicity(cleanedText, normalizedText, toxicReasons);
        return {
            ...comment,
            cleanedText,
            normalizedText,
            isSpam,
            isToxic,
            spamReasons,
            toxicReasons,
        };
    }
    cleanText(text) {
        return (text
            .replace(/\s+/g, " ")
            .replace(/[^\w\s.,!?@#-]/g, "")
            .replace(/[.,!?]{3,}/g, "...")
            .trim());
    }
    normalizeText(text) {
        return text.toLowerCase().replace(/\s+/g, " ").trim();
    }
    detectSpam(cleanedText, normalizedText, reasons) {
        let isSpam = false;
        if (cleanedText.length < this.minCommentLength) {
            reasons.push("too_short");
            isSpam = true;
        }
        if (cleanedText.length > this.maxCommentLength) {
            reasons.push("too_long");
            isSpam = true;
        }
        const capsRatio = this.calculateCapsRatio(cleanedText);
        if (capsRatio > this.excessiveCapsThreshold) {
            reasons.push("excessive_caps");
            isSpam = true;
        }
        const hasSpamKeywords = this.spamKeywords.some((keyword) => normalizedText.includes(keyword.toLowerCase()));
        if (hasSpamKeywords) {
            reasons.push("spam_keywords");
            isSpam = true;
        }
        if (this.hasExcessiveRepetition(normalizedText)) {
            reasons.push("excessive_repetition");
            isSpam = true;
        }
        if (this.containsUrls(cleanedText)) {
            reasons.push("contains_urls");
            isSpam = true;
        }
        if (this.hasExcessiveEmojis(cleanedText)) {
            reasons.push("excessive_emojis");
            isSpam = true;
        }
        return isSpam;
    }
    detectToxicity(cleanedText, normalizedText, reasons) {
        let isToxic = false;
        const hasToxicKeywords = this.toxicKeywords.some((keyword) => normalizedText.includes(keyword.toLowerCase()));
        if (hasToxicKeywords) {
            reasons.push("toxic_keywords");
            isToxic = true;
        }
        if (this.hasExcessiveProfanity(normalizedText)) {
            reasons.push("excessive_profanity");
            isToxic = true;
        }
        if (this.hasHateSpeechPatterns(normalizedText)) {
            reasons.push("hate_speech_patterns");
            isToxic = true;
        }
        return isToxic;
    }
    detectDuplicates(comments) {
        const duplicateIndices = new Set();
        for (let i = 0; i < comments.length; i++) {
            if (duplicateIndices.has(i))
                continue;
            for (let j = i + 1; j < comments.length; j++) {
                if (duplicateIndices.has(j))
                    continue;
                const similarity = this.calculateSimilarity(comments[i].normalizedText, comments[j].normalizedText);
                if (similarity > this.duplicateThreshold) {
                    duplicateIndices.add(j);
                }
            }
        }
        return duplicateIndices;
    }
    calculateCapsRatio(text) {
        const letters = text.replace(/[^a-zA-Z]/g, "");
        if (letters.length === 0)
            return 0;
        const upperCaseLetters = text.replace(/[^A-Z]/g, "");
        return upperCaseLetters.length / letters.length;
    }
    hasExcessiveRepetition(text) {
        const charRepetition = /(.)\1{4,}/;
        if (charRepetition.test(text))
            return true;
        const words = text.split(/\s+/);
        const wordCounts = new Map();
        for (const word of words) {
            if (word.length > 2) {
                wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
            }
        }
        const maxWordCount = Math.max(...wordCounts.values());
        return maxWordCount > words.length * 0.3;
    }
    containsUrls(text) {
        const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b)/i;
        return urlPattern.test(text);
    }
    hasExcessiveEmojis(text) {
        const emojiPattern = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
        const emojis = text.match(emojiPattern) || [];
        return emojis.length > text.length * 0.5;
    }
    hasExcessiveProfanity(text) {
        const profanityPatterns = [
            /\*{3,}/,
            /@#\$%/,
            /f\*+k/,
            /\b\w*\*+\w*\b/g,
        ];
        return profanityPatterns.some((pattern) => pattern.test(text));
    }
    hasHateSpeechPatterns(text) {
        const hateSpeechPatterns = [/you\s+(should|need to|must)\s+(die|kill yourself)/i, /i\s+hate\s+you/i, /go\s+(die|kill yourself)/i, /\b(racist|sexist|homophobic)\b.*\b(slur|comment)\b/i];
        return hateSpeechPatterns.some((pattern) => pattern.test(text));
    }
    calculateSimilarity(text1, text2) {
        const words1 = new Set(text1.split(/\s+/));
        const words2 = new Set(text2.split(/\s+/));
        const intersection = new Set([...words1].filter((word) => words2.has(word)));
        const union = new Set([...words1, ...words2]);
        return union.size === 0 ? 0 : intersection.size / union.size;
    }
}
exports.CommentPreprocessor = CommentPreprocessor;
//# sourceMappingURL=commentPreprocessor.js.map