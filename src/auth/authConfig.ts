import { Configuration, LogLevel } from "@azure/msal-node";

// Note: MSAL-Node doesn't have CustomAuthConfiguration or custom auth challenge types
// These features are specific to MSAL-Browser. For server-side auth, you'll handle
// authentication flows differently.

export const msalConfig: Configuration = {
    auth: {
        clientId: "567cb705-b747-46a0-b48c-2f4d341d3525",
        authority: "https://login.microsoftonline.com/90372013-278e-4c16-a745-eb85eacb48df",
        clientSecret: process.env.AZURE_CLIENT_SECRET!, // Required for confidential client in Node
        // redirectUri is not part of the base config in MSAL-Node
        // You'll specify it when making auth requests
    },
    system: {
        loggerOptions: {
            loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        console.info(message);
                        return;
                    case LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                }
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Info,
        },
    },
    // Note: MSAL-Node doesn't use browser cache settings
    // Session/token caching is handled differently in Node
};

// Separate configuration for auth-related URLs and settings
export const authConfig = {
    redirectUri: "http://localhost:3001/", // Adjust for your server
    postLogoutRedirectUri: "http://localhost:3001/",
    // The authApiProxyUrl concept doesn't directly translate to MSAL-Node
    // You'll implement your own API endpoints instead
    apiBaseUrl: "http://localhost:3001/api",
};

// If you need to implement custom authentication flows similar to the browser's
// custom auth, you'll need to create your own implementation:
export const customAuthSettings = {
    challengeTypes: ["password", "oob", "redirect"],
    // You'll need to implement these challenge handlers in your API routes
};