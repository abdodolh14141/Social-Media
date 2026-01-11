"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// FIX: Import from /components, NOT from /page.tsx
import NewPostForm from "../newPost/newPage";
import PostFeed from "../fetchPosts/getPosts";

// These should be moved to components to fix your "Module not found" build error
import AccountSearch from "@/app/searchAccounts/page";
import AboutSection from "@/app/about/page";

export default function HeroForm() {
  const { status } = useSession();
  const router = useRouter();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <AccountSearch />
      </div>

      <main className="mx-auto max-w-4xl px-4">
        {isAuthenticated ? <NewPostForm /> : <div></div>}

        <section className="space-y-8">
          <PostFeed />
        </section>

        <section className="mt-20 pt-10 border-t border-gray-800">
          <AboutSection />
        </section>
      </main>
    </>
  );
}
