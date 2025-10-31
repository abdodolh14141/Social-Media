import { useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Toaster, toast } from "sonner";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";

// Icons
import iconAccount from "../../../../../public/iconAccount.png";
import {
  Trash2,
  MessageCircle,
  Heart,
  Loader2,
  Calendar,
  User,
} from "lucide-react";

// --- Type Definitions ---
interface Comment {
  id: string;
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

interface PostAndCommentData {
  posts: Post[];
  comments: Comment[];
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  comment?: Comment;
  comments?: Comment[];
  posts?: Post[];
  data?: T;
}

// --- Animation Variants ---
const postVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 },
  },
};

const commentVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

const buttonHover = {
  scale: 1.02,
  transition: { duration: 0.2 },
};
const buttonTap = {
  scale: 0.98,
};

// --- Custom Hooks ---
const useUserSession = (): UserSession | null => {
  const { data: session } = useSession();

  return useMemo(() => {
    if (session?.user) {
      return {
        id: (session.user as any).id || "",
        email: session.user.email ?? "",
        name: session.user.name || "Anonymous",
      };
    }
    return null;
  }, [session]);
};

const usePostsAndComments = () => {
  const fetcher = async (url: string): Promise<PostAndCommentData> => {
    try {
      const [postsRes, commentsRes] = await Promise.all([
        axios.get<ApiResponse<Post[]>>("/api/posts/fetchPosts"),
        axios.get<ApiResponse<Comment[]>>("/api/posts/fetchComments"),
      ]);

      return {
        posts: postsRes.data.posts || postsRes.data.data || [],
        comments: commentsRes.data.comments || commentsRes.data.data || [],
      };
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  };

  return useSWR<PostAndCommentData>(
    "/api/posts/fetchPostsAndComments",
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
      errorRetryCount: 3,
    }
  );
};

// --- Sub-Components ---
interface UserAvatarProps {
  userId: string;
  userName: string;
  size?: "sm" | "md" | "lg";
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  userName,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
  };

  return (
    <Link
      href={`/ProfileUser/${userId}`}
      className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-800 dark:to-purple-800 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-indigo-500/30 hover:ring-indigo-500 transition-all duration-300 group`}
    >
      <Image
        src={iconAccount}
        alt={`${userName}'s avatar`}
        className="object-cover transition-transform group-hover:scale-110"
        fill
        sizes="(max-width: 768px) 32px, 48px"
      />
    </Link>
  );
};

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 16,
  className = "",
}) => <Loader2 size={size} className={`animate-spin ${className}`} />;

interface LikeButtonProps {
  isLiked: boolean;
  likeCount: number;
  isLoading: boolean;
  disabled: boolean;
  onClick: () => void;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  isLiked,
  likeCount,
  isLoading,
  disabled,
  onClick,
}) => (
  <motion.button
    whileHover={!disabled ? buttonHover : {}}
    whileTap={!disabled ? buttonTap : {}}
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all duration-200 shadow-lg border ${
      isLiked
        ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-red-500/30 border-red-500"
        : "bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 shadow-gray-300/30 dark:shadow-gray-800/50 border-gray-200 dark:border-gray-600"
    } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
    disabled={disabled}
  >
    {isLoading ? (
      <LoadingSpinner
        size={20}
        className={isLiked ? "text-white" : "text-current"}
      />
    ) : (
      <Heart size={20} className={isLiked ? "fill-current" : ""} />
    )}
    <span className="text-base font-medium">{likeCount}</span>
  </motion.button>
);

// --- Utility Functions ---
const formatDate = (dateString: string | Date): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  } catch {
    return "Recently";
  }
};

// --- PostItem Component ---
interface PostItemProps {
  post: FormattedPost;
  user: UserSession | null;
  newComment: { [key: string]: string };
  isLoading: (actionId: string) => boolean;
  setNewComment: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
  handleLike: (postId: string, isCurrentlyLiked: boolean) => Promise<void>;
  handleAddComment: (e: React.FormEvent, postId: string) => Promise<void>;
  handleDeletePost: (postId: string) => Promise<void>;
  handleDeleteComment: (commentId: string) => Promise<void>;
}

const PostItem: React.FC<PostItemProps> = ({
  post,
  user,
  newComment,
  isLoading,
  setNewComment,
  handleLike,
  handleAddComment,
  handleDeletePost,
  handleDeleteComment,
}) => {
  const isPostAuthor = user && user.id === post.IdUserCreated;
  const [showAllComments, setShowAllComments] = useState(false);

  const displayedComments = showAllComments
    ? post.comments
    : post.comments.slice(0, 3);

  const handleDeleteWithConfirm = async (postId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      await handleDeletePost(postId);
    }
  };

  const handleCommentDeleteWithConfirm = async (commentId: string) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      await handleDeleteComment(commentId);
    }
  };

  return (
    <motion.article
      key={post._id}
      variants={postVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/40 border border-gray-100 dark:border-gray-700/50 hover:shadow-xl dark:hover:shadow-gray-900/60 transition-all duration-300 overflow-hidden"
    >
      {/* Post Header */}
      <header className="p-6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <UserAvatar
              userId={post.IdUserCreated}
              userName={post.AuthorName || "Anonymous"}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/ProfileUser/${post.IdUserCreated}`}
                  className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate flex items-center gap-2"
                >
                  <User size={16} />
                  {post.AuthorName || "Anonymous"}
                </Link>
                <span className="text-gray-400">•</span>
                <time
                  className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1"
                  title={new Date(post.createdAt).toLocaleString()}
                >
                  <Calendar size={14} />
                  {formatDate(post.createdAt)}
                </time>
              </div>
            </div>
          </div>

          {isPostAuthor && (
            <motion.button
              whileHover={buttonHover}
              whileTap={buttonTap}
              onClick={() => handleDeleteWithConfirm(post._id)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              disabled={isLoading(`delete-post-${post._id}`)}
              title="Delete post"
            >
              {isLoading(`delete-post-${post._id}`) ? (
                <LoadingSpinner size={14} />
              ) : (
                <Trash2 size={14} />
              )}
              <span className="hidden sm:inline">Delete</span>
            </motion.button>
          )}
        </div>
      </header>

      {/* Post Content */}
      <div className="px-6 pb-4">
        <motion.h2
          className="text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-tight"
          layoutId={`post-title-${post._id}`}
        >
          {post.Title}
        </motion.h2>

        {post.PublicImage && (
          <motion.figure
            className="mb-4 rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <CldImage
              src={post.PublicImage}
              alt="Post image"
              width={800}
              height={400}
              crop="fill"
              gravity="auto"
              quality={75}
              sizes="(max-width: 768px) 100vw, 800px"
              className="w-full h-auto object-cover"
            />
          </motion.figure>
        )}

        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-wrap">
            {post.Content}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700/50">
        <div className="flex flex-wrap items-center gap-3">
          <LikeButton
            isLiked={post.isLikedByUser}
            likeCount={post.Like}
            isLoading={isLoading(`like-${post._id}`)}
            disabled={!user}
            onClick={() => handleLike(post._id, post.isLikedByUser)}
          />

          <div className="flex items-center gap-2 px-4 py-2.5 text-gray-600 dark:text-gray-400 font-medium bg-white dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600">
            <MessageCircle size={18} />
            <span>{post.comments.length}</span>
          </div>
        </div>
      </div>

      {/* Comment Input */}
      {user && (
        <motion.form
          onSubmit={(e) => handleAddComment(e, post._id)}
          className="px-6 pb-4 border-t border-gray-100 dark:border-gray-700/50 pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={newComment[post._id] || ""}
                onChange={(e) =>
                  setNewComment((prev) => ({
                    ...prev,
                    [post._id]: e.target.value,
                  }))
                }
                placeholder="Write a comment..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                required
                disabled={isLoading(`comment-${post._id}`)}
                maxLength={500}
              />
              {newComment[post._id] && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                  {newComment[post._id].length}/500
                </div>
              )}
            </div>
            <motion.button
              whileHover={buttonHover}
              whileTap={buttonTap}
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
              disabled={
                isLoading(`comment-${post._id}`) ||
                !newComment[post._id]?.trim()
              }
            >
              {isLoading(`comment-${post._id}`) ? (
                <LoadingSpinner size={16} />
              ) : (
                <MessageCircle size={16} />
              )}
              Comment
            </motion.button>
          </div>
        </motion.form>
      )}

      {/* Comments Section */}
      {post.comments.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700/50"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Comments ({post.comments.length})
              </h4>

              {post.comments.length > 3 && (
                <button
                  onClick={() => setShowAllComments(!showAllComments)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                >
                  {showAllComments
                    ? "Show less"
                    : `View all ${post.comments.length} comments`}
                </button>
              )}
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {displayedComments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    variants={commentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50"
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        userId={comment.userId}
                        userName={comment.name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/ProfileUser/${comment.userId}`}
                              className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
                            >
                              {comment.name}
                            </Link>
                            <span className="text-gray-400 text-xs">•</span>
                            <time
                              className="text-xs text-gray-500 dark:text-gray-400"
                              title={new Date(
                                comment.createdAt
                              ).toLocaleString()}
                            >
                              {formatDate(comment.createdAt)}
                            </time>
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {comment.textComment}
                        </p>
                      </div>

                      {comment.userId === user?.id && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() =>
                            handleCommentDeleteWithConfirm(comment.id)
                          }
                          className="text-red-500 hover:text-red-600 p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 mt-1"
                          title="Delete comment"
                          disabled={isLoading(`delete-comment-${comment.id}`)}
                        >
                          {isLoading(`delete-comment-${comment.id}`) ? (
                            <LoadingSpinner size={14} />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </motion.article>
  );
};

// --- Main Component ---
export default function GetPosts() {
  const user = useUserSession();
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [actionLoading, setActionLoading] = useState<{
    [key: string]: boolean;
  }>({});

  const {
    data: allData,
    error: dataError,
    mutate: mutateAll,
    isLoading: loading,
  } = usePostsAndComments();

  const posts: Post[] = allData?.posts || [];
  const comments: Comment[] = allData?.comments || [];

  const commentsByPostId = useMemo(() => {
    return comments.reduce((acc, comment) => {
      const postId = comment.postId;
      if (!acc[postId]) acc[postId] = [];
      acc[postId].push(comment);
      return acc;
    }, {} as { [key: string]: Comment[] });
  }, [comments]);

  const formattedPosts = useMemo(
    () =>
      posts
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .map((post) => {
          const isLiked = user ? post.likedByUsers?.includes(user.id) : false;
          const postComments = commentsByPostId[post._id] || [];

          const sortedComments = postComments.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          return {
            ...post,
            AuthorName: post.AuthorName || "Anonymous",
            Like: post.Like || 0,
            isLikedByUser: isLiked,
            comments: sortedComments,
          };
        }),
    [posts, user, commentsByPostId]
  );

  const setLoadingState = (actionId: string, isLoading: boolean) => {
    setActionLoading((prev) => ({ ...prev, [actionId]: isLoading }));
  };

  const isLoading = (actionId: string) => actionLoading[actionId] || false;

  // Action handlers
  const handleLike = useCallback(
    async (postId: string, isCurrentlyLiked: boolean) => {
      if (!user) {
        toast.error("Please login to like posts");
        return;
      }

      const optimisticLikeCount = isCurrentlyLiked ? -1 : 1;

      // Optimistic update
      mutateAll(
        (currentData) => {
          if (!currentData?.posts) return currentData;
          return {
            ...currentData,
            posts: currentData.posts.map((post) =>
              post._id === postId
                ? {
                    ...post,
                    Like: post.Like + optimisticLikeCount,
                    likedByUsers: isCurrentlyLiked
                      ? (post.likedByUsers || []).filter((id) => id !== user.id)
                      : [...(post.likedByUsers || []), user.id],
                  }
                : post
            ),
          };
        },
        { revalidate: false }
      );

      setLoadingState(`like-${postId}`, true);

      try {
        await axios.post<ApiResponse<{ liked: boolean; newLikeCount: number }>>(
          "/api/posts/addLike",
          { postId, userId: user.id }
        );

        // Revalidate to ensure data is correct
        mutateAll();
      } catch (error: any) {
        console.error("Like error:", error);
        // Revert optimistic update on error
        mutateAll();
        toast.error("Failed to process like");
      } finally {
        setLoadingState(`like-${postId}`, false);
      }
    },
    [user, mutateAll]
  );

  const handleAddComment = useCallback(
    async (e: React.FormEvent, postId: string) => {
      e.preventDefault();

      if (!user) {
        toast.error("Please login to comment");
        return;
      }

      const commentText = newComment[postId]?.trim();
      if (!commentText) {
        toast.error("Comment cannot be empty");
        return;
      }

      setLoadingState(`comment-${postId}`, true);
      const tempCommentId = `temp-${Date.now()}`;

      // Clear input immediately
      setNewComment((prev) => ({ ...prev, [postId]: "" }));

      const optimisticComment: Comment = {
        id: tempCommentId,
        postId,
        userId: user.id,
        textComment: commentText,
        name: user.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistic update
      mutateAll(
        (currentData) => ({
          posts: currentData?.posts || [],
          comments: [optimisticComment, ...(currentData?.comments || [])],
        }),
        { revalidate: false }
      );

      try {
        const res = await axios.post<ApiResponse<Comment>>(
          "/api/posts/addComment",
          {
            postId,
            name: user.name,
            comment: commentText,
            userId: user.id.toString(),
          }
        );

        if (res.data.success && res.data.comment) {
          // Replace optimistic comment with real one
          mutateAll(
            (currentData) => ({
              posts: currentData?.posts || [],
              comments: (currentData?.comments || []).map((comment) =>
                comment.id === tempCommentId ? res.data.comment! : comment
              ),
            }),
            { revalidate: false }
          );
          toast.success("Comment added!");
        } else {
          throw new Error(res.data.message);
        }
      } catch (error: any) {
        console.error("Comment error:", error);
        // Revert optimistic update
        mutateAll();
        toast.error("Failed to post comment");
      } finally {
        setLoadingState(`comment-${postId}`, false);
      }
    },
    [user, newComment, mutateAll]
  );

  const handleDeletePost = useCallback(
    async (postId: string) => {
      setLoadingState(`delete-post-${postId}`, true);

      // Optimistic update
      mutateAll(
        (currentData) => ({
          posts: (currentData?.posts || []).filter(
            (post) => post._id !== postId
          ),
          comments: (currentData?.comments || []).filter(
            (comment) => comment.postId !== postId
          ),
        }),
        { revalidate: false }
      );

      try {
        const res = await axios.delete<ApiResponse<void>>(
          `/api/posts/fetchPosts`,
          { data: { idPost: postId } }
        );

        if (!res.data.success) {
          throw new Error(res.data.message);
        }

        toast.success("Post deleted successfully");
      } catch (error: any) {
        console.error("Delete post error:", error);
        // Revert optimistic update
        mutateAll();
        toast.error("Failed to delete post");
      } finally {
        setLoadingState(`delete-post-${postId}`, false);
      }
    },
    [mutateAll]
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      setLoadingState(`delete-comment-${commentId}`, true);

      // Optimistic update
      mutateAll(
        (currentData) => ({
          posts: currentData?.posts || [],
          comments: (currentData?.comments || []).filter(
            (comment) => comment.id !== commentId
          ),
        }),
        { revalidate: false }
      );

      try {
        const res = await axios.delete<ApiResponse<void>>(
          `/api/posts/fetchComments`,
          { data: { commentId } }
        );

        if (!res.data.success) {
          throw new Error(res.data.message);
        }

        toast.success("Comment deleted");
      } catch (error: any) {
        console.error("Delete comment error:", error);
        // Revert optimistic update
        mutateAll();
        toast.error("Failed to delete comment");
      } finally {
        setLoadingState(`delete-comment-${commentId}`, false);
      }
    },
    [mutateAll]
  );

  // Render states
  if (dataError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-md w-full"
        >
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Connection Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We couldn't load the posts. Please check your connection and try
            again.
          </p>
          <button
            onClick={() => mutateAll()}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors closeButton duration={4000} />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Community Feed
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Share your thoughts and engage with the community
            </p>
          </motion.header>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <LoadingSpinner size={32} className="text-indigo-600 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Loading posts...
                </p>
              </div>
            </div>
          ) : formattedPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg"
            >
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No posts yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Be the first to share your thoughts with the community
              </p>
              <motion.button
                whileHover={buttonHover}
                whileTap={buttonTap}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg"
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
              className="space-y-6"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1,
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
                    isLoading={isLoading}
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
