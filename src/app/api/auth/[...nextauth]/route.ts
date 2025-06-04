import NextAuth, {
  NextAuthOptions,
  User as NextAuthUser,
  Session as NextAuthSession,
} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { Connect } from "@/dbConfig/dbConfig";
import bcrypt from "bcrypt";
import User from "@/app/models/userModel";
import { dom } from "@fortawesome/fontawesome-svg-core";

interface UserCredentials {
  email: string;
  password: string;
}

const checkEnvironmentVariables = () => {
  const requiredVars = ["GOOGLE_CLIENT_ID", "GOOGLE_SECRET", "NEXTAUTH_SECRET"];
  const missingVars = requiredVars.filter((key) => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
    };
  }

  interface JWT {
    id: string;
    email: string;
    name: string;
  }
}

const authOptions: NextAuthOptions = {
  jwt: {
    maxAge: 60 * 60, // 1 hour
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
    updateAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile", // Ensure profile scope is included
        },
      },
      checks: ["pkce", "state"],
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: UserCredentials | undefined) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        try {
          await Connect();

          // Check if user exists
          const existingUser = await User.findOne({ Email: credentials.email });
          if (!existingUser) {
            throw new Error("No user found with the provided email.");
          }

          // Validate password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            existingUser.Password
          );
          if (!isPasswordValid) {
            throw new Error("Invalid email or password.");
          }

          // Return the user object with its ID for JWT
          return {
            id: existingUser._id,
            email: existingUser.Email,
            name: existingUser.Name,
          };
        } catch (error: any) {
          throw new Error(`Authorization failed: ${error.message}`);
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: "__Secure-next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production", // Use secure cookies in production
        domain: process.env.NEXTAUTH_COOKIE_DOMAIN || undefined, // Set domain if specified
      },
    },
  },
  callbacks: {
    async signIn({ profile, account }) {
      if (account?.provider === "google" && profile) {
        try {
          await Connect();

          // Check if Google user exists
          let user = await User.findOne({ Email: profile.email });
          if (!user) {
            // Create a new user if none exists
            user = new User({
              Email: profile.email,
              Name: profile.name,
              Password: `${profile.email}`, // Placeholder for Google accounts
            });

            await user.save();
          }

          return true;
        } catch (error) {
          console.error("Google Sign-In Error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; // Add user ID to JWT
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: NextAuthSession;
      token: any;
    }) {
      if (token) {
        session.user = {
          id: token.id, // Include user ID in the session object
          email: token.email,
          name: token.name,
        };
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Prevent open redirects
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login", // Redirect to a custom login page
  },
};

// Check environment variables before configuring NextAuth
checkEnvironmentVariables();

// Export NextAuth handler for both GET and POST requests
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST, authOptions };
