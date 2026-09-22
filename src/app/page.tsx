import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import { buttonVariants } from '@/components/ui/button';
import { Eye, ArrowRight } from 'lucide-react';
import { FolioWrapper } from '@/components/FolioWrapper';

export default function LandingPage() {
  return (
    <div className="flex flex-col font-sans">
      <main className="flex-1 w-full">
        <section className="max-w-[1280px] mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-12 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-muted-foreground text-[12px] uppercase tracking-[0.12em] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span>Editorial Legal Intelligence</span>
          </div>
          <h1 className="font-serif text-[42px] sm:text-[56px] md:text-[68px] leading-[1.08] tracking-[-0.03em] text-foreground max-w-4xl text-balance font-normal mb-6">
            Contracts written for lawyers. <br />
            <span className="italic font-light text-foreground/80">Translated for you.</span>
          </h1>
          <p className="text-[16px] md:text-[18px] text-muted-foreground max-w-xl font-normal leading-relaxed text-balance mb-8">
            LegalSense highlights clauses that deserve a closer look, clarifies obligations in plain English, and prepares calibrated questions for your licensed attorney.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[13.5px]">
            <a href="#folio" className={buttonVariants({ size: "lg", className: "rounded-full shadow-sm flex items-center gap-2" })}>
              <Eye aria-hidden="true" className="w-[18px] h-[18px]" />
              <span>Explore The Folio</span>
            </a>
            <Link href="/workspace" className={buttonVariants({ variant: "secondary", size: "lg", className: "rounded-full shadow-sm flex items-center gap-2" })}>
              <span>Test Instant Clarity</span>
              <ArrowRight aria-hidden="true" className="text-muted-foreground w-[16px] h-[16px]" />
            </Link>
          </div>
        </section>

        <FolioWrapper />
      </main>
    </div>
  );
}
