"use client";

import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import NewPost from "../newPost/newPage";
import GetPosts from "../fetchPosts/getPosts";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Account from "@/app/searchAccounts/page";

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
      <header className="shadow-md top-0 text-white bg-gray-500 rounded-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
          <h1 className="text-2xl font-bold text-white">SocialApp</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {isAuthenticated ? (
          <>
            <Account />
            <br />
            <NewPost />
          </>
        ) : (
          <div className="text-center my-4">
            <h2 className="text-xl font-bold text-gray-800">
              Login to React Social
            </h2>
          </div>
        )}

        <GetPosts />
      </main>
    </>
  );
}
