import { Smartphone, Tablet, Monitor, RotateCcw, Share2, Download, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ToolbarProps {
  currentView: "mobile" | "tablet" | "desktop";
  onViewChange: (view: "mobile" | "tablet" | "desktop") => void;
}

export function Toolbar({ currentView, onViewChange }: ToolbarProps) {
  return (
    <div className="h-12 border-b border-border/40 bg-white/50 backdrop-blur-sm flex items-center justify-between px-4">
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/50">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={currentView === "mobile" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onViewChange("mobile")}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Mobile View</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={currentView === "tablet" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onViewChange("tablet")}
            >
              <Tablet className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Tablet View</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={currentView === "desktop" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onViewChange("desktop")}
            >
              <Monitor className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Original Desktop</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Code className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Share2 className="w-4 h-4" />
        </Button>
        <Button size="sm" className="h-8 gap-2 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90">
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>
    </div>
  );
}
