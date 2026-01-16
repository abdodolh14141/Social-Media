import { Connect } from "@/dbConfig/dbConfig";
import User from "@/app/models/userModel";
import { Account, Profile, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import { AdapterUser } from "next-auth/adapters";
import bcrypt from "bcrypt";
export const callbacks = {
  async signIn({
    user,
    account,
    profile,
  }: {
    user: AdapterUser | typeof User;
    account: Account | null;
    profile?: Profile;
  }) {
    if (account?.provider === "google" && profile?.email) {
      try {
        await Connect();

        const existingUser = await User.findOne({
          Email: profile.email,
        });

        if (!existingUser) {
          const secureRandomString = await bcrypt.hash(
            profile.email + Date.now,
            10
          );

          const newUser = new User({
            Name: profile.name,
            Email: profile.email.toLowerCase(),
            Password: secureRandomString,
          });
          await newUser.save();
        }

        return true;
      } catch (error) {
        console.error("Google sign-in error:", error);
        return false;
      }
    }
    return true;
  },

  async jwt({ token, user }: { token: JWT; user?: AdapterUser | User }) {
    if (user) {
      token.id = user.id;
      token.email = user.email;
      token.name = user.name;
    }
    return token;
  },

  async session({ session, token }: { session: Session; token: JWT }) {
    if (token) {
      session.user = {
        id: token.sub,
        email: token.email,
        name: token.name,
      };
    }
    return session;
  },
};
