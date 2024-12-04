import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { Connect } from "@/dbConfig/dbConfig";
import bcrypt from "bcrypt";
import User from "@/app/models/userModel";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

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

const authOptions: NextAuthOptions = {
  jwt: {
    maxAge: 60 * 60, // 1 hour
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
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
        },
      },
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

          return {
            id: existingUser._id.toString(),
            email: existingUser.Email,
            name: existingUser.Name,
          };
        } catch (error) {
          throw new Error(`Authorization failed: ${error.message}`);
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
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
              Password: "******", // Placeholder for Google accounts
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
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

// Check environment variables before configuring NextAuth
checkEnvironmentVariables();

// Export NextAuth handler for both GET and POST requests
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST, authOptions };
