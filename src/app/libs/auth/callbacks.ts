import { Connect } from "@/dbConfig/dbConfig";
import User from "@/app/models/userModel";
import { Account, Profile } from "next-auth";
import { JWT } from "next-auth/jwt";

export const callbacks = {
  async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
    if (url.startsWith("/")) return `${baseUrl}${url}`;
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
    if (account?.provider === "google" && profile?.email) {
      try {
        await Connect();

        const userEmail = profile.email.toLowerCase();
        const profileImage = profile.image || (profile as any).picture;

        // Use findOneAndUpdate with upsert: true
        // This avoids "Email already exists" errors and updates the profile pic if changed
        await User.findOneAndUpdate(
          { Email: userEmail },
          {
            $set: {
              Name: profile.name,
              UrlImageProfile: profileImage,
            },
            $setOnInsert: { Email: userEmail }, // Only set on creation
          },
          { upsert: true, new: true },
        );

        return true;
      } catch (error) {
        console.error("SignIn Callback Error:", error);
        return false;
      }
    }
    return true;
  },

  async jwt({
    token,
    user,
    trigger,
    session,
  }: {
    token: JWT;
    user?: any;
    trigger?: string;
    session?: any;
  }) {
    // 1. On Initial Sign In
    if (user) {
      await Connect();
      // Optimization: Fetch only the fields we need
      const dbUser = await User.findOne({
        Email: user.email?.toLowerCase(),
      }).select("_id Name UrlImageProfile");

      if (dbUser) {
        token.id = dbUser._id.toString();
        token.name = dbUser.Name;
        token.picture = dbUser.UrlImageProfile;
      }
    }

    // 2. Handle Manual Session Updates (client-side update() call)
    if (trigger === "update" && session?.user) {
      return { ...token, ...session.user };
    }

    return token;
  },

  async session({ session, token }: { session: any; token: JWT }) {
    if (token && session.user) {
      // Mapping JWT token data to the Session object
      session.user.id = token.id;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.image = token.picture;
    }
    return session;
  },
};
