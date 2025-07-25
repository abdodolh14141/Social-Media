"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { getSession } from "next-auth/react";
import axios from "axios";
import { Toaster, toast } from "sonner";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
import iconAccount from "../../../../../public/iconAccount.png";
import Like from "../../../../../public/Like.png";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// Types for Posts, Comments, and User
interface Post {
  _id: string;
  Title: string;
  Content: string;
  Like: number;
  AuthorName?: string;
  PublicImage?: string;
  IdUserCreated: string;
  Comments?: Array<{ IdUser: string; CommentText: string }>;
}

interface Comment {
  _id: string;
  idPost: string;
  UserId: string;
  TextComment: string;
  Name: string;
}

interface User {
  id: string;
  email: string;
  name: string;
}

// Animation variants
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

export default function GetPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [user, setUser] = useState<User | null>(null);
  const [expandedComments, setExpandedComments] = useState<{
    [key: string]: boolean;
  }>({});

  // Fetch posts and comments
  const fetchPostsAndComments = useCallback(async () => {
    setLoading(true);
    try {
      const [postRes, commentRes] = await Promise.all([
        axios.get("/api/posts/fetchPosts"),
        axios.get("/api/posts/fetchComments"),
      ]);

      if (postRes.status === 200 && commentRes.status === 200) {
        setPosts(postRes.data.posts || []);
        setComments(commentRes.data.comments || []);
      }
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete post by ID
  const handleDeletePost = useCallback(async (postId: string) => {
    try {
      const res = await axios.delete(`/api/posts/fetchPosts`, {
        data: { idPost: postId },
      });

      if (res.status === 200) {
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post._id !== postId)
        );
        setComments((prevComments) =>
          prevComments.filter((comment) => comment.idPost !== postId)
        );
        toast.success("Post deleted successfully!");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete post");
    }
  }, []);

  // Delete comment by ID
  const handleDeleteComment = useCallback(async (commentId: string) => {
    try {
      const res = await axios.delete(`/api/posts/fetchComments`, {
        data: { commentId },
      });

      if (res.status === 200) {
        setComments((prevComments) =>
          prevComments.filter((comment) => comment._id !== commentId)
        );
        toast.success("Comment deleted successfully!");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete comment");
    }
  }, []);

  // Fetch user session
  const fetchUserSession = useCallback(async () => {
    const session = await getSession();
    if (session?.user) {
      setUser(session.user as User);
    }
  }, []);

  // Memoized formatted posts
  const formattedPosts = useMemo(
    () =>
      posts.map((post) => ({
        ...post,
        AuthorName: post.AuthorName || "Anonymous",
        Like: post.Like || 0,
      })),
    [posts]
  );

  // Memoized comments grouped by post ID
  const commentsByPostId = useMemo(() => {
    return comments.reduce((acc, comment) => {
      if (!acc[comment.idPost]) {
        acc[comment.idPost] = [];
      }
      acc[comment.idPost].push(comment);
      return acc;
    }, {} as { [key: string]: Comment[] });
  }, [comments]);

  // Handle like post
  const handleLike = useCallback(async (postId: string) => {
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
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle add comment
  const handleAddComment = useCallback(
    async (e: React.FormEvent, postId: string) => {
      e.preventDefault();

      try {
        const session = await getSession();
        if (!session?.user?.email) {
          toast.error("You must be logged in to comment.");
          return;
        }

        if (!newComment[postId]?.trim()) {
          toast.error("Comment cannot be empty");
          return;
        }

        setLoading(true);
        const res = await axios.post("/api/posts/addComment", {
          postId,
          name: session.user.name,
          comment: newComment[postId],
          userId: (session.user as User)?.id || "",
        });

        if (res.status === 200) {
          const newCommentData: Comment = {
            _id: res.data.commentId,
            idPost: postId,
            UserId: (session.user as User)?.id || "",
            TextComment: newComment[postId],
            Name: session.user.name || "Unknown",
          };

          setComments((prev) => [...prev, newCommentData]);
          setNewComment((prev) => ({ ...prev, [postId]: "" }));
          toast.success("Comment added successfully!");
        }
      } catch (error: any) {
        toast.error(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    },
    [newComment]
  );

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Initial data fetch
  useEffect(() => {
    fetchUserSession();
    fetchPostsAndComments();
  }, [fetchPostsAndComments, fetchUserSession]);

  return (
    <>
      <Toaster position="top-center" richColors />
      <main>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center text-3xl font-extrabold p-6 mb-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg"
          >
            Community Posts
          </motion.h1>

          {loading && !posts.length ? (
            <div className="flex justify-center items-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full"
              />
            </div>
          ) : formattedPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="text-gray-400 text-xl mb-4">No posts found.</div>
              <button
                className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                onClick={() => toast.message("Login To Create New Post")}
              >
                Create Your First Post
              </button>
            </motion.div>
          ) : (
            <div className="space-y-8">
              <AnimatePresence>
                {formattedPosts.map((post) => (
                  <motion.article
                    key={post._id}
                    variants={postVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700"
                  >
                    {user && user.id === post.IdUserCreated && (
                      <motion.div className="flex justify-end">
                        <motion.button
                          whileHover={buttonHover}
                          whileTap={buttonTap}
                          onClick={() => handleDeletePost(post._id)}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-colors"
                        >
                          Delete Post
                        </motion.button>
                      </motion.div>
                    )}

                    <header className="flex items-center mb-6">
                      <div className="relative w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-4 overflow-hidden">
                        <Image
                          src={iconAccount}
                          width={40}
                          height={40}
                          alt="User Icon"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <Link
                          href={`/ProfileUser/${post.IdUserCreated}`}
                          className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {post.AuthorName}
                        </Link>
                      </div>
                    </header>

                    <motion.h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                      {post.Title}
                    </motion.h2>

                    {post.PublicImage && (
                      <motion.figure className="mb-6 rounded-xl overflow-hidden shadow-md">
                        <CldImage
                          src={post.PublicImage}
                          alt="Post Image"
                          width="800"
                          height="450"
                          className="w-full h-auto object-cover"
                        />
                      </motion.figure>
                    )}

                    <div className="prose dark:prose-invert max-w-none mb-8">
                      <p className="text-gray-700 font-bold text-2xl dark:text-gray-300 leading-relaxed">
                        {post.Content}
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                      <motion.button
                        whileHover={buttonHover}
                        whileTap={buttonTap}
                        onClick={() => handleLike(post._id)}
                        className={`flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-md hover:shadow-lg transition ${
                          loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={loading}
                      >
                        <Image src={Like} alt="Like" width={24} height={24} />
                        <span>{post.Like}</span>
                      </motion.button>

                      <motion.button
                        whileHover={buttonHover}
                        whileTap={buttonTap}
                        onClick={() => toggleComments(post._id)}
                        className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {expandedComments[post._id]
                          ? "Hide Comments"
                          : `Show Comments (${
                              commentsByPostId[post._id]?.length || 0
                            })`}
                      </motion.button>
                    </div>

                    <motion.form
                      onSubmit={(e) => handleAddComment(e, post._id)}
                      className="mb-6"
                    >
                      <div className="flex gap-3">
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
                          className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
                          required
                        />
                        <motion.button
                          whileHover={buttonHover}
                          whileTap={buttonTap}
                          type="submit"
                          className={`px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-colors ${
                            loading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={loading}
                        >
                          Post
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
                          <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Comments ({commentsByPostId[post._id]?.length || 0})
                          </h4>
                          {commentsByPostId[post._id]?.length ? (
                            <div className="space-y-4">
                              <AnimatePresence>
                                {commentsByPostId[post._id].map((comment) => (
                                  <motion.div
                                    key={comment._id}
                                    variants={commentVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm relative"
                                  >
                                    <div className="flex gap-4">
                                      <div className="flex-shrink-0">
                                        {comment.UserId === user?.id && (
                                          <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() =>
                                              handleDeleteComment(comment._id)
                                            }
                                            className="text-red-500 hover:text-red-700 p-1 right-1 absolute top-1"
                                            title="Delete comment"
                                            aria-label="Delete comment"
                                          >
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              className="h-5 w-5"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                              />
                                            </svg>
                                          </motion.button>
                                        )}
                                        <Link
                                          href={`/ProfileUser/${comment.UserId}`}
                                          className="block"
                                        >
                                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                                            <Image
                                              src={iconAccount}
                                              width={40}
                                              height={40}
                                              alt="User Icon"
                                              className="object-cover"
                                            />
                                            <p> {comment.Name}</p>
                                          </div>
                                        </Link>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="mt-1 text-gray-700 dark:text-gray-300">
                                          {comment.TextComment}
                                        </p>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                          ) : (
                            <motion.div className="text-center py-6 text-gray-500 dark:text-gray-400">
                              No comments yet. Be the first to comment!
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
