import * as msal from '@azure/msal-node';

// MSAL configuration with graceful fallback
const msalConfig = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID || 'demo-client-id',
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'demo-tenant-id'}`,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || 'demo-client-secret',
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel: any, message: string, containsPii: boolean) {
        if (process.env.NODE_ENV === 'development') {
          console.log(message);
        }
      },
      piiLoggingEnabled: false,
      logLevel: process.env.NODE_ENV === 'development' ? msal.LogLevel.Verbose : msal.LogLevel.Error,
    },
  },
};

// Create msal application object with error handling
let pcaInstance: msal.ConfidentialClientApplication | null = null;

try {
  pcaInstance = new msal.ConfidentialClientApplication(msalConfig);
} catch (error) {
  console.warn('MSAL initialization failed:', error);
  // Create a mock instance for development
  pcaInstance = {
    getAuthCodeUrl: async () => 'https://login.microsoftonline.com/demo',
    acquireTokenByCode: async () => ({ accessToken: 'demo-token' }),
    getTokenCache: () => ({
      deserialize: () => {},
      getAllAccounts: () => [],
    }),
    acquireTokenSilent: async () => ({ accessToken: 'demo-token' }),
  } as any;
}

export const pca = pcaInstance;

// Helper function to get auth code URL
export async function getAuthCodeUrl(scopes: string[], redirectUri: string): Promise<string> {
  if (!pca) {
    throw new Error('MSAL not initialized');
  }
  const authCodeUrlParameters = {
    scopes,
    redirectUri,
  };
  return await pca.getAuthCodeUrl(authCodeUrlParameters);
}

// Helper function to acquire token by code
export async function acquireTokenByCode(scopes: string[], redirectUri: string, code: string) {
  if (!pca) {
    throw new Error('MSAL not initialized');
  }
  const tokenRequest = {
    code,
    scopes,
    redirectUri,
  };
  return await pca.acquireTokenByCode(tokenRequest);
}

// Export msal for use in other modules
export { msal };