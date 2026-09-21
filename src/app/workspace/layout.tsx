"use client";

import React from "react";
import Link from "next/link";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-sans">
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-background/90 backdrop-blur-md shadow-sm border-b border-border">
        <div className="h-20 w-full px-8 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-serif text-[20px] font-semibold text-primary tracking-tight">LegalSense</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 ml-4">
              <Link href="/how-it-works" className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors">How it works</Link>
              <Link href="/safety" className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors">Safety & Guardrails</Link>
              <Link href="/privacy" className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[15px] font-medium text-muted-foreground hover:text-foreground px-4 py-2 hover:bg-muted rounded-md transition-colors">Documentation</Link>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-2">
              <span className="material-symbols-outlined text-primary-foreground text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-20">
        <aside className="hidden md:flex fixed left-0 top-20 bottom-0 w-64 bg-muted/30 border-r border-border z-40 flex-col justify-between py-6">
          <div className="px-4">
            <span className="px-2 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Analysis Workspace</span>
            <nav className="space-y-1">
              <Link 
                href="/workspace"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors min-h-[44px] bg-background border border-border shadow-sm text-primary font-semibold`}
              >
                <span className="material-symbols-outlined text-[20px]">description</span>
                Annotated Review
              </Link>
              <button 
                type="button"
                className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors min-h-[44px] text-muted-foreground hover:text-foreground hover:bg-muted/50 opacity-60 cursor-not-allowed`}
                title="Coming Soon"
              >
                <span className="material-symbols-outlined text-[20px]">rule</span>
                Clause Breakdown
              </button>
              <button 
                type="button"
                className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors min-h-[44px] text-muted-foreground hover:text-foreground hover:bg-muted/50 opacity-60 cursor-not-allowed`}
                title="Coming Soon"
              >
                <span className="material-symbols-outlined text-[20px]">shield</span>
                Risk Matrix
              </button>
            </nav>
          </div>
          <div className="px-4">
            <div className="p-4 rounded-lg bg-background border border-border shadow-sm">
              <span className="text-[12px] font-semibold text-primary block mb-1">Model Engine</span>
              <span className="text-[13px] text-muted-foreground block">Precision Legal LLM v4.2 • Active</span>
            </div>
          </div>
        </aside>

        <main className="md:ml-64 flex-1 w-full relative min-h-[calc(100vh-5rem)] overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
