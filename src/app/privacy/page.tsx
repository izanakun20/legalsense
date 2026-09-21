import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & Data Handling | LegalSense",
  description: "How we handle your data.",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col font-sans">
      <div className="flex-1 w-full max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-serif text-[40px] text-primary mb-8 tracking-tight">Privacy & Data Handling</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="font-serif text-[24px] text-foreground mb-4">Session-Only Storage</h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Document text lives only in application memory for the duration of your session. We do not use localStorage, sessionStorage, IndexedDB, or cookies to persist your document content.
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-[24px] text-foreground mb-4">Preferences</h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Only your UI theme preference (light, dark, or system) may be persisted across sessions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
