import { Zap, Layout, Save, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="h-16 border-b border-border/40 glass sticky top-0 z-50 px-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-foreground">
          Responsi<span className="text-primary">AI</span>
        </span>
      </div>

      <nav className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Layout className="w-4 h-4 mr-2" />
          Dashboard
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Save className="w-4 h-4 mr-2" />
          Library
        </Button>
      </nav>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Settings className="w-5 h-5" />
        </Button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <Button variant="ghost" size="icon" className="rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 hover:text-secondary">
          <User className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
