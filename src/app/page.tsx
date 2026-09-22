"use client";

import React, { useState } from 'react';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { AlertTriangle, Clock, DollarSign, Eye, ArrowRight, Focus, MessageCircle, Scale, Lock } from 'lucide-react';

export default function LandingPage() {
  const [activeClause, setActiveClause] = useState<'sublet' | 'autorenew' | 'cleaning'>('sublet');

  const folioData = {
    sublet: {
      docName: "Residential_Lease_Agreement_2025.pdf",
      sectionNum: "Section 14 • General Covenants",
      title: "14.2 Subletting, Assignment & Licensure",
      verbatim: (
        <>
          “Tenant shall not assign, sublet, or license said premises without the <span className="bg-secondary/15 text-foreground font-medium px-1 rounded">express prior written consent of Landlord</span>, which consent may be withheld in Landlord’s <span className="bg-destructive/15 text-destructive font-medium px-1 rounded underline decoration-destructive/40">sole and absolute discretion</span> for any cause or without cause.”
        </>
      ),
      riskBadge: (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive bg-destructive/10 px-2.5 py-0.5 rounded-full">
          <AlertTriangle aria-hidden="true" className="w-[13px] h-[13px]" />
          <span>Unilateral Discretion</span>
        </span>
      ),
      plainEnglish: (
        <>You cannot let a friend, subletter, or replacement roommate take over without written sign-off, and the landlord has the legal power to say no for <em>any reason</em>, or without giving a reason at all.</>
      ),
      attorneyQuestion: `“Can we strike ‘sole and absolute discretion’ and replace it with ‘consent shall not be unreasonably withheld, delayed, or conditioned’?”`,
      statute: `Under NY Real Property Law § 226-b, tenants in dwellings of 4+ units hold statutory rights to sublease with reasonable notice.`
    },
    autorenew: {
      docName: "Commercial_SaaS_Service_Master.pdf",
      sectionNum: "Section 9 • Term & Expiration",
      title: "9.3 Automatic Renewal & Termination Notice",
      verbatim: (
        <>
          “This Agreement shall <span className="bg-destructive/15 text-destructive font-medium px-1 rounded underline decoration-destructive/40">automatically renew for consecutive twelve (12) month periods</span> unless Customer delivers written notice of non-renewal not less than <span className="bg-secondary/15 text-foreground font-medium px-1 rounded">ninety (90) days prior</span> to the end of the current term.”
        </>
      ),
      riskBadge: (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400 px-2.5 py-0.5 rounded-full">
          <Clock aria-hidden="true" className="w-[13px] h-[13px]" />
          <span>Trap Window: 90 Days</span>
        </span>
      ),
      plainEnglish: `If you miss the narrow cancelation window 3 months before your contract year ends, you are locked in for another full year with zero option for an early exit.`,
      attorneyQuestion: `“Can we shorten the advance notice requirement to 30 days, or insert a mandatory reminder clause 15 days before the deadline?”`,
      statute: `Several states (including CA & NY Gen. Oblig. Law § 5-903) enforce statutory restrictions requiring prior written reminder notices before auto-renewals trigger.`
    },
    cleaning: {
      docName: "Standard_Tenancy_Addendum_2025.pdf",
      sectionNum: "Section 6 • Security Deposits",
      title: "6.4 Mandatory Professional Cleaning Surcharge",
      verbatim: (
        <>
          “Upon surrender, Landlord shall <span className="bg-destructive/15 text-destructive font-medium px-1 rounded underline decoration-destructive/40">automatically deduct a flat fee of $650</span> from the Security Deposit for professional steam-cleaning and sanitization, <span className="bg-secondary/15 text-foreground font-medium px-1 rounded">irrespective of the actual cleanliness</span> or broom-clean condition of the demised premises.”
        </>
      ),
      riskBadge: (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive bg-destructive/10 px-2.5 py-0.5 rounded-full">
          <DollarSign aria-hidden="true" className="w-[13px] h-[13px]" />
          <span>Unlawful Nonrefundable Fee</span>
        </span>
      ),
      plainEnglish: `The landlord plans to pocket $650 of your deposit for carpet cleaning even if you scrub the apartment spotless before returning the keys.`,
      attorneyQuestion: `“Does this non-refundable mandatory cleaning deduction violate the state statutory cap that deposits may only cover repairs beyond ordinary wear and tear?”`,
      statute: `Most jurisdictions mandate that security deposits can only be withheld for damages beyond reasonable wear and tear, rendering automatic cleaning fees questionable.`
    }
  };



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

        <section id="folio" className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-12 pb-24">
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-6">
            <span className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground mr-2 font-medium">Active Sample:</span>
            <button 
              className={`text-[13px] font-medium px-4 py-1.5 rounded-full border transition-all ${activeClause === 'sublet' ? 'bg-primary text-primary-foreground border-transparent' : 'bg-card text-muted-foreground hover:text-foreground hover:bg-background border-border'}`}
              onClick={() => setActiveClause('sublet')}
            >
              1. Subletting Discretion
            </button>
            <button 
              className={`text-[13px] font-medium px-4 py-1.5 rounded-full border transition-all ${activeClause === 'autorenew' ? 'bg-primary text-primary-foreground border-transparent' : 'bg-card text-muted-foreground hover:text-foreground hover:bg-background border-border'}`}
              onClick={() => setActiveClause('autorenew')}
            >
              2. Automatic 12-Month Roll
            </button>
            <button 
              className={`text-[13px] font-medium px-4 py-1.5 rounded-full border transition-all ${activeClause === 'cleaning' ? 'bg-primary text-primary-foreground border-transparent' : 'bg-card text-muted-foreground hover:text-foreground hover:bg-background border-border'}`}
              onClick={() => setActiveClause('cleaning')}
            >
              3. Mandatory Cleaning Deductions
            </button>
          </div>

          <div className="relative bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="border-b border-border px-6 py-3 bg-muted/50 flex items-center justify-between text-[12px] font-medium text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary/80"></span>
                <span className="uppercase tracking-widest text-foreground font-semibold">{folioData[activeClause].docName}</span>
                <span className="text-muted-foreground/80">/ Page 4, Section 14</span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground/80">
                <span className="hidden sm:inline">Anchor: Verbatim Line 14.2</span>
                <span className="px-2 py-0.5 rounded bg-card border border-border text-[11px] text-secondary font-semibold uppercase tracking-wider">Lens Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
              <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-border flex flex-col justify-between relative bg-card">
                <div>
                  <div className="flex items-center justify-between text-muted-foreground/80 text-[11px] uppercase tracking-[0.18em] mb-4">
                    <span>{folioData[activeClause].sectionNum}</span>
                    <span>Original Enactment</span>
                  </div>
                  <h2 className="font-serif text-[24px] md:text-[28px] text-foreground font-normal tracking-tight mb-5">
                    {folioData[activeClause].title}
                  </h2>
                  <p className="font-serif text-[15px] md:text-[16px] text-muted-foreground leading-[1.8] mb-6">
                    14.1. The Tenant covenants to use and occupy the Demised Premises exclusively as a private dwelling for said Tenant, and for no other purpose without prior written authorization.
                  </p>

                  <div className="relative my-4 p-5 md:p-6 rounded-xl bg-secondary/5 shadow-sm shadow-secondary/20 ring-1 ring-inset ring-secondary/20 transition-all duration-300">
                    <div className="absolute -left-1 top-4 bottom-4 w-1 bg-secondary rounded-full"></div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-secondary uppercase tracking-[0.14em] flex items-center gap-1.5">
                        <Focus aria-hidden="true" className="w-[15px] h-[15px]" />
                        Clarity Lens Highlight
                      </span>
                      <span className="text-[11px] text-muted-foreground/80">Verbatim Extract</span>
                    </div>
                    <p className="font-serif text-[16px] md:text-[17.5px] text-foreground leading-[1.75]">
                      {folioData[activeClause].verbatim}
                    </p>
                  </div>

                  <p className="font-serif text-[14px] md:text-[15px] text-muted-foreground/70 leading-[1.8] mt-4">
                    14.3. Any sublet attempted contrary to this section shall be void ab initio and confer no rights upon any occupant or third party...
                  </p>
                </div>
                <div className="pt-8 flex items-center justify-between text-[12px] text-muted-foreground">
                  <span>Standard Form Document • New York Jurisdiction</span>
                  <span className="text-muted-foreground/80 font-serif italic">§ Folio verified</span>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 sm:p-10 lg:p-10 bg-muted/30 flex flex-col justify-between relative" style={{ backgroundImage: 'radial-gradient(var(--border) 0.65px, transparent 0.65px)', backgroundSize: '24px 24px' }}>
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                    <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-secondary flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      Margin Intelligence
                    </span>
                    {folioData[activeClause].riskBadge}
                  </div>

                  <div className="mb-5">
                    <span className="font-serif italic text-[22px] text-secondary leading-none block mb-2">In plain English:</span>
                    <p className="text-[15px] text-foreground font-normal leading-[1.6]">
                      {folioData[activeClause].plainEnglish}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border shadow-sm mt-6">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1.5">
                      <MessageCircle aria-hidden="true" className="text-secondary w-[15px] h-[15px]" />
                      Attorney Briefing Question:
                    </div>
                    <p className="font-serif italic text-[14.5px] text-foreground leading-relaxed">
                      {folioData[activeClause].attorneyQuestion}
                    </p>
                  </div>

                  <div className="mt-6 flex items-start gap-2.5 text-[12px] text-muted-foreground">
                    <Scale aria-hidden="true" className="text-secondary mt-0.5 w-[16px] h-[16px]" />
                    <p className="leading-relaxed">
                      {folioData[activeClause].statute}
                    </p>
                  </div>
                </div>

                <div className="pt-8 border-t border-border mt-8 flex items-center justify-between text-[11px] text-muted-foreground/80">
                  <span className="flex items-center gap-1">
                    <Lock aria-hidden="true" className="w-[14px] h-[14px]" />
                    Server-side processing
                  </span>
                  <span>Never stored or trained</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
