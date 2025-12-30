import React, { useEffect, useState } from "react";
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
/* Animation Variants                                                  */
/* ------------------------------------------------------------------ */
const postVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

/* ------------------------------------------------------------------ */
/* Sub-Component: Single Post Card                                    */
/* ------------------------------------------------------------------ */
const PostCard = ({
  post,
  initialComments,
  onDelete,
}: {
  post: Post;
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

  const isPostOwner = session?.user?.id === post._id;

  const handleLike = async () => {
    if (!session) return toast.error("Login to like posts");
    if (isLiking) return;
    setLikes((prev) => prev + 1);
    setIsLiking(true);
    try {
      const { data } = await axios.post("/api/posts/actionPosts/addLike", {
        postId: post._id,
        userId: session.user?.id,
      });
      if (data.newLikeCount !== undefined) setLikes(data.newLikeCount);
    } catch (error) {
      setLikes((prev) => prev - 1);
      toast.error("Failed to like post");
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
      const newCommentObj = {
        idPost: post._id,
        CommentUserId: session.user?.name || session.user?.email || "User",
        TextComment: commentText,
      };
      setComments((prev) => [...prev, newCommentObj]);
      setCommentText("");
      setIsCommentsOpen(true);
      toast.success("Comment added");
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
      whileInView="visible"
      viewport={{ once: true }}
      className="relative bg-gray-900/40 backdrop-blur-md rounded-3xl border border-gray-800 shadow-2xl overflow-hidden hover:border-gray-700 transition-colors"
    >
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500">
              <Image
                src={icon}
                width={44}
                height={44}
                alt="User"
                className="rounded-full bg-gray-900 border-2 border-gray-900"
              />
            </div>
            <div>
              <Link
                href={`/ProfileUser/${post.IdUserCreated}`}
                className="font-bold text-gray-100 hover:text-blue-400 transition-colors block"
              >
                {post.AuthorName}
              </Link>
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                Community Contributor
              </span>
            </div>
          </div>
          {isPostOwner && (
            <button
              onClick={() => onDelete(post._id)}
              className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
            >
              <span className="text-sm font-medium">Delete</span>
            </button>
          )}
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-white mb-4 tracking-tight leading-snug">
          {post.Title}
        </h2>

        {post.PublicImage && (
          <div className="mb-6 rounded-2xl overflow-hidden ring-1 ring-gray-800 shadow-inner">
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
          </div>
        )}

        <p className="text-gray-400 mb-8 leading-relaxed text-lg">
          {post.Content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-bold transition-all ${
              isLiking
                ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                : "bg-gray-800/50 border-gray-700 text-gray-300 hover:border-blue-500/50 hover:text-blue-400"
            }`}
          >
            {isLiking ? "..." : `❤️ ${likes}`}
          </button>
          <button
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-800/50 border border-gray-700 text-gray-300 text-sm font-bold hover:bg-gray-800 transition-all"
          >
            💬 {comments.length}
          </button>
        </div>

        {/* Comment Form */}
        <form
          onSubmit={handleAddComment}
          className="relative flex items-center gap-2"
        >
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share your thoughts..."
            className="flex-1 bg-gray-950/50 border border-gray-800 rounded-2xl px-5 py-3 text-sm text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={!commentText.trim() || isSendingComment}
            className="p-3 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white disabled:opacity-50 disabled:grayscale transition-all"
          >
            {isSendingComment ? "..." : "➤"}
          </button>
        </form>

        {/* Comments List */}
        <AnimatePresence>
          {isCommentsOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-gray-800 space-y-4"
            >
              {comments.map((c, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex-shrink-0" />
                  <div className="flex-1 bg-gray-800/30 rounded-2xl px-4 py-3">
                    <p className="text-xs font-bold text-blue-400 mb-1">
                      {c.CommentUserId}
                    </p>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {c.TextComment}
                    </p>
                  </div>
                </div>
              ))}
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
    if (!confirm("Permanently delete this memory?")) return;
    const previousPosts = [...posts];
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    try {
      await axios.post("/api/posts/actionPosts/deletePost", { postId });
      toast.success("Post removed successfully");
    } catch (e) {
      setPosts(previousPosts);
      toast.error("Couldn't remove post");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-500">
            LOADING
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 selection:bg-blue-500/30">
      <Toaster position="top-center" richColors theme="dark" />

      <header className="max-w-4xl mx-auto pt-24 pb-16 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tighter">
            USER{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              FEED
            </span>
          </h1>
          <div className="h-1.5 w-24 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6" />
          <p className="text-gray-500 font-medium max-w-sm mx-auto">
            Explore {posts.length} unique captures from the community.
          </p>
        </motion.div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pb-24 space-y-12">
        <AnimatePresence mode="popLayout">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              initialComments={allComments.filter((c) => c.idPost === post._id)}
              onDelete={handleDeletePost}
            />
          ))}
        </AnimatePresence>

        {posts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32 border-2 border-dashed border-gray-900 rounded-[3rem]"
          >
            <span className="text-4xl mb-4 block">🏜️</span>
            <p className="text-gray-600 font-bold uppercase tracking-widest text-xs">
              No posts found
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
