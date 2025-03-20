"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { getSession } from "next-auth/react";
import axios from "axios";
import { Toaster, toast } from "sonner";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
import icon from "../../../../../public/iconAccount.png";
import Image from "next/image";

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
  idPost: string;
  CommentUserId: string;
  TextComment: string;
}

interface User {
  id: string;
  email: string;
  name: string;
}

export default function GetPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [user, setUser] = useState<User | null>(null);

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
      } else {
        toast.error("Failed to load data. Please refresh the page.");
      }
    } catch (error: any) {
      toast.error(`Failed to load data. Please refresh the page => ${error}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete post by ID

  const handleDeletePost = async (postId: string) => {
    try {
      const res = await axios.delete(`/api/posts/fetchPosts`, {
        data: { idPost: postId }, // Pass the post ID in the `data` key for DELETE
      });

      if (res.status === 200) {
        toast.success("Post deleted successfully!");
        await fetchPostsAndComments(); // Refresh the posts list after deletion
      } else {
        toast.error(
          res.data.message || "Failed to delete the post. Please try again."
        );
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "An unexpected error occurred.";
      toast.error(errorMessage);
    }
  };

  // Fetch posts and comments on initial render

  useEffect(() => {
    const resSession = async () => {
      const session = await getSession();
      setUser(session?.user || null);
    };
    resSession();
    fetchPostsAndComments();
  }, [fetchPostsAndComments]);

  const formattedPosts = useMemo(
    () =>
      posts.map((post) => ({
        ...post,
        AuthorName: post.AuthorName || "Anonymous",
        Like: post.Like || 0,
      })),
    [posts]
  );

  // Group comments by post ID

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

      setPosts((prevPosts: any) =>
        prevPosts.map((post: any) =>
          post._id === postId
            ? { ...post, Like: data.liked ? post.Like + 1 : post.Like - 1 }
            : post
        )
      );

      toast.success(data.liked ? "Post liked!" : "Like removed.");
    } catch (error: any) {
      toast.error(`Error liking the post Error Message => ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle add comment

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
        const newCommentData: Comment = {
          idPost: postId,
          CommentUserId: session.user.email || "",
          TextComment: newComment[postId],
        };

        setComments((prev) => [...prev, newCommentData]);
        setNewComment((prev) => ({ ...prev, [postId]: "" }));
        toast.success("Comment added successfully!");
      } else {
        toast.error(res.data.message || "Failed to add comment.");
      }
    } catch (error: any) {
      toast.error(`Error adding comment Error : ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster />
      <div className="container h-auto mx-auto p-5 max-w-5xl">
        <h1 className="text-center text-4xl font-bold text-white mb-5">
          Posts
        </h1>
        {loading ? (
          <div className="flex justify-center items-center m-5">
            <p className="text-white text-xl font-semibold">Loading...</p>
            <div className="spinner ml-4 border-t-4 border-white rounded-full w-8 h-8 animate-spin"></div>
          </div>
        ) : formattedPosts.length === 0 ? (
          <h3 className="text-center text-2xl font-bold text-white">
            No Found Posts
          </h3>
        ) : (
          <div
            className="grid grid-row-1
           sm:grid-row-2 lg:grid-row-3 gap-6 "
          >
            {formattedPosts.map((post) => (
              <div
                key={post._id}
                className="p-6 rounded-lg shadow-lg bg-gray-200"
              >
                {user && user.id === post.IdUserCreated && (
                  <button
                    type="button"
                    onClick={() => handleDeletePost(post._id)}
                    className="bg-red-500 text-white p-2 rounded mb-4 cursor-pointer hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                )}
                <p className="text-black font-bold text-xl mb-2">
                  <em>
                    Created By{" "}
                    <Link
                      href={`/ProfileUser/${post.IdUserCreated}`}
                      className="text-red-500 font-bold hover:underline"
                    >
                      {post.AuthorName}
                    </Link>
                  </em>
                </p>
                <h3 className="text-3xl font-semibold text-center text-black mb-4">
                  {post.Title}
                </h3>
                {post.PublicImage && (
                  <CldImage
                    src={post.PublicImage}
                    alt="Post Image"
                    width="450"
                    height="200"
                    className="rounded-lg shadow-md w-full mb-4"
                  />
                )}
                <p className="text-black text-2xl font-bold text-center mb-4">
                  {post.Content}
                </p>
                <button
                  onClick={() => handleLike(post._id)}
                  className="p-2 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
                >
                  Like: {post.Like}
                </button>
                <form
                  onSubmit={(e) => handleAddComment(e, post._id)}
                  className="mt-4"
                >
                  <input
                    type="text"
                    value={newComment[post._id] || ""}
                    onChange={(e) =>
                      setNewComment((prev) => ({
                        ...prev,
                        [post._id]: e.target.value,
                      }))
                    }
                    placeholder="Write a comment"
                    className="w-full border rounded-md px-3 py-2 mb-2"
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
                  >
                    Submit Comment
                  </button>
                </form>
                <div className="mt-4" id={post._id}>
                  {commentsByPostId[post._id]?.length ? (
                    commentsByPostId[post._id].map((comment, idx) => (
                      <div
                        key={comment.idPost + idx}
                        className="bg-gray-700 text-white p-4 rounded-lg mb-2"
                      >
                        <Link
                          href={`/ProfileUser/${
                            comment.CommentUserId.split("_")[0]
                          }`}
                          className="text-blue-400 hover:underline"
                        >
                          <div className="flex items-center">
                            <Image
                              src={icon}
                              width={30}
                              height={30}
                              alt="User Icon"
                              className="mr-2 rounded-full"
                            />
                          </div>
                        </Link>
                        <p>{comment.TextComment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No comments yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
