import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Palette, LayoutGrid, CheckCircle2, AlertCircle, Loader2, Sparkles, Smartphone, BookOpen, Accessibility, Zap } from "lucide-react";
import type { AnalysisJob, AISuggestion } from "@/lib/api";
import { ReactNode } from "react";

interface EditorPanelProps {
  job?: AnalysisJob | null;
  isAnalyzing?: boolean;
}

function ScoreCard({ icon, label, score }: { icon: ReactNode; label: string; score: number }) {
  const getColor = (s: number) => s >= 80 ? "text-green-600" : s >= 60 ? "text-amber-600" : "text-red-600";
  const getBg = (s: number) => s >= 80 ? "bg-green-500" : s >= 60 ? "bg-amber-500" : "bg-red-500";
  
  return (
    <div className="rounded-lg border border-border bg-white p-2.5 shadow-sm" data-testid={`score-card-${label.toLowerCase()}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-lg font-bold ${getColor(score)}`}>{score}%</div>
      <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden mt-1">
        <div className={`h-full ${getBg(score)} transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function EditorPanel({ job, isAnalyzing }: EditorPanelProps) {
  const responsiveScore = job?.responsiveScore ?? 0;
  const readabilityScore = job?.readabilityScore ?? 0;
  const consensusScore = job?.consensusScore ?? 0;
  const accessibilityScore = job?.accessibilityScore ?? 0;
  const performanceScore = job?.performanceScore ?? 0;
  const suggestions = (job?.suggestions || []) as AISuggestion[];
  const isComplete = job?.status === "completed";
  const isFailed = job?.status === "failed";

  const getScoreColor = (score: number) => 
    score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-red-600";
  
  const getScoreBg = (score: number) => 
    score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="w-80 border-l border-border bg-card/50 backdrop-blur-sm h-full flex flex-col">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">AI Consensus</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {isAnalyzing ? "Multi-agent analysis..." : isComplete ? "Swarm analysis complete" : isFailed ? "Analysis failed" : "AI-powered insights"}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Consensus Score Hero */}
          {isComplete && (
            <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-secondary/5 p-4 shadow-sm" data-testid="consensus-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">AI Consensus Score</span>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(consensusScore)}`} data-testid="consensus-score">
                  {consensusScore}%
                </div>
              </div>
              <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getScoreBg(consensusScore)} transition-all duration-700`}
                  style={{ width: `${consensusScore}%` }} 
                />
              </div>
            </div>
          )}

          {/* Status Card */}
          <div className="rounded-lg border border-border bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Multi-agent swarm analyzing...</span>
                </>
              ) : isComplete ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-medium text-green-600">3 AI agents reached consensus</span>
                </>
              ) : isFailed ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs font-medium text-red-600">Analysis failed</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <span className="text-xs font-medium text-muted-foreground">Waiting</span>
                </>
              )}
            </div>
          </div>
          
          {/* Score Grid */}
          <div className="grid grid-cols-2 gap-2">
            <ScoreCard icon={<Smartphone className="w-3.5 h-3.5" />} label="Responsive" score={responsiveScore} />
            <ScoreCard icon={<BookOpen className="w-3.5 h-3.5" />} label="Readability" score={readabilityScore} />
            <ScoreCard icon={<Accessibility className="w-3.5 h-3.5" />} label="Accessibility" score={accessibilityScore} />
            <ScoreCard icon={<Zap className="w-3.5 h-3.5" />} label="Performance" score={performanceScore} />
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
