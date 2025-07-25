"use client";
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

const postVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: ["easeOut"] },
  },
  exit: { opacity: 0, y: -20 },
};

const commentVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const buttonHover = {
  scale: 1.03,
  transition: { duration: 0.15 },
};

const buttonTap = {
  scale: 0.97,
};

export default function FetchPostUser({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [isOwnAccount, setIsOwnAccount] = useState(false);
  const [expandedComments, setExpandedComments] = useState<{
    [key: string]: boolean;
  }>({});

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

      setLoading(true);
      const { data } = await axios.post("/api/posts/addLike", {
        postId,
        userEmail: session.user.email,
      });

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? { ...post, Like: data.liked ? post.Like + 1 : post.Like - 1 }
            : post
        )
      );

      toast.success(data.liked ? "Post liked!" : "Like removed.");
    } catch (error) {
      toast.error("Error liking the post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();

    try {
      const session = await getSession();
      if (!session?.user?.email) {
        toast.error("You must be logged in to comment.");
        return;
      }

      setLoading(true);

      const res = await axios.post("/api/posts/addComment", {
        postId,
        comment: newComment[postId],
        userEmail: session.user.email,
      });

      if (res.status === 200) {
        setComments((prev) => [
          ...prev,
          {
            idPost: postId,
            CommentUserId: session.user?.email || "",
            TextComment: newComment[postId],
          },
        ]);
        setNewComment((prev) => ({ ...prev, [postId]: "" }));
        toast.success("Comment added successfully!");
      } else {
        toast.error(res.data.message || "Failed to add comment.");
      }
    } catch (error) {
      toast.error("Error adding comment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const res = await axios.post("/api/posts/deletePost", { postId });
      if (res.status === 200) {
        setPosts((prev) => prev.filter((post) => post._id !== postId));
        toast.success("Post deleted successfully.");
      } else {
        toast.error(res.data.message || "Failed to delete post.");
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
      const [postRes, commentRes] = await Promise.all([
        axios.post("/api/posts/getPostsUser", { IdUser: userId }),
        axios.get("/api/posts/fetchComments"),
      ]);
      const session = await getSession();
      if (session?.user?.email) {
        setIsOwnAccount(session?.user?.id === userId);
      }
      setPosts(postRes.data.posts || []);
      setComments(commentRes.data.comments || []);
    } catch (error) {
      toast.error("Failed to load posts and comments.");
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchPostsAndComments();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors />

      {/* Mobile-optimized container */}
      <div className="px-2 sm:px-4 py-4 w-full p-2">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center text-2xl sm:text-3xl font-bold p-3 mb-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg shadow-md"
        >
          Posts
        </motion.h1>

        {posts.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-400 text-center text-lg py-8"
          >
            No posts found for this user.
          </motion.p>
        ) : (
          <div className="space-y-4 p-5 m-2">
            <AnimatePresence>
              {posts.map((post) => (
                <motion.div
                  key={post._id}
                  variants={postVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="p-5 sm:p-0 m-5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-lg border border-gray-700"
                >
                  {isOwnAccount && (
                    <motion.div className="flex justify-end mb-2">
                      <motion.button
                        whileHover={buttonHover}
                        whileTap={buttonTap}
                        onClick={() => handleDeletePost(post._id)}
                        className="text-xs sm:text-sm p-1.5 px-3 bg-red-600 cursor-pointer rounded text-white hover:bg-red-700 transition shadow-sm"
                      >
                        Delete
                      </motion.button>
                    </motion.div>
                  )}

                  <div className="flex items-center mb-3 p-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-700 flex items-center justify-center mr-2">
                      <Image
                        src={icon}
                        width={20}
                        height={20}
                        alt="User Icon"
                        className="rounded-full"
                      />
                    </div>
                    <p className="text-sm sm:text-base text-gray-300">
                      Posted by{" "}
                      <Link
                        href={`/ProfileUser/${post.IdUserCreated}`}
                        className="text-blue-400 font-medium hover:underline"
                      >
                        {post.AuthorName}
                      </Link>
                    </p>
                  </div>

                  <motion.h3
                    whileHover={{ scale: 1.005 }}
                    className="text-xl sm:text-2xl font-bold text-center text-white mb-4"
                  >
                    {post.Title}
                  </motion.h3>

                  {post.PublicImage && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="mb-4 overflow-hidden rounded-lg shadow-md"
                    >
                      <CldImage
                        src={post.PublicImage}
                        alt="Post Image"
                        width={800}
                        height={400}
                        sizes="(max-width: 640px) 100vw, 800px"
                        className="w-full h-auto object-cover"
                      />
                    </motion.div>
                  )}

                  <div className="mb-4 p-3">
                    <h2 className="text-white text-sm sm:text-base font-semibold mb-1">
                      Content:
                    </h2>
                    <p className="text-gray-300 text-sm sm:text-base p-3 bg-gray-700 rounded-md">
                      {post.Content}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row p-3 justify-between items-center gap-2 mb-4">
                    <motion.button
                      whileHover={buttonHover}
                      whileTap={buttonTap}
                      onClick={() => handleLike(post._id)}
                      className={`w-full sm:w-auto px-4 py-1.5 text-sm bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full shadow-sm hover:shadow transition ${
                        loading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={loading}
                    >
                      👍 Like: {post.Like}
                    </motion.button>

                    <motion.button
                      whileHover={buttonHover}
                      whileTap={buttonTap}
                      onClick={() => toggleComments(post._id)}
                      className="w-full sm:w-auto px-4 py-1.5 text-sm bg-gray-700 text-white rounded-full"
                    >
                      {expandedComments[post._id]
                        ? "Hide Comments"
                        : "Show Comments"}
                    </motion.button>
                  </div>

                  <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={(e) => handleAddComment(e, post._id)}
                    className="mb-4"
                  >
                    <div className="flex flex-col p-3 sm:flex-row gap-2">
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
                        className="flex-1 text-sm border border-gray-600 rounded-lg px-3 py-2 bg-gray-700 text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                      <motion.button
                        whileHover={buttonHover}
                        whileTap={buttonTap}
                        type="submit"
                        className={`px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-sm ${
                          loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {loading ? "..." : "Post"}
                      </motion.button>
                    </div>
                  </motion.form>

                  <AnimatePresence>
                    {expandedComments[post._id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <h4 className="text-white text-sm sm:text-base font-semibold mb-2">
                          Comments:
                        </h4>
                        {commentsByPostId[post._id]?.length ? (
                          <div className="space-y-2">
                            <AnimatePresence>
                              {commentsByPostId[post._id].map(
                                (comment, idx) => (
                                  <motion.div
                                    key={idx}
                                    variants={commentVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="bg-gray-700 text-white p-3 rounded-md shadow-sm"
                                  >
                                    <div className="flex items-start gap-2">
                                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-600 flex items-center justify-center">
                                        <Image
                                          src={icon}
                                          width={14}
                                          height={14}
                                          alt="User Icon"
                                          className="rounded-full"
                                        />
                                      </div>
                                      <div>
                                        <p className="text-gray-200 text-xs sm:text-sm mt-1">
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
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-gray-400 text-xs sm:text-sm italic"
                          >
                            No comments yet. Be the first to comment!
                          </motion.p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  );
}
