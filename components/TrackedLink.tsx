"use client";

import Link from "next/link";
import { trackUmamiEvent } from "@/lib/umami";

interface TrackedLinkProps {
  href: string;
  className?: string;
  eventName: string;
  eventPayload?: Record<string, string | number | boolean | null>;
  children: React.ReactNode;
}

export function TrackedLink({
  href,
  className,
  eventName,
  eventPayload,
  children,
}: TrackedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        trackUmamiEvent(eventName, eventPayload);
      }}
    >
      {children}
    </Link>
  );
}
