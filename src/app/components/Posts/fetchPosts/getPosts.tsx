"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useElysiaSession } from "@/app/libs/hooks/useElysiaSession";
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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const postVariants: Variants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 90, damping: 18 },
  },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } },
};

const fetchPosts = () =>
  axios.get("/api/posts/fetchPosts").then((r) => r.data.posts ?? []);
const fetchComments = () =>
  axios
    .get("/api/posts/actionPosts/fetchComments")
    .then((r) => r.data.comments ?? []);

export default function GetPosts() {
  const { data: session } = useElysiaSession();
  const queryClient = useQueryClient();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const [draft, setDraft] = useState<Record<string, string>>({});

  const user = useMemo(() => {
    if (!session?.user) return null;
    const s = session.user as any;
    return { id: s.id ?? s.sub, email: s.email, name: s.name };
  }, [session]);

  const [postsQuery, commentsQuery] = useQueries({
    queries: [
      { queryKey: ["posts"], queryFn: fetchPosts, staleTime: STALE_TIME },
      { queryKey: ["comments"], queryFn: fetchComments, staleTime: STALE_TIME },
    ],
  });

  /* Mutations */
  const likeMutation = useMutation({
    mutationFn: (postId: string) =>
      axios.post("/api/posts/actionPosts/addLike", { postId, userId: user?.id }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  const addCommentMutation = useMutation({
    mutationFn: (data: any) =>
      axios.post("/api/posts/actionPosts/fetchComments", data),
    onSuccess: () => {
      toast.success("Comment added");
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to add comment");
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) =>
      axios.post("/api/posts/actionPosts/deletePost", { postId }),
    onSuccess: () => {
      toast.success("Post deleted");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete post");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      axios.delete("/api/posts/actionPosts/fetchComments", {
        data: { commentId },
      }),
    onSuccess: () => {
      toast.success("Comment deleted");
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete comment");
    },
  });

  const formattedPosts = useMemo(() => {
    if (!postsQuery.data) return [];
    const commentMap = new Map<string, any[]>();
    commentsQuery.data?.forEach((c: any) => {
      if (!commentMap.has(c.idPost)) commentMap.set(c.idPost, []);
      commentMap.get(c.idPost)?.push(c);
    });

    return [...postsQuery.data]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map((p) => ({
        ...p,
        isLikedByUser: user?.id ? p.likedBy?.includes(user.id) : false,
        comments: (commentMap.get(p._id) || []).sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      }));
  }, [postsQuery.data, commentsQuery.data, user?.id]);

  /* Handlers */
  const handleLike = useCallback(
    (postId: string) => {
      if (!user?.id) return toast.error("Log in to join the conversation");
      likeMutation.mutate(postId);
    },
    [user?.id, likeMutation]
  );

  const handleAddComment = useCallback(
    (e: React.FormEvent, postId: string) => {
      e.preventDefault();
      if (!user?.id) return toast.error("Log in to comment");
      const text = draft[postId];
      if (!text?.trim()) return;

      addCommentMutation.mutate(
        {
          postId,
          comment: text,
          userId: user.id,
          name: user.name || "Anonymous",
        },
        {
          onSuccess: () => {
            setDraft((prev) => ({ ...prev, [postId]: "" }));
          },
        }
      );
    },
    [draft, user, addCommentMutation]
  );

  const handleDeletePost = useCallback(
    (postId: string) => {
      if (!confirm("Are you sure you want to delete this post?")) return;
      deletePostMutation.mutate(postId);
    },
    [deletePostMutation]
  );

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      if (!confirm("Delete this comment?")) return;
      deleteCommentMutation.mutate(commentId);
    },
    [deleteCommentMutation]
  );

  const isLoading = (key: string) => {
    if (key.startsWith("delete-post")) return deletePostMutation.isPending;
    return false;
  };

  if (postsQuery.isPending || commentsQuery.isPending)
    return <LoadingSkeleton />;

  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-200 selection:bg-indigo-500/30">
      <Toaster richColors position="top-center" />

      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-indigo-600/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Main Content: max-w updated to 4xl for BIGGER posts */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-16">
        <header className="mb-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black tracking-tighter text-white sm:text-6xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500"
          >
            Feed
          </motion.h1>
          <p className="mt-4 text-lg text-slate-400 font-medium">
            Explore the latest from the community.
          </p>
        </header>

        <AnimatePresence mode="popLayout">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-12" // Increased vertical spacing for bigger feel
          >
            {formattedPosts.map((post) => (
              <motion.div
                key={post._id}
                variants={postVariants}
                layout
                className="w-full"
              >
                <PostItem
                  post={post}
                  user={user}
                  newComment={draft}
                  setNewComment={setDraft}
                  handleLike={handleLike}
                  handleAddComment={handleAddComment}
                  handleDeletePost={handleDeletePost}
                  handleDeleteComment={handleDeleteComment}
                  isLoading={isLoading}
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
    <div className="max-w-4xl mx-auto p-8 space-y-12 pt-28 bg-[#020617] min-h-screen">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-[2rem] space-y-6"
        >
          <div className="flex gap-5 items-center">
            <div className="w-14 h-14 bg-slate-800 rounded-full animate-pulse" />
            <div className="space-y-3">
              <div className="w-48 h-5 bg-slate-800 rounded-full animate-pulse" />
              <div className="w-32 h-3 bg-slate-800/50 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="w-full h-64 bg-slate-800/30 rounded-3xl animate-pulse" />
        </div>
      ))}
    </div>
  );
}
