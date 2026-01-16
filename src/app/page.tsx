"use client";
import { Sparkle, LayoutGrid, Info } from "lucide-react";
// Components should be organized in a /components folder, not /page
import AccountSearch from "@/app/searchAccounts/SearchComponent";
import PostFeed from "@/app/components/Posts/fetchPosts/getPosts";
import AboutSection from "@/app/about/page";
import { useSession } from "next-auth/react";
import NewPost from "./components/Posts/newPost/newPage";

export default function Home() {
  const isAuth = useSession()?.data ? true : false;
  return (
    <div className="mx-auto max-w-7xl w-full px-4 py-8">
      {/* 1. Search Header Area */}
      <header className="mb-8 transition-all duration-300">
        <AccountSearch />
      </header>

      {isAuth ? (
        <>
          <NewPost />
        </>
      ) : (
        <>
          <p>Login To Can React With Us</p>
        </>
      )}

      <main className="space-y-10">
        {/* 3. Feed Section */}
        <section>
          <SectionHeader
            icon={<LayoutGrid size={16} />}
            title="Recent Stories"
          />

          <div className="max-w-7xl">
            <PostFeed />
          </div>
        </section>

        {/* 4. Footer/About Area */}
        <footer className="mt-20 border-t border-zinc-100 pt-16 dark:border-zinc-800">
          <SectionHeader icon={<Info size={16} />} title="About the Platform" />
          <AboutSection />
        </footer>
      </main>
    </div>
  );
}

/**
 * Sub-components for cleaner structure
 */

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-500">
        {icon}
        {title}
      </h3>
      <div className="ml-4 h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}

function HeroCTA() {
  return (
    <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-xl transition-transform hover:scale-[1.01]">
      <Sparkle className="absolute -right-4 -top-4 h-24 w-24 opacity-20 transition-transform group-hover:rotate-12 group-hover:scale-110" />
      <h2 className="text-2xl font-bold">Share your thoughts</h2>
      <p className="mt-2 max-w-md text-blue-100">
        Join our community to create posts, follow creators, and join the
        conversation.
      </p>
      <button className="mt-6 rounded-full bg-white px-6 py-2 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-50">
        Get Started
      </button>
    </div>
  );
}
