import prisma from "../config/prisma";
import { encrypt, decrypt } from "../utils/encryption";
import { Platform } from "@prisma/client";
import axios from "axios";

export interface OAuthTokenData {
  platform: Platform;
  platformUserId: string;
  accessToken: string;
  refreshToken?: string | null;
  tokenExpiresAt?: Date | null;
  profile?: any;
}

export interface TokenRefreshResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export class OAuthService {
  /**
   * Store OAuth connection for a user
   */
  async storeConnection(userId: string, tokenData: OAuthTokenData): Promise<void> {
    try {
      await prisma.connectedPlatform.upsert({
        where: {
          userId_platform: {
            userId,
            platform: tokenData.platform,
          },
        },
        update: {
          platformUserId: tokenData.platformUserId,
          accessToken: tokenData.accessToken, // Already encrypted
          refreshToken: tokenData.refreshToken,
          tokenExpiresAt: tokenData.tokenExpiresAt,
        },
        create: {
          userId,
          platform: tokenData.platform,
          platformUserId: tokenData.platformUserId,
          accessToken: tokenData.accessToken, // Already encrypted
          refreshToken: tokenData.refreshToken,
          tokenExpiresAt: tokenData.tokenExpiresAt,
        },
      });
    } catch (error) {
      console.error("Error storing OAuth connection:", error);
      throw new Error("Failed to store OAuth connection");
    }
  }

  /**
   * Get OAuth connection for a user and platform
   */
  async getConnection(userId: string, platform: Platform) {
    try {
      const connection = await prisma.connectedPlatform.findUnique({
        where: {
          userId_platform: {
            userId,
            platform,
          },
        },
      });

      if (!connection) {
        return null;
      }

      return {
        ...connection,
        accessToken: decrypt(connection.accessToken),
        refreshToken: connection.refreshToken ? decrypt(connection.refreshToken) : null,
      };
    } catch (error) {
      console.error("Error getting OAuth connection:", error);
      throw new Error("Failed to get OAuth connection");
    }
  }

  /**
   * Get all connected platforms for a user
   */
  async getUserConnections(userId: string) {
    try {
      const connections = await prisma.connectedPlatform.findMany({
        where: { userId },
        select: {
          platform: true,
          platformUserId: true,
          connectedAt: true,
          tokenExpiresAt: true,
        },
      });

      return connections;
    } catch (error) {
      console.error("Error getting user connections:", error);
      throw new Error("Failed to get user connections");
    }
  }

  /**
   * Check if a token is expired or will expire soon
   */
  isTokenExpired(tokenExpiresAt: Date | null, bufferMinutes: number = 30): boolean {
    if (!tokenExpiresAt) {
      return false; // No expiration date means token doesn't expire
    }

    const now = new Date();
    const expirationWithBuffer = new Date(tokenExpiresAt.getTime() - bufferMinutes * 60 * 1000);

    return now >= expirationWithBuffer;
  }

  /**
   * Refresh access token for a platform
   */
  async refreshToken(userId: string, platform: Platform): Promise<TokenRefreshResult | null> {
    const connection = await this.getConnection(userId, platform);

    if (!connection || !connection.refreshToken) {
      throw new Error("No refresh token available for this platform");
    }

    try {
      let refreshResult: TokenRefreshResult | null = null;

      switch (platform) {
        case Platform.YOUTUBE:
          refreshResult = await this.refreshGoogleToken(connection.refreshToken);
          break;
        case Platform.INSTAGRAM:
          refreshResult = await this.refreshInstagramToken(connection.refreshToken);
          break;
        case Platform.TWITTER:
          // Twitter OAuth 1.0a tokens don't expire
          return null;
        case Platform.TIKTOK:
          refreshResult = await this.refreshTikTokToken(connection.refreshToken);
          break;
        default:
          throw new Error(`Token refresh not implemented for platform: ${platform}`);
      }

      if (refreshResult) {
        // Update the stored tokens
        await prisma.connectedPlatform.update({
          where: {
            userId_platform: {
              userId,
              platform,
            },
          },
          data: {
            accessToken: encrypt(refreshResult.accessToken),
            refreshToken: refreshResult.refreshToken ? encrypt(refreshResult.refreshToken) : undefined,
            tokenExpiresAt: refreshResult.expiresAt,
          },
        });
      }

      return refreshResult;
    } catch (error) {
      console.error(`Error refreshing ${platform} token:`, error);
      throw new Error(`Failed to refresh ${platform} token`);
    }
  }

  /**
   * Refresh Google/YouTube token
   */
  private async refreshGoogleToken(refreshToken: string): Promise<TokenRefreshResult> {
    const response = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: process.env.YOUTUBE_CLIENT_ID,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    const { access_token, refresh_token, expires_in } = response.data;

    return {
      accessToken: access_token,
      refreshToken: refresh_token || refreshToken, // Use new refresh token if provided
      expiresAt: new Date(Date.now() + expires_in * 1000),
    };
  }

  /**
   * Refresh Instagram token
   */
  private async refreshInstagramToken(refreshToken: string): Promise<TokenRefreshResult> {
    const response = await axios.post("https://api.instagram.com/oauth/access_token", {
      client_id: process.env.INSTAGRAM_CLIENT_ID,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    const { access_token, expires_in } = response.data;

    return {
      accessToken: access_token,
      refreshToken: refreshToken, // Instagram doesn't provide new refresh tokens
      expiresAt: new Date(Date.now() + expires_in * 1000),
    };
  }

  /**
   * Refresh TikTok token
   */
  private async refreshTikTokToken(refreshToken: string): Promise<TokenRefreshResult> {
    const response = await axios.post("https://open-api.tiktok.com/oauth/refresh_token/", {
      client_key: process.env.TIKTOK_CLIENT_ID,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    const { access_token, refresh_token, expires_in } = response.data;

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    };
  }

  /**
   * Validate if a token is still valid by making a test API call
   */
  async validateToken(userId: string, platform: Platform): Promise<boolean> {
    const connection = await this.getConnection(userId, platform);

    if (!connection) {
      return false;
    }

    // Check if token is expired first
    if (this.isTokenExpired(connection.tokenExpiresAt)) {
      return false;
    }

    try {
      switch (platform) {
        case Platform.YOUTUBE:
          return await this.validateYouTubeToken(connection.accessToken);
        case Platform.INSTAGRAM:
          return await this.validateInstagramToken(connection.accessToken);
        case Platform.TWITTER:
          return await this.validateTwitterToken(connection.accessToken);
        case Platform.TIKTOK:
          return await this.validateTikTokToken(connection.accessToken);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error validating ${platform} token:`, error);
      return false;
    }
  }

  /**
   * Validate YouTube token by making a test API call
   */
  private async validateYouTubeToken(accessToken: string): Promise<boolean> {
    try {
      const response = await axios.get("https://www.googleapis.com/youtube/v3/channels", {
        params: {
          part: "id",
          mine: true,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate Instagram token by making a test API call
   */
  private async validateInstagramToken(accessToken: string): Promise<boolean> {
    try {
      const response = await axios.get("https://graph.instagram.com/me", {
        params: {
          fields: "id",
          access_token: accessToken,
        },
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate Twitter token by making a test API call
   */
  private async validateTwitterToken(accessToken: string): Promise<boolean> {
    try {
      const response = await axios.get("https://api.twitter.com/2/users/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate TikTok token by making a test API call
   */
  private async validateTikTokToken(accessToken: string): Promise<boolean> {
    try {
      const response = await axios.post("https://open-api.tiktok.com/oauth/userinfo/", {
        access_token: accessToken,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Disconnect a platform for a user
   */
  async disconnectPlatform(userId: string, platform: Platform): Promise<void> {
    try {
      await prisma.connectedPlatform.delete({
        where: {
          userId_platform: {
            userId,
            platform,
          },
        },
      });
    } catch (error) {
      console.error("Error disconnecting platform:", error);
      throw new Error("Failed to disconnect platform");
    }
  }
}

export const oauthService = new OAuthService();
