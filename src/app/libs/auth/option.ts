import { NextAuthOptions } from "next-auth";
import { providers } from "./providers";
import { callbacks } from "./callbacks";
// Ensure the callbacks are typed correctly for NextAuth
export const authOptions: NextAuthOptions = {
  providers,
  callbacks: callbacks as Partial<import("next-auth").CallbacksOptions>, // Type assertion to satisfy NextAuth
  session: {
    strategy: "jwt",
    maxAge: 30, // 24 hours
  },
  jwt: {
    maxAge: 30, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
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
      },
    },
  },
  debug: process.env.NODE_ENV === "development",
};
