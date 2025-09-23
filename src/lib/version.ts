// Version tracking for deployment verification
export const APP_VERSION = "1.09.25";
export const BUILD_COMMIT = "53e0d42"; // 2309.1411 Google Auth fix
export const BUILD_DATE = "2025-09-23";

// Function to get version info for debugging
export function getVersionInfo() {
  return {
    version: APP_VERSION,
    commit: BUILD_COMMIT,
    buildDate: BUILD_DATE,
    timestamp: new Date().toISOString()
  };
}
