import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getSession } from "next-auth/react";
import { toast, Toaster } from "sonner";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
import axios from "axios";
import Image from "next/image";
import icon from "../../../../../public/iconAccount.png";
import { motion, AnimatePresence } from "framer-motion";

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

// Animation variants
const postVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const commentVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
};

const buttonHover = {
  scale: 1.05,
  transition: { duration: 0.2 },
};

const buttonTap = {
  scale: 0.95,
};

const shimmerAnimation = {
  initial: { x: -1000 },
  animate: { x: 1000 },
  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
};

export default function FetchPostUser({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [isOwnAccount, setIsOwnAccount] = useState(false);
  const [expandedComments, setExpandedComments] = useState<{
    [key: string]: boolean;
  }>({});
  const [likingPost, setLikingPost] = useState<string | null>(null);

  // Comments by post ID
  const commentsByPostId = useMemo(() => {
    return comments.reduce((acc, comment) => {
      if (!acc[comment.idPost]) {
        acc[comment.idPost] = [];
      }
      acc[comment.idPost].push(comment);
      return acc;
    }, {} as { [key: string]: Comment[] });
  }, [comments]);

  const handleLike = async (postId: string) => {
    try {
      const session = await getSession();
      if (!session?.user?.email) {
        toast.error("You must be logged in to like a post.");
        return;
      }

      setLikingPost(postId);
      const { data } = await axios.post("/api/posts/addLike", {
        postId,
        userEmail: session.user.email,
      });

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                Like: data.liked ? post.Like + 1 : Math.max(0, post.Like - 1),
              }
            : post
        )
      );

      toast.success(data.liked ? "Post liked! 💖" : "Like removed.");
    } catch (error) {
      toast.error("Error liking the post. Please try again.");
    } finally {
      setLikingPost(null);
    }
  };

  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const commentText = newComment[postId]?.trim();

    if (!commentText) {
      toast.error("Please enter a comment.");
      return;
    }

    try {
      const session = await getSession();
      if (!session?.user?.email) {
        toast.error("You must be logged in to comment.");
        return;
      }

      setLoading(true);
      const res = await axios.post("/api/posts/addComment", {
        postId,
        comment: commentText,
        userEmail: session.user.email,
      });

      if (res.status === 200) {
        setComments((prev) => [
          ...prev,
          {
            idPost: postId,
            CommentUserId: session.user?.email || "",
            TextComment: commentText,
          },
        ]);
        setNewComment((prev) => ({ ...prev, [postId]: "" }));
        setExpandedComments((prev) => ({ ...prev, [postId]: true }));
        toast.success("Comment added successfully! 💬");
      }
    } catch (error) {
      toast.error("Error adding comment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const res = await axios.post("/api/posts/deletePost", { postId });
      if (res.status === 200) {
        setPosts((prev) => prev.filter((post) => post._id !== postId));
        toast.success("Post deleted successfully. 🗑️");
      }
    } catch (error) {
      toast.error("Error deleting post. Please try again.");
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const fetchPostsAndComments = useCallback(async () => {
    try {
      setLoading(true);
      const [postRes, commentRes] = await Promise.all([
        axios.post("/api/posts/getPostsUser", { IdUser: userId }),
        axios.get("/api/posts/fetchComments"),
      ]);

      const session = await getSession();
      if (session?.user?.id) {
        setIsOwnAccount(session.user.id === userId);
      }

      setPosts(postRes.data.posts || []);
      setComments(commentRes.data.comments || []);
    } catch (error) {
      toast.error("Failed to load posts and comments.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchPostsAndComments();
    }
  }, [userId, fetchPostsAndComments]);

  // Loading skeleton
  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
        <Toaster position="top-center" richColors />
        <div className="max-w-4xl mx-auto space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-700 rounded-full mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/6"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-700 rounded w-3/4 mb-4 mx-auto"></div>
              <div className="h-48 bg-gray-700 rounded mb-4"></div>
              <div className="flex justify-between">
                <div className="h-8 bg-gray-700 rounded w-20"></div>
                <div className="h-8 bg-gray-700 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors />

      {/* Enhanced container with better background */}
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header with gradient and better typography */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
              User Posts
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              {posts.length} post{posts.length !== 1 ? "s" : ""} found
            </p>
          </motion.div>

          {posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-4xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                No Posts Yet
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                This user hasn't created any posts yet. Check back later!
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {posts.map((post) => (
                  <motion.article
                    key={post._id}
                    variants={postVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    className="group bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl shadow-2xl border border-gray-600/50 hover:border-gray-500/70 transition-all duration-300 overflow-hidden"
                  >
                    {/* Post Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                              <Image
                                src={icon}
                                width={24}
                                height={24}
                                alt="User Icon"
                                className="rounded-full"
                              />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-300">
                              Posted by{" "}
                              <Link
                                href={`/ProfileUser/${post.IdUserCreated}`}
                                className="font-semibold text-blue-400 hover:text-blue-300 transition-colors duration-200"
                              >
                                {post.AuthorName}
                              </Link>
                            </p>
                            <p className="text-xs text-gray-500">2 hours ago</p>
                          </div>
                        </div>

                        {isOwnAccount && (
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeletePost(post._id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors duration-200 group/delete"
                            title="Delete post"
                          >
                            <span className="text-red-400 group-hover/delete:text-red-300 text-lg">
                              🗑️
                            </span>
                          </motion.button>
                        )}
                      </div>

                      {/* Post Title */}
                      <motion.h2
                        whileHover={{ scale: 1.01 }}
                        className="text-2xl sm:text-3xl font-bold text-center text-white mb-6 leading-tight"
                      >
                        {post.Title}
                      </motion.h2>

                      {/* Post Image */}
                      {post.PublicImage && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                          className="mb-6 rounded-xl overflow-hidden shadow-2xl"
                        >
                          <CldImage
                            src={post.PublicImage}
                            alt="Post Image"
                            width={800}
                            height={400}
                            sizes="(max-width: 640px) 100vw, 800px"
                            className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                          />
                        </motion.div>
                      )}

                      {/* Post Content */}
                      <div className="mb-6">
                        <p className="text-gray-200 leading-relaxed text-base sm:text-lg bg-gray-700/50 rounded-xl p-4 border border-gray-600/30">
                          {post.Content}
                        </p>
                      </div>

                      {/* Engagement Buttons */}
                      <div className="flex items-center justify-between mb-4">
                        <motion.button
                          whileHover={buttonHover}
                          whileTap={buttonTap}
                          onClick={() => handleLike(post._id)}
                          disabled={likingPost === post._id}
                          className={`flex items-center space-x-2 px-6 py-3 rounded-full shadow-lg transition-all duration-200 ${
                            likingPost === post._id
                              ? "bg-blue-600 cursor-not-allowed"
                              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                          }`}
                        >
                          <span className="text-white font-semibold">👍</span>
                          <span className="text-white font-bold">
                            {post.Like}
                          </span>
                          {likingPost === post._id && (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                            />
                          )}
                        </motion.button>

                        <motion.button
                          whileHover={buttonHover}
                          whileTap={buttonTap}
                          onClick={() => toggleComments(post._id)}
                          className="flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-full shadow-lg transition-colors duration-200"
                        >
                          <span>💬</span>
                          <span className="font-semibold">
                            {commentsByPostId[post._id]?.length || 0}
                          </span>
                          <span className="font-medium">
                            {expandedComments[post._id] ? "Hide" : "Show"}{" "}
                            Comments
                          </span>
                        </motion.button>
                      </div>

                      {/* Comment Input */}
                      <motion.form
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={(e) => handleAddComment(e, post._id)}
                        className="mb-4"
                      >
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={newComment[post._id] || ""}
                              onChange={(e) =>
                                setNewComment((prev) => ({
                                  ...prev,
                                  [post._id]: e.target.value,
                                }))
                              }
                              placeholder="Share your thoughts..."
                              className="w-full text-sm border border-gray-500 rounded-xl px-4 py-3 bg-gray-600/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all duration-200"
                              maxLength={500}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                              {newComment[post._id]?.length || 0}/500
                            </div>
                          </div>
                          <motion.button
                            whileHover={buttonHover}
                            whileTap={buttonTap}
                            type="submit"
                            disabled={loading || !newComment[post._id]?.trim()}
                            className={`px-6 py-3 text-sm font-semibold rounded-xl shadow-lg transition-all duration-200 ${
                              loading || !newComment[post._id]?.trim()
                                ? "bg-gray-500 cursor-not-allowed text-gray-300"
                                : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white"
                            }`}
                          >
                            {loading ? "Posting..." : "Post Comment 🚀"}
                          </motion.button>
                        </div>
                      </motion.form>
                    </div>

                    {/* Comments Section */}
                    <AnimatePresence>
                      {expandedComments[post._id] && (
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={commentVariants}
                          transition={{ duration: 0.3 }}
                          className="border-t border-gray-600/50 bg-gray-750/30"
                        >
                          <div className="p-6 pt-4">
                            <h4 className="text-white font-semibold mb-4 flex items-center">
                              <span className="mr-2">💬</span>
                              Comments (
                              {commentsByPostId[post._id]?.length || 0})
                            </h4>

                            {commentsByPostId[post._id]?.length ? (
                              <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                  {commentsByPostId[post._id].map(
                                    (comment, idx) => (
                                      <motion.div
                                        key={`${post._id}-${idx}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{
                                          duration: 0.3,
                                          delay: idx * 0.1,
                                        }}
                                        className="bg-gray-700/50 backdrop-blur-sm rounded-xl p-4 border border-gray-600/30 hover:border-gray-500/50 transition-colors duration-200"
                                      >
                                        <div className="flex items-start space-x-3">
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center flex-shrink-0">
                                            <Image
                                              src={icon}
                                              width={16}
                                              height={16}
                                              alt="User Icon"
                                              className="rounded-full"
                                            />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-gray-200 text-sm leading-relaxed break-words">
                                              {comment.TextComment}
                                            </p>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )
                                  )}
                                </AnimatePresence>
                              </div>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-8 text-gray-500"
                              >
                                <div className="text-4xl mb-2">💭</div>
                                <p className="text-sm">
                                  No comments yet. Start the conversation!
                                </p>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
