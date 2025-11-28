import { GoogleAuth } from 'google-auth-library';

class TokenManager {
  private auth: GoogleAuth;
  private cachedToken: { token: string; expiry: number } | null = null;

  constructor() {
    // Check if all required environment variables are present
    const requiredEnvVars = [
      'GC_TYPE', 'GC_PROJECT_ID', 'GC_PRIVATE_KEY_ID', 'GC_PRIVATE_KEY',
      'GC_CLIENT_EMAIL', 'GC_CLIENT_ID', 'GC_AUTH_URI', 'GC_TOKEN_URI',
      'GC_AUTH_PROVIDER_X509_CERT_URL', 'GC_CLIENT_X509_CERT_URL'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Use explicit service account credentials for Vercel deployment
    const credentials = {
      type: process.env.GC_TYPE,
      project_id: process.env.GC_PROJECT_ID,
      private_key_id: process.env.GC_PRIVATE_KEY_ID,
      private_key: process.env.GC_PRIVATE_KEY,
      client_email: process.env.GC_CLIENT_EMAIL,
      client_id: process.env.GC_CLIENT_ID,
      auth_uri: process.env.GC_AUTH_URI,
      token_uri: process.env.GC_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GC_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.GC_CLIENT_X509_CERT_URL,
    };

    this.auth = new GoogleAuth({
      credentials,
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
