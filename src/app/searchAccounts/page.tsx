"use client";

import { getSession } from "next-auth/react";
import { toast, Toaster } from "sonner";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import debounce from "lodash.debounce";

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

  // Use a ref for the debounced function to prevent unnecessary re-renders
  const debouncedSearch = useRef(
    debounce(async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch("/api/users/searchUsers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: searchTerm.trim() }),
        });

        const data = await response.json();

        if (response.ok && data.user) {
          setSearchResults(data.user);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        toast.error("Failed to fetch accounts. Please try again.");
      } finally {
        setLoading(false);
        setHasSearched(true);
      }
    }, 400)
  ).current;

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Toaster position="top-center" />

      <div className="bg-white rounded-2xl shadow-sm border p-8">
        <header className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Find Accounts</h2>
          <p className="text-gray-500 mt-2">
            Search for users by name or email
          </p>
        </header>

        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            value={query}
            placeholder="Search by name..."
            onChange={handleInputChange}
            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-lg"
          />
          {loading && (
            <div className="absolute right-4 top-3.5">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        <div className="mt-10">
          {searchResults.length > 0 ? (
            <div className="grid gap-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Results
              </h3>
              {searchResults.map((account) => (
                <Link
                  href={`/ProfileUser/${account._id}`}
                  key={account._id}
                  className="group flex items-center p-4 rounded-xl border border-transparent bg-gray-50 hover:bg-blue-50 hover:border-blue-100 transition-all"
                >
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl mr-4 group-hover:scale-110 transition-transform">
                    {account.Name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {account.Name}
                    </h4>
                    <p className="text-sm text-gray-500">{account.Email}</p>
                  </div>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          ) : hasSearched && !loading ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-lg">
                No accounts found for "{query}"
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
