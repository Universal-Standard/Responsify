import Stripe from 'stripe';

// Initialize Stripe with API key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

/**
 * Create a Stripe Checkout Session for subscription
 */
export async function createCheckoutSession(
  priceId: string,
  userId: string,
  userEmail?: string
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.APP_URL || 'http://localhost:5000'}/settings?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL || 'http://localhost:5000'}/settings`,
    customer_email: userEmail,
    client_reference_id: userId,
    metadata: {
      userId,
    },
  });

  return session;
}

/**
 * Create a Stripe Customer Portal session for managing subscriptions
 */
export async function createPortalSession(
  customerId: string,
  returnUrl?: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl || `${process.env.APP_URL || 'http://localhost:5000'}/settings`,
  });

  return session;
}

/**
 * Retrieve a subscription by ID
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Resume a canceled subscription
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

/**
 * Create a Stripe customer
 */
export async function createCustomer(
  email: string,
  userId: string
): Promise<Stripe.Customer> {
  return await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });
}

export { stripe };
