import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Globe,
  FolderKanban,
  History,
  Settings as SettingsIcon,
  Plus
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {user?.displayName || user?.username}!
          </h1>
          <p className="text-muted-foreground text-lg">
            Here's what's happening with your website analyses
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Analyses"
            value="0"
            description="All time"
            icon={<BarChart3 className="w-5 h-5" />}
            trend="+0% from last month"
          />
          <StatsCard
            title="Projects"
            value="0"
            description="Active projects"
            icon={<FolderKanban className="w-5 h-5" />}
            trend="0 shared"
          />
          <StatsCard
            title="Avg. Score"
            value="—"
            description="Responsiveness"
            icon={<TrendingUp className="w-5 h-5" />}
            trend="No data yet"
          />
          <StatsCard
            title="This Month"
            value="0"
            description="Analyses run"
            icon={<Zap className="w-5 h-5" />}
            trend={
              user?.subscriptionTier === "free" 
                ? "10 remaining" 
                : user?.subscriptionTier === "pro"
                ? "100 remaining"
                : "Unlimited"
            }
          />
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with your responsive website analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Link href="/">
              <Button size="lg">
                <Plus className="w-4 h-4 mr-2" />
                New Analysis
              </Button>
            </Link>
            <Link href="/history">
              <Button size="lg" variant="outline">
                <History className="w-4 h-4 mr-2" />
                View History
              </Button>
            </Link>
            <Link href="/projects">
              <Button size="lg" variant="outline">
                <FolderKanban className="w-4 h-4 mr-2" />
                Manage Projects
              </Button>
            </Link>
            <Link href="/settings">
              <Button size="lg" variant="outline">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
            <CardDescription>
              Your most recent website analyses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No analyses yet</p>
              <p className="text-sm mb-4">
                Start by analyzing your first website
              </p>
              <Link href="/">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Analyze Website
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Info */}
        {user?.subscriptionTier === "free" && (
          <Card className="mt-8 border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle>Upgrade to Pro</CardTitle>
              <CardDescription>
                Get more analyses, advanced features, and priority support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Pro plan includes:
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• 100 analyses per month</li>
                    <li>• Scheduled monitoring</li>
                    <li>• Team collaboration</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
                <Button size="lg">
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend: string;
}

function StatsCard({ title, value, description, icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        <p className="text-xs text-muted-foreground mt-2">{trend}</p>
      </CardContent>
    </Card>
  );
}
