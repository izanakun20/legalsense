"use client";

import React, { useState } from "react";
import { DocumentInput } from "@/components/DocumentInput";
import { DocumentAnalysis } from "@/components/DocumentAnalysis";
import { FileText, Plus, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import { SAMPLE_DOCS } from "@/lib/test-data";

type SessionDoc = {
  id: string;
  name: string;
  text: string;
};

export default function WorkspacePage() {
  const [documents, setDocuments] = useState<SessionDoc[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  const activeDoc = documents.find(d => d.id === activeDocId);

  const addDocument = (name: string, text: string) => {
    const newDoc: SessionDoc = {
      id: Math.random().toString(36).substring(7),
      name,
      text,
    };
    
    setDocuments(prev => {
      const updated = [newDoc, ...prev];
      return updated.slice(0, 5); // Keep MRU of 5
    });
    setActiveDocId(newDoc.id);
  };

  const removeDocument = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (activeDocId === id) {
      setActiveDocId(null);
    }
  };

  const loadSample = (type: 'lease' | 'nda' | 'service', name: string) => {
    const text = SAMPLE_DOCS[type];
    addDocument(name, text);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden font-sans bg-background">
      
      {/* Session Library Sidebar */}
      <div className="w-80 flex-shrink-0 bg-card border-r border-border hidden md:flex flex-col h-full shadow-sm relative z-10">
        <div className="p-6 border-b border-border bg-background/50">
          <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Session</span>
          <h2 className="font-serif text-[22px] text-primary tracking-tight">Library</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {documents.map(doc => (
            <button 
              type="button"
              key={doc.id}
              onClick={() => setActiveDocId(doc.id)}
              className={`w-full text-left p-4 rounded-xl cursor-pointer flex items-center justify-between group transition-all ${
                activeDocId === doc.id 
                  ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]' 
                  : 'bg-background border border-border hover:border-primary/30 text-foreground hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className={`w-4 h-4 shrink-0 ${activeDocId === doc.id ? 'text-primary-foreground/80' : 'text-secondary'}`} />
                <span className="font-medium text-[14px] truncate">{doc.name}</span>
              </div>
              <button 
                onClick={(e) => removeDocument(doc.id, e)}
                className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
                  activeDocId === doc.id ? 'hover:bg-primary-foreground/20' : 'hover:bg-muted'
                }`}
                aria-label="Remove document"
              >
                <X className="w-4 h-4" />
              </button>
            </button>
          ))}
          {documents.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4 border-2 border-dashed border-border rounded-xl">
              <FileText className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-[13px] text-muted-foreground">Your recent session documents will appear here.</p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-border bg-background/50">
          <Button 
            onClick={() => setActiveDocId(null)} 
            disabled={!activeDocId}
            variant="outline"
            className="w-full rounded-full gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Document
          </Button>
          <p className="text-[11px] text-center text-muted-foreground mt-3 uppercase tracking-wider">
            Up to 5 documents per session
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto w-full">
        {!activeDoc ? (
          <div className="flex flex-col items-center justify-center min-h-full p-6 lg:p-12">
            <div className="max-w-3xl w-full text-center mb-12">
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-border bg-card shadow-sm mb-6">
                <span className="flex h-2 w-2 rounded-full bg-secondary mr-2"></span>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">AI Analysis Standby</span>
              </div>
              <h1 className="font-serif text-[42px] md:text-[52px] text-primary tracking-tight leading-tight mb-4">
                Contractual Clarity Workspace
              </h1>
              <p className="text-[16px] text-muted-foreground">
                Upload your document or start with a verified fictional sample to explore the capabilities.
              </p>
            </div>
            
            <DocumentInput onParse={(text) => addDocument(`Document ${documents.length + 1}`, text)} />

            <div className="max-w-4xl mx-auto w-full mt-24 mb-12">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                <div>
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-secondary block mb-1">Quick Verification</span>
                  <h3 className="font-serif text-[24px] text-primary">Start with a Verified Sample</h3>
                </div>
                <span className="text-muted-foreground text-[13px] hidden sm:inline border px-3 py-1 rounded-full bg-card">Pre-configured edge cases included</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sample 1 */}
                <button
                  type="button"
                  className={`text-left w-full bg-card rounded-2xl p-6 border transition-all cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-md border-border hover:border-secondary`}
                  onClick={() => loadSample('lease', 'Standard Residential Lease')}
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted text-muted-foreground">Real Estate</span>
                      <span className="text-[12px] text-muted-foreground/60 font-medium">12 pp</span>
                    </div>
                    <h4 className="font-serif text-[18px] text-primary group-hover:text-secondary transition-colors mb-3 leading-snug">
                      Standard Residential Lease
                    </h4>
                    <p className="text-[14px] text-muted-foreground leading-relaxed line-clamp-2">
                      Sublet restrictions, automatic renewal, and tenant indemnity terms.
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-secondary font-semibold text-[13px] uppercase tracking-wider">
                    <span>Analyze Sample</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
                
                {/* Sample 2 */}
                <button
                  type="button"
                  className={`text-left w-full bg-card rounded-2xl p-6 border transition-all cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-md border-border hover:border-secondary`}
                  onClick={() => loadSample('nda', 'Mutual Non-Disclosure')}
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted text-muted-foreground">Corporate</span>
                      <span className="text-[12px] text-muted-foreground/60 font-medium">4 pp</span>
                    </div>
                    <h4 className="font-serif text-[18px] text-primary group-hover:text-secondary transition-colors mb-3 leading-snug">
                      Mutual Non-Disclosure
                    </h4>
                    <p className="text-[14px] text-muted-foreground leading-relaxed line-clamp-2">
                      Trade secrets, non-solicitation scope, and injunctive relief clauses.
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-secondary font-semibold text-[13px] uppercase tracking-wider">
                    <span>Analyze Sample</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Sample 3 */}
                <button
                  type="button"
                  className={`text-left w-full bg-card rounded-2xl p-6 border transition-all cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-md border-border hover:border-secondary`}
                  onClick={() => loadSample('service', 'Contractor Agreement')}
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted text-muted-foreground">Services</span>
                      <span className="text-[12px] text-muted-foreground/60 font-medium">6 pp</span>
                    </div>
                    <h4 className="font-serif text-[18px] text-primary group-hover:text-secondary transition-colors mb-3 leading-snug">
                      Contractor Agreement
                    </h4>
                    <p className="text-[14px] text-muted-foreground leading-relaxed line-clamp-2">
                      IP work-for-hire assignment, liability caps, and payment schedules.
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-secondary font-semibold text-[13px] uppercase tracking-wider">
                    <span>Analyze Sample</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 lg:p-8 xl:p-12 w-full max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8 bg-card border border-border p-4 px-6 rounded-2xl shadow-sm">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-secondary uppercase tracking-widest mb-1">Active Session Document</span>
                <h2 className="font-serif text-[22px] text-foreground flex items-center gap-3">
                  {activeDoc.name}
                </h2>
              </div>
              <Button 
                onClick={() => setActiveDocId(null)}
                variant="ghost"
                className="rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                size="sm"
              >
                <X className="w-4 h-4 mr-2" />
                Close View
              </Button>
            </div>
            
            <DocumentAnalysis documentText={activeDoc.text} />
          </div>
        )}
      </div>
    </div>
  );
}
