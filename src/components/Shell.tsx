import * as React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Disclaimer } from "@/lib/product/disclaimer";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-background focus:text-foreground focus:outline-ring"
      >
        Skip to main content
      </a>

      <header role="banner" className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center mx-auto px-4 sm:px-8">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-serif font-bold text-lg text-primary tracking-tight">LegalSense</span>
            </Link>
            <nav role="navigation" aria-label="Main Navigation" className="flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/workspace"
                className="transition-colors hover:text-foreground/80 text-foreground"
              >
                Workspace
              </Link>
              <Link
                href="/how-it-works"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                How it Works
              </Link>
            </nav>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main-content" role="main" className="flex-1 w-full mx-auto">
        {children}
      </main>

      <footer role="contentinfo" className="border-t border-border bg-background py-6 md:py-8">
        <div className="container mx-auto px-4 sm:px-8 flex flex-col items-center justify-center gap-4">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            <Disclaimer />
          </p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <Link href="/safety" className="hover:underline underline-offset-4">Safety & Limits</Link>
            <Link href="/privacy" className="hover:underline underline-offset-4">Privacy</Link>
            <Link href="/accessibility" className="hover:underline underline-offset-4">Accessibility</Link>
          </div>
        </div>
      </footer>
      
      {/* Global polite region for announcements */}
      <div aria-live="polite" id="global-announcer" className="sr-only" role="status"></div>
    </div>
  );
}
