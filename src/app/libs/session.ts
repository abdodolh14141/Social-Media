import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth/next";

export async function getSession(req: any, res: any) {
  const session = await getServerSession(req, res, authOptions);
  return session;
}
