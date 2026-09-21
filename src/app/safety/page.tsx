import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Safety & Limits | LegalSense",
  description: "Safety and limits of LegalSense AI.",
};

export default function SafetyPage() {
  return (
    <div className="flex flex-col font-sans">
      <div className="flex-1 w-full max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-serif text-[40px] text-primary mb-8 tracking-tight">Safety & Limits</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="font-serif text-[24px] text-foreground mb-4">No Legal Advice</h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              LegalSense provides AI-assisted synthesis for navigational and editorial review only. It does not constitute formal legal counsel or statutory warranty. Always consult a licensed attorney for your situation.
            </p>
          </section>
          
          <section>
            <h2 className="font-serif text-[24px] text-foreground mb-4">AI Processing</h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Analysis is performed using Google&apos;s Gemini LLM. As an AI model, it may produce hallucinations or incomplete analysis. All generated content must be reviewed carefully.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
