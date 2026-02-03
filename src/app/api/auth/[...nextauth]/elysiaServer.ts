import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { postsRoutes } from "@/backend/routes/posts";
import { usersRoutes } from "@/backend/routes/users";
import { emailRoutes } from "@/backend/routes/email";
import { createMessagesRoutes } from "@/backend/routes/messages";

export const elysiaApp = new Elysia()
  .use(cors())
  .get("/", () => "Elysia Integrated Backend...!")
  .use(postsRoutes)
  .use(usersRoutes)
  .use(emailRoutes)
  .use(createMessagesRoutes((global as any).io));
