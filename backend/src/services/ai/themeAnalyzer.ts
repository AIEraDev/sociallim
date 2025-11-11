import { Comment, Sentiment } from "@prisma/client";
import { SentimentAnalysisResult } from "../../types";

export interface ThemeCluster {
  id: string;
  name: string;
  comments: Comment[];
  sentiment: Sentiment;
  frequency: number;
  representativeComments: Comment[];
  keywords: string[];
  coherenceScore: number;
}

export interface KeywordData {
  word: string;
  frequency: number;
  sentiment: Sentiment;
  contexts: string[];
  tfidfScore: number;
  sentimentScore: number;
}

export interface ThemeAnalysisResult {
  themes: ThemeCluster[];
  keywords: KeywordData[];
  summary: {
    totalThemes: number;
    totalKeywords: number;
    averageCoherence: number;
    dominantSentiment: Sentiment;
  };
}

/**
 * Advanced theme clustering and keyword extraction service
 * Implements semantic similarity clustering, keyword analysis, and theme identification
 * Requirements: 3.2, 3.3, 6.1, 6.2, 6.4
 */
export class ThemeAnalyzer {
  private readonly minClusterSize = 2;
  private readonly maxClusters = 10;
  private readonly similarityThreshold = 0.15;
  private readonly minKeywordFrequency = 2;
  private readonly maxKeywords = 50;
  private readonly stopWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can", "this", "that", "these", "those", "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them", "my", "your", "his", "her", "its", "our", "their", "mine", "yours", "hers", "ours", "theirs", "am", "so", "very", "just", "now", "then", "here", "there", "where", "when", "why", "how", "what", "who", "which", "all", "any", "some", "no", "not", "only", "own", "other", "such", "same", "different", "new", "old", "first", "last", "long", "short", "high", "low", "big", "small", "large", "little", "good", "bad", "right", "wrong", "true", "false"]);

  /**
   * Analyze themes and extract keywords from comments with sentiment data
   */
  public async analyzeThemes(comments: Comment[], sentimentResults: SentimentAnalysisResult[]): Promise<ThemeAnalysisResult> {
    if (comments.length === 0) {
      return {
        themes: [],
        keywords: [],
        summary: {
          totalThemes: 0,
          totalKeywords: 0,
          averageCoherence: 0,
          dominantSentiment: Sentiment.NEUTRAL,
        },
      };
    }

    // Step 1: Preprocess comments for analysis
    const preprocessedComments = this.preprocessCommentsForClustering(comments);

    // Step 2: Extract keywords with TF-IDF scoring
    const keywords = this.extractKeywords(preprocessedComments, sentimentResults);

    // Step 3: Create semantic similarity matrix
    const similarityMatrix = this.calculateSimilarityMatrix(preprocessedComments);

    // Step 4: Perform clustering using similarity matrix
    const clusters = this.performClustering(preprocessedComments, similarityMatrix, sentimentResults);

    // Step 5: Generate theme names and select representative comments
    const themes = await this.generateThemeMetadata(clusters, keywords);

    // Step 6: Calculate summary statistics
    const summary = this.calculateSummary(themes, keywords);

    return {
      themes,
      keywords: keywords.slice(0, this.maxKeywords),
      summary,
    };
  }

  /**
   * Preprocess comments for clustering analysis
   */
  private preprocessCommentsForClustering(comments: Comment[]): Array<Comment & { tokens: string[]; normalizedText: string }> {
    return comments.map((comment) => {
      // Normalize text
      const normalizedText = comment.text
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // Tokenize and filter stop words
      const tokens = normalizedText.split(" ").filter(
        (token) => token.length > 2 && !this.stopWords.has(token) && !/^\d+$/.test(token) // Remove pure numbers
      );

      return {
        ...comment,
        tokens,
        normalizedText,
      };
    });
  }

  /**
   * Extract keywords using TF-IDF scoring with sentiment analysis
   */
  private extractKeywords(preprocessedComments: Array<Comment & { tokens: string[]; normalizedText: string }>, sentimentResults: SentimentAnalysisResult[]): KeywordData[] {
    // Calculate term frequency for each comment
    const termFrequencies = new Map<string, Map<number, number>>();
    const documentFrequencies = new Map<string, number>();
    const termSentiments = new Map<string, { positive: number; negative: number; neutral: number }>();
    const termContexts = new Map<string, Set<string>>();

    // Build term frequency and document frequency maps
    preprocessedComments.forEach((comment, commentIndex) => {
      const uniqueTerms = new Set(comment.tokens);
      const sentiment = sentimentResults[commentIndex]?.sentiment || Sentiment.NEUTRAL;

      comment.tokens.forEach((token) => {
        // Term frequency
        if (!termFrequencies.has(token)) {
          termFrequencies.set(token, new Map());
        }
        const commentTF = termFrequencies.get(token)!;
        commentTF.set(commentIndex, (commentTF.get(commentIndex) || 0) + 1);

        // Sentiment tracking
        if (!termSentiments.has(token)) {
          termSentiments.set(token, { positive: 0, negative: 0, neutral: 0 });
        }
        const sentimentCount = termSentiments.get(token)!;
        sentimentCount[sentiment.toLowerCase() as keyof typeof sentimentCount]++;

        // Context extraction (surrounding words)
        if (!termContexts.has(token)) {
          termContexts.set(token, new Set());
        }
        const tokenIndex = comment.tokens.indexOf(token);
        const contextStart = Math.max(0, tokenIndex - 2);
        const contextEnd = Math.min(comment.tokens.length, tokenIndex + 3);
        const context = comment.tokens.slice(contextStart, contextEnd).join(" ");
        termContexts.get(token)!.add(context);
      });

      // Document frequency
      uniqueTerms.forEach((token) => {
        documentFrequencies.set(token, (documentFrequencies.get(token) || 0) + 1);
      });
    });

    // Calculate TF-IDF scores and create keyword data
    const keywords: KeywordData[] = [];
    const totalDocuments = preprocessedComments.length;

    termFrequencies.forEach((commentTFs, term) => {
      const documentFreq = documentFrequencies.get(term) || 0;
      const totalTermFreq = Array.from(commentTFs.values()).reduce((sum, freq) => sum + freq, 0);

      // Skip terms that appear too infrequently or are too short
      if (totalTermFreq < this.minKeywordFrequency || term.length <= 2) return;

      // Calculate TF-IDF score
      const tf = totalTermFreq / preprocessedComments.reduce((sum, comment) => sum + comment.tokens.length, 0);
      const idf = Math.log(totalDocuments / documentFreq);
      const tfidfScore = tf * idf;

      // Determine dominant sentiment for this keyword
      const sentimentCounts = termSentiments.get(term)!;
      const maxSentimentCount = Math.max(sentimentCounts.positive, sentimentCounts.negative, sentimentCounts.neutral);
      let dominantSentiment: Sentiment;
      let sentimentScore: number;

      if (maxSentimentCount === sentimentCounts.positive) {
        dominantSentiment = Sentiment.POSITIVE;
        sentimentScore = sentimentCounts.positive / (sentimentCounts.positive + sentimentCounts.negative + sentimentCounts.neutral);
      } else if (maxSentimentCount === sentimentCounts.negative) {
        dominantSentiment = Sentiment.NEGATIVE;
        sentimentScore = sentimentCounts.negative / (sentimentCounts.positive + sentimentCounts.negative + sentimentCounts.neutral);
      } else {
        dominantSentiment = Sentiment.NEUTRAL;
        sentimentScore = sentimentCounts.neutral / (sentimentCounts.positive + sentimentCounts.negative + sentimentCounts.neutral);
      }

      keywords.push({
        word: term,
        frequency: totalTermFreq,
        sentiment: dominantSentiment,
        contexts: Array.from(termContexts.get(term) || []).slice(0, 5), // Top 5 contexts
        tfidfScore,
        sentimentScore,
      });
    });

    // Sort by TF-IDF score and return top keywords
    return keywords.sort((a, b) => b.tfidfScore - a.tfidfScore).slice(0, this.maxKeywords);
  }

  /**
   * Calculate semantic similarity matrix using Jaccard similarity with weighted terms
   */
  private calculateSimilarityMatrix(preprocessedComments: Array<Comment & { tokens: string[]; normalizedText: string }>): number[][] {
    const matrix: number[][] = [];

    for (let i = 0; i < preprocessedComments.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < preprocessedComments.length; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          matrix[i][j] = this.calculateJaccardSimilarity(preprocessedComments[i].tokens, preprocessedComments[j].tokens);
        }
      }
    }

    return matrix;
  }

  /**
   * Calculate Jaccard similarity between two token arrays
   */
  private calculateJaccardSimilarity(tokens1: string[], tokens2: string[]): number {
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    const intersection = new Set([...set1].filter((token) => set2.has(token)));
    const union = new Set([...set1, ...set2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Perform clustering using similarity matrix and sentiment data
   */
  private performClustering(
    preprocessedComments: Array<Comment & { tokens: string[]; normalizedText: string }>,
    similarityMatrix: number[][],
    sentimentResults: SentimentAnalysisResult[]
  ): Array<{
    comments: Comment[];
    avgSimilarity: number;
    dominantSentiment: Sentiment;
  }> {
    const clusters: Array<{
      comments: Comment[];
      avgSimilarity: number;
      dominantSentiment: Sentiment;
    }> = [];
    const assigned = new Set<number>();

    // Use a greedy clustering approach
    for (let i = 0; i < preprocessedComments.length; i++) {
      if (assigned.has(i)) continue;

      const cluster = {
        comments: [preprocessedComments[i]],
        avgSimilarity: 0,
        dominantSentiment: sentimentResults[i]?.sentiment || Sentiment.NEUTRAL,
      };

      const clusterIndices = [i];
      assigned.add(i);

      // Find similar comments to add to this cluster
      for (let j = i + 1; j < preprocessedComments.length; j++) {
        if (assigned.has(j)) continue;

        const similarity = similarityMatrix[i][j];
        if (similarity >= this.similarityThreshold) {
          cluster.comments.push(preprocessedComments[j]);
          clusterIndices.push(j);
          assigned.add(j);
        }
      }

      // If no similar comments found with strict threshold, try a more relaxed approach
      if (cluster.comments.length === 1) {
        // Look for comments with shared keywords or similar sentiment
        for (let j = i + 1; j < preprocessedComments.length; j++) {
          if (assigned.has(j)) continue;

          const sharedTokens = preprocessedComments[i].tokens.filter((token) => preprocessedComments[j].tokens.includes(token));

          const sameSentiment = (sentimentResults[i]?.sentiment || Sentiment.NEUTRAL) === (sentimentResults[j]?.sentiment || Sentiment.NEUTRAL);

          // If they share meaningful tokens or same sentiment, group them
          if (sharedTokens.length >= 1 && (sameSentiment || sharedTokens.length >= 2)) {
            cluster.comments.push(preprocessedComments[j]);
            clusterIndices.push(j);
            assigned.add(j);
          }
        }
      }

      // Keep clusters with minimum size, or single comments if we have few total comments and meaningful content
      const hasMeaningfulTokens = preprocessedComments[i].tokens.length > 0;
      const shouldKeepCluster = cluster.comments.length >= this.minClusterSize || (preprocessedComments.length <= 6 && cluster.comments.length >= 1 && hasMeaningfulTokens);

      if (shouldKeepCluster) {
        // Calculate average similarity within cluster
        let totalSimilarity = 0;
        let pairCount = 0;

        for (let x = 0; x < clusterIndices.length; x++) {
          for (let y = x + 1; y < clusterIndices.length; y++) {
            totalSimilarity += similarityMatrix[clusterIndices[x]][clusterIndices[y]];
            pairCount++;
          }
        }

        cluster.avgSimilarity = pairCount > 0 ? totalSimilarity / pairCount : 0.5; // Default for single comments

        // Determine dominant sentiment in cluster
        const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
        clusterIndices.forEach((index) => {
          const sentiment = sentimentResults[index]?.sentiment || Sentiment.NEUTRAL;
          sentimentCounts[sentiment.toLowerCase() as keyof typeof sentimentCounts]++;
        });

        const maxCount = Math.max(sentimentCounts.positive, sentimentCounts.negative, sentimentCounts.neutral);
        if (maxCount === sentimentCounts.positive) {
          cluster.dominantSentiment = Sentiment.POSITIVE;
        } else if (maxCount === sentimentCounts.negative) {
          cluster.dominantSentiment = Sentiment.NEGATIVE;
        } else {
          cluster.dominantSentiment = Sentiment.NEUTRAL;
        }

        clusters.push(cluster);
      }

      // Limit number of clusters
      if (clusters.length >= this.maxClusters) break;
    }

    return clusters.sort((a, b) => b.comments.length - a.comments.length);
  }

  /**
   * Generate theme metadata including names and representative comments
   */
  private async generateThemeMetadata(
    clusters: Array<{
      comments: Comment[];
      avgSimilarity: number;
      dominantSentiment: Sentiment;
    }>,
    keywords: KeywordData[]
  ): Promise<ThemeCluster[]> {
    const themes: ThemeCluster[] = [];

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];

      // Generate theme name based on most common keywords in cluster
      const themeName = this.generateThemeName(cluster.comments, keywords);

      // Select representative comments
      const representativeComments = this.selectRepresentativeComments(cluster.comments, 3);

      // Extract relevant keywords for this theme
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

  /**
   * Generate a descriptive name for a theme based on its comments and keywords
   */
  private generateThemeName(comments: Comment[], keywords: KeywordData[]): string {
    // Extract most frequent meaningful words from comments in this cluster
    const wordFreq = new Map<string, number>();

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

    // Get top words by frequency
    const topWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);

    // Try to match with high-scoring keywords
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

  /**
   * Select representative comments from a cluster
   */
  private selectRepresentativeComments(comments: Comment[], maxCount: number): Comment[] {
    if (comments.length <= maxCount) {
      return [...comments];
    }

    // Sort by length and like count to get most substantial comments
    const scored = comments.map((comment) => ({
      comment,
      score: comment.text.length * 0.7 + comment.likeCount * 0.3,
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, maxCount).map((item) => item.comment);
  }

  /**
   * Extract keywords most relevant to a specific theme
   */
  private extractThemeKeywords(comments: Comment[], allKeywords: KeywordData[]): string[] {
    const themeText = comments.map((c) => c.text.toLowerCase()).join(" ");

    return allKeywords
      .filter((keyword) => themeText.includes(keyword.word))
      .sort((a, b) => b.tfidfScore - a.tfidfScore)
      .slice(0, 5)
      .map((kw) => kw.word);
  }

  /**
   * Calculate summary statistics for the theme analysis
   */
  private calculateSummary(
    themes: ThemeCluster[],
    keywords: KeywordData[]
  ): {
    totalThemes: number;
    totalKeywords: number;
    averageCoherence: number;
    dominantSentiment: Sentiment;
  } {
    const totalThemes = themes.length;
    const totalKeywords = keywords.length;

    const averageCoherence = themes.length > 0 ? themes.reduce((sum, theme) => sum + theme.coherenceScore, 0) / themes.length : 0;

    // Calculate dominant sentiment across all themes
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    themes.forEach((theme) => {
      sentimentCounts[theme.sentiment.toLowerCase() as keyof typeof sentimentCounts] += theme.frequency;
    });

    let dominantSentiment: Sentiment = Sentiment.NEUTRAL;
    const maxCount = Math.max(sentimentCounts.positive, sentimentCounts.negative, sentimentCounts.neutral);
    if (maxCount === sentimentCounts.positive) {
      dominantSentiment = Sentiment.POSITIVE;
    } else if (maxCount === sentimentCounts.negative) {
      dominantSentiment = Sentiment.NEGATIVE;
    }

    return {
      totalThemes,
      totalKeywords,
      averageCoherence,
      dominantSentiment,
    };
  }

  /**
   * Advanced clustering with configurable parameters
   */
  public async analyzeThemesWithConfig(
    comments: Comment[],
    sentimentResults: SentimentAnalysisResult[],
    config: {
      minClusterSize?: number;
      maxClusters?: number;
      similarityThreshold?: number;
      maxKeywords?: number;
    } = {}
  ): Promise<ThemeAnalysisResult> {
    // Temporarily update configuration
    const originalConfig = {
      minClusterSize: this.minClusterSize,
      maxClusters: this.maxClusters,
      similarityThreshold: this.similarityThreshold,
      maxKeywords: this.maxKeywords,
    };

    if (config.minClusterSize !== undefined) {
      (this as any).minClusterSize = Math.max(1, config.minClusterSize);
    }
    if (config.maxClusters !== undefined) {
      (this as any).maxClusters = Math.max(1, Math.min(20, config.maxClusters));
    }
    if (config.similarityThreshold !== undefined) {
      (this as any).similarityThreshold = Math.max(0.1, Math.min(0.9, config.similarityThreshold));
    }
    if (config.maxKeywords !== undefined) {
      (this as any).maxKeywords = Math.max(10, Math.min(100, config.maxKeywords));
    }

    try {
      const result = await this.analyzeThemes(comments, sentimentResults);
      return result;
    } finally {
      // Restore original configuration
      (this as any).minClusterSize = originalConfig.minClusterSize;
      (this as any).maxClusters = originalConfig.maxClusters;
      (this as any).similarityThreshold = originalConfig.similarityThreshold;
      (this as any).maxKeywords = originalConfig.maxKeywords;
    }
  }

  /**
   * Get configuration for monitoring and debugging
   */
  public getConfiguration(): {
    minClusterSize: number;
    maxClusters: number;
    similarityThreshold: number;
    minKeywordFrequency: number;
    maxKeywords: number;
    stopWordsCount: number;
  } {
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
