"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast, Toaster } from "sonner";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
import axios from "axios";
import Image from "next/image";
import icon from "../../../../../public/iconAccount.png";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageSquare, Trash2, Send, Loader2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
interface Comment {
  idPost: string;
  CommentUserId: string;
  TextComment: string;
}

interface Post {
  _id: string;
  IdUserCreated: string;
  AuthorName: string;
  Title: string;
  Content: string;
  PublicImage?: string;
  Like: number;
}

/* ------------------------------------------------------------------ */
/* Animation Variants                                                 */
/* ------------------------------------------------------------------ */
const postVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

const commentVariants = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  visible: { opacity: 1, height: "auto", marginTop: 16 },
  exit: { opacity: 0, height: 0, marginTop: 0 },
};

/* ------------------------------------------------------------------ */
/* Sub-Component: PostCard                                            */
/* ------------------------------------------------------------------ */
const PostCard = ({
  post,
  userId,
  initialComments,
  onDelete,
}: {
  post: Post;
  userId: string;
  initialComments: Comment[];
  onDelete: (id: string) => void;
}) => {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [likes, setLikes] = useState(post.Like);
  const [isLiking, setIsLiking] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);

  // Check if current logged in user owns this profile/post
  const isOwnAccount = (session?.user as any)?.id === userId;

  const handleLike = async () => {
    if (!session) return toast.error("Login to like posts");
    if (isLiking) return;

    const previousLikes = likes;
    setLikes((prev) => prev + 1);
    setIsLiking(true);

    try {
      const { data } = await axios.post("/api/posts/actionPosts/addLike", {
        postId: post._id,
        userId: (session.user as any)?.id,
      });
      setLikes(data.liked ? previousLikes + 1 : Math.max(0, previousLikes - 1));
      toast.success(data.liked ? "Liked! ❤️" : "Unliked");
    } catch (error) {
      setLikes(previousLikes);
      toast.error("Failed to update like");
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !session) return;

    setIsSendingComment(true);
    try {
      await axios.post("/api/posts/actionPosts/addComment", {
        postId: post._id,
        comment: commentText,
        userEmail: session.user?.email,
      });

      setComments((prev) => [
        ...prev,
        {
          idPost: post._id,
          CommentUserId: session.user?.name || "User",
          TextComment: commentText,
        },
      ]);
      setCommentText("");
      setIsCommentsOpen(true);
      toast.success("Comment posted");
    } catch (error) {
      toast.error("Comment failed");
    } finally {
      setIsSendingComment(false);
    }
  };

  return (
    <motion.article
      variants={postVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className="group relative bg-slate-800/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden hover:border-indigo-500/40 transition-all duration-500"
    >
      <div className="p-8 pb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20">
            <div className="bg-slate-900 rounded-full p-1 flex items-center justify-center">
              <Image
                src={icon}
                width={36}
                height={36}
                alt="User"
                className="rounded-full"
              />
            </div>
          </div>
          <div>
            <Link
              href={`/ProfileUser/${post.IdUserCreated}`}
              className="text-lg font-bold text-white hover:text-indigo-400 transition-colors"
            >
              {post.AuthorName}
            </Link>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">
              Member
            </p>
          </div>
        </div>

        {isOwnAccount && (
          <button
            onClick={() => onDelete(post._id)}
            className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div className="px-8 py-2">
        <h2 className="text-3xl font-black text-white mb-4 tracking-tight leading-tight">
          {post.Title}
        </h2>

        {post.PublicImage && (
          <div className="relative mb-6 rounded-3xl overflow-hidden aspect-video bg-slate-900 shadow-inner group-hover:shadow-indigo-500/10 transition-shadow">
            <CldImage
              src={post.PublicImage}
              alt={post.Title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-1000"
            />
          </div>
        )}

        <p className="text-slate-300 text-lg leading-relaxed font-medium opacity-80">
          {post.Content}
        </p>
      </div>

      <div className="p-8 pt-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Heart size={18} className={likes > 0 ? "fill-white" : ""} />
            <span>{likes}</span>
          </button>

          <button
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 rounded-2xl text-white font-bold transition-all"
          >
            <MessageSquare size={18} />
            <span>{comments.length}</span>
          </button>
        </div>

        <form onSubmit={handleAddComment} className="relative">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="w-full bg-slate-900/40 border-2 border-slate-700/50 rounded-2xl px-6 py-4 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:bg-slate-900 outline-none transition-all pr-16"
          />
          <button
            type="submit"
            disabled={!commentText.trim() || isSendingComment}
            className="absolute right-3 top-3 p-2 bg-indigo-600 rounded-xl text-white disabled:opacity-20 hover:scale-105 transition-transform"
          >
            {isSendingComment ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>

        <AnimatePresence>
          {isCommentsOpen && (
            <motion.div
              variants={commentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 border-t border-white/5 overflow-hidden"
            >
              {comments.length === 0 ? (
                <p className="text-center text-slate-500 py-4 text-sm italic">
                  No comments yet
                </p>
              ) : (
                comments.map((c, i) => (
                  <div
                    key={i}
                    className="flex gap-4 items-start pt-4 group/comment"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-700 border border-white/5 flex-shrink-0" />
                    <div className="bg-slate-700/30 p-4 rounded-2xl rounded-tl-none flex-1 border border-white/5">
                      <p className="text-xs font-black text-indigo-400 mb-1">
                        {c.CommentUserId}
                      </p>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {c.TextComment}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
};

/* ------------------------------------------------------------------ */
/* Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function FetchPostUser({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [postRes, commentRes] = await Promise.all([
          axios.post("/api/posts/getPostsUser", { IdUser: userId }),
          axios.get("/api/posts/actionPosts/fetchComments"),
        ]);
        setPosts(postRes.data.posts || []);
        setAllComments(commentRes.data.comments || []);
      } catch (e) {
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchData();
  }, [userId]);

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure?")) return;
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    try {
      await axios.post("/api/posts/actionPosts/deletePost", { postId });
      toast.success("Deleted");
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#0F172A]">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 overflow-x-hidden">
      {/* Dynamic Glow Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <Toaster position="top-center" richColors />

      <div className="max-w-4xl mx-auto px-6 py-20">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <h1 className="text-6xl font-black text-white tracking-tighter mb-4">
            User{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Activity
            </span>
          </h1>
          <div className="inline-flex items-center gap-3 px-5 py-2 bg-slate-800/60 rounded-full border border-white/10 shadow-xl">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
            <span className="text-sm font-bold text-slate-300 tracking-wide">
              {posts.length} Contributions
            </span>
          </div>
        </motion.header>

        <div className="space-y-12">
          <AnimatePresence mode="popLayout">
            {posts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <p className="text-slate-500 text-xl font-medium">
                  No posts shared yet.
                </p>
              </motion.div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  userId={userId}
                  initialComments={allComments.filter(
                    (c) => c.idPost === post._id
                  )}
                  onDelete={handleDeletePost}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
