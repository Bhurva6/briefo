import { GoogleAuth } from 'google-auth-library';

class TokenManager {
  private auth: GoogleAuth;
  private cachedToken: { token: string; expiry: number } | null = null;

  constructor() {
    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  }

  async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.cachedToken && Date.now() < this.cachedToken.expiry) {
      return this.cachedToken.token;
    }

    try {
      const client = await this.auth.getClient();
      const tokenResponse = await client.getAccessToken();

      if (!tokenResponse.token) {
        throw new Error('Failed to obtain access token');
      }

      // Cache the token with expiry (tokens typically last 1 hour)
      this.cachedToken = {
        token: tokenResponse.token,
        expiry: Date.now() + (55 * 60 * 1000), // 55 minutes to be safe
      };

      return tokenResponse.token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  invalidateToken(): void {
    this.cachedToken = null;
  }
}

export const tokenManager = new TokenManager();
