"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocumentInput } from "./DocumentInput";
import { getUserSafeErrorMessage } from "@/lib/errors";
import { AlertTriangle, Info, CheckCircle, Search, Download } from "lucide-react";

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
};

type CompareChange = {
  type: 'Added' | 'Removed' | 'Modified';
  description: string;
  quoteDoc1: string | null;
  quoteDoc2: string | null;
};

export function DocumentAnalysis({ documentText }: { documentText: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [clauses, setClauses] = useState<Clause[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Q&A state
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  // Compare state
  const [doc2Text, setDoc2Text] = useState<string | null>(null);
  const [changes, setChanges] = useState<CompareChange[] | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Accessibility announcements
  const [announcement, setAnnouncement] = useState<string>("");

  useEffect(() => {
    const analyze = async () => {
      setAnnouncement("Analyzing document, please wait.");
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentText })
        });
        if (!res.ok) throw new Error("Failed to analyze");
        const data = await res.json();
        setSummary(data.summary);
        setClauses(data.clauses);
        setAnnouncement("Analysis complete. Results are available in the Summary and Clauses tabs.");
      } catch (err) {
        setError(getUserSafeErrorMessage(err, "An error occurred during analysis."));
        setAnnouncement("Analysis failed.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    analyze();
  }, [documentText]);

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
      if (!res.ok) throw new Error("Failed to get answer");
      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.answer, quote: data.quote, outOfScope: data.outOfScope }]);
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
    setIsComparing(true);
    setAnnouncement("Comparing documents, please wait.");
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc1Text: documentText, doc2Text })
      });
      if (!res.ok) throw new Error("Failed to compare");
      const data = await res.json();
      setChanges(data.changes);
      setAnnouncement("Comparison complete.");
    } catch (err) {
      setError(getUserSafeErrorMessage(err, "An error occurred during comparison."));
      setAnnouncement("Comparison failed.");
    } finally {
      setIsComparing(false);
    }
  };

  const handleExport = () => {
    if (!summary || !clauses) return;
    let md = `# Legal Document Analysis Report\n\n`;
    md += `**Disclaimer:** This is general information, not legal advice. Consult a licensed attorney for your situation.\n\n`;
    md += `## Summary\n\n${summary}\n\n`;
    md += `## Key Clauses & Risks\n\n`;
    clauses.forEach(c => {
      md += `### ${c.category}\n`;
      md += `- **Risk Level:** ${c.attentionLevel}\n`;
      md += `- **Reason:** ${c.reason}\n`;
      md += `- **Quote:** "${c.quote}"\n\n`;
    });
    md += `## Attorney-Ready Questions & Next Steps\n\n`;
    clauses.forEach(c => {
      if (c.suggestedQuestion) {
        md += `- [ ] **Regarding ${c.category}:** ${c.suggestedQuestion}\n`;
      }
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document-analysis-report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setAnnouncement("Report exported successfully.");
  };

  const Disclaimer = () => (
    <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-2 rounded-md text-amber-900 dark:text-amber-200 text-xs font-medium my-2">
      <strong>Disclaimer:</strong> This is general information, not legal advice. Consult a licensed attorney for your situation.
    </div>
  );

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleExport} disabled={!summary || !clauses || isAnalyzing} variant="outline">
          <Download className="w-4 h-4 mr-2" aria-hidden="true" />
          Export Report
        </Button>
      </div>
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="clauses">Clauses</TabsTrigger>
          <TabsTrigger value="qa">Q&A</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Document Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {isAnalyzing ? (
                <p>Analyzing document...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : (
                <div className="space-y-4">
                  <Disclaimer />
                  <p className="whitespace-pre-wrap">{summary}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clauses">
          <Card>
            <CardHeader>
              <CardTitle>Key Clauses</CardTitle>
            </CardHeader>
            <CardContent>
              <Disclaimer />
              {isAnalyzing ? (
                <p>Analyzing document...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : (
                <div className="space-y-4">
                  {clauses?.map((c, i) => (
                    <div key={i} className="border p-4 rounded-md space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full font-semibold ${
                          c.attentionLevel === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                          c.attentionLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' :
                          'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                        }`}>
                          {c.attentionLevel === 'High' && <AlertTriangle className="w-3 h-3" />}
                          {c.attentionLevel === 'Medium' && <Info className="w-3 h-3" />}
                          {c.attentionLevel === 'Low' && <CheckCircle className="w-3 h-3" />}
                          {c.attentionLevel} Risk
                        </span>
                        <span className="font-semibold">{c.category}</span>
                      </div>
                      <p className="text-sm"><strong>Reason:</strong> {c.reason}</p>
                      <p className="text-sm"><strong>Quote:</strong> "{c.quote}"</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400"><strong>Ask a Lawyer:</strong> {c.suggestedQuestion}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qa">
          <Card>
            <CardHeader>
              <CardTitle>Document Q&A</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[400px] overflow-y-auto p-2">
                {messages.map((m, i) => (
                  <div key={i} className={`p-3 rounded-md ${m.role === 'user' ? 'bg-muted ml-8' : 'bg-blue-50 dark:bg-blue-900/20 mr-8'}`}>
                    <p className="text-sm font-semibold mb-1">{m.role === 'user' ? 'You' : 'Assistant'}</p>
                    {m.role === 'assistant' && <Disclaimer />}
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    {m.quote && (
                      <p className="text-xs text-muted-foreground mt-2 border-l-2 pl-2">"{m.quote}"</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Input 
                  value={question} 
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Ask a question about the document..."
                  onKeyDown={e => e.key === 'Enter' && handleAsk()}
                />
                <Button onClick={handleAsk} disabled={isAsking || !question.trim()} aria-label="Send question">
                  <Search className="w-4 h-4 mr-2" aria-hidden="true" />
                  Ask
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compare">
          <Card>
            <CardHeader>
              <CardTitle>Compare Document</CardTitle>
            </CardHeader>
            <CardContent>
              {!doc2Text ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Upload or paste a second document to compare against the current one.</p>
                  <DocumentInput onParse={setDoc2Text} />
                </div>
              ) : (
                <div className="space-y-4">
                  <Disclaimer />
                  <Button onClick={handleCompare} disabled={isComparing}>
                    {isComparing ? "Comparing..." : "Run Comparison"}
                  </Button>
                  <Button variant="outline" onClick={() => setDoc2Text(null)} className="ml-2">Clear Document 2</Button>
                  
                  {changes && (
                    <div className="space-y-4 mt-4">
                      {changes.map((c, i) => (
                        <div key={i} className="border p-4 rounded-md space-y-2">
                          <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                            c.type === 'Added' ? 'bg-green-100 text-green-800' :
                            c.type === 'Removed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {c.type}
                          </span>
                          <p className="text-sm">{c.description}</p>
                          {c.quoteDoc1 && <p className="text-xs text-muted-foreground"><strong>Doc 1:</strong> "{c.quoteDoc1}"</p>}
                          {c.quoteDoc2 && <p className="text-xs text-muted-foreground"><strong>Doc 2:</strong> "{c.quoteDoc2}"</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div aria-live="polite" className="sr-only" role="status">
        {announcement}
      </div>
    </div>
  );
}
