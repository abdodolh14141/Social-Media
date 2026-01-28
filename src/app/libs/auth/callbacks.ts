import { Connect } from "@/dbConfig/dbConfig";
import User from "@/app/models/userModel";
import { Account, Profile } from "next-auth";
import { JWT } from "next-auth/jwt";

export const callbacks = {
  async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
    // Allows relative callback URLs
    if (url.startsWith("/")) return `${baseUrl}${url}`;
    // Allows callback URLs on the same origin
    else if (new URL(url).origin === baseUrl) return url;
    return baseUrl;
  },
  async signIn({
    account,
    profile,
  }: {
    account: Account | null;
    profile?: Profile;
  }) {
    // Only handle logic for Google provider
    if (account?.provider === "google" && profile?.email) {
      try {
        await Connect();

        const userEmail = profile.email.toLowerCase();

        // Check if user exists, if not, create them
        // Using findOneAndUpdate with upsert is more atomic and efficient
        await User.findOneAndUpdate(
          { Email: userEmail },
          {
            $setOnInsert: {
              Name: profile.name,
              Email: userEmail,
              UrlImageProfile: profile.image || (profile as any).picture, // Google uses .picture
              // OAuth users don't need a password. 
              // We leave it undefined or use a flag to indicate OAuth.
            },
          },
          { upsert: true, new: true }
        );

        return true;
      } catch (error) {
        console.error("SignIn Callback Error:", error);
        return false; // Prevents sign in if DB fails
      }
    }
    return true; // Allow other providers (like Credentials)
  },

  async jwt({ token, user, trigger, session }: { token: JWT; user?: any; trigger?: string; session?: any }) {
    // Initial sign in: attach DB fields to the token
    if (user) {
      await Connect();
      const dbUser = await User.findOne({ Email: user.email?.toLowerCase() });
      
      if (dbUser) {
        token.id = dbUser._id.toString();
        token.name = dbUser.Name;
        token.picture = dbUser.UrlImageProfile;
      }
    }

    // Handle session updates (e.g., if user changes their name/image)
    if (trigger === "update" && session) {
      return { ...token, ...session.user };
    }

    return token;
  },

  async session({ session, token }: { session: any; token: JWT }) {
    if (token && session.user) {
      session.user.id = token.id as string;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.image = token.picture;
    }
    return session;
  },
};