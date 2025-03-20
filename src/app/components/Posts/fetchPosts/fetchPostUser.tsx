import React, { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast, Toaster } from "sonner";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
import axios from "axios";
import Image from "next/image";
import icon from "../../../../../public/iconAccount.png";
import { motion, AnimatePresence } from "framer-motion";

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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

const commentVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
};

/* ------------------------------------------------------------------ */
/* Sub-Component: Single Post Card                                    */
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

  const isOwnAccount = session?.user?.id === userId; // Assuming session has ID

  // Optimistic Like Handler
  const handleLike = async () => {
    if (!session) return toast.error("Login to like posts");
    if (isLiking) return;

    // 1. Optimistic Update
    const previousLikes = likes;
    setLikes((prev) => prev + 1); // Assume success (add logic for unlike if needed)
    setIsLiking(true);

    try {
      const { data } = await axios.post("/api/posts/actionPosts/addLike", {
        postId: post._id,
        userId: session.user?.id,
      });

      // 2. Sync with server actual response
      setLikes(data.liked ? previousLikes + 1 : Math.max(0, previousLikes - 1));
      toast.success(data.liked ? "Liked! ❤️" : "Unliked");
    } catch (error) {
      // 3. Rollback on error
      setLikes(previousLikes);
      toast.error("Failed to like post");
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!session) return toast.error("Login to comment");

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
          CommentUserId: session.user?.email || "Anonymous",
          TextComment: commentText,
        },
      ]);
      setCommentText("");
      setIsCommentsOpen(true);
      toast.success("Comment added 💬");
    } catch (error) {
      toast.error("Failed to post comment");
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
      className="group bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl shadow-xl border border-gray-600/50 hover:border-gray-500/70 overflow-hidden"
    >
      {/* --- Post Header --- */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                <Image
                  src={icon}
                  width={24}
                  height={24}
                  alt="User Icon"
                  className="rounded-full"
                />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-300">
                Posted by{" "}
                <Link
                  href={`/ProfileUser/${post.IdUserCreated}`}
                  className="font-semibold text-blue-400 hover:text-blue-300"
                >
                  {post.AuthorName}
                </Link>
              </p>
            </div>
          </div>

          {isOwnAccount && (
            <button
              onClick={() => onDelete(post._id)}
              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
              title="Delete Post"
            >
              🗑️
            </button>
          )}
        </div>

        {/* --- Content --- */}
        <h2 className="text-2xl font-bold text-white mb-4">{post.Title}</h2>

        {post.PublicImage && (
          <div className="mb-6 rounded-xl overflow-hidden shadow-lg bg-gray-900">
            <CldImage
              src={post.PublicImage}
              alt={post.Title}
              width={800}
              height={400}
              className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/30 mb-6">
          <p className="text-gray-200 leading-relaxed">{post.Content}</p>
        </div>

        {/* --- Actions --- */}
        <div className="flex gap-4 mb-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleLike}
            disabled={isLiking}
            className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-semibold shadow-lg flex items-center justify-center gap-2"
          >
            {isLiking ? (
              <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            ) : (
              "👍"
            )}
            <span>{likes}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-semibold transition flex items-center justify-center gap-2"
          >
            💬 <span>{comments.length}</span>
          </motion.button>
        </div>

        {/* --- Input --- */}
        <form onSubmit={handleAddComment} className="relative">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={!commentText.trim() || isSendingComment}
            className="absolute right-2 top-1.5 px-4 py-1.5 bg-blue-600 rounded-lg text-sm font-semibold text-white disabled:opacity-50 hover:bg-blue-500 transition"
          >
            {isSendingComment ? "..." : "Post"}
          </button>
        </form>

        {/* --- Comments List --- */}
        <AnimatePresence>
          {isCommentsOpen && (
            <motion.div
              variants={commentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mt-4 space-y-3 overflow-hidden"
            >
              {comments.length === 0 ? (
                <p className="text-center text-gray-500 py-2">
                  No comments yet
                </p>
              ) : (
                comments.map((c, i) => (
                  <div
                    key={i}
                    className="bg-gray-700/30 p-3 rounded-lg border border-white/5"
                  >
                    <p className="text-xs text-blue-400 mb-1">
                      {c.CommentUserId}
                    </p>
                    <p className="text-sm text-gray-200">{c.TextComment}</p>
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

  // Fetch Data
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
        toast.error("Could not load posts");
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchData();
  }, [userId]);

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Permanently delete this post?")) return;

    // Optimistic Delete from List
    setPosts((prev) => prev.filter((p) => p._id !== postId));

    try {
      await axios.post("/api/posts/actionPosts/deletePost", { postId });
      toast.success("Deleted");
    } catch (e) {
      toast.error("Deletion failed");
      // Ideally refetch posts here to restore state
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-900">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <Toaster position="top-center" richColors />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto mb-10 text-center"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          User Feed
        </h1>
        <p className="text-gray-400 mt-2">{posts.length} Posts</p>
      </motion.div>

      <div className="max-w-3xl mx-auto space-y-8">
        <AnimatePresence mode="popLayout">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              userId={userId}
              initialComments={allComments.filter((c) => c.idPost === post._id)}
              onDelete={handleDeletePost}
            />
          ))}
        </AnimatePresence>

        {posts.length === 0 && (
          <div className="text-center text-gray-500 py-20">No posts found.</div>
        )}
      </div>
    </div>
  );
}
