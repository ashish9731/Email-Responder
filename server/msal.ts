import * as msal from '@azure/msal-node';

// MSAL configuration
const msalConfig = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}`,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel: any, message: string, containsPii: boolean) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Verbose,
    },
  },
};

// Create msal application object
export const pca = new msal.ConfidentialClientApplication(msalConfig);

// Helper function to get auth code URL
export async function getAuthCodeUrl(scopes: string[], redirectUri: string): Promise<string> {
  const authCodeUrlParameters = {
    scopes,
    redirectUri,
  };
  return await pca.getAuthCodeUrl(authCodeUrlParameters);
}

// Helper function to acquire token by code
export async function acquireTokenByCode(scopes: string[], redirectUri: string, code: string) {
  const tokenRequest = {
    code,
    scopes,
    redirectUri,
  };
  return await pca.acquireTokenByCode(tokenRequest);
}

// Export msal for use in other modules
export { msal };