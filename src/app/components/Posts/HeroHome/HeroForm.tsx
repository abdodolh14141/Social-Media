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
          <div></div>
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
