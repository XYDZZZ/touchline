"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const PALETTE = [
  "bg-emerald-700",
  "bg-rose-700",
  "bg-amber-700",
  "bg-teal-800",
  "bg-red-800",
  "bg-stone-700",
  "bg-orange-800",
  "bg-lime-800",
];

function hashString(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface TeamLogoProps {
  name: string;
  logoUrl?: string | null;
  short?: string | null;
  size?: number;
  className?: string;
}

/** Renders a team crest from a public URL; if the URL fails, degrades
 *  gracefully to a colored initials badge instead of a broken image. */
export function TeamLogo({ name, logoUrl, short, size = 24, className }: TeamLogoProps) {
  const [broken, setBroken] = useState(false);

  if (broken || !logoUrl) {
    return (
      <span
        aria-label={name}
        style={{ width: size, height: size, fontSize: Math.max(8, Math.round(size * 0.38)) }}
        className={cn(
          "inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold tracking-tight text-white",
          PALETTE[hashString(name) % PALETTE.length],
          className
        )}
      >
        {(short ?? name.slice(0, 3)).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${name} crest`}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setBroken(true)}
      style={{ width: size, height: size }}
      className={cn("shrink-0 rounded-sm object-contain", className)}
    />
  );
}
