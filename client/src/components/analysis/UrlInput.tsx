import { useState, useEffect } from "react";
import { Search, ArrowRight, Loader2, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isAnalyzing: boolean;
  compact?: boolean;
}

export function UrlInput({ onAnalyze, isAnalyzing, compact = false }: UrlInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn(
        "relative w-full transition-all duration-500",
        compact ? "max-w-2xl mx-auto" : "max-w-xl mx-auto"
      )}
    >
      <div className={cn(
        "relative group rounded-xl bg-background border transition-all duration-300 overflow-hidden",
        compact 
          ? "border-border/60 shadow-sm" 
          : "border-primary/20 shadow-lg shadow-primary/5 p-1"
      )}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className={cn("w-5 h-5 text-muted-foreground", isAnalyzing && "animate-pulse text-primary")} />
        </div>
        
        <Input
          type="url"
          placeholder="Enter website URL to mockify (e.g., https://example.com)..."
          className={cn(
            "pl-11 pr-32 border-none shadow-none focus-visible:ring-0 bg-transparent font-mono text-sm",
            compact ? "h-10" : "h-14 text-base"
          )}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isAnalyzing}
        />

        <div className="absolute inset-y-1 right-1 flex items-center">
          <Button 
            type="submit" 
            disabled={!url || isAnalyzing}
            size={compact ? "sm" : "default"}
            className={cn(
              "transition-all duration-300 gap-2",
              isAnalyzing ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
            )}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Analyzing</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span className="hidden sm:inline">Generate</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      {!compact && (
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
          <span className="px-3 py-1 rounded-full bg-muted/50 border border-border/50 cursor-pointer hover:bg-muted hover:text-foreground transition-colors" onClick={() => setUrl("https://airbnb.com")}>airbnb.com</span>
          <span className="px-3 py-1 rounded-full bg-muted/50 border border-border/50 cursor-pointer hover:bg-muted hover:text-foreground transition-colors" onClick={() => setUrl("https://linear.app")}>linear.app</span>
          <span className="px-3 py-1 rounded-full bg-muted/50 border border-border/50 cursor-pointer hover:bg-muted hover:text-foreground transition-colors" onClick={() => setUrl("https://stripe.com")}>stripe.com</span>
        </div>
      )}
    </form>
  );
}
