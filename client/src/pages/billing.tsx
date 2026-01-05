import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Check, Zap, Crown, Building2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  analysesPerMonth: number;
  maxSavedDesigns: number;
  features: string[];
  stripePriceId: string;
  isActive: boolean;
}

export default function Billing() {
  const { toast } = useToast();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const { data: plans = [], isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["billing-plans"],
    queryFn: async () => {
      const response = await fetch("/api/billing/plans");
      if (!response.ok) {
        throw new Error("Failed to fetch plans");
      }
      return response.json();
    },
  });

  const handleSubscribe = async (priceId: string, planId: string) => {
    setLoadingPlanId(planId);
    try {
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
      setLoadingPlanId(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch("/api/billing/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });

      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive",
      });
    }
  };

  const getPlanIcon = (planName: string) => {
    if (planName === "Free") return <Zap className="w-8 h-8 text-primary" />;
    if (planName === "Pro") return <Crown className="w-8 h-8 text-primary" />;
    return <Building2 className="w-8 h-8 text-primary" />;
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return "Free";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock the full power of ResponsiAI with our flexible subscription plans
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`p-8 relative ${
                    plan.name === "Pro" 
                      ? "border-primary shadow-lg scale-105" 
                      : ""
                  }`}
                >
                  {plan.name === "Pro" && (
                    <Badge className="absolute top-4 right-4 bg-primary">
                      Most Popular
                    </Badge>
                  )}
                  
                  <div className="text-center mb-6">
                    {getPlanIcon(plan.name)}
                    <h3 className="text-2xl font-bold mt-4 mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold">
                      {formatPrice(plan.price, plan.currency)}
                    </div>
                    {plan.price > 0 && (
                      <div className="text-sm text-muted-foreground">
                        per {plan.interval}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    variant={plan.name === "Pro" ? "default" : "outline"}
                    disabled={loadingPlanId === plan.id || plan.price === 0}
                    onClick={() => handleSubscribe(plan.stripePriceId, plan.id)}
                  >
                    {loadingPlanId === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : plan.price === 0 ? (
                      "Current Plan"
                    ) : (
                      "Subscribe"
                    )}
                  </Button>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Card className="p-6 max-w-2xl mx-auto">
                <h3 className="text-xl font-semibold mb-3">Already subscribed?</h3>
                <p className="text-muted-foreground mb-4">
                  Manage your subscription, update payment methods, or view invoices
                </p>
                <Button variant="outline" onClick={handleManageBilling}>
                  Manage Billing
                </Button>
              </Card>
            </div>

            <div className="mt-12 text-center text-sm text-muted-foreground">
              <p>All plans include:</p>
              <p className="mt-2">
                • Secure payment processing with Stripe • Cancel anytime • 
                Money-back guarantee • 24/7 customer support
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
