import React from "react";
import { AiOutput } from "@/components/AiOutput";
import { USE_CASES } from "@/lib/product/use-cases";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How it Works | LegalSense",
  description: "Learn how LegalSense uses AI to synthesize legal documents.",
};

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col font-sans">
      <div className="flex-1 w-full max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-serif text-[40px] text-primary mb-8 tracking-tight">How it Works</h1>
        
        <AiOutput className="mb-12">
          <div className="space-y-10">
            {USE_CASES.map((useCase) => (
              <section key={useCase.id}>
                <h2 className="font-serif text-[24px] text-foreground mb-4">{useCase.title}</h2>
                <p className="text-[15px] leading-relaxed text-muted-foreground">
                  {useCase.description}
                </p>
              </section>
            ))}
          </div>
        </AiOutput>
      </div>
    </div>
  );
}
