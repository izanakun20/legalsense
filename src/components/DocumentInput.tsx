"use client";

import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud } from "lucide-react";
import { getUserSafeErrorMessage } from "@/lib/errors";

export function DocumentInput({ onParse }: { onParse: (text: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<string>("");

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
      setFile(selected);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/parse-file", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error("Failed to parse file.");
      }
      
      const data = await res.json();
      setAnnouncement("File uploaded and processed successfully.");
      onParse(data.text);
    } catch (err) {
      setError(getUserSafeErrorMessage(err, "An unexpected error occurred while parsing the file."));
      setAnnouncement("Failed to upload file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) {
      setError("Please paste some text before submitting.");
      return;
    }
    if (pasteText.length > 200000) {
      setError("Pasted text exceeds the maximum allowed length of 200,000 characters.");
      return;
    }
    setError(null);
    setAnnouncement("Text analyzed successfully.");
    // Paste text does not go through file extension validation
    onParse(pasteText);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" role="tab">Upload File</TabsTrigger>
          <TabsTrigger value="paste" role="tab">Paste Text</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" role="tabpanel">
          <Card>
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
              <CardDescription>Upload a PDF, DOCX, or TXT file for analysis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label 
                className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
              >
                <UploadCloud className="w-10 h-10 mb-4 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  {file ? file.name : "Click to select a file"}
                </p>
                <input 
                  type="file" 
                  className="sr-only" 
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={handleFileChange}
                />
              </label>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button onClick={handleFileUpload} disabled={!file || isProcessing} className="w-full">
                {isProcessing ? "Processing..." : "Analyze File"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paste" role="tabpanel">
          <Card>
            <CardHeader>
              <CardTitle>Paste Text</CardTitle>
              <CardDescription>Paste document text directly below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Paste your legal document text here..."
                className="min-h-[200px]"
                value={pasteText}
                onChange={(e) => {
                  setPasteText(e.target.value);
                  setError(null);
                }}
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button onClick={handlePasteSubmit} disabled={!pasteText.trim() || isProcessing} className="w-full">
                Analyze Text
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Aria-live region for screen readers as requested */}
      <div aria-live="polite" className="sr-only" role="status">
        {isProcessing ? "Processing document, please wait." : announcement}
        {error ? `Error: ${error}` : ""}
      </div>
    </div>
  );
}
