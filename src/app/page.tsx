"use client";

import { useState } from "react";
import { DocumentInput } from "@/components/DocumentInput";
import { DocumentAnalysis } from "@/components/DocumentAnalysis";

export default function Home() {
  const [parsedText, setParsedText] = useState<string | null>(null);

  return (
    <main className="min-h-screen p-8 md:p-24 bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Legal Document Assistant</h1>
          <p className="text-lg text-muted-foreground">
            Understand, compare, and navigate legal documents.
          </p>
          {/* DISCLAIMER MUST BE ON EVERY OUTPUT SURFACE */}
          <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-4 rounded-md text-amber-900 dark:text-amber-200 text-sm font-medium">
            <strong>Disclaimer:</strong> This is general information, not legal advice. Consult a licensed attorney for your situation.
          </div>
        </div>

        {!parsedText ? (
          <DocumentInput onParse={setParsedText} />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Document Analysis</h2>
              <button 
                onClick={() => setParsedText(null)}
                className="text-sm underline text-muted-foreground hover:text-foreground"
              >
                Upload a Different Document
              </button>
            </div>
            <DocumentAnalysis documentText={parsedText} />
          </div>
        )}
      </div>
    </main>
  );
}
