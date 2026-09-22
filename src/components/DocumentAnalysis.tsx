"use client";
/* eslint-disable max-lines */

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocumentInput } from "./DocumentInput";
import { getUserSafeErrorMessage } from "@/lib/errors";
import { Info, Search, Download, FileText, ArrowRight, AlertTriangle } from "lucide-react";
import { AiOutput } from "./AiOutput";
import { ClauseCard } from "./ClauseCard";
import { USE_CASES } from "@/lib/product/use-cases";
import { DISCLAIMER_TEXT } from "@/lib/product/disclaimer";
import { GuardMeta } from "@/lib/guard/quote-verifier";
import { detectPII, PiiMatch } from "@/lib/pii-detector";

type Clause = {
  category: string;
  attentionLevel: 'High' | 'Medium' | 'Low';
  reason: string;
  suggestedQuestion: string;
  quote: string;
};

type QAMessage = {
  role: 'user' | 'assistant';
  content: string;
  quote?: string | null;
  outOfScope?: boolean;
  guard?: GuardMeta;
};

type CompareChange = {
  type: 'Added' | 'Removed' | 'Modified';
  description: string;
  quoteDoc1: string | null;
  quoteDoc2: string | null;
};

export function DocumentAnalysis({ documentText, initialTab }: { documentText: string; initialTab?: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [clauses, setClauses] = useState<Clause[] | null>(null);
  const [analyzeGuard, setAnalyzeGuard] = useState<GuardMeta | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab ?? USE_CASES[0].tabOrRoute);
  
  const [hoveredClauseId, setHoveredClauseId] = useState<number | null>(null);

  // Q&A state
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  // Compare state
  const [doc2Text, setDoc2Text] = useState<string | null>(null);
  const [changes, setChanges] = useState<CompareChange[] | null>(null);
  const [compareGuard, setCompareGuard] = useState<GuardMeta | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Accessibility announcements
  const [announcement, setAnnouncement] = useState<string>("");

  const [isAnalyzingClauses, setIsAnalyzingClauses] = useState(false);
  const [hasFetchedClauses, setHasFetchedClauses] = useState(false);

  const [piiMatches, setPiiMatches] = useState<PiiMatch[] | null>(null);
  const [hasAcknowledgedPii, setHasAcknowledgedPii] = useState(false);

  useEffect(() => {
    const analyze = async () => {
      // PII check before fetching
      if (!hasAcknowledgedPii) {
        const matches = detectPII(documentText);
        if (matches.length > 0) {
          setPiiMatches(matches);
          setIsAnalyzing(false);
          setAnnouncement("Personally Identifiable Information detected in the document. Please review.");
          return;
        } else {
          setHasAcknowledgedPii(true);
        }
      }

      setIsAnalyzing(true);
      setError(null);
      setAnnouncement("Analyzing document, please wait.");
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentText, analysisType: 'summary' })
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to analyze document.");
        }
        
        setSummary(data.summary);
        if (data.guard) setAnalyzeGuard(data.guard);
        setAnnouncement("Analysis complete. Results are available in the tabs.");
      } catch (err) {
        setError(getUserSafeErrorMessage(err, "An error occurred during analysis."));
        setAnnouncement("Analysis failed.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    analyze();
  }, [documentText, hasAcknowledgedPii]);

  useEffect(() => {
    const requiresClauses = ['highlight', 'options', 'actionable', 'attorney'].includes(activeTab);
    if (requiresClauses && !clauses && !isAnalyzingClauses && !hasFetchedClauses) {
      const fetchClauses = async () => {
        setIsAnalyzingClauses(true);
        setHasFetchedClauses(true);
        setAnnouncement("Extracting clauses, please wait.");
        try {
          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ documentText, analysisType: 'clauses' })
          });
          const data = await res.json();
          if (res.ok) {
            setClauses(data.clauses);
            if (data.guard && !analyzeGuard) setAnalyzeGuard(data.guard);
            setAnnouncement("Clause extraction complete.");
          }
        } catch (err) {
          setError(getUserSafeErrorMessage(err, "Failed to fetch clauses."));
        } finally {
          setIsAnalyzingClauses(false);
        }
      };
      fetchClauses();
    }
  }, [activeTab, clauses, isAnalyzingClauses, documentText, hasFetchedClauses, analyzeGuard]);

  const handleAsk = async () => {
    if (!question.trim()) return;
    const newMessages = [...messages, { role: 'user', content: question } as QAMessage];
    setMessages(newMessages);
    setQuestion("");
    setIsAsking(true);
    setAnnouncement("Generating answer, please wait.");

    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentText, question })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get answer");
      
      setMessages([...newMessages, { role: 'assistant', content: data.answer, quote: data.quote, outOfScope: data.outOfScope, guard: data.guard }]);
      setAnnouncement("Answer generated.");
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: getUserSafeErrorMessage(err, "An error occurred. Please try again.") }]);
      setAnnouncement("Failed to generate answer.");
    } finally {
      setIsAsking(false);
    }
  };

  const handleCompare = async () => {
    if (!doc2Text) return;
    setError(null);
    setIsComparing(true);
    setAnnouncement("Comparing documents, please wait.");
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc1Text: documentText, doc2Text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to compare");
      
      setChanges(data.changes);
      if (data.guard) setCompareGuard(data.guard);
      setAnnouncement("Comparison complete.");
    } catch (err) {
      setError(getUserSafeErrorMessage(err, "An error occurred during comparison."));
      setAnnouncement("Comparison failed.");
    } finally {
      setIsComparing(false);
    }
  };

  const handleExport = (format: 'pdf' | 'md') => {
    if (!summary || !clauses) return;
    let content = `# Legal Document Analysis Report\n\n`;
    content += `**Disclaimer:** ${DISCLAIMER_TEXT}\n\n`;
    content += `## Summary\n\n${summary}\n\n`;
    content += `## Key Clauses & Risks\n\n`;
    clauses.forEach(c => {
      content += `### ${c.category}\n`;
      content += `- **Risk Level:** ${c.attentionLevel}\n`;
      content += `- **Reason:** ${c.reason}\n`;
      content += `- **Quote:** "${c.quote}"\n\n`;
    });
    content += `## Attorney-Ready Questions\n\n`;
    clauses.forEach(c => {
      if (c.suggestedQuestion) {
        content += `- [ ] **Regarding ${c.category}:** ${c.suggestedQuestion}\n`;
      }
    });
    content += `\n\n**Disclaimer:** ${DISCLAIMER_TEXT}\n`;

    const blob = new Blob([content], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-analysis-report.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setAnnouncement(`Report exported successfully as ${format.toUpperCase()}.`);
  };

  // Helper to highlight text inline
  const renderHighlightedText = () => {
    if (!clauses || clauses.length === 0) return <div className="whitespace-pre-wrap font-serif text-[16px] leading-[28px] text-foreground">{documentText}</div>;
    
    let elements = [ { text: documentText, clauseIdx: -1 } ];
    
    clauses.forEach((c, idx) => {
       if (!c.quote || c.quote.length < 5) return;
       const newElements: {text: string, clauseIdx: number}[] = [];
       elements.forEach(el => {
          if (el.clauseIdx !== -1) {
             newElements.push(el);
             return;
          }
          const parts = el.text.split(c.quote);
          parts.forEach((part, pIdx) => {
             newElements.push({ text: part, clauseIdx: -1 });
             if (pIdx < parts.length - 1) {
                newElements.push({ text: c.quote, clauseIdx: idx });
             }
          });
       });
       elements = newElements;
    });

    return (
       <div className="whitespace-pre-wrap font-serif text-[16px] leading-[28px] text-foreground selection:bg-primary/20">
          {elements.map((el, i) => {
             if (el.clauseIdx === -1) return <span key={i}>{el.text}</span>;
             const isActive = hoveredClauseId === el.clauseIdx;
             return (
                <span 
                   key={i} 
                   id={`clause-highlight-${el.clauseIdx}`}
                   className={`transition-colors cursor-pointer rounded-[2px] border-b-[1.5px] border-dotted border-[#5ED0C3] ${isActive ? 'bg-[#5ED0C3]/30' : 'bg-[#5ED0C3]/[0.18]'}`}
                   onMouseEnter={() => setHoveredClauseId(el.clauseIdx)}
                   onMouseLeave={() => setHoveredClauseId(null)}
                >
                   {el.text}
                </span>
             );
          })}
       </div>
    );
  };


  return (
    <div className="w-full flex flex-col xl:flex-row gap-6 min-h-[700px] h-full">
      {/* 8-Col Left Pane: Document Text */}
      <div className="xl:w-2/3 flex flex-col bg-card rounded-[12px] border border-border shadow-sm h-full overflow-hidden">
        <div className="p-4 border-b border-border bg-background/50 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Source Document</span>
          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            Analysis Active
          </span>
        </div>
        <div className="p-6 md:p-8 lg:p-12 overflow-y-auto flex-1">
          {piiMatches && !hasAcknowledgedPii ? (
            <div className="flex flex-col h-full items-center justify-center text-center max-w-lg mx-auto space-y-6">
              <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center border border-destructive/20">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-serif text-foreground mb-2">Sensitive Information Detected</h3>
                <p className="text-muted-foreground text-[14.5px] leading-relaxed">
                  We found potential Personally Identifiable Information (PII) in your document. Please verify before sending to the AI.
                </p>
              </div>
              
              <div className="bg-muted/30 border border-border rounded-xl p-4 w-full text-left max-h-[200px] overflow-y-auto custom-scrollbar">
                <ul className="space-y-3">
                  {piiMatches.map((match, i) => (
                    <li key={i} className="flex flex-col text-[13px]">
                      <span className="font-semibold text-foreground uppercase tracking-wider text-[11px] opacity-70">{match.type}</span>
                      <span className="font-mono text-muted-foreground mt-0.5">{match.value}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex w-full gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-[8px]"
                  onClick={() => {
                    // Navigate back or just cancel
                    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                    window.location.href = '/workspace';
                  }}
                >
                  Cancel Analysis
                </Button>
                <Button 
                  variant="default"
                  className="flex-1 rounded-[8px]"
                  onClick={() => setHasAcknowledgedPii(true)}
                >
                  Proceed Anyway
                </Button>
              </div>
            </div>
          ) : isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <div className="w-8 h-8 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin mb-4" />
              <p className="text-[13px] uppercase tracking-wider font-semibold">Analyzing Legal Constructs...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 rounded-[12px] bg-destructive/10 text-destructive border border-destructive/20 flex gap-3 text-[14px]">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              {renderHighlightedText()}
            </>
          )}
        </div>
      </div>
      
      {/* 4-Col Right Pane: Margin Annotations */}
      <div className="xl:w-1/3 flex flex-col bg-card rounded-[12px] border border-border shadow-sm h-[800px] xl:h-auto overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full w-full">
          <div className="border-b border-border bg-background/50 overflow-x-auto scrollbar-hide shrink-0 w-full relative">
            <TabsList className="flex h-14 bg-transparent p-0 w-max min-w-full">
              {USE_CASES.map((useCase) => (
                <TabsTrigger 
                  key={useCase.id} 
                  value={useCase.tabOrRoute}
                  className="h-14 px-4 sm:px-6 rounded-none border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-[13px] font-semibold tracking-wide uppercase whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground/80"
                >
                  {useCase.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-background/20">
            {analyzeGuard && (
              <div className="mb-4 p-3 bg-muted/50 border border-border rounded-[8px] text-[12px] text-muted-foreground flex gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <p>Part of this result was replaced or left unverified because it could not be confirmed against the document.</p>
              </div>
            )}
            {/* TAB 1: SIMPLIFY */}
            <TabsContent value="summary" className="mt-0 outline-none h-full">
              {isAnalyzing ? null : (
                <div className="space-y-5">
                  {/* Risk heat-map bar */}
                  {clauses && clauses.length > 0 && (() => {
                    const high = clauses.filter(c => c.attentionLevel === 'High').length;
                    const med  = clauses.filter(c => c.attentionLevel === 'Medium').length;
                    const low  = clauses.filter(c => c.attentionLevel === 'Low').length;
                    const total = clauses.length;
                    return (
                      <div className="rounded-[14px] border border-border bg-card p-5 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Risk Snapshot</h3>
                          <span className="text-[12px] text-muted-foreground">{total} clause{total !== 1 ? 's' : ''} flagged</span>
                        </div>
                        {/* Segmented bar */}
                        <div className="flex rounded-full overflow-hidden h-3 gap-px">
                          {high > 0 && <div style={{ width: `${(high/total)*100}%` }} className="bg-[#FF6B6B] transition-all" />}
                          {med  > 0 && <div style={{ width: `${(med/total)*100}%`  }} className="bg-[#FFB347] transition-all" />}
                          {low  > 0 && <div style={{ width: `${(low/total)*100}%`  }} className="bg-[#5ED0C3] transition-all" />}
                        </div>
                        <div className="flex gap-4 text-[12px]">
                          {high > 0 && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B]" /><span className="text-muted-foreground">{high} High</span></span>}
                          {med  > 0 && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FFB347]" /><span className="text-muted-foreground">{med} Medium</span></span>}
                          {low  > 0 && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#5ED0C3]" /><span className="text-muted-foreground">{low} Low</span></span>}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Quick clause chips */}
                  {clauses && clauses.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {clauses.map((c, i) => {
                        const color = c.attentionLevel === 'High'   ? 'bg-[#FF6B6B]/15 text-[#FF6B6B] border-[#FF6B6B]/30'
                                    : c.attentionLevel === 'Medium' ? 'bg-[#FFB347]/15 text-[#FFB347] border-[#FFB347]/30'
                                    :                                  'bg-[#5ED0C3]/15 text-[#5ED0C3] border-[#5ED0C3]/30';
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => { setActiveTab('highlight'); setHoveredClauseId(i); }}
                            className={`px-3 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-opacity hover:opacity-80 ${color}`}
                          >
                            {c.category}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Plain language summary card */}
                  <div className="rounded-[14px] border border-border bg-card p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Plain-Language Summary</h3>
                    </div>
                    <AiOutput>
                      <p className="whitespace-pre-wrap leading-[1.85] text-[14px] text-foreground">{summary}</p>
                    </AiOutput>
                  </div>
                </div>
              )}
            </TabsContent>


            {/* TAB 2: COMPARE */}
            <TabsContent value="compare" className="mt-0 outline-none h-full">
              <div className="space-y-6">
                <h3 className="text-xl font-serif text-foreground">Change Detection</h3>
                {!doc2Text ? (
                  <div className="space-y-4">
                    <p className="text-[14px] text-muted-foreground">Upload a second version to detect changes.</p>
                    <DocumentInput onParse={setDoc2Text} />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-3">
                      <Button onClick={handleCompare} disabled={isComparing} size="lg" className="rounded-[8px] w-full shadow-sm font-semibold text-[13px] uppercase tracking-wider">
                        {isComparing ? "Comparing..." : "Run Comparison"}
                      </Button>
                      <Button variant="outline" onClick={() => { setDoc2Text(null); setChanges(null); setCompareGuard(null); }} className="rounded-[8px] w-full text-[13px] uppercase tracking-wider text-foreground">
                        Clear Second Document
                      </Button>
                    </div>
                    
                    {compareGuard && (
                      <div className="p-3 bg-muted/50 border border-border rounded-[8px] text-[12px] text-muted-foreground flex gap-2">
                        <Info className="w-4 h-4 shrink-0" />
                        <p>Part of this result was replaced or left unverified because it could not be confirmed against the document.</p>
                      </div>
                    )}

                    {changes && (
                      <AiOutput className="mt-6 space-y-4">
                        {changes.length === 0 && <p className="text-muted-foreground p-6 text-center border border-border rounded-[12px]">No material changes detected.</p>}
                        {changes.map((c, i) => (
                          <div key={i} className="border border-border p-5 rounded-[12px] space-y-4 bg-card shadow-sm">
                            <span className={`px-2 py-0.5 text-[11px] uppercase tracking-wider rounded-[6px] font-bold ${
                              c.type === 'Added' ? 'bg-[#1E2A40] text-[#9DBDF0] border border-[#26354E]' :
                              c.type === 'Removed' ? 'bg-[#3A1712] text-[#FFB4A9] border border-[#FFB4A9]' :
                              'bg-[#3A2A0B] text-[#FFD28A] border border-[#FFD28A]'
                            }`}>
                              {c.type}
                            </span>
                            <p className="text-[14px] text-foreground leading-relaxed">{c.description}</p>
                          </div>
                        ))}
                      </AiOutput>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 3: HIGHLIGHT (CLAUSES) */}
            <TabsContent value="highlight" className="mt-0 outline-none h-full">
              {isAnalyzing ? null : (
                <div className="space-y-4">
                  {clauses && clauses.length > 0 && (
                    <p className="text-[12px] text-muted-foreground">
                      Click a clause card to jump to its location in the document.
                    </p>
                  )}
                  <div className="space-y-3">
                    {clauses?.map((c, i) => (
                      <ClauseCard
                        key={i}
                        clause={c}
                        index={i}
                        isActive={hoveredClauseId === i}
                        onMouseEnter={() => setHoveredClauseId(i)}
                        onMouseLeave={() => setHoveredClauseId(null)}
                        onClick={() => {
                          const el = document.getElementById(`clause-highlight-${i}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>


            {/* TAB 4: ASK */}
            <TabsContent value="ask" className="mt-0 outline-none h-full flex flex-col">
              <h3 className="text-xl font-serif text-foreground mb-4 shrink-0">Citation-Grounded Q&A</h3>
              <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-background/50 border border-border rounded-[12px] mb-4 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Search className="w-8 h-8 mb-4 opacity-30" />
                    <p className="text-[13px] text-center px-4">Ask a question about the document text.</p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`p-4 rounded-[12px] shadow-sm border ${m.role === 'user' ? 'bg-primary text-primary-foreground ml-6 border-transparent' : 'bg-card mr-6 border-border'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${m.role === 'user' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {m.role === 'user' ? 'You' : 'AI Assistant'}
                    </p>
                    {m.role === 'assistant' ? (
                      <AiOutput>
                        <div className="space-y-3">
                          <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-foreground">{m.content}</p>
                          {m.quote && (
                            <div className="p-3 bg-background/80 rounded-[8px] border border-border/50">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Source Text</span>
                              <p className="font-serif italic text-[13px] text-muted-foreground leading-relaxed">&quot;{m.quote}&quot;</p>
                            </div>
                          )}
                          {m.guard && (
                            <div className="p-3 bg-muted/50 border border-border rounded-[8px] text-[12px] text-muted-foreground flex gap-2 mt-2">
                              <Info className="w-4 h-4 shrink-0" />
                              <p>Part of this result was replaced or left unverified because it could not be confirmed against the document.</p>
                            </div>
                          )}
                        </div>
                      </AiOutput>
                    ) : (
                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="relative shrink-0">
                <Input 
                  value={question} 
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Ask a question..."
                  className="pr-20 h-12 rounded-[8px] border-border bg-background focus-visible:ring-primary shadow-sm text-[14px] px-4"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAsk();
                    }
                  }}
                />
                <Button 
                  onClick={handleAsk} 
                  disabled={isAsking || !question.trim()} 
                  size="sm"
                  className="absolute right-1.5 top-1.5 bottom-1.5 rounded-[6px] px-4 font-semibold text-[12px] uppercase tracking-wider"
                >
                  Ask
                </Button>
              </div>
            </TabsContent>

            {/* TAB 5: OPTIONS AND NEXT STEPS */}
            <TabsContent value="options" className="mt-0 outline-none h-full">
              {isAnalyzing ? null : (
                <div className="space-y-6">
                  <h3 className="text-xl font-serif text-foreground">Options and Next Steps</h3>
                  <p className="text-muted-foreground text-[14px] mb-6">
                    Negotiation points based on the extracted clauses.
                  </p>
                  <AiOutput>
                    <div className="space-y-4">
                      {clauses?.map((c, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 rounded-[12px] border border-[#26354E] bg-card">
                          <ArrowRight className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-foreground text-[14px] mb-1">Regarding {c.category}</h4>
                            <p className="text-[13.5px] text-muted-foreground leading-relaxed">
                              Consider discussing the risk associated with this term. {c.reason}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AiOutput>
                </div>
              )}
            </TabsContent>

            {/* TAB 6: ACTIONABLE OUTPUTS */}
            <TabsContent value="actionable" className="mt-0 outline-none h-full">
              <div className="space-y-8 flex flex-col items-center text-center py-10">
                <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-[12px] flex items-center justify-center mb-2 border border-secondary/20">
                  <Download className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif text-foreground">Export Checklist</h3>
                <p className="text-muted-foreground text-[14px] max-w-sm leading-relaxed">
                  Download a complete breakdown of all identified clauses and attorney-ready questions.
                </p>
                
                <div className="flex flex-col gap-3 mt-4 w-full">
                  <Button 
                    onClick={() => handleExport('pdf')} 
                    disabled={!summary || !clauses || isAnalyzing}
                    size="lg"
                    className="rounded-[8px] shadow-sm gap-2 w-full font-semibold text-[13px] uppercase tracking-wider"
                  >
                    <FileText className="w-4 h-4" />
                    Export as PDF
                  </Button>
                  <Button 
                    onClick={() => handleExport('md')} 
                    disabled={!summary || !clauses || isAnalyzing}
                    variant="outline"
                    size="lg"
                    className="rounded-[8px] shadow-sm gap-2 w-full text-foreground font-semibold text-[13px] uppercase tracking-wider"
                  >
                    <FileText className="w-4 h-4" />
                    Export as Markdown
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 7: ATTORNEY PREP */}
            <TabsContent value="attorney" className="mt-0 outline-none h-full">
              {isAnalyzing ? null : (
                <div className="space-y-6">
                  <div className="border-b border-border pb-4">
                    <h3 className="text-xl font-serif text-foreground mb-2">Attorney Prep</h3>
                    <p className="text-muted-foreground text-[14px]">
                      Specific questions to bring to your legal counsel.
                    </p>
                  </div>
                  
                  <AiOutput>
                    <div className="space-y-5">
                      {clauses?.filter(c => c.suggestedQuestion).map((c, i) => (
                        <div key={i} className="p-5 rounded-[12px] border border-[#26354E] bg-card shadow-sm relative overflow-hidden group">
                          <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#5ED0C3]/80 group-hover:bg-[#5ED0C3] transition-colors" />
                          <h4 className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                            Topic: {c.category}
                          </h4>
                          <p className="font-serif text-[15px] text-foreground leading-relaxed italic mb-4">
                            &quot;{c.suggestedQuestion}&quot;
                          </p>
                          <div className="p-3 bg-background/50 rounded-[8px] border border-border text-[12.5px] text-muted-foreground flex gap-2">
                            <Info className="w-4 h-4 shrink-0 mt-0.5 text-secondary" />
                            <p>
                              <span className="font-semibold text-foreground">Why ask this:</span> {c.reason}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AiOutput>
                </div>
              )}
            </TabsContent>

          </div>
        </Tabs>
      </div>
      
      <div aria-live="polite" className="sr-only" role="status" id="doc-analysis-announcer">
        {announcement}
      </div>
    </div>
  );
}
