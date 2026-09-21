import React from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col font-sans min-h-[60vh] items-center justify-center text-center px-6">
      <h1 className="font-serif text-[64px] text-primary mb-4 tracking-tight">404</h1>
      <h2 className="font-serif text-[24px] text-foreground mb-6">Page Not Found</h2>
      <p className="text-[15px] leading-relaxed text-muted-foreground max-w-md mb-8">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className={buttonVariants()}>
        Return Home
      </Link>
    </div>
  );
}
