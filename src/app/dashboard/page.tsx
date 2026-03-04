"use client";

import { useEffect, useState, useCallback } from "react";
import { useElysiaSession } from "../libs/hooks/useElysiaSession";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Users as UsersIcon,
  Settings,
  LogOut,
  UserCircle,
  Pencil,
  Trash2,
  ExternalLink,
  Plus,
  Search,
} from "lucide-react";

interface User {
  _id: string;
  Name: string;
  Email: string;
}

interface Post {
  _id: string;
  Title: string;
  Content: string;
}

export default function DashboardPage() {
  const { data: session } = useElysiaSession();
  const [usersAccounts, setUsersAccounts] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "posts">("users");


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, postsRes] = await Promise.all([
        axios.get("/api/users/getUsers"),
        axios.get("/api/posts/fetchPosts")
      ]);

      setUsersAccounts(usersRes.data.users || []);
      setPosts(postsRes.data.posts || []);
    } catch (error) {
      toast.error("Failed to sync dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);



  const handleDelete = async (type: 'user' | 'post', id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const url = type === 'user' ? `/api/users/deleteUser/${id}` : `/api/posts/deletePost/${id}`;
      await axios.delete(url);
      toast.success(`${type} deleted successfully`);
      fetchData();
    } catch (error) {
      toast.error(`Failed to delete ${type}`);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-950 text-white flex flex-col fixed h-full z-20 shadow-2xl">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-500 p-2 rounded-xl shadow-lg shadow-indigo-500/30">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">CoreAdmin</span>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${activeTab === 'users' ? 'bg-white/10 text-white shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <UsersIcon size={20} />
              <span className="font-medium">User Directory</span>
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${activeTab === 'posts' ? 'bg-white/10 text-white shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <FileText size={20} />
              <span className="font-medium">Content Manager</span>
            </button>
            <div className="pt-4 mt-4 border-t border-white/5">
              <NavItem href="/dashboard/settings" icon={<Settings size={20} />} label="System Settings" />
            </div>
          </nav>
        </div>

        <div className="mt-auto p-6">
          <button className="flex items-center gap-3 w-full p-4 text-red-400 hover:bg-red-400/10 rounded-2xl transition-all font-semibold">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ml-72 flex-1 p-10">
        <header className="flex justify-between items-start mb-12">
          <div>
            <h2 className="text-4xl font-black text-slate-900 mb-2 capitalize">
              {activeTab} Management
            </h2>
            <p className="text-slate-500 font-medium">
              Update, monitor, and moderate your platform {activeTab}.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/dashboard/createAccount" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95">
              <Plus size={18} />
              Create New
            </Link>

            <div className="h-12 w-[1px] bg-slate-200 mx-2" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{session?.user?.name || "Admin"}</p>
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Superuser</p>
              </div>
              <div className="w-12 h-12 bg-slate-200 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                <img src={`https://ui-avatars.com/api/?name=${session?.user?.name}&background=6366f1&color=fff`} alt="avatar" />
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-white rounded-3xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {activeTab === 'users' ? (
              usersAccounts.map((user) => (
                <UserCard key={user._id} user={user} onDelete={() => handleDelete('user', user._id)} />
              ))
            ) : (
              posts.map((post) => (
                <PostCard key={post._id} post={post} onDelete={() => handleDelete('post', post._id)} />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* HELPER COMPONENTS */

function UserCard({ user, onDelete }: { user: User; onDelete: () => void }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link href={`/dashboard/users/edit/${user._id}`} className="p-2.5 bg-white shadow-lg rounded-xl text-slate-600 hover:text-indigo-600 transition-colors">
          <Pencil size={16} />
        </Link>
        <button onClick={onDelete} className="p-2.5 bg-white shadow-lg rounded-xl text-slate-600 hover:text-red-600 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
          <UserCircle className="w-10 h-10 text-indigo-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">{user.Name}</h3>
        <p className="text-slate-400 text-sm mb-6">{user.Email}</p>

        <Link
          href={`/profileAccount/${user._id}`}
          className="w-full py-3 bg-slate-50 text-slate-600 rounded-2xl text-sm font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
        >
          View Full Profile <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  );
}

function PostCard({ post, onDelete }: { post: Post; onDelete: () => void }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <FileText size={24} />
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/posts/edit/${post._id}`} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <Pencil size={18} />
            </Link>
            <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">{post.Title}</h3>
        <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed mb-6">{post.Content}</p>
      </div>

      <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
        <span>Draft Mode</span>
        <span className="text-indigo-500">Post ID: {post._id.slice(-4)}</span>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}