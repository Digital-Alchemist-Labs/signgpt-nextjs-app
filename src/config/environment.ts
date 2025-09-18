// Environment configuration based on the original translate project
// This file centralizes all environment variables and API endpoints

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string | null;
}

export interface EnvironmentConfig {
  production: boolean;
  firebase: FirebaseConfig;
  reCAPTCHAKey: string;

  // API Endpoints
  signMtApiBaseUrl: string;
  signMtCloudFunctionUrl: string;
  firebaseStorageBucketUrl: string;
  firebaseStorageBucket: string;

  // MediaPipe Configuration
  mediaPipeModelPath: string;

  // Feature Flags
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
}

// Default configuration based on original project
const defaultConfig: EnvironmentConfig = {
  production: process.env.NODE_ENV === "production",
  firebase: {
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
  reCAPTCHAKey:
    process.env.NEXT_PUBLIC_RECAPTCHA_KEY ||
    "6Ldsxb8oAAAAAGyUZbyd0QruivPSudqAWFygR-4t",

  // API Endpoints
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

  // MediaPipe Configuration
  mediaPipeModelPath:
    process.env.NEXT_PUBLIC_MEDIAPIPE_MODEL_PATH || "/assets/models/holistic/",

  // Feature Flags
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
  enableErrorReporting:
    process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === "true",
};

// Export the environment configuration
export const environment: EnvironmentConfig = defaultConfig;

// Helper functions
export const isProduction = () => environment.production;
export const isDevelopment = () => !environment.production;

// API URL builders
export const getSignMtApiUrl = (endpoint: string) =>
  `${environment.signMtApiBaseUrl}/${endpoint.replace(/^\//, "")}`;
export const getFirebaseStorageUrl = (path: string) =>
  `${environment.firebaseStorageBucketUrl}${encodeURIComponent(path)}`;

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

// Log configuration in development
if (isDevelopment()) {
  console.log("Environment Configuration:", {
    production: environment.production,
    firebase: {
      ...environment.firebase,
      apiKey: environment.firebase.apiKey.substring(0, 10) + "...", // Hide full API key
    },
    endpoints: {
      signMtApi: environment.signMtApiBaseUrl,
      cloudFunction: environment.signMtCloudFunctionUrl,
      firebaseStorage: environment.firebaseStorageBucketUrl,
    },
  });
}
