import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Code, Book, Zap, Globe, Star, GitBranch } from "lucide-react";

export default function Documentation() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Documentation</h1>
          <p className="text-muted-foreground">Learn how to use ResponsiAI and integrate with the API</p>
        </div>

        <Tabs defaultValue="getting-started" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="getting-started">
              <Zap className="w-4 h-4 mr-2" />
              Getting Started
            </TabsTrigger>
            <TabsTrigger value="api">
              <Code className="w-4 h-4 mr-2" />
              API Reference
            </TabsTrigger>
            <TabsTrigger value="guides">
              <Book className="w-4 h-4 mr-2" />
              Guides
            </TabsTrigger>
            <TabsTrigger value="features">
              <Star className="w-4 h-4 mr-2" />
              Features
            </TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Welcome to ResponsiAI</h2>
              <p className="text-muted-foreground mb-6">
                ResponsiAI is an advanced AI-powered tool that analyzes websites and generates 
                mobile-responsive design conversions using a multi-agent architecture.
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3">Quick Start</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Enter any website URL in the dashboard</li>
                    <li>Click "Analyze" to start the AI analysis</li>
                    <li>Wait for the multi-agent system to process your site</li>
                    <li>Review the generated mobile design and scores</li>
                    <li>Save your favorite designs to the library</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">Key Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-border rounded-lg">
                      <Globe className="w-8 h-8 text-primary mb-2" />
                      <h4 className="font-medium mb-1">Multi-Agent AI</h4>
                      <p className="text-sm text-muted-foreground">
                        3 AI providers working in consensus for optimal results
                      </p>
                    </div>
                    <div className="p-4 border border-border rounded-lg">
                      <Zap className="w-8 h-8 text-primary mb-2" />
                      <h4 className="font-medium mb-1">Real-time Analysis</h4>
                      <p className="text-sm text-muted-foreground">
                        Instant feedback on responsive design quality
                      </p>
                    </div>
                    <div className="p-4 border border-border rounded-lg">
                      <Star className="w-8 h-8 text-primary mb-2" />
                      <h4 className="font-medium mb-1">5 Score Dimensions</h4>
                      <p className="text-sm text-muted-foreground">
                        Consensus, Responsive, Readability, Accessibility, Performance
                      </p>
                    </div>
                    <div className="p-4 border border-border rounded-lg">
                      <GitBranch className="w-8 h-8 text-primary mb-2" />
                      <h4 className="font-medium mb-1">Design Versions</h4>
                      <p className="text-sm text-muted-foreground">
                        Track iteration history and compare versions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">API Reference</h2>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="analyze">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge>POST</Badge>
                      <code className="text-sm">/api/analyze</code>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <p className="text-muted-foreground">Start analyzing a URL</p>
                      <div>
                        <h4 className="font-medium mb-2">Request Body</h4>
                        <pre className="bg-secondary p-4 rounded-lg overflow-x-auto">
{`{
  "url": "https://example.com"
}`}
                        </pre>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Response</h4>
                        <pre className="bg-secondary p-4 rounded-lg overflow-x-auto">
{`{
  "jobId": "uuid",
  "status": "analyzing",
  "message": "Analysis started"
}`}
                        </pre>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="get-analysis">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">GET</Badge>
                      <code className="text-sm">/api/analyze/:jobId</code>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <p className="text-muted-foreground">Get the status and results of an analysis job</p>
                      <div>
                        <h4 className="font-medium mb-2">Response</h4>
                        <pre className="bg-secondary p-4 rounded-lg overflow-x-auto text-xs">
{`{
  "id": "uuid",
  "url": "https://example.com",
  "status": "completed",
  "responsiveScore": 85,
  "readabilityScore": 78,
  "consensusScore": 82,
  "accessibilityScore": 90,
  "performanceScore": 88,
  "mobileConversion": "<html>...</html>",
  "suggestions": [...]
}`}
                        </pre>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="save-design">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge>POST</Badge>
                      <code className="text-sm">/api/designs</code>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <p className="text-muted-foreground">Save a completed analysis as a design</p>
                      <div>
                        <h4 className="font-medium mb-2">Request Body</h4>
                        <pre className="bg-secondary p-4 rounded-lg overflow-x-auto">
{`{
  "jobId": "uuid",
  "name": "My Website Design"
}`}
                        </pre>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="get-designs">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">GET</Badge>
                      <code className="text-sm">/api/designs</code>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <p className="text-muted-foreground">Get all saved designs</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="versions">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">GET</Badge>
                      <code className="text-sm">/api/versions/:jobId</code>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <p className="text-muted-foreground">Get all design versions for an analysis job</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </TabsContent>

          <TabsContent value="guides" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Usage Guides</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3">Understanding Scores</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-1">Consensus Score</h4>
                      <p className="text-sm text-muted-foreground">
                        Agreement level between multiple AI agents on design quality (80+ is excellent)
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Responsive Score</h4>
                      <p className="text-sm text-muted-foreground">
                        How well the design adapts to different screen sizes
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Readability Score</h4>
                      <p className="text-sm text-muted-foreground">
                        Text clarity, typography, and content hierarchy
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Accessibility Score</h4>
                      <p className="text-sm text-muted-foreground">
                        WCAG compliance and support for assistive technologies
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Performance Score</h4>
                      <p className="text-sm text-muted-foreground">
                        Load time, optimization, and rendering efficiency
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">Best Practices</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Start with well-structured websites for best results</li>
                    <li>Review AI suggestions and iterate on designs</li>
                    <li>Compare multiple versions before finalizing</li>
                    <li>Test generated designs on real devices</li>
                    <li>Save designs to track improvement over time</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Feature Roadmap</h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-green-500">v1.0 - Available</Badge>
                  </div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Multi-agent AI analysis with 3 providers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span>5-dimensional scoring system</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Design versioning and history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Real-time analysis status</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Design library and management</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-green-500">v1.0 - Available</Badge>
                  </div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Stripe billing integration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Subscription management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Usage analytics dashboard</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-purple-500">v1.2 - Future</Badge>
                  </div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span>🔮</span>
                      <span>Two-factor authentication (2FA)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>🔮</span>
                      <span>Team collaboration features</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>🔮</span>
                      <span>Advanced comparison tools</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
