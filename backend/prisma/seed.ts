/**
 * Database Seeding Script for Comment Sentiment Analyzer
 *
 * This script populates the database with sample data for development and testing.
 * It creates users, connected platforms, posts, comments, and analysis results
 * to provide a realistic development environment.
 *
 * Usage:
 * - Development: npm run db:seed
 * - Production: Should not be run in production
 *
 * @fileoverview Database seeding with comprehensive sample data
 */

import { PrismaClient, Platform, Sentiment } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Sample data generators for realistic development environment
 */

// Sample users for development
const sampleUsers = [
  {
    email: "demo@comment-analyzer.com",
    password: "DemoPassword123!",
    firstName: "Demo",
    lastName: "User",
  },
  {
    email: "creator@example.com",
    password: "CreatorPass123!",
    firstName: "Content",
    lastName: "Creator",
  },
  {
    email: "influencer@example.com",
    password: "InfluencerPass123!",
    firstName: "Social",
    lastName: "Influencer",
  },
];

// Sample posts for different platforms
const samplePosts = [
  {
    platform: Platform.YOUTUBE,
    platformPostId: "dQw4w9WgXcQ",
    title: "Amazing Content Creation Tips for Beginners",
    url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    publishedAt: new Date("2024-01-10T12:00:00Z"),
  },
  {
    platform: Platform.YOUTUBE,
    platformPostId: "jNQXAC9IVRw",
    title: "Advanced Video Editing Techniques",
    url: "https://youtube.com/watch?v=jNQXAC9IVRw",
    publishedAt: new Date("2024-01-08T15:30:00Z"),
  },
  {
    platform: Platform.INSTAGRAM,
    platformPostId: "17841401234567890",
    title: "Behind the scenes of our latest photoshoot",
    url: "https://instagram.com/p/ABC123/",
    publishedAt: new Date("2024-01-12T10:15:00Z"),
  },
  {
    platform: Platform.TWITTER,
    platformPostId: "1234567890123456789",
    title: "Excited to share our new product launch! What do you think?",
    url: "https://twitter.com/user/status/1234567890123456789",
    publishedAt: new Date("2024-01-14T09:45:00Z"),
  },
  {
    platform: Platform.TIKTOK,
    platformPostId: "7123456789012345678",
    title: "Quick tutorial on productivity hacks",
    url: "https://tiktok.com/@user/video/7123456789012345678",
    publishedAt: new Date("2024-01-13T16:20:00Z"),
  },
];

// Sample comments with varied sentiment
const sampleComments = [
  // Positive comments
  {
    text: "This is absolutely amazing! Thank you for sharing these tips.",
    authorName: "HappyViewer123",
    likeCount: 45,
    sentiment: Sentiment.POSITIVE,
  },
  {
    text: "Love this content! Keep up the great work!",
    authorName: "ContentLover",
    likeCount: 32,
    sentiment: Sentiment.POSITIVE,
  },
  {
    text: "Exactly what I needed to see today. Very helpful!",
    authorName: "GratefulUser",
    likeCount: 28,
    sentiment: Sentiment.POSITIVE,
  },
  {
    text: "Outstanding quality as always. You never disappoint!",
    authorName: "LoyalFan",
    likeCount: 67,
    sentiment: Sentiment.POSITIVE,
  },
  {
    text: "This changed my perspective completely. Thank you!",
    authorName: "MindBlown",
    likeCount: 41,
    sentiment: Sentiment.POSITIVE,
  },

  // Negative comments
  {
    text: "Not really impressed with this one. Expected better.",
    authorName: "CriticalViewer",
    likeCount: 12,
    sentiment: Sentiment.NEGATIVE,
  },
  {
    text: "The audio quality could be much better. Hard to follow.",
    authorName: "AudioCritic",
    likeCount: 8,
    sentiment: Sentiment.NEGATIVE,
  },
  {
    text: "This feels rushed. Would prefer more detailed explanations.",
    authorName: "DetailSeeker",
    likeCount: 15,
    sentiment: Sentiment.NEGATIVE,
  },
  {
    text: "Disappointed. This is not what the title promised.",
    authorName: "DisappointedFan",
    likeCount: 6,
    sentiment: Sentiment.NEGATIVE,
  },

  // Neutral comments
  {
    text: "Interesting approach. Will try this and see how it works.",
    authorName: "CuriousLearner",
    likeCount: 22,
    sentiment: Sentiment.NEUTRAL,
  },
  {
    text: "Thanks for the tutorial. Some parts were clearer than others.",
    authorName: "BalancedViewer",
    likeCount: 18,
    sentiment: Sentiment.NEUTRAL,
  },
  {
    text: "Good content overall. Room for improvement in some areas.",
    authorName: "FairCritic",
    likeCount: 25,
    sentiment: Sentiment.NEUTRAL,
  },
  {
    text: "First time watching your content. Will check out more videos.",
    authorName: "NewViewer",
    likeCount: 14,
    sentiment: Sentiment.NEUTRAL,
  },
  {
    text: "Can you make a follow-up video about advanced techniques?",
    authorName: "RequestMaker",
    likeCount: 31,
    sentiment: Sentiment.NEUTRAL,
  },
];

// Sample themes for analysis results
const sampleThemes = [
  {
    name: "Content Quality",
    frequency: 45,
    sentiment: Sentiment.POSITIVE,
    exampleComments: ["Amazing quality content as always!", "The production value is incredible", "Such professional work"],
  },
  {
    name: "Educational Value",
    frequency: 38,
    sentiment: Sentiment.POSITIVE,
    exampleComments: ["Learned so much from this", "Very educational and helpful", "Great tutorial, easy to follow"],
  },
  {
    name: "Technical Issues",
    frequency: 12,
    sentiment: Sentiment.NEGATIVE,
    exampleComments: ["Audio quality could be better", "Video seems a bit blurry", "Hard to hear in some parts"],
  },
  {
    name: "Engagement",
    frequency: 67,
    sentiment: Sentiment.POSITIVE,
    exampleComments: ["Love interacting with your content", "Always excited for new uploads", "Keep up the great work!"],
  },
];

// Sample keywords for analysis results
const sampleKeywords = [
  {
    word: "amazing",
    frequency: 23,
    sentiment: Sentiment.POSITIVE,
    contexts: ["This is amazing!", "Amazing content as always", "Simply amazing work"],
  },
  {
    word: "helpful",
    frequency: 31,
    sentiment: Sentiment.POSITIVE,
    contexts: ["Very helpful tutorial", "So helpful, thank you", "Really helpful tips"],
  },
  {
    word: "quality",
    frequency: 18,
    sentiment: Sentiment.POSITIVE,
    contexts: ["Great quality content", "High quality production", "Quality work"],
  },
  {
    word: "disappointed",
    frequency: 8,
    sentiment: Sentiment.NEGATIVE,
    contexts: ["Bit disappointed with this", "Really disappointed", "Disappointed fan here"],
  },
  {
    word: "tutorial",
    frequency: 42,
    sentiment: Sentiment.NEUTRAL,
    contexts: ["Great tutorial", "Tutorial was helpful", "Need more tutorials"],
  },
];

// Sample emotions for analysis results
const sampleEmotions = [
  { name: "joy", percentage: 45.2 },
  { name: "surprise", percentage: 23.1 },
  { name: "trust", percentage: 18.7 },
  { name: "anticipation", percentage: 12.4 },
  { name: "frustration", percentage: 8.9 },
  { name: "disappointment", percentage: 6.3 },
];

/**
 * Utility functions for data generation
 */

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Main seeding functions
 */

async function seedUsers() {
  console.log("🌱 Seeding users...");

  const users = [];

  for (const userData of sampleUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isEmailVerified: true,
        lastLoginAt: generateRandomDate(new Date("2024-01-01"), new Date()),
      },
    });

    users.push(user);
    console.log(`   ✅ Created user: ${user.email}`);
  }

  return users;
}

async function seedConnectedPlatforms(users: any[]) {
  console.log("🌱 Seeding connected platforms...");

  const platforms = [];

  for (const user of users) {
    // Each user connects to 2-3 random platforms
    const userPlatforms = getRandomElements(Object.values(Platform), Math.floor(Math.random() * 2) + 2);

    for (const platform of userPlatforms) {
      const connectedPlatform = await prisma.connectedPlatform.create({
        data: {
          platform,
          platformUserId: `${platform.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`,
          accessToken: "encrypted_access_token_placeholder",
          refreshToken: "encrypted_refresh_token_placeholder",
          tokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          connectedAt: generateRandomDate(new Date("2024-01-01"), new Date()),
          userId: user.id,
        },
      });

      platforms.push(connectedPlatform);
      console.log(`   ✅ Connected ${platform} for user: ${user.email}`);
    }
  }

  return platforms;
}

async function seedPosts(users: any[]) {
  console.log("🌱 Seeding posts...");

  const posts = [];

  for (const user of users) {
    // Each user gets 3-5 posts
    const userPostCount = Math.floor(Math.random() * 3) + 3;
    const userPosts = getRandomElements(samplePosts, userPostCount);

    for (const postData of userPosts) {
      const post = await prisma.post.create({
        data: {
          ...postData,
          platformPostId: `${postData.platformPostId}_${user.id}`,
          publishedAt: generateRandomDate(new Date("2024-01-01"), new Date()),
          userId: user.id,
        },
      });

      posts.push(post);
      console.log(`   ✅ Created post: ${post.title} (${post.platform})`);
    }
  }

  return posts;
}

async function seedComments(posts: any[]) {
  console.log("🌱 Seeding comments...");

  const comments = [];

  for (const post of posts) {
    // Each post gets 10-25 comments
    const commentCount = Math.floor(Math.random() * 16) + 10;

    for (let i = 0; i < commentCount; i++) {
      const commentData = getRandomElement(sampleComments);

      const comment = await prisma.comment.create({
        data: {
          platformCommentId: `comment_${post.id}_${i}`,
          text: commentData.text,
          authorName: commentData.authorName,
          publishedAt: generateRandomDate(post.publishedAt, new Date()),
          likeCount: Math.floor(Math.random() * 100),
          isFiltered: Math.random() < 0.05, // 5% chance of being filtered
          filterReason: Math.random() < 0.05 ? "spam" : null,
          postId: post.id,
        },
      });

      comments.push(comment);
    }

    console.log(`   ✅ Created ${commentCount} comments for post: ${post.title}`);
  }

  return comments;
}

async function seedAnalysisResults(posts: any[], users: any[]) {
  console.log("🌱 Seeding analysis results...");

  // Create analysis results for 70% of posts
  const postsToAnalyze = posts.filter(() => Math.random() < 0.7);

  for (const post of postsToAnalyze) {
    const user = users.find((u) => u.id === post.userId);
    if (!user) continue;

    // Get comments for this post
    const postComments = await prisma.comment.findMany({
      where: { postId: post.id },
    });

    const totalComments = postComments.length;
    const filteredComments = postComments.filter((c) => c.isFiltered).length;

    // Create analysis result
    const analysisResult = await prisma.analysisResult.create({
      data: {
        totalComments,
        filteredComments,
        summary: generateSummary(post.title, totalComments),
        analyzedAt: generateRandomDate(post.publishedAt, new Date()),
        postId: post.id,
        userId: user.id,
      },
    });

    // Create sentiment breakdown
    const sentimentBreakdown = generateSentimentBreakdown();
    await prisma.sentimentBreakdown.create({
      data: {
        ...sentimentBreakdown,
        analysisResultId: analysisResult.id,
      },
    });

    // Create emotions
    const emotions = getRandomElements(sampleEmotions, 4);
    for (const emotion of emotions) {
      await prisma.emotion.create({
        data: {
          name: emotion.name,
          percentage: emotion.percentage + (Math.random() - 0.5) * 10, // Add some variance
          analysisResultId: analysisResult.id,
        },
      });
    }

    // Create themes
    const themes = getRandomElements(sampleThemes, 3);
    for (const theme of themes) {
      await prisma.theme.create({
        data: {
          name: theme.name,
          frequency: Math.floor(theme.frequency * (totalComments / 100)),
          sentiment: theme.sentiment,
          exampleComments: theme.exampleComments,
          analysisResultId: analysisResult.id,
        },
      });
    }

    // Create keywords
    const keywords = getRandomElements(sampleKeywords, 5);
    for (const keyword of keywords) {
      await prisma.keyword.create({
        data: {
          word: keyword.word,
          frequency: Math.floor(keyword.frequency * (totalComments / 100)),
          sentiment: keyword.sentiment,
          contexts: keyword.contexts,
          analysisResultId: analysisResult.id,
        },
      });
    }

    console.log(`   ✅ Created analysis result for post: ${post.title}`);
  }
}

function generateSummary(postTitle: string, commentCount: number): string {
  const summaries = [`Analysis of "${postTitle}" shows overwhelmingly positive reception with ${commentCount} comments. Viewers particularly appreciated the educational value and production quality. Main themes include content quality, engagement, and helpful tutorials. Some minor technical feedback was noted but overall sentiment remains very positive.`, `The post "${postTitle}" generated strong audience engagement with ${commentCount} comments showing mixed but generally positive sentiment. Key discussion points centered around content quality and educational value. Viewers expressed appreciation for the detailed explanations while suggesting improvements in audio quality.`, `Community response to "${postTitle}" demonstrates high engagement with ${commentCount} comments. Sentiment analysis reveals predominantly positive reactions, with viewers praising the helpful content and professional presentation. Minor concerns were raised about technical aspects, but overall feedback is encouraging.`, `Analysis of "${postTitle}" indicates excellent audience reception across ${commentCount} comments. The content resonated well with viewers who highlighted its educational value and quality production. Main themes include appreciation for tutorials, engagement with the creator, and constructive feedback for improvement.`];

  return getRandomElement(summaries);
}

function generateSentimentBreakdown() {
  // Generate realistic sentiment distribution
  const positive = 50 + Math.random() * 30; // 50-80%
  const negative = 5 + Math.random() * 15; // 5-20%
  const neutral = 100 - positive - negative;

  return {
    positive: Math.round(positive * 10) / 10,
    negative: Math.round(negative * 10) / 10,
    neutral: Math.round(neutral * 10) / 10,
    confidenceScore: 0.7 + Math.random() * 0.25, // 0.7-0.95
  };
}

/**
 * Main seeding function
 */
async function main() {
  console.log("🚀 Starting database seeding...");
  console.log("");

  try {
    // Clear existing data in development
    if (process.env.NODE_ENV === "development") {
      console.log("🧹 Cleaning existing data...");

      // Delete in reverse order of dependencies
      await prisma.keyword.deleteMany();
      await prisma.theme.deleteMany();
      await prisma.emotion.deleteMany();
      await prisma.sentimentBreakdown.deleteMany();
      await prisma.analysisResult.deleteMany();
      await prisma.comment.deleteMany();
      await prisma.post.deleteMany();
      await prisma.connectedPlatform.deleteMany();
      await prisma.user.deleteMany();

      console.log("   ✅ Existing data cleared");
      console.log("");
    }

    // Seed data
    const users = await seedUsers();
    console.log("");

    const platforms = await seedConnectedPlatforms(users);
    console.log("");

    const posts = await seedPosts(users);
    console.log("");

    const comments = await seedComments(posts);
    console.log("");

    await seedAnalysisResults(posts, users);
    console.log("");

    // Summary
    console.log("🎉 Database seeding completed successfully!");
    console.log("");
    console.log("📊 Summary:");
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   🔗 Connected Platforms: ${platforms.length}`);
    console.log(`   📝 Posts: ${posts.length}`);
    console.log(`   💬 Comments: ${comments.length}`);
    console.log("");
    console.log("🔐 Demo Login Credentials:");
    console.log("   Email: demo@comment-analyzer.com");
    console.log("   Password: DemoPassword123!");
    console.log("");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

// Execute seeding
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
