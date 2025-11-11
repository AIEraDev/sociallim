import { oauthService } from "./oauthService";
import { Platform } from "@prisma/client";
import prisma from "../config/prisma";

export class TokenManager {
  /**
   * Get a valid access token for a user and platform
   * Automatically refreshes if token is expired or will expire soon
   */
  async getValidToken(userId: string, platform: Platform): Promise<string | null> {
    try {
      const connection = await oauthService.getConnection(userId, platform);

      if (!connection) {
        throw new Error(`No connection found for platform ${platform}`);
      }

      // Check if token is expired or will expire soon (30 minutes buffer)
      if (oauthService.isTokenExpired(connection.tokenExpiresAt, 30)) {
        console.log(`Token for ${platform} is expired or will expire soon, refreshing...`);

        try {
          await oauthService.refreshToken(userId, platform);

          // Get the updated connection after refresh
          const refreshedConnection = await oauthService.getConnection(userId, platform);
          return refreshedConnection?.accessToken || null;
        } catch (refreshError) {
          console.error(`Failed to refresh token for ${platform}:`, refreshError);

          // If refresh fails, the connection might be invalid
          // Mark it for user attention but don't delete it automatically
          await this.markConnectionAsInvalid(userId, platform);
          throw new Error(`Token refresh failed for ${platform}. Please reconnect your account.`);
        }
      }

      return connection.accessToken;
    } catch (error) {
      console.error(`Error getting valid token for ${platform}:`, error);
      throw error;
    }
  }

  /**
   * Validate all tokens for a user and return status
   */
  async validateAllTokens(userId: string): Promise<
    {
      platform: Platform;
      isValid: boolean;
      needsReconnection: boolean;
      error?: string;
    }[]
  > {
    const connections = await oauthService.getUserConnections(userId);
    const results = [];

    for (const connection of connections) {
      try {
        const isValid = await oauthService.validateToken(userId, connection.platform);
        results.push({
          platform: connection.platform,
          isValid,
          needsReconnection: !isValid,
        });
      } catch (error) {
        results.push({
          platform: connection.platform,
          isValid: false,
          needsReconnection: true,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  /**
   * Refresh all tokens that are about to expire
   */
  async refreshExpiringTokens(userId: string): Promise<
    {
      platform: Platform;
      refreshed: boolean;
      error?: string;
    }[]
  > {
    const connections = await oauthService.getUserConnections(userId);
    const results = [];

    for (const connection of connections) {
      try {
        const fullConnection = await oauthService.getConnection(userId, connection.platform);

        if (!fullConnection) {
          continue;
        }

        // Check if token will expire in the next 24 hours
        if (oauthService.isTokenExpired(fullConnection.tokenExpiresAt, 24 * 60)) {
          const refreshResult = await oauthService.refreshToken(userId, connection.platform);

          results.push({
            platform: connection.platform,
            refreshed: refreshResult !== null,
          });
        } else {
          results.push({
            platform: connection.platform,
            refreshed: false, // No refresh needed
          });
        }
      } catch (error) {
        results.push({
          platform: connection.platform,
          refreshed: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  /**
   * Mark a connection as invalid (for user attention)
   * This could be used to flag connections that need manual intervention
   */
  private async markConnectionAsInvalid(userId: string, platform: Platform): Promise<void> {
    try {
      // For now, we'll just log this. In the future, we could add a status field
      // to the ConnectedPlatform model to track invalid connections
      console.warn(`Connection marked as invalid: User ${userId}, Platform ${platform}`);

      // Could implement additional logic here like:
      // - Sending notifications to user
      // - Updating a status field in the database
      // - Logging to an audit trail
    } catch (error) {
      console.error("Error marking connection as invalid:", error);
    }
  }

  /**
   * Batch validate tokens using Prisma transactions for consistency
   */
  async batchValidateTokens(userIds: string[]): Promise<
    Map<
      string,
      {
        platform: Platform;
        isValid: boolean;
      }[]
    >
  > {
    const results = new Map();

    // Use Prisma transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      for (const userId of userIds) {
        const userConnections = await tx.connectedPlatform.findMany({
          where: { userId },
          select: {
            platform: true,
            tokenExpiresAt: true,
          },
        });

        const userResults = [];
        for (const connection of userConnections) {
          const isValid = !oauthService.isTokenExpired(connection.tokenExpiresAt);
          userResults.push({
            platform: connection.platform,
            isValid,
          });
        }

        results.set(userId, userResults);
      }
    });

    return results;
  }

  /**
   * Clean up expired tokens that cannot be refreshed
   * This should be run periodically as a background job
   */
  async cleanupExpiredTokens(): Promise<{
    deletedConnections: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let deletedConnections = 0;

    try {
      // Find all connections with expired tokens (older than 7 days)
      const expiredConnections = await prisma.connectedPlatform.findMany({
        where: {
          tokenExpiresAt: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          },
        },
        select: {
          userId: true,
          platform: true,
          id: true,
        },
      });

      for (const connection of expiredConnections) {
        try {
          // Try to validate the token first
          const isValid = await oauthService.validateToken(connection.userId, connection.platform);

          if (!isValid) {
            // Try to refresh the token
            try {
              await oauthService.refreshToken(connection.userId, connection.platform);
            } catch (refreshError) {
              // If refresh fails, delete the connection
              await prisma.connectedPlatform.delete({
                where: { id: connection.id },
              });
              deletedConnections++;
              console.log(`Deleted expired connection: User ${connection.userId}, Platform ${connection.platform}`);
            }
          }
        } catch (error) {
          errors.push(`Error processing connection ${connection.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
    } catch (error) {
      errors.push(`Error during cleanup: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    return { deletedConnections, errors };
  }
}

export const tokenManager = new TokenManager();
