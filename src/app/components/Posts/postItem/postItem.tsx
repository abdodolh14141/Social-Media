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
  Send,
} from "lucide-react";
import { CldImage } from "next-cloudinary";
import Link from "next/link";
import { memo, useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type Comment = {
  _id: string;
  idPost?: string;
  userId?: string;
  TextComment?: string;
  Name?: string;
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

const formatDate = (d: string | Date): string => {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

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
    const [showAll, setShowAll] = useState(false);

    const comments = post.comments ?? [];
    const total = comments.length;
    const limit = showAll ? total : 3;
    const slice = comments.slice(0, limit);
    const hasMore = total > 3;

    const isAuthor = user?.id === post.IdUserCreated;
    const isLiked = post.isLikedByUser ?? false;
    const commentText = newComment[post._id] ?? "";

    return (
      <motion.article
        layout
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden transition-all hover:shadow-indigo-500/10"
      >
        {/* BIG HEADER */}
        <header className="p-8 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
              <User size={28} />
            </div>
            <div>
              <Link
                href={`/ProfileUser/${post.IdUserCreated}`}
                className="text-xl font-black text-gray-900 dark:text-white hover:text-indigo-500 transition-colors"
              >
                {post.AuthorName || "Anonymous User"}
              </Link>
              <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                <Calendar size={14} />
                {formatDate(post.createdAt)}
              </div>
            </div>
          </div>

          {isAuthor && (
            <button
              onClick={() => handleDeletePost(post._id)}
              disabled={isLoading(`delete-post-${post._id}`)}
              className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all"
            >
              {isLoading(`delete-post-${post._id}`) ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Trash2 size={22} />
              )}
            </button>
          )}
        </header>

        {/* BIG CONTENT */}
        <div className="px-8 pb-6 space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
            {post.Title}
          </h2>

          {post.PublicImage && (
            <div className="rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
              <CldImage
                src={post.PublicImage}
                alt={post.Title}
                width={1200} // Bigger for the 4xl container
                height={600}
                crop="fill"
                quality={90}
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          )}

          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {post.Content}
          </p>
        </div>

        {/* ACTIONS */}
        <div className="px-8 py-6 flex items-center gap-4 border-t border-gray-100 dark:border-white/5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleLike(post._id)}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${
              isLiked
                ? "bg-red-500 text-white shadow-red-500/30"
                : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300"
            }`}
          >
            <Heart className={isLiked ? "fill-current" : ""} size={24} />
            {post.Like || 0}
          </motion.button>

          <div className="flex items-center gap-2 text-gray-500 font-bold ml-auto text-lg">
            <MessageCircle size={24} />
            {total} Comments
          </div>
        </div>

        {/* BIG COMMENT INPUT */}
        {user && (
          <form
            onSubmit={(e) => handleAddComment(e, post._id)}
            className="px-8 pb-8"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={commentText}
                onChange={(e) =>
                  setNewComment((p) => ({ ...p, [post._id]: e.target.value }))
                }
                placeholder="Join the discussion..."
                className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-2xl px-6 py-5 text-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="absolute right-3 p-3 bg-indigo-600 text-white rounded-xl shadow-lg disabled:opacity-0 transition-all"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        )}

        {/* COMMENTS LIST */}
        {total > 0 && (
          <div className="bg-gray-50/50 dark:bg-black/20 p-8 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-black uppercase tracking-widest text-gray-400">
                Discussion
              </span>
              {hasMore && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-indigo-500 font-bold flex items-center gap-1"
                >
                  {showAll ? <ChevronUp /> : <ChevronDown />}{" "}
                  {showAll ? "Hide" : `View ${total - 3} more`}
                </button>
              )}
            </div>

            <div className="space-y-4">
              {slice.map((c) => (
                <div
                  key={c._id}
                  className="bg-white dark:bg-white/5 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-black text-gray-900 dark:text-white mr-2">
                        {c.Name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(c.createdAt)}
                      </span>
                      <p className="mt-2 text-gray-700 dark:text-gray-300 leading-snug">
                        {c.TextComment}
                      </p>
                    </div>
                    {c.Name === user?.name && (
                      <button
                        onClick={() => handleDeleteComment(c._id)}
                        className="text-red-400 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.article>
    );
  }
);

PostItem.displayName = "PostItem";
