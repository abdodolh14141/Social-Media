"use client";

import axios from "axios";
import { useParams } from "next/navigation";
import { toast, Toaster } from "sonner";
import { getSession } from "next-auth/react";
import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import icon from "../../../../public/iconAccount.png";
import FetchPostUser from "@/app/components/Posts/fetchPosts/fetchPostUser";

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

export default function ProfileUser() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true); // Loading state for profile data
  const [isOwnAccount, setIsOwnAccount] = useState(false);
  const [followers, setFollowers] = useState<string[]>([]);
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

        const session = await getSession();
        if (session?.user?.email) {
          setIsOwnAccount(session?.user?.email === user.Email);
        }
      } else {
        toast.error("Could not find the account.");
      }
    } catch (error) {
      toast.error("Failed to load profile.");
    } finally {
      setLoadingProfile(false);
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

  useEffect(() => {
    if (userId) {
      fetchProfileData().then(() => fetchFollowers());
    }
  }, [userId, fetchProfileData]);

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
                <div className="text-lg font-bold p-2 m-2 text-white rounded-md shadow-lg w-full mx-auto">
                  {profileData && profileData.Followers.length > 0 ? (
                    profileData?.Followers?.map((follower, index) => (
                      <ul>
                        <li>
                          <h1>
                            {" "}
                            <p>Followers:</p>
                          </h1>
                          <p key={index} className="text-gray-700 text-center">
                            {index + 1} : {follower.split("@")[0]}
                          </p>
                        </li>
                      </ul>
                    ))
                  ) : (
                    <p className="text-gray-500">No Followers Yet.</p>
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
            {typeof userId === "string" && <FetchPostUser userId={userId} />}
          </>
        )}
      </div>
    </>
  );
}
