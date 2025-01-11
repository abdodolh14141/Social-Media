"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { signOut } from "next-auth/react";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";

export default function Logout() {
  return (
    <button
      className="flex items-center gap-3 bg-red-600 border rounded-lg cursor-pointer p-2 px-2 shadow hover:shadow-gray-950 hover:bg-red-700"
      onClick={() => signOut()}
    >
      <span className="font-bold">Logout</span>
      <FontAwesomeIcon icon={faRightFromBracket} />{" "}
    </button>
  );
}
