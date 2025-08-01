import { getServerSession } from "next-auth/next";
import { AuthOptions } from "./auth/option";

export async function getSession(req: any, res: any) {
  const session = await getServerSession(req, res, AuthOptions);
  return session;
}
