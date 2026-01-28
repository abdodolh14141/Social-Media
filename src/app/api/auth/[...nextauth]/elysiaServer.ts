import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { postsRoutes } from "@/backend/routes/posts";
import { usersRoutes } from "@/backend/routes/users";
import { emailRoutes } from "@/backend/routes/email";

export const elysiaApp = new Elysia()
  .use(cors())
  .get("/", () => "Hello from Elysia Integrated Backend!")
  .use(postsRoutes)
  .use(usersRoutes)
  .use(emailRoutes);
