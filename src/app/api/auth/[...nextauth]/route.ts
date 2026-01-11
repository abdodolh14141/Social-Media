import NextAuth from "next-auth";
import { AuthOptions } from "@/app/libs/auth/option";
import { validateAuthEnvironment } from "../../../libs/auth/validateEnv";

validateAuthEnvironment();

const handler = NextAuth(AuthOptions);

export { handler as GET, handler as POST };
