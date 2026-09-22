import React from "react";

export const DISCLAIMER_TEXT = "This is general information, not legal advice. Consult a licensed attorney for your situation.";

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      {DISCLAIMER_TEXT}
    </span>
  );
}
