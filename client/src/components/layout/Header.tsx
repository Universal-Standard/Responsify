import { Zap, Layout, Save, Settings, User, BarChart3, BookOpen, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export function Header() {
  const [location, navigate] = useLocation();

  return (
    <header className="h-16 border-b border-border/40 glass sticky top-0 z-50 px-6 flex items-center justify-between">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")} data-testid="header-logo">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-foreground">
          Responsi<span className="text-primary">AI</span>
        </span>
      </div>

      <nav className="flex items-center gap-1">
        <Button 
          variant={location === "/" ? "secondary" : "ghost"} 
          size="sm" 
          className="text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
          data-testid="nav-dashboard"
        >
          <Layout className="w-4 h-4 mr-2" />
          Dashboard
        </Button>
        <Button 
          variant={location === "/library" ? "secondary" : "ghost"} 
          size="sm" 
          className="text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/library")}
          data-testid="nav-library"
        >
          <Save className="w-4 h-4 mr-2" />
          Library
        </Button>
        <Button 
          variant={location === "/compare" ? "secondary" : "ghost"} 
          size="sm" 
          className="text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/compare")}
          data-testid="nav-compare"
        >
          <GitCompare className="w-4 h-4 mr-2" />
          Compare
        </Button>
        <Button 
          variant={location === "/analytics" ? "secondary" : "ghost"} 
          size="sm" 
          className="text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/analytics")}
          data-testid="nav-analytics"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Analytics
        </Button>
        <Button 
          variant={location === "/docs" ? "secondary" : "ghost"} 
          size="sm" 
          className="text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/docs")}
          data-testid="nav-docs"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Docs
        </Button>
      </nav>

      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground" 
          onClick={() => navigate("/settings")}
          data-testid="btn-settings"
        >
          <Settings className="w-5 h-5" />
        </Button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <Button variant="ghost" size="icon" className="rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 hover:text-secondary" data-testid="btn-profile">
          <User className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
