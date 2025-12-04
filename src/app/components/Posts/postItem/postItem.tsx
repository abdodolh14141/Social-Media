"use client";

import {
  Trash2,
  MessageCircle,
  Heart,
  Loader2,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CldImage } from "next-cloudinary";
import Link from "next/link";
import React, { useState, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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

interface PostItemProps {
  post: Post & { comments: Comment[]; isLikedByUser?: boolean };
  user: { id: string; name?: string } | null;
  newComment: { [postId: string]: string };
  isLoading?: (key: string) => boolean;
  setNewComment: React.Dispatch<
    React.SetStateAction<{ [postId: string]: string }>
  >;
  handleLike: (postId: string) => void;
  handleAddComment: (
    e: React.FormEvent<HTMLFormElement>,
    postId: string
  ) => void;
  handleDeletePost: (postId: string) => void;
  handleDeleteComment: (commentId: string) => void;
}

// --- Animation Constants ---
const ANIMATION = {
  post: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  },
  comment: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  },
  button: {
    hover: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.98 },
  },
} as const;

const COMMENTS_CONFIG = {
  INITIAL_VISIBLE: 3,
  LOAD_MORE_INCREMENT: 5,
  MAX_COMMENT_LENGTH: 500,
} as const;

// --- Utility Functions ---
const formatDate = (dateString: string | Date): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

    if (diffInSeconds < 60) return "Just now";

    const diffInMinutes = diffInSeconds / 60;
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m ago`;

    const diffInHours = diffInMinutes / 60;
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;

    const diffInDays = diffInHours / 24;
    if (diffInDays < 7) return `${Math.floor(diffInDays)}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return "Recently";
  }
};

// --- Utility Components ---
const LoadingSpinner = memo<{ size?: number; className?: string }>(
  ({ size = 16, className = "" }) => (
    <Loader2 size={size} className={`animate-spin ${className}`} />
  )
);
LoadingSpinner.displayName = "LoadingSpinner";

interface LikeButtonProps {
  isLiked: boolean;
  likeCount: number;
  isLoading: boolean;
  disabled: boolean;
  onClick: () => void;
}

const LikeButton = memo<LikeButtonProps>(
  ({ isLiked, likeCount, isLoading, disabled, onClick }) => (
    <motion.button
      whileHover={!disabled && !isLoading ? ANIMATION.button.hover : {}}
      whileTap={!disabled && !isLoading ? ANIMATION.button.tap : {}}
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all duration-200 shadow-lg border ${
        isLiked
          ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-red-500/30 border-red-500"
          : "bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 shadow-gray-300/30 dark:shadow-gray-800/50 border-gray-200 dark:border-gray-600"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      disabled={disabled || isLoading}
      aria-label={`${isLiked ? "Unlike" : "Like"} post (${likeCount} likes)`}
    >
      {isLoading ? (
        <LoadingSpinner
          size={20}
          className={isLiked ? "text-white" : "text-current"}
        />
      ) : (
        <Heart
          size={20}
          className={
            isLiked ? "fill-current" : "text-red-500 dark:text-red-400"
          }
          aria-hidden="true"
        />
      )}
      <span className="text-base font-medium">{likeCount}</span>
    </motion.button>
  )
);
LikeButton.displayName = "LikeButton";

// --- Comment Component ---
interface CommentItemProps {
  comment: Comment;
  index: number;
  totalComments: number;
  currentUserId: string | undefined;
  isDeleting: boolean;
  onDelete: (commentId: string) => void;
}

const CommentItem = memo<CommentItemProps>(
  ({ comment, index, totalComments, currentUserId, isDeleting, onDelete }) => {
    const isOwner = comment.userId === currentUserId;

    return (
      <motion.article
        variants={ANIMATION.comment}
        animate="visible"
        exit="exit"
        layout
        className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-shadow"
        aria-posinset={index + 1}
        aria-setsize={totalComments}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <header className="flex items-center gap-2 mb-2 flex-wrap">
              <Link
                href={`/profile/${comment.userId}`}
                className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
              >
                {comment.name}
              </Link>
              <span className="text-gray-400 text-xs">•</span>
              <time
                className="text-xs text-gray-500 dark:text-gray-400"
                dateTime={comment.createdAt}
                title={new Date(comment.createdAt).toLocaleString()}
              >
                {formatDate(comment.createdAt)}
              </time>
            </header>

            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {comment.textComment}
            </p>
          </div>

          {isOwner && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(comment._id)}
              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Delete comment"
              disabled={isDeleting}
              aria-label={`Delete comment by ${comment.name}`}
            >
              {isDeleting ? (
                <LoadingSpinner size={14} className="text-red-500" />
              ) : (
                <Trash2 size={14} />
              )}
            </motion.button>
          )}
        </div>
      </motion.article>
    );
  }
);
CommentItem.displayName = "CommentItem";

// --- Main Component ---
export const PostItem = memo<PostItemProps>(
  ({
    post,
    user,
    newComment,
    isLoading = () => false,
    setNewComment,
    handleLike,
    handleAddComment,
    handleDeletePost,
    handleDeleteComment,
  }) => {
    const [showAllComments, setShowAllComments] = useState(false);
    const postId = post._id;
    const isPostAuthor = user?.id === post.IdUserCreated;

    // Memoized values
    const comments = useMemo(() => post.comments || [], [post.comments]);
    const totalComments = comments.length;

    const displayedComments = useMemo(() => {
      if (showAllComments || totalComments <= COMMENTS_CONFIG.INITIAL_VISIBLE) {
        return comments;
      }
      return comments.slice(0, COMMENTS_CONFIG.INITIAL_VISIBLE);
    }, [comments, showAllComments, totalComments]);

    const hasMoreComments = totalComments > COMMENTS_CONFIG.INITIAL_VISIBLE;
    const hiddenCommentsCount = totalComments - COMMENTS_CONFIG.INITIAL_VISIBLE;

    const likeCount = typeof post.Like === "number" ? post.Like : 0;
    const isLikedByUser = post.isLikedByUser ?? false;

    // Loading states
    const isPostDeleteLoading = isLoading(`delete-post-${postId}`);
    const isCommentAddLoading = isLoading(`comment-${postId}`);
    const isLikeLoading = isLoading(`like-${postId}`);

    // Handlers
    const handleDeleteWithConfirm = () => {
      if (
        window.confirm(
          "Are you sure you want to delete this post? This action cannot be undone."
        )
      ) {
        handleDeletePost(postId);
      } else {
        toast.info("Post deletion cancelled.");
      }
    };

    const handleCommentDeleteWithConfirm = (commentId: string) => {
      if (window.confirm("Are you sure you want to delete this comment?")) {
        handleDeleteComment(commentId);
      } else {
        toast.info("Comment deletion cancelled.");
      }
    };

    const currentCommentText = newComment[postId] || "";
    const remainingChars =
      COMMENTS_CONFIG.MAX_COMMENT_LENGTH - currentCommentText.length;

    return (
      <motion.article
        variants={ANIMATION.post}
        initial="hidden"
        animate="visible"
        exit="exit"
        layout
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl dark:shadow-gray-900/40 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl dark:hover:shadow-gray-900/60 transition-all duration-300 overflow-hidden"
      >
        {/* Post Header */}
        <header className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/ProfileUser/${post.IdUserCreated}`}
                    className="text-lg font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate flex items-center gap-2 group"
                  >
                    <User
                      size={18}
                      className="text-indigo-500 group-hover:text-indigo-600"
                    />
                    <span className="truncate max-w-xs sm:max-w-none">
                      {post.AuthorName || "Anonymous"}
                    </span>
                  </Link>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <time
                    className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5"
                    dateTime={post.createdAt}
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
                whileHover={ANIMATION.button.hover}
                whileTap={ANIMATION.button.tap}
                onClick={handleDeleteWithConfirm}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                disabled={isPostDeleteLoading}
                title="Delete post"
              >
                {isPostDeleteLoading ? (
                  <LoadingSpinner size={14} className="text-red-600" />
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {post.Title}
          </h2>

          {post.PublicImage && (
            <motion.figure
              className="mb-4 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-600"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <CldImage
                src={post.PublicImage}
                alt={post.Title}
                width={800}
                height={400}
                crop="fill"
                gravity="auto"
                quality={80}
                sizes="(max-width: 768px) 100vw, 800px"
                className="w-full h-auto object-cover aspect-video"
              />
            </motion.figure>
          )}

          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-wrap">
            {post.Content}
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700/50">
          <LikeButton
            isLiked={isLikedByUser}
            likeCount={likeCount}
            isLoading={isLikeLoading}
            disabled={!user}
            onClick={() => handleLike(postId)}
          />
        </div>

        {/* Comment Input */}
        {user ? (
          <motion.form
            onSubmit={(e) => handleAddComment(e, postId)}
            className="px-6 pb-5 border-t border-gray-100 dark:border-gray-700/50 pt-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={currentCommentText}
                  onChange={(e) =>
                    setNewComment((prev) => ({
                      ...prev,
                      [postId]: e.target.value,
                    }))
                  }
                  placeholder="Write a comment..."
                  className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                  required
                  disabled={isCommentAddLoading}
                  maxLength={COMMENTS_CONFIG.MAX_COMMENT_LENGTH}
                />
                {currentCommentText && (
                  <div
                    className={`text-xs mt-1.5 text-right font-medium ${
                      remainingChars < 50
                        ? "text-red-500 dark:text-red-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {remainingChars} characters remaining
                  </div>
                )}
              </div>
              <motion.button
                whileHover={ANIMATION.button.hover}
                whileTap={ANIMATION.button.tap}
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                disabled={isCommentAddLoading || !currentCommentText.trim()}
              >
                {isCommentAddLoading ? (
                  <LoadingSpinner size={16} />
                ) : (
                  <MessageCircle size={16} />
                )}
                <span className="hidden sm:inline">Comment</span>
                <span className="sm:hidden">Post</span>
              </motion.button>
            </div>
          </motion.form>
        ) : (
          <div className="px-6 pb-5 border-t border-gray-100 dark:border-gray-700/50 pt-5 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <Link
                href="/api/auth/signin"
                className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold transition-colors underline decoration-2 underline-offset-2"
              >
                Sign in
              </Link>{" "}
              to leave a comment
            </p>
          </div>
        )}

        {/* Comments Section */}
        {totalComments > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border-t border-gray-200 dark:border-gray-700/50"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                  Comments ({totalComments})
                </h4>
                {hasMoreComments && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAllComments(!showAllComments)}
                    className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    {showAllComments ? (
                      <>
                        Show less <ChevronUp size={16} />
                      </>
                    ) : (
                      <>
                        Show {hiddenCommentsCount} more{" "}
                        <ChevronDown size={16} />
                      </>
                    )}
                  </motion.button>
                )}
              </div>

              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {displayedComments.map((comment, index) => (
                    <CommentItem
                      key={comment._id}
                      comment={comment}
                      index={index}
                      totalComments={displayedComments.length}
                      currentUserId={user?.id}
                      isDeleting={isLoading(`delete-comment-${comment._id}`)}
                      onDelete={handleCommentDeleteWithConfirm}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </motion.article>
    );
  }
);

PostItem.displayName = "PostItem";
