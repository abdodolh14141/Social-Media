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
    transition: { duration: 0.5, ease: "easeOut" },
  },
  exit: { opacity: 0, y: -20 },
};

const commentVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

const buttonHover = {
  scale: 1.05,
  transition: { duration: 0.2 },
};

const buttonTap = {
  scale: 0.95,
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
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors />

      {/* User Posts */}
      <div className="postsUser w-full px-4 md:px-8 lg:px-16 py-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center text-3xl font-bold p-4 mb-8 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg shadow-lg"
        >
          Posts
        </motion.h1>

        {posts.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-400 text-center text-xl py-12"
          >
            No posts found for this user.
          </motion.p>
        ) : (
          <div className="grid gap-8">
            <AnimatePresence>
              {posts.map((post) => (
                <motion.div
                  key={post._id}
                  variants={postVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gray-700"
                >
                  {isOwnAccount && (
                    <motion.div className="flex justify-end">
                      <motion.button
                        whileHover={buttonHover}
                        whileTap={buttonTap}
                        onClick={() => handleDeletePost(post._id)}
                        className="p-2 px-4 bg-red-600 cursor-pointer rounded-md text-white hover:bg-red-700 transition shadow-md"
                      >
                        Delete Post
                      </motion.button>
                    </motion.div>
                  )}

                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                      <Image
                        src={icon}
                        width={24}
                        height={24}
                        alt="User Icon"
                        className="rounded-full"
                      />
                    </div>
                    <p className="text-gray-300">
                      Posted by{" "}
                      <Link
                        href={`/ProfileUser/${post.IdUserCreated}`}
                        className="text-blue-400 font-semibold hover:underline"
                      >
                        {post.AuthorName}
                      </Link>
                    </p>
                  </div>

                  <motion.h3
                    whileHover={{ scale: 1.01 }}
                    className="text-3xl font-bold text-center text-white mb-6"
                  >
                    {post.Title}
                  </motion.h3>

                  {post.PublicImage && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="mb-6 overflow-hidden rounded-xl shadow-lg"
                    >
                      <CldImage
                        src={post.PublicImage}
                        alt="Post Image"
                        width="800"
                        height="400"
                        className="w-full h-auto object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </motion.div>
                  )}

                  <div className="mb-6">
                    <h2 className="text-white text-xl font-semibold mb-2">
                      Content:
                    </h2>
                    <p className="text-gray-300 text-lg p-4 bg-gray-700 rounded-lg">
                      {post.Content}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mb-6">
                    <motion.button
                      whileHover={buttonHover}
                      whileTap={buttonTap}
                      onClick={() => handleLike(post._id)}
                      className={`px-6 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full shadow-md hover:shadow-lg transition ${
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
                      className="px-6 py-2 bg-gray-700 text-white rounded-full"
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
                    className="mb-6"
                  >
                    <div className="flex gap-2">
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
                        className="flex-1 border border-gray-600 rounded-lg px-4 py-2 bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <motion.button
                        whileHover={buttonHover}
                        whileTap={buttonTap}
                        type="submit"
                        className={`px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md ${
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
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <h4 className="text-white font-semibold mb-4 text-xl">
                          Comments:
                        </h4>
                        {commentsByPostId[post._id]?.length ? (
                          <div className="space-y-3">
                            <AnimatePresence>
                              {commentsByPostId[post._id].map(
                                (comment, idx) => (
                                  <motion.div
                                    key={idx}
                                    variants={commentVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="bg-gray-700 text-white p-4 rounded-lg shadow-md"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                                        <Image
                                          src={icon}
                                          width={16}
                                          height={16}
                                          alt="User Icon"
                                          className="rounded-full"
                                        />
                                      </div>
                                      <div>
                                        <Link
                                          href={`/ProfileUser/${
                                            comment.CommentUserId.split("_")[0]
                                          }`}
                                          className="text-blue-400 hover:underline text-sm font-medium"
                                        >
                                          {comment.CommentUserId.split("@")[0]}
                                        </Link>
                                        <p className="text-gray-200 mt-1">
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
                            className="text-gray-400 italic"
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
