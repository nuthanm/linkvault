"use client";

import Link from "next/link";

type User = { id: string; name: string; mobile_number: string };

export default function AccountMenu({ user }: { user: User }) {
  const initials = user.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <Link
      href="/account"
      className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center hover:bg-blue-200 transition-colors ring-2 ring-transparent hover:ring-blue-300"
      title="Account settings"
      aria-label="Account settings"
    >
      {initials}
    </Link>
  );
}
