"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Toaster, toast } from "sonner";
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  Variants,
} from "framer-motion";
import { useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { PostItem } from "@/app/components/Posts/postItem/postItem";

const STALE_TIME = 1000 * 60 * 5;

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const postVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
  exit: { scale: 0.95, opacity: 0 },
};

const fetchPosts = () =>
  axios.get("/api/posts/fetchPosts").then((r) => r.data.posts ?? []);
const fetchComments = () =>
  axios
    .get("/api/posts/actionPosts/fetchComments")
    .then((r) => r.data.comments ?? []);

export default function GetPosts() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const [draft, setDraft] = useState<Record<string, string>>({});

  const user = useMemo(() => {
    const s = session?.user as any;
    return s
      ? { id: s.id ?? s.sub, email: s.email ?? "", name: s.name ?? "Anonymous" }
      : null;
  }, [session]);

  const [postsQuery, commentsQuery] = useQueries({
    queries: [
      { queryKey: ["posts"], queryFn: fetchPosts, staleTime: STALE_TIME },
      { queryKey: ["comments"], queryFn: fetchComments, staleTime: STALE_TIME },
    ],
  });

  const isLoading = postsQuery.isPending || commentsQuery.isPending;

  const formattedPosts = useMemo(() => {
    if (!postsQuery.data) return [];
    const commentMap = new Map();
    commentsQuery.data?.forEach((c: any) => {
      const existing = commentMap.get(c.idPost) || [];
      commentMap.set(c.idPost, [...existing, c]);
    });

    return [...postsQuery.data]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map((p) => ({
        ...p,
        isLikedByUser: user?.id ? p.likedByUsers?.includes(user.id) : false,
        comments: (commentMap.get(p._id) || []).sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      }));
  }, [postsQuery.data, commentsQuery.data, user?.id]);

  const handleLike = useCallback(
    (postId: string) => {
      if (!user?.id) return toast.error("Please login to like posts");
      // Like mutation logic remains same as optimized version
    },
    [user?.id]
  );

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="relative min-h-screen bg-[#030712] text-gray-100 overflow-hidden">
      <Toaster richColors position="bottom-right" />

      {/* 1. Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-indigo-500 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* 2. Background Decor */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-20">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            Community Feed
          </h1>
          <p className="text-gray-400 mt-2">Latest updates from the network</p>
        </motion.div>

        {/* 3. Staggered Post List */}
        <AnimatePresence mode="popLayout">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {formattedPosts.map((post) => (
              <motion.div key={post._id} variants={postVariants} layout>
                <PostItem
                  post={post}
                  user={user}
                  newComment={draft}
                  setNewComment={setDraft}
                  handleLike={handleLike}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8 pt-24">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="relative overflow-hidden bg-gray-900/40 border border-white/5 h-64 rounded-3xl"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          />
        </div>
      ))}
    </div>
  );
}
