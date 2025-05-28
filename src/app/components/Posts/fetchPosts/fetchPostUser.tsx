"use clint";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getSession } from "next-auth/react";
import { toast, Toaster } from "sonner";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
import axios from "axios";
import Image from "next/image";
import icon from "../../../../../public/iconAccount.png";

interface Comment {
  idPost: string;
  CommentUserId: string;
  TextComment: string;
}
export default function FetchPostUser({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [isOwnAccount, setIsOwnAccount] = useState(false);

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

  // Add a comment to a post

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

  // Fetch posts and comments for the user

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
    return <></>;
  }

  return (
    <>
      <Toaster position="top-center" />
      {/* User Posts */}
      <div className="postsUser w-full">
        <h1 className="text-center text-3xl font-semibold p-2 m-2">Posts</h1>
        {posts.length === 0 ? (
          <p className="text-gray-600 text-center">
            No posts found for this user.
          </p>
        ) : (
          posts.map((post) => (
            <div
              key={post._id}
              className="p-6 bg-gray-800 max-w-7xl rounded-lg shadow-lg"
            >
              {isOwnAccount ? (
                <>
                  <div>
                    <button
                      className="p-1 m-1 bg-red-600 cursor-pointer rounded-md text-white hover:bg-red-700 transition"
                      onClick={() => handleDeletePost(post._id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span></span>
                </>
              )}
              <p className="text-white text-xl mb-2">
                <em>
                  Created By
                  <Link
                    href={`/ProfileUser/${post.IdUserCreated}`}
                    className="text-red-500 font-bold hover:underline"
                  >
                    {post.AuthorName}
                  </Link>
                </em>
              </p>
              <h3 className="text-3xl font-semibold text-center text-white mb-4">
                {post.Title}
              </h3>
              {post.PublicImage && (
                <div className="mb-4">
                  <CldImage
                    src={post.PublicImage}
                    alt="Post Image"
                    width="650"
                    height="300"
                    className="rounded-lg shadow-md w-full"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}
              <p className="text-white text-xl text-center mb-4">
                {post.Content}
              </p>
              <button
                onClick={() => handleLike(post._id)}
                className={`p-2 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={loading}
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
                  className="w-full border rounded-md px-3 py-2 mb-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className={`w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Adding comment..." : "Add Comment"}
                </button>
              </form>
              <div className="mt-4">
                <h4 className="text-white font-semibold mb-2">Comments:</h4>
                {commentsByPostId[post._id]?.length ? (
                  commentsByPostId[post._id].map((comment, idx) => (
                    <div
                      key={idx}
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
          ))
        )}
      </div>
    </>
  );
}
