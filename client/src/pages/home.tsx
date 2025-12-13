import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Toolbar } from "@/components/layout/Toolbar";
import { UrlInput } from "@/components/analysis/UrlInput";
import { DeviceFrame } from "@/components/preview/DeviceFrame";
import { EditorPanel } from "@/components/preview/EditorPanel";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Save, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  startAnalysis, 
  pollAnalysisStatus, 
  saveDesign,
  type AnalysisJob,
  type AISuggestion
} from "@/lib/api";

import generatedImage from '@assets/generated_images/subtle_geometric_tech_pattern_background_with_soft_purple_and_teal_gradients.png';

export default function Home() {
  const [currentJob, setCurrentJob] = useState<AnalysisJob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [view, setView] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [isSaving, setIsSaving] = useState(false);
  const pollCleanupRef = useRef<(() => void) | null>(null);
  const { toast } = useToast();

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollCleanupRef.current) {
        pollCleanupRef.current();
      }
    };
  }, []);

  const handleAnalyze = async (inputUrl: string) => {
    setIsAnalyzing(true);
    setCurrentJob(null);

    try {
      const { jobId } = await startAnalysis(inputUrl);
      
      // Start polling for status
      pollCleanupRef.current = pollAnalysisStatus(
        jobId,
        (job) => {
          setCurrentJob(job);
        },
        (job) => {
          setCurrentJob(job);
          setIsAnalyzing(false);
          toast({
            title: "Analysis Complete",
            description: `Successfully analyzed ${job.pageTitle || job.url}`,
          });
        },
        (error) => {
          setIsAnalyzing(false);
          toast({
            title: "Analysis Failed",
            description: error.message,
            variant: "destructive",
          });
        }
      );
    } catch (error: any) {
      setIsAnalyzing(false);
      toast({
        title: "Error",
        description: error.message || "Failed to start analysis",
        variant: "destructive",
      });
    }
  };

  const handleSaveDesign = async () => {
    if (!currentJob || currentJob.status !== "completed") return;
    
    setIsSaving(true);
    try {
      const name = currentJob.pageTitle || new URL(currentJob.url).hostname;
      await saveDesign(currentJob.id, name);
      toast({
        title: "Design Saved",
        description: "Your design has been saved to the library",
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (pollCleanupRef.current) {
      pollCleanupRef.current();
    }
    setCurrentJob(null);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans overflow-hidden">
      <Header />

      <main className="flex-1 flex flex-col relative">
        {/* Background Texture */}
        <div 
          className="absolute inset-0 z-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `url(${generatedImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        <AnimatePresence mode="wait">
          {!currentJob ? (
            // Empty State / Hero
            <motion.div 
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center px-4 relative z-10"
            >
              <div className="text-center max-w-3xl mx-auto space-y-6 mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />
                  <span>AI-Powered Conversion Engine 2.0</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-foreground">
                  Transform any website into a <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    perfect mobile experience
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Our AI engine analyzes desktop layouts and intelligently reconstructs them for mobile devices, preserving functionality while optimizing UX.
                </p>
              </div>

              <div className="w-full max-w-xl relative z-20">
                <UrlInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
              </div>
            </motion.div>
          ) : (
            // Workspace
            <motion.div 
              key="workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col h-full z-10"
            >
              <Toolbar 
                currentView={view} 
                onViewChange={setView} 
                onReset={handleReset}
                onSave={handleSaveDesign}
                isSaving={isSaving}
                canSave={currentJob?.status === "completed"}
              />
              
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 bg-muted/30 relative">
                  {/* Grid Pattern */}
                  <div className="absolute inset-0 z-0 opacity-[0.03]" 
                       style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
                  />
                  
                  <DeviceFrame type={view}>
                    <MobilePreview job={currentJob} isAnalyzing={isAnalyzing} />
                  </DeviceFrame>
                </div>
                
                <EditorPanel 
                  job={currentJob}
                  isAnalyzing={isAnalyzing}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// Mobile Preview Component
function MobilePreview({ job, isAnalyzing }: { job: AnalysisJob; isAnalyzing: boolean }) {
  if (isAnalyzing || job.status === "analyzing" || job.status === "converting") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
          <Sparkles className="w-8 h-8 text-primary animate-spin" style={{ animationDuration: "3s" }} />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {job.status === "converting" ? "Generating Mobile Layout..." : "Analyzing Website..."}
        </h3>
        <p className="text-gray-500 text-sm max-w-xs">
          {job.status === "converting" 
            ? "AI is creating your optimized mobile design" 
            : "Fetching and parsing website structure"}
        </p>
        <div className="mt-6 flex gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  if (job.status === "failed") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Analysis Failed</h3>
        <p className="text-gray-500 text-sm max-w-xs">{job.errorMessage || "Something went wrong"}</p>
      </div>
    );
  }

  if (job.status === "completed" && job.mobileConversion) {
    return (
      <iframe
        srcDoc={job.mobileConversion}
        className="w-full h-full border-0"
        title="Mobile Preview"
        sandbox="allow-scripts"
      />
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <CheckCircle className="w-8 h-8 text-green-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready</h3>
      <p className="text-gray-500 text-sm">Preview will appear here</p>
    </div>
  );
}
