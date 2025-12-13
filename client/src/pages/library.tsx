import { motion } from "framer-motion";
import { FileText, Trash2, ExternalLink, Copy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock saved designs
const savedDesigns = [
  {
    id: 1,
    name: "Stripe Checkout Flow",
    url: "https://stripe.com",
    dateCreated: "2025-01-10",
    views: 12,
    score: 98,
    preview: "Modern fintech design with clean typography",
  },
  {
    id: 2,
    name: "Airbnb Property Listing",
    url: "https://airbnb.com",
    dateCreated: "2025-01-08",
    views: 8,
    score: 95,
    preview: "Gallery and booking flow optimized",
  },
  {
    id: 3,
    name: "Linear Issue Tracker",
    url: "https://linear.app",
    dateCreated: "2025-01-05",
    views: 5,
    score: 97,
    preview: "Minimal UI with keyboard shortcuts",
  },
];

export default function Library() {
  return (
    <div className="min-h-screen bg-background">
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
              <TabsTrigger value="all">All ({savedDesigns.length})</TabsTrigger>
              <TabsTrigger value="starred">Starred (2)</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="search"
              placeholder="Search designs..."
              className="flex-1 sm:flex-initial px-4 py-2 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button size="sm" className="bg-primary text-primary-foreground">
              New Design
            </Button>
          </div>
        </div>

        {/* Designs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedDesigns.map((design, idx) => (
            <motion.div
              key={design.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="glass-card group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300" data-testid={`card-design-${design.id}`}>
                {/* Preview Area */}
                <div className="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="w-12 h-12 text-primary/30 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="absolute top-2 right-2">
                    <button className="p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors opacity-0 group-hover:opacity-100">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground line-clamp-1">{design.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{design.url}</p>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">{design.preview}</p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Conversion Score</span>
                    <span className="font-semibold text-secondary">{design.score}%</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-border/50">
                    <Button variant="secondary" size="sm" className="flex-1 gap-2 h-8 text-xs" data-testid={`btn-open-${design.id}`}>
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" data-testid={`btn-copy-${design.id}`}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" data-testid={`btn-delete-${design.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Meta */}
                  <div className="text-xs text-muted-foreground pt-1 flex items-center justify-between border-t border-border/30">
                    <span>Created {design.dateCreated}</span>
                    <span>{design.views} views</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State (commented out - for when no designs exist) */}
        {/* <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No designs yet</h3>
          <p className="text-muted-foreground mb-6">Start by converting a website to save it to your library</p>
          <Button className="bg-primary text-primary-foreground">
            Convert Your First Website
          </Button>
        </div> */}
      </div>
    </div>
  );
}
