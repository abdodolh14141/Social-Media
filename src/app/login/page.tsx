"use client";

import { useEffect, useState } from "react";
import LoginWithGoogle from "../components/buttons/LoginWithGoogle";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { getSession } from "next-auth/react";

interface FormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const router = useRouter();

  const handleSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const { email, password } = formData;

    try {
      const resData = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (resData?.status === 200) {
        toast.success("Successfully logged in!");
        router.push("/");
      } else {
        toast.error("Invalid credentials, please try again.");
      }
    } catch (error: any) {
      toast.error("An error occurred. Please try again.");
    }
  };

  useEffect(() => {
    const resCheckLogin = async () => {
      try {
        const resSession = await getSession();
        if (resSession?.user) {
          router.replace("/");
        }
      } catch (error: any) {
        console.log(error);
        toast.error(error);
      }
    };
    resCheckLogin();
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-screen shadow-2xl">
      <Toaster />
      <div className="p-6 max-w-7xl w-full bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-bold text-center mb-2">Sign In</h1>
        <p className="text-center mb-6 text-gray-500">
          Sign In To Your Account Using One Of The Methods
        </p>
        <div className="max-w-5xl w-full bg-white rounded-lg shadow-md mx-auto p-4">
          <form onSubmit={handleSubmit} className="p-4 m-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full p-3 m-3 border rounded-md focus:outline-none focus:border-blue-500"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full p-3 border m-3 rounded-md focus:outline-none focus:border-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full p-3 m-3 bg-blue-500 text-white cursor-pointer font-semibold rounded-md hover:bg-blue-600 transition duration-200"
            >
              Sign In
            </button>
          </form>
          <LoginWithGoogle />
          <div className="p-2 flex text-green-600 text-xl justify-around">
            <Link href={"/signIn"}>I Don't Have Account</Link>
            <Link href={"/restPassword"}>Forget Password</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
