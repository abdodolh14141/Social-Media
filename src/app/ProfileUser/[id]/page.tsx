"use client";

import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { getSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  gender: string;
  follow: number;
  age: number | null;
  profileImage?: string;
}

const API_BASE_URL = "api/users";

export default function ProfileUser() {
  const [formData, setFormData] = useState<ProfileData>({
    id: "",
    name: "",
    email: "",
    gender: "Unknown",
    follow: 0,
    age: null,
    profileImage: "",
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOwnAccount, setIsOwnAccount] = useState(false);

  const { id: IdUser } = useParams();
  const router = useRouter();

  // Handle follow/unfollow action
  const handleFollow = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    try {
      const session = await getSession();
      const emailUser = session?.user?.email;

      if (!emailUser) {
        toast.error("You must be logged in to follow.");
        return;
      }

      const response = await axios.post(`/api/users/AddFollow`, {
        FollowByEmail: emailUser,
        AccountId: formData.id,
      });

      if (response.status === 200 && response.data.success) {
        const { action } = response.data; // "follow" or "unfollow"
        const updatedFollowCount =
          action === "follow" ? formData.follow + 1 : formData.follow - 1;

        setFormData((prev) => ({
          ...prev,
          follow: updatedFollowCount,
        }));
        setIsFollowing(action === "follow");

        toast.success(
          action === "follow"
            ? "You followed this profile!"
            : "You unfollowed this profile."
        );
      } else {
        toast.error(response.data.message || "Failed to update follow state.");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "An error occurred while following."
      );
    } finally {
      setLoading(false);
    }
  }, [loading, formData.id, formData.follow]);

  // Check if the current user owns the profile
  useEffect(() => {
    const checkOwnAccount = async () => {
      try {
        const session = await getSession();
        const loggedInEmail = session?.user?.email;

        if (loggedInEmail) {
          setIsOwnAccount(formData.email === loggedInEmail);
        } else {
          toast.error("Unable to retrieve session information.");
        }
      } catch (error) {
        toast.error("An error occurred while checking the account.");
      }
    };

    if (formData.email) {
      checkOwnAccount();
    }
  }, [formData.email]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await axios.post(`/api/users/searchProfile`, {
          id: IdUser,
        });

        if (response.status === 200) {
          const {
            _id,
            Name,
            Email,
            Gender,
            Follow,
            Age,
            isUserFollowing,
            profileImage,
          } = response.data.user;

          setFormData({
            id: _id,
            name: Name,
            email: Email,
            gender: Gender || "Unknown",
            follow: Follow || 0,
            age: Age || null,
            profileImage: profileImage || "",
          });
          setIsFollowing(isUserFollowing);
        } else {
          toast.error("Could not find the account.");
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load profile.");
      }
    };

    if (IdUser) {
      fetchProfileData();
    }
  }, [IdUser]);

  return (
    <>
      <Toaster />
      <div className="flex flex-col items-center bg-white shadow-lg rounded-lg p-10 my-40 max-w-7xl mx-auto">
        {isOwnAccount ? (
          <h4 className="text-xl font-bold">This is Your Profile</h4>
        ) : (
          <h4>Account</h4>
        )}
        <img
          src={
            formData.profileImage ||
            "https://cdn-icons-png.flaticon.com/512/8345/8345328.png"
          }
          alt="Profile avatar"
          className="w-40 h-40 rounded-full shadow-md object-cover"
        />
        <div className="text-center mt-6">
          <h1 className="text-3xl font-semibold text-gray-800 mb-2">
            {formData.name || "Guest"}
          </h1>
          <h2 className="text-2xl p-2 text-gray-600">
            {formData.email || "Not provided"}
          </h2>
          <ul>
            <li>Age: {formData.age || "Unknown"}</li>
            <li>Gender: {formData.gender}</li>
          </ul>
        </div>
        <div className="mt-4 flex flex-col items-center">
          <p className="text-xl text-gray-600">
            Followers:{" "}
            <span className="font-bold text-gray-800">{formData.follow}</span>
          </p>
          {isOwnAccount ? (
            <p className="text-lg font-bold p-2">You cannot follow yourself</p>
          ) : (
            <button
              className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md shadow-lg transition-all duration-200 disabled:opacity-50"
              onClick={handleFollow}
              disabled={loading}
            >
              {loading ? "Processing..." : isFollowing ? "Unfollow" : "Follow"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
