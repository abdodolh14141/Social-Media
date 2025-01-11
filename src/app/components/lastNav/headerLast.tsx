"use client";
import React from "react";
import Link from "next/link";

export default function LastNav() {
  return (
    <>
      <div className="bg-slate-800 p-1 fixed  bottom-0 left-0 w-full shadow-lg">
        <nav className="flex items-center gap-5 justify-around">
          <Link
            className="hover:scale-110 p-2 hover:bg-red-600 rounded-lg"
            href={"/about"}
          >
            Contact
          </Link>
          <Link
            className="hover:scale-110 p-2 hover:bg-red-600 rounded-lg"
            href={"https://github.com/abdodolh14141/Social-Media"}
          >
            Sourse Code
          </Link>
          <Link
            className="hover:scale-110 p-2 hover:bg-red-600 rounded-lg"
            href={"https://www.instagram.com/just_dolh/"}
          >
            Instagram
          </Link>
        </nav>
      </div>
    </>
  );
}
