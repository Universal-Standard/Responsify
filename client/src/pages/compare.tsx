import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getAllDesigns, type SavedDesign } from "@/lib/api";
import { ArrowLeftRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { DeviceFrame } from "@/components/preview/DeviceFrame";

export default function Compare() {
  const [design1Id, setDesign1Id] = useState<string>("");
  const [design2Id, setDesign2Id] = useState<string>("");

  const { data: designs = [] } = useQuery({
    queryKey: ["designs"],
    queryFn: getAllDesigns,
  });

  const design1 = designs.find(d => d.id === design1Id);
  const design2 = designs.find(d => d.id === design2Id);

  // Auto-select first two designs if available
  useEffect(() => {
    if (designs.length >= 2 && !design1Id && !design2Id) {
      setDesign1Id(designs[0].id);
      setDesign2Id(designs[1].id);
    }
  }, [designs, design1Id, design2Id]);

  const compareScores = (score1?: number | null, score2?: number | null) => {
    if (!score1 || !score2) return { diff: 0, trend: "neutral" as const };
    const diff = score1 - score2;
    if (diff > 5) return { diff, trend: "up" as const };
    if (diff < -5) return { diff, trend: "down" as const };
    return { diff, trend: "neutral" as const };
  };

  const getTrendIcon = (trend: "up" | "down" | "neutral") => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Compare Designs</h1>
          <p className="text-muted-foreground">Side-by-side comparison of your saved designs</p>
        </div>

        {/* Design Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-4">
            <label className="text-sm font-medium mb-2 block">Design 1</label>
            <Select value={design1Id} onValueChange={setDesign1Id}>
              <SelectTrigger>
                <SelectValue placeholder="Select first design" />
              </SelectTrigger>
              <SelectContent>
                {designs.map(design => (
                  <SelectItem key={design.id} value={design.id}>
                    {design.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          <Card className="p-4">
            <label className="text-sm font-medium mb-2 block">Design 2</label>
            <Select value={design2Id} onValueChange={setDesign2Id}>
              <SelectTrigger>
                <SelectValue placeholder="Select second design" />
              </SelectTrigger>
              <SelectContent>
                {designs.map(design => (
                  <SelectItem key={design.id} value={design.id}>
                    {design.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        </div>

        {design1 && design2 ? (
          <>
            {/* Score Comparison */}
            <Card className="p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-primary" />
                Score Comparison
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Analysis Score</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-lg font-bold">
                      {design1.analysisScore || 0}
                    </Badge>
                    {getTrendIcon(compareScores(design1.analysisScore, design2.analysisScore).trend)}
                    <Badge variant="secondary" className="text-lg font-bold">
                      {design2.analysisScore || 0}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Difference: {Math.abs(compareScores(design1.analysisScore, design2.analysisScore).diff).toFixed(0)} points
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Readability</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-lg font-bold">
                      {design1.readabilityScore || 0}
                    </Badge>
                    {getTrendIcon(compareScores(design1.readabilityScore, design2.readabilityScore).trend)}
                    <Badge variant="secondary" className="text-lg font-bold">
                      {design2.readabilityScore || 0}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Difference: {Math.abs(compareScores(design1.readabilityScore, design2.readabilityScore).diff).toFixed(0)} points
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">View Count</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-lg font-bold">
                      {design1.viewCount || 0}
                    </Badge>
                    {getTrendIcon(compareScores(design1.viewCount, design2.viewCount).trend)}
                    <Badge variant="outline" className="text-lg font-bold">
                      {design2.viewCount || 0}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="flex items-center gap-2">
                    <Badge>{design1.status}</Badge>
                    <Badge>{design2.status}</Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* Side-by-Side Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg">{design1.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{design1.originalUrl}</p>
                </div>
                {design1.mobileHtml ? (
                  <DeviceFrame device="mobile" content={design1.mobileHtml} />
                ) : (
                  <div className="aspect-[9/16] bg-secondary/10 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">No preview available</p>
                  </div>
                )}
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(design1.createdAt).toLocaleDateString()}</span>
                  </div>
                  {design1.pageTitle && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Page Title:</span>
                      <span className="truncate ml-2">{design1.pageTitle}</span>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg">{design2.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{design2.originalUrl}</p>
                </div>
                {design2.mobileHtml ? (
                  <DeviceFrame device="mobile" content={design2.mobileHtml} />
                ) : (
                  <div className="aspect-[9/16] bg-secondary/10 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">No preview available</p>
                  </div>
                )}
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(design2.createdAt).toLocaleDateString()}</span>
                  </div>
                  {design2.pageTitle && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Page Title:</span>
                      <span className="truncate ml-2">{design2.pageTitle}</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </>
        ) : (
          <Card className="p-12 text-center">
            <ArrowLeftRight className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Select Designs to Compare</h3>
            <p className="text-muted-foreground">
              {designs.length < 2 
                ? "You need at least 2 saved designs to use the comparison feature"
                : "Choose two designs from the dropdowns above to start comparing"
              }
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
