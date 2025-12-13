import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Toolbar } from "@/components/layout/Toolbar";
import { UrlInput } from "@/components/analysis/UrlInput";
import { DeviceFrame } from "@/components/preview/DeviceFrame";
import { EditorPanel } from "@/components/preview/EditorPanel";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import generatedImage from '@assets/generated_images/subtle_geometric_tech_pattern_background_with_soft_purple_and_teal_gradients.png';

// Extract domain from URL for content selection
const getDomainCategory = (url: string): string => {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    if (domain.includes("n8n")) return "workflow";
    if (domain.includes("stripe")) return "fintech";
    if (domain.includes("airbnb")) return "travel";
    if (domain.includes("linear")) return "productivity";
    if (domain.includes("github")) return "code";
    if (domain.includes("notion")) return "productivity";
    return "default";
  } catch {
    return "default";
  }
};

// Mock Component for preview content based on domain
interface MockContentProps {
  category?: string;
}

const MockContent = ({ category = "default" }: MockContentProps) => {
  // Workflow/Automation content (for n8n, etc.)
  if (category === "workflow") {
    return (
      <div className="p-6 space-y-6 font-sans">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
            ⚙️ Workflow Automation
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Workflow Builder</h1>
          <p className="text-gray-600">Connect your apps and automate tasks</p>
          <button className="w-full bg-orange-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-orange-600/30 active:scale-95 transition-transform">
            Create Workflow
          </button>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Recent Workflows</h2>
          {[
            { name: "Slack Notifications", status: "Active", trigger: "Webhook" },
            { name: "Email Parser", status: "Active", trigger: "Gmail" },
            { name: "Data Sync", status: "Inactive", trigger: "API" },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">{item.name}</div>
                <div className="text-xs text-gray-500">{item.trigger}</div>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${item.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {item.status}
              </div>
            </div>
          ))}
        </section>
      </div>
    );
  }

  // Productivity content (for Linear, Notion, etc.)
  if (category === "productivity") {
    return (
      <div className="p-6 space-y-6 font-sans">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
            📋 Workspace
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Your Projects</h1>
          <p className="text-gray-600">Manage tasks and collaborate with your team</p>
          <button className="w-full bg-purple-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-purple-600/30 active:scale-95 transition-transform">
            New Project
          </button>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Current Projects</h2>
          {[
            { name: "Q1 Roadmap", items: 12, status: "In Progress" },
            { name: "Design System", items: 8, status: "In Progress" },
            { name: "Documentation", items: 5, status: "Planning" },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-900">{item.name}</div>
                <div className="text-xs text-gray-500">{item.items} tasks</div>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 w-[60%]" />
              </div>
            </div>
          ))}
        </section>
      </div>
    );
  }

  // Travel content (for Airbnb, etc.)
  if (category === "travel") {
    return (
      <div className="p-6 space-y-6 font-sans">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
            ✈️ Travel
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Find Your Next Stay</h1>
          <p className="text-gray-600">Discover unique places around the world</p>
          <div className="flex gap-2">
            <input type="text" placeholder="Where to?" className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-sm" />
            <button className="bg-red-600 text-white font-semibold px-6 py-3 rounded-lg">Search</button>
          </div>
        </header>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Popular Stays</h2>
          {[
            { name: "Beach Villa", price: "$245", rating: 4.8 },
            { name: "City Apartment", price: "$189", rating: 4.6 },
            { name: "Mountain Cabin", price: "$320", rating: 5.0 },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="h-24 bg-gradient-to-br from-red-400 to-orange-400 rounded-lg mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-600">{item.price}/night</div>
                </div>
                <div className="text-sm font-medium text-gray-900">⭐ {item.rating}</div>
              </div>
            </div>
          ))}
        </section>
      </div>
    );
  }

  // Default banking content
  return (
    <div className="p-6 space-y-8 font-sans">
      <header className="space-y-4 text-center">
        <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-2xl mx-auto shadow-xl mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
          Modern Banking for <span className="text-blue-600">Everyone</span>
        </h1>
        <p className="text-gray-600 leading-relaxed">
          Experience the future of finance with zero fees, instant transfers, and smart analytics.
        </p>
        <button className="w-full bg-blue-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-600/30 active:scale-95 transition-transform">
          Get Started
        </button>
      </header>

      <section className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <div className="text-2xl font-bold text-gray-900">$0</div>
          <div className="text-xs text-gray-500 font-medium">Monthly Fees</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <div className="text-2xl font-bold text-gray-900">4.5%</div>
          <div className="text-xs text-gray-500 font-medium">APY Savings</div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Latest Activity</h2>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">🛍️</div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">Grocery Store</div>
              <div className="text-xs text-gray-500">Today, 12:42 PM</div>
            </div>
            <div className="font-medium text-gray-900">-$64.20</div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default function Home() {
  const [url, setUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [view, setView] = useState<"mobile" | "tablet" | "desktop">("mobile");

  const handleAnalyze = (inputUrl: string) => {
    setIsAnalyzing(true);
    // Simulate AI delay
    setTimeout(() => {
      setIsAnalyzing(false);
      setUrl(inputUrl);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans overflow-hidden">
      <Header />

      <main className="flex-1 flex flex-col relative">
        {/* Background Texture */}
        <div 
            className="absolute inset-0 z-0 opacity-40 pointer-events-none"
            style={{
                backgroundImage: `url(${generatedImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        />

        <AnimatePresence mode="wait">
          {!url ? (
            // Empty State / Hero
            <motion.div 
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center px-4 relative z-10"
            >
              <div className="text-center max-w-3xl mx-auto space-y-6 mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />
                  <span>AI-Powered Conversion Engine 2.0</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-foreground">
                  Transform any website into a <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    perfect mobile experience
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Our AI engine analyzes desktop layouts and intelligently reconstructs them for mobile devices, preserving functionality while optimizing UX.
                </p>
              </div>

              <div className="w-full max-w-xl relative z-20">
                <UrlInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
              </div>
            </motion.div>
          ) : (
            // Workspace
            <motion.div 
              key="workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col h-full z-10"
            >
              <Toolbar currentView={view} onViewChange={setView} />
              
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 bg-muted/30 relative">
                  {/* Grid Pattern */}
                  <div className="absolute inset-0 z-0 opacity-[0.03]" 
                       style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
                  />
                  
                  <DeviceFrame type={view}>
                    <MockContent category={url ? getDomainCategory(url) : "default"} />
                  </DeviceFrame>
                </div>
                
                <EditorPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
