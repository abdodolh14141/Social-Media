"use client";

import { useElysiaSession } from "@/app/libs/hooks/useElysiaSession";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, User, Mail, Save, Loader2 } from "lucide-react";

export default function EditUserPage() {
  const { data: session, status: sessionStatus } = useElysiaSession();
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({ name: "", email: "" });

  // 1. Fetch User Data
  const { data: userData, isLoading, isError } = useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const res = await axios.get(`/api/users/getUser/${id}`);
      return res.data.user;
    },
    enabled: !!id && sessionStatus === "authenticated",
  });

  // Sync form data when user data is fetched
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.Name || "",
        email: userData.Email || "",
      });
    }
  }, [userData]);

  // 2. Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: { name: string; email: string }) => {
      return axios.put(`/api/admin/edit/${id}`, payload);
    },
    onSuccess: (data) => {
      toast.success(data.data.message || "User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      router.push(`/dashboard/users`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Update failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return toast.error("Please fill in all fields");
    updateMutation.mutate(formData);
  };

  // Loading State
  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="mt-4 text-gray-500 font-medium">Loading user profile...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100">
          <p className="text-red-600 font-semibold">User not found or error loading data.</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-red-700 underline">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-8 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Directory</span>
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700" />

          <div className="px-8 pb-8">
            {/* Avatar Stack */}
            <div className="relative -mt-12 mb-6 flex items-end gap-4">
              <div className="w-24 h-24 bg-white p-1 rounded-2xl shadow-md">
                <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                  <User size={40} />
                </div>
              </div>
              <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{userData?.Name || "Edit User"}</h1>
                <p className="text-sm text-gray-500 font-medium">User ID: {id?.toString().slice(-8)}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Input */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <User size={16} className="text-gray-400" />
                    Full Name
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    type="text"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <Mail size={16} className="text-gray-400" />
                    Email Address
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    type="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex items-center justify-between gap-4">
                <div className="text-xs text-gray-400 max-w-[200px]">
                  Updating this information will affect the user's login credentials and profile display.
                </div>

                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-blue-200"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}