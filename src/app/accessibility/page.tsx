import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility | LegalSense",
  description: "Accessibility statement and commitment.",
};

export default function AccessibilityPage() {
  return (
    <div className="flex flex-col font-sans">
      <div className="flex-1 w-full max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-serif text-[40px] text-primary mb-8 tracking-tight">Accessibility</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="font-serif text-[24px] text-foreground mb-4">Our Commitment</h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              LegalSense is designed to meet WCAG 2.2 AA standards. We are committed to ensuring our platform is accessible to everyone.
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-[24px] text-foreground mb-4">Features</h2>
            <ul className="list-disc pl-5 space-y-2 text-[15px] leading-relaxed text-muted-foreground">
              <li>Semantic HTML5 landmarks and skip links for screen readers.</li>
              <li>Full keyboard operability for interactive elements.</li>
              <li>Respect for operating system reduced motion preferences.</li>
              <li>Sufficient color contrast ratios for text and UI components.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
