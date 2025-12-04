"use client";
import { useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import axios, { AxiosError } from "axios";
import { Toaster, toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  useQueries,
  UseQueryResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { Loader2 } from "lucide-react";
import { PostItem } from "../postItem/postItem";

// --- Type Definitions ---
interface Comment {
  _id: string;
  postId: string;
  userId: string;
  textComment: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface Post {
  _id: string;
  Title: string;
  Content: string;
  Like: number;
  AuthorName?: string;
  PublicImage?: string;
  IdUserCreated: string;
  likedByUsers?: string[];
  createdAt: string;
  updatedAt: string;
}

interface FormattedPost extends Post {
  isLikedByUser: boolean;
  comments: Comment[];
}

interface UserSession {
  id: string;
  email: string;
  name: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  comment?: Comment;
  comments?: Comment[];
  posts?: Post[];
  data?: T;
}

// --- Constants ---
const ANIMATION_CONFIG = {
  buttonHover: { scale: 1.02, transition: { duration: 0.2 } },
  buttonTap: { scale: 0.98 },
  fadeIn: { opacity: 0, y: 20 },
  fadeInVisible: { opacity: 1, y: 0 },
} as const;

const QUERY_CONFIG = {
  POSTS_KEY: ["posts"] as const,
  COMMENTS_KEY: ["comments"] as const,
  RETRY_COUNT: 3,
  STALE_TIME: 60 * 1000,
} as const;

// --- Helper Components ---
const LoadingSpinner = ({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) => <Loader2 size={size} className={`animate-spin ${className}`} />;

// --- Custom Hooks ---
const useCurrentUserSession = () => {
  const { data: session, status } = useSession();

  const user = useMemo(() => {
    if (status === "authenticated" && session?.user) {
      const userId = (session.user as any).id || (session.user as any).sub;
      if (userId) {
        return {
          id: userId,
          email: session.user.email ?? "",
          name: session.user.name || "Anonymous",
        } as UserSession;
      }
    }
    return null;
  }, [session, status]);

  return { user, status };
};

const usePostsAndComments = () => {
  const fetchPosts = useCallback(async (): Promise<Post[]> => {
    const res = await axios.get<ApiResponse<Post[]>>("/api/posts/fetchPosts");
    return res.data.posts || res.data.data || [];
  }, []);

  const fetchComments = useCallback(async (): Promise<Comment[]> => {
    const res = await axios.get<ApiResponse<Comment[]>>(
      "/api/posts/fetchComments"
    );
    return res.data.comments || res.data.data || [];
  }, []);

  const results = useQueries({
    queries: [
      {
        queryKey: QUERY_CONFIG.POSTS_KEY,
        queryFn: fetchPosts,
        retry: QUERY_CONFIG.RETRY_COUNT,
        staleTime: QUERY_CONFIG.STALE_TIME,
      },
      {
        queryKey: QUERY_CONFIG.COMMENTS_KEY,
        queryFn: fetchComments,
        retry: QUERY_CONFIG.RETRY_COUNT,
        staleTime: QUERY_CONFIG.STALE_TIME,
      },
    ],
  });

  const [postsQueryResult, commentsQueryResult] = results as [
    UseQueryResult<Post[]>,
    UseQueryResult<Comment[]>
  ];

  return {
    data:
      postsQueryResult.isSuccess && commentsQueryResult.isSuccess
        ? { posts: postsQueryResult.data, comments: commentsQueryResult.data }
        : undefined,
    isLoading: postsQueryResult.isPending || commentsQueryResult.isPending,
    error: postsQueryResult.error || commentsQueryResult.error,
    refetch: useCallback(() => {
      postsQueryResult.refetch();
      commentsQueryResult.refetch();
    }, [postsQueryResult, commentsQueryResult]),
  };
};

// --- Utility Functions ---
const sortByDateDesc = <T extends { createdAt: string }>(items: T[]): T[] =>
  [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

const groupCommentsByPostId = (comments: Comment[]) =>
  comments.reduce((acc, comment) => {
    if (!acc[comment.postId]) acc[comment.postId] = [];
    acc[comment.postId].push(comment);
    return acc;
  }, {} as Record<string, Comment[]>);

// --- Main Component ---
export default function GetPosts() {
  const queryClient = useQueryClient();
  const {
    data: fetchResult,
    error: fetchError,
    isLoading,
    refetch,
  } = usePostsAndComments();
  const { user } = useCurrentUserSession();
  const [newComment, setNewComment] = useState<Record<string, string>>({});

  const posts: Post[] = fetchResult?.posts || [];
  const comments: Comment[] = fetchResult?.comments || [];

  // Data Formatting Logic
  const commentsByPostId = useMemo(
    () => groupCommentsByPostId(comments),
    [comments]
  );

  const formattedPosts = useMemo(() => {
    return sortByDateDesc(posts).map((post) => {
      const isLiked = user?.id ? post.likedByUsers?.includes(user.id) : false;
      const postComments = commentsByPostId[post._id] || [];

      return {
        ...post,
        AuthorName: post.AuthorName || "Anonymous",
        Like: post.Like || 0,
        isLikedByUser: isLiked,
        comments: sortByDateDesc(postComments),
      } as FormattedPost;
    });
  }, [posts, user, commentsByPostId]);

  // --- React Query Mutations ---
  const likeMutation = useMutation({
    mutationFn: async ({
      postId,
      userId,
    }: {
      postId: string;
      userId: string;
    }) => {
      const res = await axios.post<
        ApiResponse<{ liked: boolean; newLikeCount: number }>
      >("/api/posts/addLike", { postId, userId });
      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to process like.");
      }
      return res.data;
    },
    onMutate: async ({ postId, userId }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_CONFIG.POSTS_KEY });
      const previousPosts = queryClient.getQueryData<Post[]>(
        QUERY_CONFIG.POSTS_KEY
      );

      queryClient.setQueryData<Post[]>(QUERY_CONFIG.POSTS_KEY, (oldPosts) => {
        if (!oldPosts) return [];
        return oldPosts.map((post) => {
          if (post._id !== postId) return post;

          const isLiked = post.likedByUsers?.includes(userId);
          const newLikedByUsers = isLiked
            ? post.likedByUsers.filter((id) => id !== userId)
            : [...(post.likedByUsers || []), userId];

          return {
            ...post,
            Like: post.Like + (isLiked ? -1 : 1),
            likedByUsers: newLikedByUsers,
          };
        });
      });
      return { previousPosts };
    },
    onError: (err, _, context) => {
      toast.error(`Failed to process like: ${(err as AxiosError).message}`);
      if (context?.previousPosts) {
        queryClient.setQueryData(QUERY_CONFIG.POSTS_KEY, context.previousPosts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_CONFIG.POSTS_KEY });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (data: {
      postId: string;
      name: string;
      comment: string;
      userId: string;
    }) => {
      const res = await axios.post<ApiResponse<Comment>>(
        "/api/posts/addComment",
        data
      );
      if (!res.data.success || !res.data.comment) {
        throw new Error(res.data.message || "Failed to add comment.");
      }
      return res.data.comment;
    },
    onSuccess: (_, variables) => {
      toast.success("Comment added!");
      setNewComment((prev) => ({ ...prev, [variables.postId]: "" }));
      queryClient.invalidateQueries({ queryKey: QUERY_CONFIG.COMMENTS_KEY });
    },
    onError: (err) => {
      toast.error(`Failed to post comment: ${(err as AxiosError).message}`);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await axios.delete<ApiResponse<void>>(
        `/api/posts/fetchPosts`,
        {
          data: { idPost: postId },
        }
      );
      if (!res.data.success) {
        throw new Error(res.data.message || "API error during post deletion.");
      }
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_CONFIG.POSTS_KEY });
      const previousPosts = queryClient.getQueryData<Post[]>(
        QUERY_CONFIG.POSTS_KEY
      );
      queryClient.setQueryData<Post[]>(QUERY_CONFIG.POSTS_KEY, (oldPosts) =>
        oldPosts ? oldPosts.filter((post) => post._id !== postId) : []
      );
      return { previousPosts };
    },
    onSuccess: () => {
      toast.success("Post deleted successfully");
    },
    onError: (err, _, context) => {
      toast.error(`Failed to delete post: ${(err as AxiosError).message}`);
      if (context?.previousPosts) {
        queryClient.setQueryData(QUERY_CONFIG.POSTS_KEY, context.previousPosts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_CONFIG.POSTS_KEY });
      queryClient.invalidateQueries({ queryKey: QUERY_CONFIG.COMMENTS_KEY });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await axios.delete<ApiResponse<void>>(
        `/api/posts/fetchComments`,
        {
          data: { commentId },
        }
      );
      if (!res.data.success) {
        throw new Error(
          res.data.message || "API error during comment deletion."
        );
      }
    },
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_CONFIG.COMMENTS_KEY });
      const previousComments = queryClient.getQueryData<Comment[]>(
        QUERY_CONFIG.COMMENTS_KEY
      );
      queryClient.setQueryData<Comment[]>(
        QUERY_CONFIG.COMMENTS_KEY,
        (oldComments) =>
          oldComments
            ? oldComments.filter((comment) => comment._id !== commentId)
            : []
      );
      return { previousComments };
    },
    onSuccess: () => {
      toast.success("Comment deleted");
    },
    onError: (err, _, context) => {
      toast.error(`Failed to delete comment: ${(err as AxiosError).message}`);
      if (context?.previousComments) {
        queryClient.setQueryData(
          QUERY_CONFIG.COMMENTS_KEY,
          context.previousComments
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_CONFIG.COMMENTS_KEY });
    },
  });

  // --- Action Handlers ---
  const handleLike = useCallback(
    (postId: string) => {
      if (!user?.id) {
        toast.error("Please login to like posts");
        return;
      }
      likeMutation.mutate({ postId, userId: user.id });
    },
    [user, likeMutation]
  );

  const handleAddComment = useCallback(
    (e: React.FormEvent, postId: string) => {
      e.preventDefault();

      if (!user?.id) {
        toast.error("Authentication required. Please log in to comment.");
        return;
      }

      const commentText = newComment[postId]?.trim();
      if (!commentText) {
        toast.error("Comment cannot be empty.");
        return;
      }

      addCommentMutation.mutate({
        postId,
        name: user.name || "Anonymous",
        comment: commentText,
        userId: user.id,
      });
    },
    [user, newComment, addCommentMutation]
  );

  const handleDeletePost = useCallback(
    (postId: string) => {
      deletePostMutation.mutate(postId);
    },
    [deletePostMutation]
  );

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      deleteCommentMutation.mutate(commentId);
    },
    [deleteCommentMutation]
  );

  const isAnyMutationPending =
    likeMutation.isPending ||
    addCommentMutation.isPending ||
    deletePostMutation.isPending ||
    deleteCommentMutation.isPending;

  const isLoadingState = useCallback(
    () => isAnyMutationPending,
    [isAnyMutationPending]
  );

  // --- Render Logic ---
  if (fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-slate-900 dark:to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-w-md w-full"
        >
          <div className="text-7xl mb-6">😞</div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Connection Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            We couldn't load the posts. Please check your connection and try
            again.
          </p>
          <motion.button
            whileHover={ANIMATION_CONFIG.buttonHover}
            whileTap={ANIMATION_CONFIG.buttonTap}
            onClick={() => refetch()}
            className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors closeButton duration={4000} />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-slate-900 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.header
            initial={ANIMATION_CONFIG.fadeIn}
            animate={ANIMATION_CONFIG.fadeInVisible}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 dark:text-white mb-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
              Community Feed
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-light">
              Share your thoughts and engage with the community
            </p>
          </motion.header>

          {isLoading ? (
            <div className="flex justify-center items-center h-72">
              <div className="text-center">
                <LoadingSpinner size={40} className="text-indigo-600 mb-6" />
                <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                  Loading posts...
                </p>
              </div>
            </div>
          ) : formattedPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="text-7xl mb-6">📝</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                No posts yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto text-lg">
                Be the first to share your thoughts with the community
              </p>
              <motion.button
                whileHover={ANIMATION_CONFIG.buttonHover}
                whileTap={ANIMATION_CONFIG.buttonTap}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                onClick={() =>
                  toast.info(
                    user
                      ? "Navigate to create post page"
                      : "Please login to create a post"
                  )
                }
              >
                Create First Post
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              className="space-y-8"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.08,
                  },
                },
              }}
            >
              <AnimatePresence mode="popLayout">
                {formattedPosts.map((post) => (
                  <PostItem
                    key={post._id}
                    post={post}
                    user={user}
                    newComment={newComment}
                    isLoading={isLoadingState}
                    setNewComment={setNewComment}
                    handleLike={handleLike}
                    handleAddComment={handleAddComment}
                    handleDeletePost={handleDeletePost}
                    handleDeleteComment={handleDeleteComment}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
}
