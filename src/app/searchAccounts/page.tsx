"use client";

import { getSession } from "next-auth/react";
import { toast, Toaster } from "sonner";
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import debounce from "lodash.debounce";
import { motion, AnimatePresence } from "framer-motion";

interface Account {
  _id: string;
  Name: string;
  Email: string;
}

export default function SearchAccount() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search logic
  const debouncedSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      try {
        const { data } = await axios.post("/api/users/searchUsers", {
          name: searchTerm.trim(),
        });

        const users = data.user || [];
        setSearchResults(users);
        setHasSearched(true);

        if (users.length === 0) {
          toast.info("No accounts matched your search.");
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    setSearchResults([]);
    setHasSearched(false);
    debouncedSearch.cancel();
  };

  // Pre-fill with session name if available
  useEffect(() => {
    const initSession = async () => {
      const session = await getSession();
      if (session?.user?.name) {
        setQuery(session.user.name);
        debouncedSearch(session.user.name);
      }
    };
    initSession();
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Toaster position="top-center" richColors />

      <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
        <header className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Find People</h2>
          <p className="text-gray-400">Search for users by name or nickname</p>
        </header>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-gray-500 text-xl">🔍</span>
          </div>

          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search accounts..."
            className="w-full bg-gray-900 border border-gray-700 rounded-xl py-4 pl-12 pr-12 text-white text-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />

          {query && (
            <button
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Indicators */}
        <div className="h-6 mt-2 text-center">
          {loading && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-blue-400 text-sm animate-pulse"
            >
              Searching the database...
            </motion.p>
          )}
        </div>

        {/* Results Section */}
        <div className="mt-6">
          <AnimatePresence>
            {searchResults.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider ml-1">
                  Results ({searchResults.length})
                </h3>
                <ul className="grid gap-3">
                  {searchResults.map((account) => (
                    <Link
                      href={`/ProfileUser/${account._id}`}
                      key={account._id}
                      className="group"
                    >
                      <li className="flex items-center p-4 bg-gray-900 border border-gray-700 rounded-xl hover:border-blue-500 hover:bg-gray-800 transition-all cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                          {account.Name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <p className="text-white font-medium text-lg">
                            {account.Name}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {account.Email}
                          </p>
                        </div>
                        <div className="ml-auto text-gray-600 group-hover:text-blue-400 transition">
                          ➜
                        </div>
                      </li>
                    </Link>
                  ))}
                </ul>
              </motion.div>
            ) : (
              hasSearched &&
              !loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-10"
                >
                  <p className="text-gray-500 text-lg">
                    No accounts found for "{query}"
                  </p>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
