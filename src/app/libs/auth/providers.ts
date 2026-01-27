import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { Connect } from "@/dbConfig/dbConfig";
import bcrypt from "bcrypt";
import User from "@/app/models/userModel";

export const providers = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_SECRET!,
    authorization: {
      params: {
        prompt: "consent",
        access_type: "offline",
        response_type: "code",
        scope: "openid email profile",
      },
    },
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
      };
    },
  }),
  CredentialsProvider({
    id: "credentials",
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Email and password are required");
      }

      try {
        await Connect();

        const user = await User.findOne({
          Email: credentials.email,
        }).select("+Password");
        if (!user) {
          throw new Error("No user found with this email");
        }

        if (!user.Password) {
          throw new Error(
            "This account was created with Google. Please sign in with Google."
          );
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.Password
        );
        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          email: user.Email,
          name: user.Name,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Authentication failed";
        throw new Error(message);
      }
    },
  }),
];
