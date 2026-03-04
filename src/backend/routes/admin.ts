import User from "@/app/models/userModel";
import { Connect } from "@/dbConfig/dbConfig";
import Elysia from "elysia";

export const adminRoute = new Elysia({ prefix: "/admin" })
  .onBeforeHandle(async () => {
    await Connect();
  })
  .put("/edit/:id", async ({ body, params, set }: any) => {
    try {
      const { id } = params;
      const { name, email, password } = body;
      const user = await User.findById(id);
      if (!user) {
        return { success: false, message: "User not found" };
      }
      user.name = name;
      user.email = email;
      user.password = password;
      await user.save();
      return { success: true, message: "User updated successfully" };
    } catch (error) {
      set.status = 500;
      console.log(error);
      return { success: false, message: "Error updating user" };
    }
  });

export default adminRoute;
