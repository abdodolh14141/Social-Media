"use client";

import { toast, Toaster } from "sonner";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import debounce from "lodash.debounce";
import { Search, ChevronRight, Loader2, X } from "lucide-react";

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

  const abortControllerRef = useRef<AbortController | null>(null);

  // The actual search logic
  const debouncedSearch = useMemo(
    () =>
      debounce(async (searchTerm: string) => {
        const trimmed = searchTerm.trim();

        if (!trimmed || trimmed.length < 2) {
          setSearchResults([]);
          setHasSearched(false);
          setLoading(false);
          return;
        }

        // Cancel previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
          const res = await fetch("/api/users/searchUsers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: trimmed }),
            signal: abortControllerRef.current.signal,
          });

          const data = await res.json();
          if (res.ok && Array.isArray(data.user)) {
            setSearchResults(data.user);
          } else {
            setSearchResults([]);
          }
        } catch (error: any) {
          if (error.name !== "AbortError") {
            toast.error("Search failed. Check your connection.");
          }
        } finally {
          setLoading(false);
          setHasSearched(true);
        }
      }, 250), // 250ms is the sweet spot for responsiveness
    [],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
      abortControllerRef.current?.abort();
    };
  }, [debouncedSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // WAKE UP: Set loading true immediately so the UI feels responsive
    if (value.trim().length >= 2) {
      setLoading(true);
      debouncedSearch(value);
    } else {
      setLoading(false);
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4">
      <Toaster position="top-center" richColors />

      <form onSubmit={(e) => e.preventDefault()} className="relative group">
        <div className="relative">
          <input
            type="text"
            autoComplete="off"
            value={query}
            placeholder="Search accounts..."
            onChange={handleInputChange}
            className="w-full pl-12 text-white pr-12 py-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-blue-500 shadow-lg outline-none transition-all"
          />

          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />

          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            )}
            {loading && (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            )}
          </div>
        </div>
      </form>

      {/* Results area with min-height to prevent layout shift */}
      <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto rounded-xl min-h-[100px]">
        {searchResults.map((account) => (
          <Link
            href={`/profileAccount/${account._id}`}
            key={account._id}
            className="flex items-center p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl transition-all active:scale-[0.98] shadow-sm"
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold mr-3">
              {account.Name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {account.Name}
              </p>
              <p className="text-xs text-zinc-500 truncate">{account.Email}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-400" />
          </Link>
        ))}

        {hasSearched && !loading && searchResults.length === 0 && (
          <div className="p-8 text-center text-zinc-500 italic bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
            No accounts found for "{query}"
          </div>
        )}
      </div>
    </div>
  );
}
