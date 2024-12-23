"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { getSession } from "next-auth/react";
import axios from "axios";
import { Toaster, toast } from "sonner";
import Link from "next/link";
import { CldImage } from "next-cloudinary";

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

export default function GetPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});

  // Fetch posts and comments
  const fetchPostsAndComments = useCallback(async () => {
    try {
      const [postRes, commentRes] = await Promise.all([
        axios.get("/api/posts/fetchPosts"),
        axios.get("/api/posts/fetchComments"),
      ]);

      setPosts(postRes.data.posts || []);
      setComments(commentRes.data.comments || []);
    } catch (error) {
      toast.error("Failed to load data. Please refresh the page.");
    }
  }, []);

  useEffect(() => {
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

  const commentsByPostId = useMemo(() => {
    return comments.reduce((acc, comment) => {
      if (!acc[comment.idPost]) {
        acc[comment.idPost] = [];
      }
      acc[comment.idPost].push(comment);
      return acc;
    }, {} as { [key: string]: Comment[] });
  }, [comments]);

  // Like a post
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

  // Add a comment
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
            CommentUserId: session.user.email,
            TextComment: newComment[postId],
          },
        ]);
        setNewComment((prev) => ({ ...prev, [postId]: "" }));
        toast.success("Comment added successfully!");
      } else {
        toast.error(res.data.message || "Failed to add comment.");
      }
    } catch (error) {
      toast.error(
        "Error adding comment. Please try again Or You Add Comment Exist."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster />
      <div>
        {formattedPosts.map((post) => (
          <div
            key={post._id}
            className="p-6 border rounded-lg m-4 shadow-sm bg-gray-100"
          >
            <p className="text-gray-600 mb-2">
              <em>
                Created By{" "}
                <Link
                  href={`/ProfileUser/${post.IdUserCreated}`}
                  className="text-blue-600 hover:underline"
                >
                  {post.AuthorName}
                </Link>
              </em>
            </p>

            <h3 className="text-2xl font-bold text-center text-gray-800 mb-2">
              {post.Title}
            </h3>

            {post.PublicImage && (
              <div className="my-4">
                <CldImage
                  src={post.PublicImage}
                  alt="Post Image"
                  width="650"
                  height="300"
                  className="rounded-xl shadow-md max-w-full mx-auto"
                  style={{ objectFit: "cover" }}
                />
              </div>
            )}

            <p className="text-gray-700 text-center">{post.Content}</p>

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => handleLike(post._id)}
                className={`bg-green-500 text-white px-4 py-1 rounded-md hover:bg-green-600 transition ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={loading}
              >
                Like: {post.Like}
              </button>

              <form
                onSubmit={(e) => handleAddComment(e, post._id)}
                className="flex items-center"
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
                  className="border rounded-md px-3 py-2 mr-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  className={`bg-blue-500 text-white px-4 py-1 rounded-md hover:bg-blue-600 transition ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={loading}
                >
                  Submit
                </button>
              </form>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold text-gray-700 text-center text-3xl p-4">
                Comments:
              </h4>
              {commentsByPostId[post._id]?.length ? (
                <div className="space-y-4">
                  {commentsByPostId[post._id].map((comment, idx) => (
                    <div
                      key={idx}
                      className="flex items-start bg-gray-800 text-white rounded-lg shadow-md p-4"
                    >
                      <div className="flex items-center justify-around">
                        <p className="font-bold text-blue-400">
                          <Link
                            href={`/ProfileUser/${
                              comment.CommentUserId.split("_")[0]
                            }`}
                          >
                            <img
                              src="https://img.icons8.com/color/48/test-account.png"
                              alt="icon User"
                              className="hover:scale-125 hover:bg-green-600"
                            />{" "}
                          </Link>
                        </p>
                        <p className="m-5 text-gray-300">
                          Text : {comment.TextComment}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center">No comments yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
