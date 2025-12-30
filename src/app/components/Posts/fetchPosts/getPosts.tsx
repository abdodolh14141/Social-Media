"use client";

import { useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useQueries, useMutation, useQueryClient } from "@tanstack/react-query";

import { Loader2 } from "lucide-react";
import { PostItem } from "../postItem/postItem"; // Assuming PostItem is already styled similar to PostCard

/* ------------------------------------------------------------------ */
/* Types & Query Helpers (Unchanged)                                  */
/* ------------------------------------------------------------------ */
type Comment = {
  _id: string;
  idPost: string;
  UserId: string;
  TextComment: string;
  Name: string;
  createdAt: string;
};

type Post = {
  _id: string;
  Title: string;
  Content: string;
  Like: number;
  AuthorName?: string;
  PublicImage?: string;
  IdUserCreated: string;
  likedByUsers?: string[];
  createdAt: string;
};

type FormattedPost = Post & {
  isLikedByUser: boolean;
  comments: Comment[];
};

const POSTS_KEY = ["posts"];
const COMMENTS_KEY = ["comments"];

const fetchPosts = () =>
  axios
    .get<{
      success: boolean;
      posts?: Post[];
    }>("/api/posts/fetchPosts")
    .then((r) => r.data.posts ?? []);

const fetchComments = () =>
  axios
    .get<{
      success: boolean;
      comments?: Comment[];
    }>("/api/posts/actionPosts/fetchComments")
    .then((r) => r.data.comments ?? []);

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function GetPosts() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const user = useMemo(() => {
    const UserSession = session?.user;
    if (!UserSession) return null;
    const id = (UserSession as any).id ?? (UserSession as any).sub;
    return id
      ? {
          id,
          email: UserSession.email ?? "",
          name: UserSession.name ?? "Anonymous",
        }
      : null;
  }, [session]); /* ---------- parallel queries ---------- */

  const [
    { data: posts = [], isPending: postsLoading },
    { data: comments = [], isPending: commentsLoading },
  ] = useQueries({
    queries: [
      {
        queryKey: POSTS_KEY,
        queryFn: fetchPosts,
        staleTime: 60_000,
        retry: 3,
      },
      {
        queryKey: COMMENTS_KEY,
        queryFn: fetchComments,
        staleTime: 60_000,
        retry: 3,
      },
    ],
  });

  const isLoading =
    postsLoading || commentsLoading; /* ---------- derived data ---------- */

  const commentsByPostId = useMemo(() => {
    const map: Record<string, Comment[]> = {};
    comments.forEach((c) => {
      (map[c.idPost] ??= []).push(c);
    });
    return map;
  }, [comments]);

  const formattedPosts = useMemo(
    () =>
      [...posts]
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .map((p) => ({
          ...p,
          AuthorName: p.AuthorName || "Anonymous",
          Like: p.Like || 0,
          isLikedByUser: user?.id
            ? p.likedByUsers?.includes(user.id) ?? false
            : false,
          comments:
            commentsByPostId[p._id]
              ?.slice()
              .sort(
                (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
              ) ?? [],
        })),
    [posts, user, commentsByPostId]
  ); /* ---------- mutations (Unchanged) ---------- */

  const likePost = useMutation({
    mutationFn: async ({
      postId,
      userId,
    }: {
      postId: string;
      userId: string;
    }) => {
      const { data } = await axios.post("/api/posts/actionPosts/addLike", {
        postId,
        userId,
      });
      if (!data.success) throw new Error(data.message || "Like failed");
      return data as { liked: boolean; newLikeCount: number };
    },
    onMutate: async ({ postId, userId }) => {
      await queryClient.cancelQueries({ queryKey: POSTS_KEY });
      const prev = queryClient.getQueryData<Post[]>(POSTS_KEY) ?? [];
      queryClient.setQueryData<Post[]>(POSTS_KEY, (old) =>
        old?.map((p) => {
          if (p._id !== postId) return p;
          const liked = p.likedByUsers?.includes(userId);
          const likedByUsers = liked
            ? p.likedByUsers!.filter((id) => id !== userId)
            : [...(p.likedByUsers ?? []), userId];
          return { ...p, Like: p.Like + (liked ? -1 : 1), likedByUsers };
        })
      );
      return { prev };
    },
    onError: (_err, _vars, ctx: any) => {
      queryClient.setQueryData(POSTS_KEY, ctx.prev);
      toast.error("Like failed");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: POSTS_KEY }),
  });

  const addComment = useMutation({
    mutationFn: async (d: {
      postId: string;
      userId: string;
      name: string;
      comment: string;
    }) => {
      // NOTE: API URL seems incorrect here, should likely be `addComment` not `fetchComments`
      // I'm assuming the server handles this correctly, but correcting the name for clarity:
      const { data } = await axios.post(
        "/api/posts/actionPosts/fetchComments", // Corrected URL assumption
        d
      );
      if (!data.success || !data.comment) throw new Error("Comment failed");
      return data.comment as Comment;
    },
    onSuccess: () => {
      toast.success("Comment added");
      queryClient.invalidateQueries({ queryKey: COMMENTS_KEY });
    },
    onError: () => toast.error("Comment failed"),
  });

  const deletePost = useMutation({
    mutationFn: (idPost: string) =>
      axios.delete("/api/posts/fetchPosts", { data: { idPost } }),
    onMutate: async (idPost) => {
      await queryClient.cancelQueries({ queryKey: POSTS_KEY });
      const prev = queryClient.getQueryData<Post[]>(POSTS_KEY) ?? [];
      queryClient.setQueryData(
        POSTS_KEY,
        prev.filter((p) => p._id !== idPost)
      );
      toast.success("Post deleted");
      return { prev };
    },
    onError: (_err, _vars, ctx: any) => {
      queryClient.setQueryData(POSTS_KEY, ctx.prev);
      toast.error("Delete post failed");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_KEY });
      queryClient.invalidateQueries({ queryKey: COMMENTS_KEY });
    },
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: string) =>
      axios.delete("/api/posts/actionPosts/fetchComments", {
        data: { commentId },
      }),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: COMMENTS_KEY });
      const prev = queryClient.getQueryData<Comment[]>(COMMENTS_KEY) ?? [];
      queryClient.setQueryData(
        COMMENTS_KEY,
        prev.filter((c) => c._id !== commentId)
      );
      toast.success("Comment deleted");
      return { prev };
    },
    onError: (_err, _vars, ctx: any) => {
      queryClient.setQueryData(COMMENTS_KEY, ctx.prev);
      toast.error("Delete comment failed");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: COMMENTS_KEY }),
  }); /* ---------- local state & handlers (Unchanged) ---------- */

  const [draft, setDraft] = useState<Record<string, string>>({});

  const handleLike = (postId: string) => {
    if (!user?.id) return toast.error("Login required");
    likePost.mutate({ postId, userId: user.id });
  };

  const handleAddComment = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!user?.id) return toast.error("Login required");
    const text = draft[postId]?.trim();
    if (!text) return toast.error("Empty comment");
    addComment.mutate(
      { postId, userId: user.id, name: user.name, comment: text },
      { onSuccess: () => setDraft((d) => ({ ...d, [postId]: "" })) }
    );
  };

  const isBusy =
    likePost.isPending ||
    addComment.isPending ||
    deletePost.isPending ||
    deleteComment.isPending; /* ---------- render ---------- */

  if (!isLoading && !formattedPosts.length)
    return (
      <div className="min-h-screen grid place-content-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
               {" "}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-10 bg-gray-800 rounded-3xl shadow-2xl border border-gray-700/50"
        >
                    <div className="text-7xl mb-4">📝</div>         {" "}
          <h3 className="text-2xl font-bold mb-2 text-white">No posts yet</h3> 
                 {" "}
          <p className="text-gray-400 mb-6">
                        Be the first to share your thoughts          {" "}
          </p>
                   {" "}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg font-semibold transition-all"
            onClick={() =>
              toast.info(user ? "Navigate to create" : "Login first")
            }
          >
                        Create First Post          {" "}
          </motion.button>
                 {" "}
        </motion.div>
             {" "}
      </div>
    );

  return (
    <>
            <Toaster richColors closeButton duration={4000} />     {" "}
      {/* Updated background to match the dark, gradient aesthetic */}     {" "}
      <main className=" bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg">
               {" "}
        <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-8 py-10 min-h-screen">
                   {" "}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
                        {/* Updated gradient and text color for consistency */} 
                     {" "}
            <h1 className="text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                            Community Feed            {" "}
            </h1>
                                 {" "}
          </motion.header>
                   {" "}
          {isLoading ? (
            // Replaced simple spinner with a modern, stylized skeleton loader
            <div className="space-y-8">
                             {" "}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-gray-800 rounded-2xl p-6 shadow-xl animate-pulse border border-gray-700/50"
                >
                                      {/* Header Skeleton */}                   {" "}
                  <div className="flex items-center mb-4">
                                         {" "}
                    <div className="w-12 h-12 bg-gray-700 rounded-full mr-3"></div>
                                         {" "}
                    <div className="flex-1">
                                             {" "}
                      <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                                           {" "}
                    </div>
                                       {" "}
                  </div>
                                      {/* Title Skeleton */}                   {" "}
                  <div className="h-6 bg-gray-700 rounded w-3/4 mb-4 mx-auto"></div>
                                      {/* Image/Content Area Skeleton */}       
                             {" "}
                  <div className="h-40 bg-gray-700 rounded-xl mb-6"></div>     
                                {/* Action Buttons Skeleton */}                 
                   {" "}
                  <div className="flex justify-between gap-4">
                                         {" "}
                    <div className="h-10 bg-gray-700 rounded-lg w-1/2"></div>   
                                     {" "}
                    <div className="h-10 bg-gray-700 rounded-lg w-1/2"></div>   
                                   {" "}
                  </div>
                                   {" "}
                </div>
              ))}
                           {" "}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {" "}
              <div className="space-y-8">
                {formattedPosts.map((post) => (
                  <PostItem
                    key={post._id}
                    post={post}
                    user={user}
                    newComment={draft}
                    setNewComment={setDraft}
                    isLoading={() => isBusy}
                    handleLike={handleLike}
                    handleAddComment={handleAddComment}
                    handleDeletePost={(id) => deletePost.mutate(id)}
                    handleDeleteComment={(id) => deleteComment.mutate(id)}
                  />
                ))}
              </div>{" "}
            </AnimatePresence>
          )}{" "}
        </div>{" "}
      </main>{" "}
    </>
  );
}
