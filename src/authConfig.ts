// lib/authConfig.js
/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL Node configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/configuration.md
 */

const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID || '', // 'Application (client) ID' of app registration in Azure portal
    authority: `${process.env.CLOUD_INSTANCE}${process.env.TENANT_ID}`, // Full directory URL
    clientSecret: process.env.CLIENT_SECRET || '' // Client secret generated from the app registration
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel: number, message: string) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: 3,
    }
  }
};

const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/redirect';
const POST_LOGOUT_REDIRECT_URI = process.env.POST_LOGOUT_REDIRECT_URI || 'http://localhost:3000';
const GRAPH_ME_ENDPOINT = `${process.env.GRAPH_API_ENDPOINT}v1.0/me`;

// Scopes you add here will be prompted for user consent during sign-in.
const scopes = ['user.read'];

export {
  msalConfig,
  REDIRECT_URI,
  POST_LOGOUT_REDIRECT_URI,
  GRAPH_ME_ENDPOINT,
  scopes
};