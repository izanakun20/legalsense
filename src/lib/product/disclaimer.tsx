import React from "react";

export const DISCLAIMER_TEXT = "LegalSense provides AI-assisted analysis, not formal legal counsel. Data is never used for training.";

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      {DISCLAIMER_TEXT}
    </span>
  );
}
