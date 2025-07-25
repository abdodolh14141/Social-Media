/**
 * Validates that all required environment variables are present
 * @throws Error if any required variables are missing
 */
export function validateAuthEnvironment(): void {
  const requiredEnvVars = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_SECRET",
    "NEXTAUTH_SECRET",
  ];

  const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
}
