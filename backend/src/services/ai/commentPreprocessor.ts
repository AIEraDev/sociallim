import { Comment } from "@prisma/client";

export interface FilterResult {
  filteredComments: Comment[];
  spamComments: Comment[];
  toxicComments: Comment[];
  filterStats: {
    total: number;
    spam: number;
    toxic: number;
    duplicate: number;
    filtered: number;
  };
}

export interface PreprocessedComment extends Comment {
  cleanedText: string;
  normalizedText: string;
  isSpam: boolean;
  isToxic: boolean;
  spamReasons: string[];
  toxicReasons: string[];
}

/**
 * Comment preprocessing service for cleaning, normalizing, and filtering comments
 * Handles spam detection, toxicity filtering, and text normalization
 */
export class CommentPreprocessor {
  private readonly spamKeywords = ["subscribe", "follow me", "check out my", "click here", "free money", "make money fast", "work from home", "get rich quick", "buy now", "limited time", "act now", "call now", "visit my channel"];

  private readonly toxicKeywords = [
    // Basic profanity and hate speech indicators
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
    // Add more as needed - this is a basic set for demonstration
  ];

  private readonly excessiveCapsThreshold = 0.7; // 70% caps
  private readonly duplicateThreshold = 0.9; // 90% similarity
  private readonly minCommentLength = 3;
  private readonly maxCommentLength = 5000;

  /**
   * Main preprocessing method that cleans, normalizes, and filters comments
   */
  public async preprocessComments(comments: Comment[]): Promise<FilterResult> {
    const preprocessedComments: PreprocessedComment[] = [];
    const spamComments: Comment[] = [];
    const toxicComments: Comment[] = [];
    const duplicateComments: Comment[] = [];

    // First pass: clean and normalize all comments
    for (const comment of comments) {
      const preprocessed = this.preprocessSingleComment(comment);
      preprocessedComments.push(preprocessed);
    }

    // Second pass: detect duplicates
    const duplicateIndices = this.detectDuplicates(preprocessedComments);

    // Third pass: filter based on spam, toxicity, and duplicates
    const filteredComments: Comment[] = [];

    for (let i = 0; i < preprocessedComments.length; i++) {
      const comment = preprocessedComments[i];
      const isDuplicate = duplicateIndices.has(i);

      if (comment.isSpam) {
        spamComments.push(comment);
      } else if (comment.isToxic) {
        toxicComments.push(comment);
      } else if (isDuplicate) {
        duplicateComments.push(comment);
      } else {
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

  /**
   * Preprocess a single comment: clean, normalize, and detect spam/toxicity
   */
  private preprocessSingleComment(comment: Comment): PreprocessedComment {
    const cleanedText = this.cleanText(comment.text);
    const normalizedText = this.normalizeText(cleanedText);

    const spamReasons: string[] = [];
    const toxicReasons: string[] = [];

    // Spam detection
    const isSpam = this.detectSpam(cleanedText, normalizedText, spamReasons);

    // Toxicity detection
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

  /**
   * Clean text by removing unwanted characters and formatting
   */
  private cleanText(text: string): string {
    return (
      text
        // Remove excessive whitespace
        .replace(/\s+/g, " ")
        // Remove special characters but keep basic punctuation
        .replace(/[^\w\s.,!?@#-]/g, "")
        // Remove excessive punctuation
        .replace(/[.,!?]{3,}/g, "...")
        // Trim whitespace
        .trim()
    );
  }

  /**
   * Normalize text for analysis (lowercase, remove extra spaces)
   */
  private normalizeText(text: string): string {
    return text.toLowerCase().replace(/\s+/g, " ").trim();
  }

  /**
   * Detect spam using rule-based approach
   */
  private detectSpam(cleanedText: string, normalizedText: string, reasons: string[]): boolean {
    let isSpam = false;

    // Check comment length
    if (cleanedText.length < this.minCommentLength) {
      reasons.push("too_short");
      isSpam = true;
    }

    if (cleanedText.length > this.maxCommentLength) {
      reasons.push("too_long");
      isSpam = true;
    }

    // Check for excessive caps
    const capsRatio = this.calculateCapsRatio(cleanedText);
    if (capsRatio > this.excessiveCapsThreshold) {
      reasons.push("excessive_caps");
      isSpam = true;
    }

    // Check for spam keywords
    const hasSpamKeywords = this.spamKeywords.some((keyword) => normalizedText.includes(keyword.toLowerCase()));
    if (hasSpamKeywords) {
      reasons.push("spam_keywords");
      isSpam = true;
    }

    // Check for excessive repetition
    if (this.hasExcessiveRepetition(normalizedText)) {
      reasons.push("excessive_repetition");
      isSpam = true;
    }

    // Check for URL patterns (basic)
    if (this.containsUrls(cleanedText)) {
      reasons.push("contains_urls");
      isSpam = true;
    }

    // Check for excessive emojis or special characters
    if (this.hasExcessiveEmojis(cleanedText)) {
      reasons.push("excessive_emojis");
      isSpam = true;
    }

    return isSpam;
  }

  /**
   * Detect toxicity using keyword-based approach
   */
  private detectToxicity(cleanedText: string, normalizedText: string, reasons: string[]): boolean {
    let isToxic = false;

    // Check for toxic keywords
    const hasToxicKeywords = this.toxicKeywords.some((keyword) => normalizedText.includes(keyword.toLowerCase()));
    if (hasToxicKeywords) {
      reasons.push("toxic_keywords");
      isToxic = true;
    }

    // Check for excessive profanity patterns
    if (this.hasExcessiveProfanity(normalizedText)) {
      reasons.push("excessive_profanity");
      isToxic = true;
    }

    // Check for hate speech patterns
    if (this.hasHateSpeechPatterns(normalizedText)) {
      reasons.push("hate_speech_patterns");
      isToxic = true;
    }

    return isToxic;
  }

  /**
   * Detect duplicate comments using similarity comparison
   */
  private detectDuplicates(comments: PreprocessedComment[]): Set<number> {
    const duplicateIndices = new Set<number>();

    for (let i = 0; i < comments.length; i++) {
      if (duplicateIndices.has(i)) continue;

      for (let j = i + 1; j < comments.length; j++) {
        if (duplicateIndices.has(j)) continue;

        const similarity = this.calculateSimilarity(comments[i].normalizedText, comments[j].normalizedText);

        if (similarity > this.duplicateThreshold) {
          duplicateIndices.add(j); // Keep the first occurrence, mark later ones as duplicates
        }
      }
    }

    return duplicateIndices;
  }

  /**
   * Calculate the ratio of uppercase characters in text
   */
  private calculateCapsRatio(text: string): number {
    const letters = text.replace(/[^a-zA-Z]/g, "");
    if (letters.length === 0) return 0;

    const upperCaseLetters = text.replace(/[^A-Z]/g, "");
    return upperCaseLetters.length / letters.length;
  }

  /**
   * Check for excessive repetition of characters or words
   */
  private hasExcessiveRepetition(text: string): boolean {
    // Check for repeated characters (e.g., "aaaaa", "!!!!!")
    const charRepetition = /(.)\1{4,}/;
    if (charRepetition.test(text)) return true;

    // Check for repeated words
    const words = text.split(/\s+/);
    const wordCounts = new Map<string, number>();

    for (const word of words) {
      if (word.length > 2) {
        // Only count meaningful words
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }

    // If any word appears more than 30% of the time, it's excessive
    const maxWordCount = Math.max(...wordCounts.values());
    return maxWordCount > words.length * 0.3;
  }

  /**
   * Check if text contains URLs
   */
  private containsUrls(text: string): boolean {
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b)/i;
    return urlPattern.test(text);
  }

  /**
   * Check for excessive emojis or special characters
   */
  private hasExcessiveEmojis(text: string): boolean {
    // Count emoji-like patterns and special characters
    const emojiPattern = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojis = text.match(emojiPattern) || [];

    // If more than 50% of characters are emojis/special chars, it's excessive
    return emojis.length > text.length * 0.5;
  }

  /**
   * Check for excessive profanity patterns
   */
  private hasExcessiveProfanity(text: string): boolean {
    // Count profanity-like patterns (repeated symbols, excessive punctuation)
    const profanityPatterns = [
      /\*{3,}/, // ***
      /@#\$%/, // @#$%
      /f\*+k/, // f**k variations
      /\b\w*\*+\w*\b/g, // words with asterisks
    ];

    return profanityPatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Check for hate speech patterns
   */
  private hasHateSpeechPatterns(text: string): boolean {
    const hateSpeechPatterns = [/you\s+(should|need to|must)\s+(die|kill yourself)/i, /i\s+hate\s+you/i, /go\s+(die|kill yourself)/i, /\b(racist|sexist|homophobic)\b.*\b(slur|comment)\b/i];

    return hateSpeechPatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Calculate similarity between two strings using Jaccard similarity
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));

    const intersection = new Set([...words1].filter((word) => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }
}
