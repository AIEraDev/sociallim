import { GoogleGenerativeAI } from "@google/generative-ai";
import { Comment, Sentiment } from "@prisma/client";
import { SentimentAnalysisResult } from "../../types";
import { ThemeCluster, KeywordData } from "./themeAnalyzer";

export interface EmotionAnalysis {
  name: string;
  prevalence: number;
  description: string;
  representativeComments: string[];
}

export interface SummaryData {
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  themes: ThemeCluster[];
  keywords: KeywordData[];
  totalComments: number;
  filteredComments: number;
}

export interface GeneratedSummary {
  summary: string;
  emotions: EmotionAnalysis[];
  keyInsights: string[];
  recommendations: string[];
  qualityScore: number;
  wordCount: number;
}

export interface SummaryValidation {
  isValid: boolean;
  issues: string[];
  qualityScore: number;
  recommendations: string[];
  lengthCheck: {
    wordCount: number;
    isWithinRange: boolean;
    targetRange: [number, number];
  };
}

/**
 * Advanced summary generation system using Google Gemini
 * Combines sentiment analysis, theme clustering, and emotion detection
 * Requirements: 4.1, 4.3, 4.4
 */
export class SummaryGenerator {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;
  private readonly targetWordRange: [number, number] = [75, 150]; // 3-5 sentences roughly
  private readonly maxSummaryLength = 500;
  private readonly minQualityScore = 0.6;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("Gemini API key is required. Set GEMINI_API_KEY environment variable.");
    }

    this.genAI = new GoogleGenerativeAI(key);
    this.model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL!,
      generationConfig: {
        temperature: 0.3, // Balanced creativity for summaries
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });
  }

  /**
   * Generate comprehensive summary combining sentiment and themes
   * Requirement 4.1: Generate 3-5 sentence summary of overall sentiment
   */
  public async generateSummary(summaryData: SummaryData): Promise<GeneratedSummary> {
    if (summaryData.totalComments === 0) {
      return this.createEmptySummary();
    }

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.maxRetries) {
      try {
        // Generate main summary
        const summaryText = await this.generateMainSummary(summaryData);

        // Detect and analyze emotions
        const emotions = await this.analyzeEmotions(summaryData);

        // Generate key insights
        const keyInsights = await this.generateKeyInsights(summaryData);

        // Generate recommendations
        const recommendations = await this.generateRecommendations(summaryData);

        const result: GeneratedSummary = {
          summary: summaryText,
          emotions,
          keyInsights,
          recommendations,
          qualityScore: 0,
          wordCount: summaryText.split(/\s+/).length,
        };

        // Validate the generated summary
        const validation = this.validateSummary(result, summaryData);
        result.qualityScore = validation.qualityScore;

        if (validation.isValid || attempt === this.maxRetries - 1) {
          return result;
        }

        console.warn(`Summary quality below threshold (${validation.qualityScore}), retrying...`);
        attempt++;
        await this.delay(this.retryDelay * attempt);
      } catch (error) {
        attempt++;
        lastError = error as Error;
        console.error(`Summary generation attempt ${attempt} failed:`, error);

        if (attempt >= this.maxRetries) {
          console.error(`All ${this.maxRetries} attempts failed. Generating fallback summary.`);
          return this.generateFallbackSummary(summaryData, lastError?.message);
        }

        await this.delay(this.retryDelay * attempt);
      }
    }

    // This should never be reached, but TypeScript requires it
    return this.generateFallbackSummary(summaryData, lastError?.message);
  }

  /**
   * Generate the main summary text using Gemini
   */
  private async generateMainSummary(summaryData: SummaryData): Promise<string> {
    const prompt = this.createSummaryPrompt(summaryData);

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Check for empty or invalid response
    if (!text || text.length < 10) {
      throw new Error("Empty or invalid AI response");
    }

    // Clean up the response
    return this.cleanSummaryText(text);
  }

  /**
   * Create a comprehensive prompt for summary generation
   */
  private createSummaryPrompt(summaryData: SummaryData): string {
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

  /**
   * Analyze emotions and calculate prevalence
   * Requirement 4.4: Display top 3 emotions with prevalence percentages
   */
  private async analyzeEmotions(summaryData: SummaryData): Promise<EmotionAnalysis[]> {
    const emotionCounts = new Map<string, { count: number; comments: string[] }>();

    // Extract emotions from themes and sentiment patterns
    summaryData.themes.forEach((theme) => {
      const emotion = this.inferEmotionFromTheme(theme);
      if (emotion) {
        const current = emotionCounts.get(emotion.name) || { count: 0, comments: [] };
        current.count += theme.frequency;
        current.comments.push(...theme.representativeComments.slice(0, 2).map((c) => c.text));
        emotionCounts.set(emotion.name, current);
      }
    });

    // Convert to EmotionAnalysis array
    const totalComments = summaryData.totalComments - summaryData.filteredComments;
    const emotions: EmotionAnalysis[] = [];

    emotionCounts.forEach((data, emotionName) => {
      const prevalence = totalComments > 0 ? (data.count / totalComments) * 100 : 0;

      emotions.push({
        name: emotionName,
        prevalence: Math.round(prevalence * 10) / 10, // Round to 1 decimal
        description: this.getEmotionDescription(emotionName),
        representativeComments: data.comments.slice(0, 3),
      });
    });

    // Sort by prevalence and return top 3
    return emotions.sort((a, b) => b.prevalence - a.prevalence).slice(0, 3);
  }

  /**
   * Infer emotion from theme characteristics
   */
  private inferEmotionFromTheme(theme: ThemeCluster): { name: string; score: number } | null {
    const keywords = theme.keywords.join(" ").toLowerCase();
    const sentiment = theme.sentiment;

    // Map keywords and sentiment to emotions
    if (sentiment === Sentiment.POSITIVE) {
      if (keywords.includes("love") || keywords.includes("amazing") || keywords.includes("great")) {
        return { name: "joy", score: 0.8 };
      }
      if (keywords.includes("excited") || keywords.includes("wow") || keywords.includes("incredible")) {
        return { name: "excitement", score: 0.7 };
      }
      return { name: "satisfaction", score: 0.6 };
    }

    if (sentiment === Sentiment.NEGATIVE) {
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

    // Neutral sentiment
    if (keywords.includes("question") || keywords.includes("wondering") || keywords.includes("curious")) {
      return { name: "curiosity", score: 0.5 };
    }

    return null;
  }

  /**
   * Get human-readable description for emotions
   */
  private getEmotionDescription(emotionName: string): string {
    const descriptions: Record<string, string> = {
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

  /**
   * Generate key insights from the analysis data
   */
  private async generateKeyInsights(summaryData: SummaryData): Promise<string[]> {
    const insights: string[] = [];

    // Sentiment insights
    const { positive, negative, neutral } = summaryData.sentimentBreakdown;
    const dominantSentiment = Math.max(positive, negative, neutral);

    if (dominantSentiment === positive && positive > 0.6) {
      insights.push(`Strong positive reception with ${Math.round(positive * 100)}% positive sentiment`);
    } else if (dominantSentiment === negative && negative > 0.4) {
      insights.push(`Significant negative feedback requiring attention (${Math.round(negative * 100)}% negative)`);
    } else if (neutral > 0.5) {
      insights.push(`Mixed audience reaction with ${Math.round(neutral * 100)}% neutral responses`);
    }

    // Theme insights
    if (summaryData.themes.length > 0) {
      const topTheme = summaryData.themes[0];
      const themePercentage = Math.round((topTheme.frequency / (summaryData.totalComments - summaryData.filteredComments)) * 100);
      insights.push(`"${topTheme.name}" is the dominant discussion topic (${themePercentage}% of comments)`);
    }

    // Keyword insights
    if (summaryData.keywords.length > 0) {
      const topKeyword = summaryData.keywords[0];
      insights.push(`"${topKeyword.word}" appears ${topKeyword.frequency} times, indicating strong audience focus`);
    }

    // Engagement insights
    if (summaryData.filteredComments > summaryData.totalComments * 0.2) {
      insights.push(`High spam/toxic content filtered (${summaryData.filteredComments} comments removed)`);
    }

    return insights.slice(0, 4); // Return top 4 insights
  }

  /**
   * Generate actionable recommendations for content creators
   */
  private async generateRecommendations(summaryData: SummaryData): Promise<string[]> {
    const recommendations: string[] = [];
    const { sentimentBreakdown, themes } = summaryData;

    // Sentiment-based recommendations
    if (sentimentBreakdown.positive > 0.7) {
      recommendations.push("Leverage this positive momentum by creating similar content");
    } else if (sentimentBreakdown.negative > 0.4) {
      recommendations.push("Address the concerns raised in negative feedback");
      recommendations.push("Consider clarifying or improving content based on criticism");
    }

    // Theme-based recommendations
    if (themes.length > 0) {
      const topTheme = themes[0];
      if (topTheme.sentiment === Sentiment.POSITIVE) {
        recommendations.push(`Expand on the "${topTheme.name}" topic that resonates well with your audience`);
      } else if (topTheme.sentiment === Sentiment.NEGATIVE) {
        recommendations.push(`Address concerns about "${topTheme.name}" in future content`);
      }
    }

    // Engagement recommendations
    const totalValid = summaryData.totalComments - summaryData.filteredComments;
    if (totalValid < 10) {
      recommendations.push("Encourage more audience engagement through questions or calls-to-action");
    }

    // Quality recommendations
    if (summaryData.filteredComments > summaryData.totalComments * 0.3) {
      recommendations.push("Consider moderating comments more actively to improve discussion quality");
    }

    return recommendations.slice(0, 3); // Return top 3 recommendations
  }

  /**
   * Clean and format the generated summary text
   */
  private cleanSummaryText(text: string): string {
    // Remove any markdown formatting
    let cleaned = text.replace(/[*_`#]/g, "");

    // Remove extra whitespace
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    // Ensure proper sentence structure
    cleaned = cleaned.replace(/([.!?])\s*([a-z])/g, "$1 $2");

    // Capitalize first letter
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    // Ensure it ends with proper punctuation
    if (cleaned.length > 0 && !/[.!?]$/.test(cleaned)) {
      cleaned += ".";
    }

    return cleaned;
  }

  /**
   * Validate summary quality and length
   * Requirement 4.4: Create validation for summary quality and length
   */
  public validateSummary(summary: GeneratedSummary, originalData: SummaryData): SummaryValidation {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let qualityScore = 1.0;

    // Length validation
    const wordCount = summary.wordCount;
    const isWithinRange = wordCount >= this.targetWordRange[0] && wordCount <= this.targetWordRange[1];

    if (!isWithinRange) {
      if (wordCount < this.targetWordRange[0]) {
        issues.push(`Summary too short: ${wordCount} words (minimum ${this.targetWordRange[0]})`);
        recommendations.push("Expand summary with more specific insights");
        qualityScore -= 0.2;
      } else if (wordCount > this.targetWordRange[1]) {
        issues.push(`Summary too long: ${wordCount} words (maximum ${this.targetWordRange[1]})`);
        recommendations.push("Condense summary to focus on key points");
        qualityScore -= 0.1;
      }
    }

    // Content quality validation
    if (summary.summary.length < 50) {
      issues.push("Summary content appears too brief");
      qualityScore -= 0.3;
    }

    if (!summary.summary.includes("%") && originalData.totalComments > 0) {
      issues.push("Summary lacks specific percentage data");
      recommendations.push("Include specific sentiment percentages");
      qualityScore -= 0.1;
    }

    // Emotion validation
    if (summary.emotions.length === 0 && originalData.totalComments > 5) {
      issues.push("No emotions detected despite sufficient comment volume");
      recommendations.push("Improve emotion detection methodology");
      qualityScore -= 0.15;
    }

    // Check for emotion prevalence accuracy
    const totalPrevalence = summary.emotions.reduce((sum, emotion) => sum + emotion.prevalence, 0);
    if (totalPrevalence > 100) {
      issues.push("Emotion prevalence percentages exceed 100%");
      qualityScore -= 0.2;
    }

    // Insights validation
    if (summary.keyInsights.length === 0) {
      issues.push("No key insights generated");
      recommendations.push("Enhance insight generation logic");
      qualityScore -= 0.1;
    }

    // Recommendations validation
    if (summary.recommendations.length === 0 && originalData.totalComments > 0) {
      issues.push("No actionable recommendations provided");
      recommendations.push("Generate content creator recommendations");
      qualityScore -= 0.1;
    }

    // Ensure quality score is within bounds
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

  /**
   * Create empty summary for cases with no comments
   */
  private createEmptySummary(): GeneratedSummary {
    return {
      summary: "No comments available for analysis. Consider encouraging audience engagement through questions or calls-to-action.",
      emotions: [],
      keyInsights: ["No comment data available for analysis"],
      recommendations: ["Encourage audience engagement", "Ask questions in your content", "Use calls-to-action to prompt responses"],
      qualityScore: 0.5,
      wordCount: 15,
    };
  }

  /**
   * Generate fallback summary when AI generation fails
   */
  private generateFallbackSummary(summaryData: SummaryData, errorMessage?: string): GeneratedSummary {
    const { sentimentBreakdown, themes, totalComments, filteredComments } = summaryData;
    const validComments = totalComments - filteredComments;

    if (validComments === 0) {
      return this.createEmptySummary();
    }

    const positivePercent = Math.round(sentimentBreakdown.positive * 100);
    const negativePercent = Math.round(sentimentBreakdown.negative * 100);
    const neutralPercent = Math.round(sentimentBreakdown.neutral * 100);

    let dominantSentiment = "mixed";
    if (sentimentBreakdown.positive > 0.5) dominantSentiment = "positive";
    else if (sentimentBreakdown.negative > 0.4) dominantSentiment = "negative";
    else if (sentimentBreakdown.neutral > 0.5) dominantSentiment = "neutral";

    const topTheme = themes.length > 0 ? themes[0].name : "general discussion";

    const fallbackSummary = `The audience response shows ${dominantSentiment} sentiment with ${positivePercent}% positive, ${negativePercent}% negative, and ${neutralPercent}% neutral reactions across ${validComments} comments. The most prominent theme is "${topTheme}" which indicates key areas of audience interest. This analysis provides insights into how your content resonates with viewers.`;

    // Generate basic emotions based on sentiment
    const emotions: EmotionAnalysis[] = [];
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
      qualityScore: 0.4, // Lower quality for fallback
      wordCount: fallbackSummary.split(/\s+/).length,
    };
  }

  /**
   * Utility method to add delay between retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get configuration for monitoring and debugging
   */
  public getConfiguration(): {
    maxRetries: number;
    retryDelay: number;
    targetWordRange: [number, number];
    maxSummaryLength: number;
    minQualityScore: number;
  } {
    return {
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      targetWordRange: this.targetWordRange,
      maxSummaryLength: this.maxSummaryLength,
      minQualityScore: this.minQualityScore,
    };
  }

  /**
   * Update configuration for optimization
   */
  public updateConfiguration(config: { targetWordRange?: [number, number]; maxSummaryLength?: number; minQualityScore?: number }): void {
    if (config.targetWordRange && config.targetWordRange[0] > 0 && config.targetWordRange[1] > config.targetWordRange[0]) {
      (this as any).targetWordRange = config.targetWordRange;
    }
    if (config.maxSummaryLength && config.maxSummaryLength > 100) {
      (this as any).maxSummaryLength = config.maxSummaryLength;
    }
    if (config.minQualityScore && config.minQualityScore >= 0 && config.minQualityScore <= 1) {
      (this as any).minQualityScore = config.minQualityScore;
    }
  }
}
