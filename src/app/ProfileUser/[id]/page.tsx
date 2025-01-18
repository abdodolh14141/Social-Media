"use client";

import axios from "axios";
import { useParams } from "next/navigation";
import { toast, Toaster } from "sonner";
import { getSession } from "next-auth/react";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
import Image from "next/image";
import icon from "../../../../public/iconAccount.png";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  gender: string;
  follow: number;
  age: number | null;
  Like: number;
  profileImage?: string;
  Followers: string[];
}

interface Comment {
  idPost: string;
  CommentUserId: string;
  TextComment: string;
}

export default function ProfileUser() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true); // Loading state for profile data
  const [isOwnAccount, setIsOwnAccount] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});

  const { id: userId } = useParams();

  // Check if the user is the owner of the account

  const fetchProfileData = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const { data } = await axios.post("/api/users/searchProfile", {
        id: userId,
      });
      const user = data?.user;

      if (user) {
        setProfileData({
          id: user._id,
          name: user.Name,
          email: user.Email,
          gender: user.Gender || "Unknown",
          follow: user.Follow,
          age: user.Age || null,
          Like: user.Likes || 0,
          profileImage: user.UrlImageProfile || "",
          Followers: user.Followers || [],
        });
        setIsFollowing(user.isUserFollowing);
      } else {
        toast.error("Could not find the account.");
      }
    } catch (error) {
      toast.error("Failed to load profile.");
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

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
      setPosts(postRes.data.posts || []);
      setComments(commentRes.data.comments || []);
    } catch (error) {
      toast.error("Failed to load posts and comments.");
    }
  }, [userId]);

  const fetchFollowers = useCallback(async () => {
    try {
      const res = await axios.post("/api/users/getFollowers", {
        AccountId: userId,
      });

      if (res.status === 200 && res.data.followers) {
        setFollowers(res.data.followers);
      } else {
        toast.error(res.data?.message || "Failed to fetch followers.");
      }
    } catch (error) {
      console.error("Error fetching followers:", error);
      toast.error("Failed to fetch followers. Please try again later.");
    }
  }, [userId]);

  useEffect(() => {
    const res = async () => {
      const session = await getSession();
      if (session?.user?.email) {
        setIsOwnAccount(session.user.email === profileData?.email);
      }
    };
    res();
    if (userId) {
      fetchProfileData()
        .then(() => fetchPostsAndComments())
        .then(() => fetchFollowers());
    }
  }, [userId, fetchProfileData, fetchPostsAndComments]);

  const handleFollow = useCallback(async () => {
    if (loading || !profileData) return;

    setLoading(true);
    try {
      const session = await getSession();
      const emailUser = session?.user?.email;

      if (!emailUser) {
        toast.error("You must be logged in to follow.");
        return;
      }

      const res = await axios.post("/api/users/AddFollow", {
        FollowByEmail: emailUser,
        AccountId: profileData.id,
      });

      if (res.status === 200) {
        const action = res.data.action;
        setProfileData((prev) =>
          prev
            ? { ...prev, follow: prev.follow + (action === "follow" ? 1 : -1) }
            : null
        );
        setIsFollowing(action === "follow");
        toast.success(
          action === "follow"
            ? "You followed this profile!"
            : "You unfollowed this profile."
        );
      } else {
        toast.error(res.data.message || "Failed to update follow state.");
      }
    } catch {
      toast.error("An error occurred while following.");
    } finally {
      setLoading(false);
    }
  }, [loading, profileData]);

  return (
    <>
      <Toaster />
      <div className="flex flex-col items-center bg-white shadow-lg rounded-lg p-20 my-20 max-w-7xl mx-auto">
        {loadingProfile ? (
          <div className="flex flex-col items-center justify-center p-10">
            <p className="text-3xl font-semibold text-gray-700">
              Loading profile...
            </p>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mt-6"></div>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <h4 className="text-3xl p-2">
              {isOwnAccount ? "Your Profile" : "Account"}
            </h4>
            <hr className="my-6 border-t-2 border-black w-full" />
            {/* Profile Details */}
            <div className="text-center mt-4 w-full">
              <Image
                src={icon}
                alt="User Icon"
                className="mx-auto rounded-full p-2 shadow-md bg-black"
                width={85}
                height={80}
              />
              <ul className="shadow-lg m-5 rounded-lg p-6 space-y-4 max-w-3xl mx-auto">
                <li className="flex flex-col items-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {profileData?.name || "Guest"}
                  </h1>
                  <h2 className="text-xl font-medium text-gray-700">
                    <span className="font-semibold text-gray-900">Email:</span>{" "}
                    {profileData?.email || "Not provided"}
                  </h2>
                  <h3 className="text-xl font-medium text-gray-700">
                    <span className="font-semibold text-gray-900">Age:</span>{" "}
                    {profileData?.age || "Not provided"}
                  </h3>
                  <h3 className="text-xl font-medium text-gray-700">
                    <span className="font-semibold text-gray-900">Gender:</span>{" "}
                    {profileData?.gender}
                  </h3>
                </li>
              </ul>
            </div>
            {/* Followers Section */}
            <div className="mt-4 w-full flex flex-col items-center">
              <p className="text-xl text-gray-600">
                Followers:{" "}
                <span className="font-bold text-gray-800">
                  {profileData?.follow}
                </span>
              </p>
              {isOwnAccount ? (
                <div className="text-lg font-bold p-2 m-2 bg-blue-500 text-white rounded-md shadow-lg w-full max-w-2xl mx-auto">
                  <p>Followers:</p>
                  {profileData && profileData.Followers ? (
                    profileData.Followers?.map((follower, index) => (
                      <ul>
                        <li>
                          <p key={index} className="text-gray-700 text-center">
                            {index + 1} : {follower.split("@")[0]}
                          </p>
                        </li>
                      </ul>
                    ))
                  ) : (
                    <p className="text-gray-500">No followers yet.</p>
                  )}
                </div>
              ) : (
                <button
                  className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md shadow-lg transition-all duration-200 disabled:opacity-50"
                  onClick={handleFollow}
                  disabled={loading}
                >
                  {loading
                    ? "Processing..."
                    : isFollowing
                    ? "Unfollow"
                    : "Follow"}
                </button>
              )}
            </div>

            <hr className="my-8 border-t-4 border-black rounded-md shadow-md w-full" />
            {/* User Posts */}
            <div className="postsUser w-full">
              <h1 className="text-center text-3xl font-semibold p-2 m-2">
                Posts
              </h1>
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
                    {post.IdUserCreated === userId ? (
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
                        Created By{" "}
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
                        disabled={loading}
                      >
                        Submit Comment
                      </button>
                    </form>
                    <div className="mt-4">
                      <h4 className="text-white font-semibold mb-2">
                        Comments:
                      </h4>
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
        )}
      </div>
    </>
  );
}
