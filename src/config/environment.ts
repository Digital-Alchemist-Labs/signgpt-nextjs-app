// Environment configuration based on the original translate project
// This file centralizes all environment variables and API endpoints
// SECURITY NOTE: Only non-sensitive configuration should use NEXT_PUBLIC_ prefix

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string | null;
}

// Server-side only configuration (sensitive data)
export interface ServerConfig {
  // API Endpoints (internal)
  signGptClientUrl: string;
  webSocketUrl: string;
  apiBaseUrl: string;

  // Firebase Admin (if needed)
  firebaseAdminKey?: string;
}

// Client-side configuration (public data only)
export interface ClientConfig {
  production: boolean;
  firebase: FirebaseConfig; // Firebase config is generally safe to expose
  reCAPTCHAKey: string; // ReCAPTCHA site key is meant to be public

  // Public API Endpoints only
  signMtApiBaseUrl: string;
  signMtCloudFunctionUrl: string;
  firebaseStorageBucketUrl: string;
  firebaseStorageBucket: string;

  // MediaPipe Configuration (public assets)
  mediaPipeModelPath: string;

  // Feature Flags (non-sensitive)
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
}

export interface EnvironmentConfig extends ClientConfig {
  server: ServerConfig;
}

// Server-side configuration (not exposed to client)
const getServerConfig = (): ServerConfig => ({
  // Internal API endpoints - use regular env vars (not NEXT_PUBLIC_)
  signGptClientUrl: process.env.SIGNGPT_CLIENT_URL || "http://localhost:8001",
  webSocketUrl: process.env.WEBSOCKET_URL || "ws://localhost:8000/ws",
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:8001",

  // Firebase Admin key (if needed for server operations)
  firebaseAdminKey: process.env.FIREBASE_ADMIN_KEY,
});

// Client-side configuration (safe to expose)
const getClientConfig = (): ClientConfig => ({
  production: process.env.NODE_ENV === "production",
  firebase: {
    // Firebase config is generally safe to expose as it's needed for client SDK
    apiKey:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      "AIzaSyAtVDGmDVCwWunWW2ocgeHWnAsUhHuXvcg",
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sign-mt.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sign-mt",
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sign-mt.appspot.com",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "665830225099",
    appId:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
      "1:665830225099:web:18e0669d5847a4b047974e",
    measurementId:
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
      (process.env.NODE_ENV === "production" ? "G-1LXY5W5Z9H" : null),
  },
  // ReCAPTCHA site key is meant to be public
  reCAPTCHAKey:
    process.env.NEXT_PUBLIC_RECAPTCHA_KEY ||
    "6Ldsxb8oAAAAAGyUZbyd0QruivPSudqAWFygR-4t",

  // Public API Endpoints only
  signMtApiBaseUrl:
    process.env.NEXT_PUBLIC_SIGN_MT_API_BASE_URL || "https://sign.mt/api",
  signMtCloudFunctionUrl:
    process.env.NEXT_PUBLIC_SIGN_MT_CLOUD_FUNCTION_URL ||
    "https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose",
  firebaseStorageBucketUrl:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_URL ||
    "https://firebasestorage.googleapis.com/v0/b/sign-mt-assets/o/",
  firebaseStorageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_GS || "gs://sign-mt-assets",

  // MediaPipe Configuration (public assets)
  mediaPipeModelPath:
    process.env.NEXT_PUBLIC_MEDIAPIPE_MODEL_PATH || "/assets/models/holistic/",

  // Feature Flags (non-sensitive)
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
  enableErrorReporting:
    process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === "true",
});

// Combined configuration
const defaultConfig: EnvironmentConfig = {
  ...getClientConfig(),
  server: getServerConfig(),
};

// Export the environment configuration
export const environment: EnvironmentConfig = defaultConfig;

// Export client-side only configuration for components
export const clientEnvironment: ClientConfig = getClientConfig();

// Export server-side configuration (only use in API routes/server components)
export const getServerEnvironment = (): ServerConfig => {
  if (typeof window !== "undefined") {
    throw new Error(
      "Server configuration should not be accessed on the client side"
    );
  }
  return getServerConfig();
};

// Helper functions
export const isProduction = () => environment.production;
export const isDevelopment = () => !environment.production;

// API URL builders (client-safe)
export const getSignMtApiUrl = (endpoint: string) =>
  `${environment.signMtApiBaseUrl}/${endpoint.replace(/^\//, "")}`;
export const getFirebaseStorageUrl = (path: string) =>
  `${environment.firebaseStorageBucketUrl}${encodeURIComponent(path)}`;

// Server-side API URL builders (use only in API routes)
export const getServerApiUrl = (endpoint: string) => {
  const serverConfig = getServerEnvironment();
  return `${serverConfig.apiBaseUrl}/${endpoint.replace(/^\//, "")}`;
};

// Validation function
export const validateEnvironment = (): boolean => {
  const requiredKeys = [
    "firebase.apiKey",
    "firebase.projectId",
    "signMtApiBaseUrl",
    "signMtCloudFunctionUrl",
  ];

  for (const key of requiredKeys) {
    const value = key
      .split(".")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .reduce((obj, k) => obj?.[k], environment as any);
    if (!value) {
      console.error(`Missing required environment variable: ${key}`);
      return false;
    }
  }

  return true;
};

// Log configuration in development (client-safe only)
if (isDevelopment() && typeof window !== "undefined") {
  console.log("Client Environment Configuration:", {
    production: clientEnvironment.production,
    firebase: {
      ...clientEnvironment.firebase,
      apiKey: clientEnvironment.firebase.apiKey.substring(0, 10) + "...", // Hide full API key
    },
    endpoints: {
      signMtApi: clientEnvironment.signMtApiBaseUrl,
      cloudFunction: clientEnvironment.signMtCloudFunctionUrl,
      firebaseStorage: clientEnvironment.firebaseStorageBucketUrl,
    },
  });
}
