import { type NextAuthOptions } from "next-auth";
import { type CallbacksOptions } from "next-auth";
import { type Providers } from "next-auth/providers";
// Assuming 'providers' and 'callbacks' are defined in separate files
import { providers } from "./providers";
import { callbacks as rawCallbacks } from "./callbacks"; // Rename to avoid conflict with final variable

// --- Define Missing Constant ---
// Define the session maximum age in seconds for consistency
const SESSION_MAX_AGE_SECONDS = 4 * 60 * 60; // 4 hours

// --- Type Casting for Callbacks ---
// Ensure the callbacks object is correctly typed as CallbacksOptions
const callbacks: CallbacksOptions = rawCallbacks;

// --- Main Configuration Object ---
export const AuthOptions: NextAuthOptions = {
  // 1. Providers: Ensure it's correctly typed from the imported file
  providers: providers as Providers,

  // 2. Callbacks: Using the correctly typed and casted object
  callbacks,

  // 3. Session Strategy: JWT is the recommended strategy.
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
    // Note: 'updateAge' only works with database sessions.
    // It is redundant or incorrect when using 'jwt' strategy. Removing the comment's suggestion.
  },

  // 4. JWT Options: Should match the session maxAge for consistency.
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },

  // 5. Secret: Essential for securing tokens.
  // Note: Using a non-null assertion '!' is common but be sure NEXTAUTH_SECRET is set.
  secret: process.env.NEXTAUTH_SECRET!,

  // 6. Custom Pages: Controls the UI flow for authentication.
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
    // Note: Consider adding 'signOut', 'verifyRequest', and 'newUser' for completeness.
  },

  // 7. Cookies: Aligned with the session maxAge.
  cookies: {
    sessionToken: {
      name: `${
        process.env.NODE_ENV === "production" ? "__Secure-" : ""
      }next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // Using the defined constant here
        maxAge: SESSION_MAX_AGE_SECONDS,
      },
    },
    // Optional: Include the CSRF token cookie config for full control
    csrfToken: {
      name: `${
        process.env.NODE_ENV === "production" ? "__Host-" : ""
      }next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  // 8. Debugging: Correctly enabled only in development.
  debug: process.env.NODE_ENV === "development",
};
