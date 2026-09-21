"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { UploadCloud, FileText, AlertCircle } from "lucide-react";
import { getUserSafeErrorMessage } from "@/lib/errors";
import { motion, AnimatePresence } from "framer-motion";

export function DocumentInput({ onParse }: { onParse: (text: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      const validExtensions = ['.pdf', '.docx', '.txt'];
      
      const isValid = validTypes.includes(selected.type) || validExtensions.some(ext => selected.name.toLowerCase().endsWith(ext));
      
      if (!isValid) {
        setError("Invalid file type. Please upload a PDF, DOCX, or TXT file.");
        setFile(null);
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit.");
        setFile(null);
        return;
      }
      setFile(selected);
    }
  };

  const handleFileUpload = async () => {
    if (!file || !consentGiven) return;
    setIsProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/parse-file", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse file.");
      }
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error("The document contains no extractable text. Scanned PDFs are not supported.");
      }
      
      onParse(data.text);
    } catch (err) {
      setError(getUserSafeErrorMessage(err, "An unexpected error occurred while parsing the file."));
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim() || !consentGiven) {
      setError("Please paste some text and confirm privacy consent.");
      return;
    }
    if (pasteText.length > 200000) {
      setError("Pasted text exceeds the maximum allowed length of 200,000 characters.");
      return;
    }
    setError(null);
    onParse(pasteText);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col font-sans">
      <div className="flex items-center gap-6 px-6 sm:px-8 border-b border-border bg-background pt-6">
        <button 
          onClick={() => setActiveTab('upload')}
          className={`pb-4 relative font-medium transition-colors text-[14px] uppercase tracking-wide ${activeTab === 'upload' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <span className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            Upload file
          </span>
          {activeTab === 'upload' && (
            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('paste')}
          className={`pb-4 relative font-medium transition-colors text-[14px] uppercase tracking-wide ${activeTab === 'paste' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Paste text
          </span>
          {activeTab === 'paste' && (
            <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
      </div>

      <div className="p-6 sm:p-8 flex flex-col gap-8">
        <AnimatePresence mode="wait">
          {activeTab === 'upload' ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              <label className="relative rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors bg-background p-12 text-center flex flex-col items-center justify-center cursor-pointer group focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
                <input 
                  type="file" 
                  className="sr-only" 
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                />
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-6 group-hover:bg-primary/5 transition-colors">
                  <UploadCloud className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-serif text-foreground mb-2">
                  {file ? file.name : "Select a document to upload"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  Supports PDF, DOCX, and TXT files up to 10MB.
                </p>
                <div className="h-10 px-6 inline-flex items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm font-medium transition-colors hover:bg-secondary/90 shadow-sm">
                  Browse files
                </div>
              </label>

              {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="paste"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              <Textarea 
                placeholder="Paste your legal document text here..."
                className="min-h-[300px] font-mono text-sm leading-relaxed p-6 bg-background rounded-xl focus-visible:ring-primary border-border resize-none"
                value={pasteText}
                onChange={(e) => {
                  setPasteText(e.target.value);
                  setError(null);
                }}
              />
              {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-6 border-t border-border flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <label htmlFor="consent-checkbox" className="flex items-start sm:items-center gap-3 cursor-pointer group max-w-md">
            <Checkbox 
              id="consent-checkbox"
              checked={consentGiven} 
              onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
              className="mt-1 sm:mt-0 data-[state=checked]:bg-secondary data-[state=checked]:border-secondary" 
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-snug">
              I acknowledge LegalSense provides AI-assisted analysis, <strong className="font-semibold text-foreground">not formal legal counsel</strong>. Data is never used for training.
            </span>
          </label>

          <Button 
            onClick={activeTab === 'upload' ? handleFileUpload : handlePasteSubmit} 
            disabled={(activeTab === 'upload' ? !file : !pasteText.trim()) || !consentGiven || isProcessing} 
            size="lg"
            className="w-full sm:w-auto rounded-full font-semibold shadow-sm shrink-0"
          >
            {isProcessing ? "Processing Document..." : "Analyze Document"}
          </Button>
        </div>
      </div>
    </div>
  );
}
