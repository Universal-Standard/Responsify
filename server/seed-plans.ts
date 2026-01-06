import { db } from "./db";
import { subscriptionPlans } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Seeds the database with default subscription plans
 * Run this after database initialization
 */
export async function seedSubscriptionPlans() {
  const plans = [
    {
      name: "Free",
      description: "Get started with basic features",
      stripePriceId: "price_free",
      price: 0,
      currency: "usd",
      interval: "month",
      analysesPerMonth: 5,
      maxSavedDesigns: 3,
      features: JSON.stringify([
        "5 website analyses per month",
        "3 saved designs",
        "Basic AI analysis",
        "Standard support"
      ]),
      isActive: true,
    },
    {
      name: "Pro",
      description: "Perfect for professionals",
      stripePriceId: process.env.STRIPE_PRICE_ID_PRO || "price_pro_default",
      price: 1900,
      currency: "usd",
      interval: "month",
      analysesPerMonth: 50,
      maxSavedDesigns: 50,
      features: JSON.stringify([
        "50 website analyses per month",
        "50 saved designs",
        "Advanced AI analysis with all 3 providers",
        "Design versioning",
        "Comparison tools",
        "Priority support"
      ]),
      isActive: true,
    },
    {
      name: "Enterprise",
      description: "For teams and agencies",
      stripePriceId: process.env.STRIPE_PRICE_ID_ENTERPRISE || "price_enterprise_default",
      price: 9900,
      currency: "usd",
      interval: "month",
      analysesPerMonth: -1, // unlimited
      maxSavedDesigns: -1, // unlimited
      features: JSON.stringify([
        "Unlimited website analyses",
        "Unlimited saved designs",
        "Advanced AI analysis",
        "Team collaboration",
        "API access",
        "White-label options",
        "Dedicated support"
      ]),
      isActive: true,
    },
  ];

  for (const plan of plans) {
    try {
      // Check if plan already exists
      const existing = await db.select().from(subscriptionPlans)
        .where(eq(subscriptionPlans.stripePriceId, plan.stripePriceId))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(subscriptionPlans).values(plan);
        console.log(`✓ Created subscription plan: ${plan.name}`);
      } else {
        console.log(`→ Subscription plan already exists: ${plan.name}`);
      }
    } catch (error) {
      console.error(`✗ Failed to create plan ${plan.name}:`, error);
    }
  }
  
  console.log('Subscription plans seeded successfully');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSubscriptionPlans()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}
