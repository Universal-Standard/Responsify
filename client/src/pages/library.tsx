import { motion } from "framer-motion";
import { FileText, Trash2, ExternalLink, Copy, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/Header";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAllDesigns, deleteDesign, updateDesign, type SavedDesign } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { format } from "date-fns";

export default function Library() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: designs = [], isLoading } = useQuery({
    queryKey: ["designs"],
    queryFn: getAllDesigns,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDesign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designs"] });
      toast({ title: "Design deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    },
  });

  const starMutation = useMutation({
    mutationFn: ({ id, isStarred }: { id: string; isStarred: boolean }) => 
      updateDesign(id, { isStarred }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designs"] });
    },
  });

  const starredDesigns = designs.filter(d => d.isStarred);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">Saved Designs</h1>
          <p className="text-muted-foreground">Manage and reuse your converted website mockups</p>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <Tabs defaultValue="all" className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="all">All ({designs.length})</TabsTrigger>
              <TabsTrigger value="starred">Starred ({starredDesigns.length})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => navigate("/")}>
              New Design
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && designs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No designs yet</h3>
            <p className="text-muted-foreground mb-6">Start by converting a website to save it to your library</p>
            <Button className="bg-primary text-primary-foreground" onClick={() => navigate("/")}>
              Convert Your First Website
            </Button>
          </div>
        )}

        {/* Designs Grid */}
        {!isLoading && designs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design, idx) => (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <DesignCard 
                  design={design} 
                  onDelete={() => deleteMutation.mutate(design.id)}
                  onToggleStar={() => starMutation.mutate({ id: design.id, isStarred: !design.isStarred })}
                  isDeleting={deleteMutation.isPending}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DesignCard({ 
  design, 
  onDelete, 
  onToggleStar,
  isDeleting 
}: { 
  design: SavedDesign; 
  onDelete: () => void;
  onToggleStar: () => void;
  isDeleting: boolean;
}) {
  const [, navigate] = useLocation();

  return (
    <Card className="glass-card group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300" data-testid={`card-design-${design.id}`}>
      {/* Preview Area */}
      <div className="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
        {design.mobileHtml ? (
          <iframe
            srcDoc={design.mobileHtml}
            className="w-full h-full border-0 pointer-events-none scale-50 origin-top-left"
            style={{ width: "200%", height: "200%" }}
            title={design.name}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <FileText className="w-12 h-12 text-primary/30 group-hover:scale-110 transition-transform duration-300" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <button 
            className="p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors"
            onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
          >
            <Star className={`w-4 h-4 ${design.isStarred ? "text-amber-500 fill-amber-500" : "text-gray-400"}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground line-clamp-1">{design.name}</h3>
          <p className="text-xs text-muted-foreground truncate">{design.originalUrl}</p>
        </div>

        {design.pageDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2">{design.pageDescription}</p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Conversion Score</span>
          <span className="font-semibold text-secondary">{design.analysisScore || 0}%</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border/50">
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex-1 gap-2 h-8 text-xs" 
            data-testid={`btn-open-${design.id}`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0" 
            data-testid={`btn-copy-${design.id}`}
            onClick={() => navigator.clipboard.writeText(design.mobileHtml || "")}
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600" 
            data-testid={`btn-delete-${design.id}`}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </Button>
        </div>

        {/* Meta */}
        <div className="text-xs text-muted-foreground pt-1 flex items-center justify-between border-t border-border/30">
          <span>Created {format(new Date(design.createdAt), "MMM d, yyyy")}</span>
          <span>{design.viewCount || 0} views</span>
        </div>
      </div>
    </Card>
  );
}
