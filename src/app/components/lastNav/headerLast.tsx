"use client";
import React from "react";
import Link from "next/link";

export default function LastNav() {
  return (
    <>
      <footer className="bg-white rounded-lg fixed  bottom-0 left-0 w-full shadow-sm  dark:bg-gray-800">
        <div className="w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-between">
          <ul className="flex flex-wrap items-center mt-3 text-sm font-medium text-gray-500 dark:text-gray-400 sm:mt-0">
            <li>
              <Link
                className="hover:scale-110 p-2 hover:bg-red-600 rounded-lg"
                href={"/about"}
              >
                Contact
              </Link>
            </li>

            <li>
              <Link
                className="hover:scale-110 p-2 hover:bg-red-600 rounded-lg"
                href={"https://github.com/abdodolh14141/Social-Media"}
                target="_blank"
              >
                Sourse Code
              </Link>
            </li>
            <li>
              <Link
                className="hover:scale-110 p-2 hover:bg-red-600 rounded-lg"
                href={"https://www.instagram.com/just_dolh/"}
                target="_blank"
              >
                Instagram
              </Link>
            </li>
          </ul>
        </div>
      </footer>
    </>
  );
}
