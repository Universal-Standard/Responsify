import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sliders, Type, Palette, LayoutGrid, CheckCircle2, AlertCircle } from "lucide-react";

export function EditorPanel() {
  return (
    <div className="w-80 border-l border-border bg-card/50 backdrop-blur-sm h-full flex flex-col">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-display font-semibold text-lg">AI Assistant</h3>
        <p className="text-sm text-muted-foreground">Modify elements intelligently</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Analysis Card */}
          <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">Analysis Complete</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Responsiveness</span>
                <span className="text-green-600 font-medium">98%</span>
              </div>
              <div className="h-1.5 w-full bg-secondary/10 rounded-full overflow-hidden">
                <div className="h-full bg-secondary w-[98%]" />
              </div>
              
              <div className="flex justify-between text-sm mt-2">
                <span>Readability</span>
                <span className="text-primary font-medium">94%</span>
              </div>
              <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[94%]" />
              </div>
            </div>
          </div>

          <Separator />

          <Tabs defaultValue="style">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="style"><Palette className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="layout"><LayoutGrid className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="text"><Type className="w-4 h-4" /></TabsTrigger>
            </TabsList>
            
            <TabsContent value="style" className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Suggestions</h4>
                <Button variant="outline" className="w-full justify-start text-left h-auto py-3 px-4 border-l-4 border-l-primary hover:bg-primary/5">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-xs">Increase Contrast</span>
                    <span className="text-[10px] text-muted-foreground">Header text contrast is low on mobile</span>
                  </div>
                </Button>
                <Button variant="outline" className="w-full justify-start text-left h-auto py-3 px-4 border-l-4 border-l-secondary hover:bg-secondary/5">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-xs">Simplify Palette</span>
                    <span className="text-[10px] text-muted-foreground">Reduce secondary colors for clarity</span>
                  </div>
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-3">
             <h4 className="text-sm font-medium flex items-center gap-2">
               <AlertCircle className="w-4 h-4 text-amber-500" />
               Manual Override
             </h4>
             <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" className="text-xs">Font Size +</Button>
                <Button variant="secondary" size="sm" className="text-xs">Font Size -</Button>
                <Button variant="secondary" size="sm" className="text-xs">Padding +</Button>
                <Button variant="secondary" size="sm" className="text-xs">Padding -</Button>
             </div>
          </div>
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border/50 bg-muted/20">
        <Button className="w-full gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Apply Changes
        </Button>
      </div>
    </div>
  );
}
