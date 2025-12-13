import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sliders, Type, Palette, LayoutGrid, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { AnalysisJob, AISuggestion } from "@/lib/api";

interface EditorPanelProps {
  job?: AnalysisJob | null;
  isAnalyzing?: boolean;
}

export function EditorPanel({ job, isAnalyzing }: EditorPanelProps) {
  const responsiveScore = job?.responsiveScore ?? 0;
  const readabilityScore = job?.readabilityScore ?? 0;
  const suggestions = (job?.suggestions || []) as AISuggestion[];
  const isComplete = job?.status === "completed";
  const isFailed = job?.status === "failed";

  return (
    <div className="w-80 border-l border-border bg-card/50 backdrop-blur-sm h-full flex flex-col">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-display font-semibold text-lg">AI Assistant</h3>
        <p className="text-sm text-muted-foreground">
          {isAnalyzing ? "Analyzing..." : isComplete ? "Analysis complete" : isFailed ? "Analysis failed" : "Modify elements intelligently"}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Analysis Card */}
          <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Analyzing...</span>
                </>
              ) : isComplete ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-medium text-muted-foreground">Analysis Complete</span>
                </>
              ) : isFailed ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs font-medium text-muted-foreground">Analysis Failed</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <span className="text-xs font-medium text-muted-foreground">Waiting</span>
                </>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Responsiveness</span>
                <span className={`font-medium ${responsiveScore >= 80 ? "text-green-600" : responsiveScore >= 60 ? "text-amber-600" : "text-red-600"}`}>
                  {responsiveScore}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-secondary/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-secondary transition-all duration-500" 
                  style={{ width: `${responsiveScore}%` }} 
                />
              </div>
              
              <div className="flex justify-between text-sm mt-2">
                <span>Readability</span>
                <span className={`font-medium ${readabilityScore >= 80 ? "text-primary" : readabilityScore >= 60 ? "text-amber-600" : "text-red-600"}`}>
                  {readabilityScore}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${readabilityScore}%` }} 
                />
              </div>
            </div>
          </div>

          {job?.pageTitle && (
            <div className="text-sm">
              <span className="text-muted-foreground">Analyzing: </span>
              <span className="font-medium">{job.pageTitle}</span>
            </div>
          )}

          <Separator />

          <Tabs defaultValue="suggestions">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="suggestions"><AlertCircle className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="style"><Palette className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="layout"><LayoutGrid className="w-4 h-4" /></TabsTrigger>
            </TabsList>
            
            <TabsContent value="suggestions" className="space-y-3">
              <h4 className="text-sm font-medium">AI Suggestions</h4>
              {suggestions.length > 0 ? (
                suggestions.map((suggestion, idx) => (
                  <Button 
                    key={idx}
                    variant="outline" 
                    className={`w-full justify-start text-left h-auto py-3 px-4 border-l-4 ${
                      suggestion.priority === "high" 
                        ? "border-l-red-500 hover:bg-red-50" 
                        : suggestion.priority === "medium" 
                        ? "border-l-amber-500 hover:bg-amber-50" 
                        : "border-l-green-500 hover:bg-green-50"
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-xs">{suggestion.title}</span>
                      <span className="text-[10px] text-muted-foreground">{suggestion.description}</span>
                    </div>
                  </Button>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  {isAnalyzing ? "Generating suggestions..." : "No suggestions yet"}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="style" className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Color Palette</h4>
                {job?.aiAnalysis?.colorPalette ? (
                  <div className="flex gap-2 flex-wrap">
                    {(job.aiAnalysis.colorPalette as string[]).map((color, idx) => (
                      <div 
                        key={idx}
                        className="w-8 h-8 rounded-lg border border-border shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Not available</div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="layout" className="space-y-4">
              <h4 className="text-sm font-medium">Layout Sections</h4>
              {job?.aiAnalysis?.mobileLayout ? (
                <div className="space-y-2">
                  {(job.aiAnalysis.mobileLayout as any[]).map((section, idx) => (
                    <div key={idx} className="text-xs p-2 bg-muted/50 rounded border border-border/50">
                      <span className="font-medium">{section.title}</span>
                      <span className="text-muted-foreground ml-2">({section.type})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Not available</div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border/50 bg-muted/20">
        <Button className="w-full gap-2" disabled={!isComplete}>
          <CheckCircle2 className="w-4 h-4" />
          Apply Changes
        </Button>
      </div>
    </div>
  );
}
