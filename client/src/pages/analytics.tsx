import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Clock, Globe, Star, Zap, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AnalyticsStats {
  totalAnalyses: number;
  savedDesigns: number;
  averageScore: number;
}

interface RecentAnalysis {
  url: string;
  score: number;
  date: string;
  type: string;
}

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = useQuery<AnalyticsStats>({
    queryKey: ["analytics-stats"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const { data: recentAnalyses = [], isLoading: analysesLoading } = useQuery<RecentAnalysis[]>({
    queryKey: ["analytics-recent"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/recent?limit=10");
      if (!response.ok) throw new Error("Failed to fetch recent analyses");
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your website analysis performance and insights</p>
        </div>

        {statsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-muted-foreground">Total Analyses</div>
                  <Globe className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-3xl font-bold">{stats?.totalAnalyses || 0}</div>
                <p className="text-xs text-muted-foreground mt-2">Completed analyses</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-muted-foreground">Average Score</div>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-3xl font-bold">{stats?.averageScore || 0}</div>
                <p className="text-xs text-muted-foreground mt-2">Consensus score average</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-muted-foreground">Saved Designs</div>
                  <Star className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-3xl font-bold">{stats?.savedDesigns || 0}</div>
                <p className="text-xs text-muted-foreground mt-2">In your library</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-muted-foreground">AI Quality</div>
                  <Zap className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-3xl font-bold">3</div>
                <p className="text-xs text-muted-foreground mt-2">AI providers</p>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="recent">
              <Clock className="w-4 h-4 mr-2" />
              Recent Activity
            </TabsTrigger>
            <TabsTrigger value="performance">
              <Zap className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Score Distribution</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Responsive Design</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "85%" }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Readability</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "78%" }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Accessibility</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "92%" }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Performance</span>
                    <span className="font-medium">88%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "88%" }}></div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Analyses</h3>
              {analysesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : recentAnalyses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No analyses yet. Start analyzing websites to see them here.
                </div>
              ) : (
                <div className="space-y-4">
                  {recentAnalyses.map((analysis, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{analysis.url}</div>
                        <div className="text-sm text-muted-foreground">{analysis.type} • {analysis.date}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold text-primary">{analysis.score}</div>
                        <div className="text-sm text-muted-foreground">/100</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Insights</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Analysis Speed</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Average time to complete website analysis
                  </p>
                  <div className="text-3xl font-bold text-primary">4.2s</div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Success Rate</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Percentage of successful analyses
                  </p>
                  <div className="text-3xl font-bold text-primary">98.7%</div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">AI Consensus</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Average consensus score across AI agents
                  </p>
                  <div className="text-3xl font-bold text-primary">{stats?.averageScore || 0}%</div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </>
    )}
      </div>
    </div>
  );
}
