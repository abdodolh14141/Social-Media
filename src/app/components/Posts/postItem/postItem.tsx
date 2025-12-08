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
import { memo, useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ------------------------------------------------------------------ */
/* Types (kept identical so parent does not care)                     */
/* ------------------------------------------------------------------ */
type Comment = {
  _id: string;
  idPost?: string;
  userId?: string;
  TextComment?: string;
  Name?: string;
  createdAt: string;
};

type PostItemProps = {
  post: Post & { comments: Comment[]; isLikedByUser?: boolean };
  user: { id: string; name?: string } | null;
  newComment: Record<string, string>;
  isLoading?: (key: string) => boolean;
  setNewComment: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleLike: (postId: string) => void;
  handleAddComment: (e: FormEvent<HTMLFormElement>, postId: string) => void;
  handleDeletePost: (postId: string) => void;
  handleDeleteComment: (commentId: string) => void;
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

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const formatDate = (d: string | Date): string => {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year:
      new Date(d).getFullYear() !== new Date().getFullYear()
        ? "numeric"
        : undefined,
  });
};

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
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
    /* ---------- local state ---------- */
    const [showAll, setShowAll] = useState(false);

    /* ---------- derived ---------- */
    const comments = post.comments ?? [];
    const total = comments.length;
    const limit = showAll ? total : 3; // 3 initial
    const slice = comments.slice(0, limit);
    const hasMore = total > 3;

    /* ---------- handlers ---------- */
    const onLike = () => handleLike(post._id);

    const onDeletePost = () => {
      handleDeletePost(post._id);
    };

    const onDeleteComment = (id: string) => {
      handleDeleteComment(id);
    };

    const onCommentChange = (e: React.ChangeEvent<HTMLInputElement>) =>
      setNewComment((p) => ({ ...p, [post._id]: e.target.value }));

    const onSubmit = (e: FormEvent<HTMLFormElement>) =>
      handleAddComment(e, post._id);

    /* ---------- render ---------- */
    const isAuthor = user?.id === post.IdUserCreated;
    const likeCount = Number(post.Like) || 0;
    const isLiked = post.isLikedByUser ?? false;
    const commentText = newComment[post._id] ?? "";
    const left = 500 - commentText.length;

    return (
      <motion.article
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
      >
        {/* header */}
        <header className="p-6 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <User size={18} className="text-indigo-500" />
            <Link
              href={`/ProfileUser/${post.IdUserCreated}`}
              className="text-lg font-bold text-gray-900 dark:text-white truncate"
            >
              {post.AuthorName || "Anonymous"}
            </Link>
            <span className="text-gray-300">•</span>
            <time
              className="text-sm text-gray-500 flex items-center gap-1.5"
              dateTime={post.createdAt}
              title={new Date(post.createdAt).toLocaleString()}
            >
              <Calendar size={14} />
              {formatDate(post.createdAt)}
            </time>
          </div>

          {isAuthor && (
            <button
              onClick={onDeletePost}
              disabled={isLoading(`delete-post-${post._id}`)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 rounded-xl"
            >
              {isLoading(`delete-post-${post._id}`) ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </header>

        {/* body */}
        <div className="px-6 pb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {post.Title}
          </h2>
          {post.PublicImage && (
            <figure className="mb-4 rounded-2xl overflow-hidden shadow-lg">
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
            </figure>
          )}
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {post.Content}
          </p>
        </div>

        {/* actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700/50">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLike}
            disabled={!user || isLoading(`like-${post._id}`)}
            aria-label={`${isLiked ? "Unlike" : "Like"} post (${likeCount})`}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold shadow-lg border transition-all ${
              isLiked
                ? "bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-500"
                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading(`like-${post._id}`) ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Heart
                size={20}
                className={isLiked ? "fill-current" : "text-red-500"}
              />
            )}
            <span>{likeCount}</span>
          </motion.button>
        </div>

        {/* comment input */}
        {user ? (
          <form
            onSubmit={onSubmit}
            className="px-6 pb-5 border-t border-gray-100 dark:border-gray-700/50 pt-5"
          >
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={commentText}
                  onChange={onCommentChange}
                  placeholder="Write a comment…"
                  maxLength={500}
                  required
                  disabled={isLoading(`comment-${post._id}`)}
                  className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                {commentText && (
                  <div
                    className={`text-xs text-right mt-1 ${
                      left < 50 ? "text-red-500" : "text-gray-500"
                    }`}
                  >
                    {left} left
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={
                  isLoading(`comment-${post._id}`) || !commentText.trim()
                }
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50"
              >
                {isLoading(`comment-${post._id}`) ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <MessageCircle size={16} />
                )}
                <span className="ml-2 hidden sm:inline">Post</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="px-6 pb-5 border-t border-gray-100 dark:border-gray-700/50 pt-5 text-center">
            <Link
              href="/api/auth/signin"
              className="text-indigo-600 font-bold underline"
            >
              Sign in
            </Link>{" "}
            to comment
          </div>
        )}

        {/* comments list */}
        {total > 0 && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border-t border-gray-200 dark:border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Comments ({total})
              </h3>
              {hasMore && (
                <button
                  onClick={() => setShowAll((s) => !s)}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                >
                  {showAll ? (
                    <>
                      Show less <ChevronUp size={16} />
                    </>
                  ) : (
                    <>
                      Show {total - 3} more <ChevronDown size={16} />
                    </>
                  )}
                </button>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {slice?.map((c) => (
                  <motion.div
                    key={c._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Link
                            href={`/ProfileUser/${c.userId ?? c.UserId}`}
                            className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600"
                          >
                            {c.name ?? c.Name}
                          </Link>
                          <span className="text-gray-400 text-xs">•</span>
                          <time
                            className="text-xs text-gray-500"
                            dateTime={c.createdAt}
                            title={new Date(c.createdAt).toLocaleString()}
                          >
                            {formatDate(c.createdAt)}
                          </time>
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                          {c.textComment ?? c.TextComment}
                        </p>
                      </div>
                      {(c.userId ?? c.UserId) === user?.id && (
                        <button
                          onClick={() => onDeleteComment(c._id)}
                          disabled={isLoading(`delete-comment-${c._id}`)}
                          title="Delete comment"
                          className="text-red-500 hover:text-red-600 disabled:opacity-50"
                        >
                          {isLoading(`delete-comment-${c._id}`) ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </div>
        )}
      </motion.article>
    );
  }
);
PostItem.displayName = "PostItem";
