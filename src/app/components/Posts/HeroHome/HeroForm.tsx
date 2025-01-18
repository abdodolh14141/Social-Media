"use client";

import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import NewPost from "../newPost/newPage";
import GetPosts from "../fetchPosts/getPosts";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Account from "@/app/searchAccounts/page";
import About from "@/app/about/page";

export default function HeroForm() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession();
        setIsAuthenticated(!!session?.user);
      } catch (error: any) {
        toast.error("Failed to check session. Please try again.");
      }
    };

    checkSession();
  }, [router]);

  return (
    <>
      <Toaster />
      <Account />

      <main className="w-full mx-auto p-6">
        {isAuthenticated ? (
          <>
            <NewPost />
          </>
        ) : (
          <div className="my-5">
            <h2 className="text-2xl text-center text-white font-bold m-3 p-3">
              Login to React World And Social And Add Posts And Comments And
              Like Posts And Follow Users And More
            </h2>{" "}
            <hr className="my-8 border-t-8 border-black rounded-md shadow-md w-full" />
          </div>
        )}

        <div>
          <GetPosts />
        </div>
        <div className="mt-20">
          <About />
        </div>
      </main>
    </>
  );
}
