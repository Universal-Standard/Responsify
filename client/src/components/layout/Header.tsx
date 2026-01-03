import { Zap, Layout, Save, History, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/UserMenu";
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
          data-testid="nav-analyze"
        >
          <Zap className="w-4 h-4 mr-2" />
          Analyze
        </Button>
        <Button 
          variant={location === "/history" ? "secondary" : "ghost"} 
          size="sm" 
          className="text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/history")}
          data-testid="nav-history"
        >
          <History className="w-4 h-4 mr-2" />
          History
        </Button>
        <Button 
          variant={location === "/projects" ? "secondary" : "ghost"} 
          size="sm" 
          className="text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/projects")}
          data-testid="nav-projects"
        >
          <FolderKanban className="w-4 h-4 mr-2" />
          Projects
        </Button>
        <Button 
          variant={location === "/dashboard" ? "secondary" : "ghost"} 
          size="sm" 
          className="text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/dashboard")}
          data-testid="nav-dashboard"
        >
          <Layout className="w-4 h-4 mr-2" />
          Dashboard
        </Button>
      </nav>

      <div className="flex items-center gap-2">
        <UserMenu />
      </div>
    </header>
  );
}
