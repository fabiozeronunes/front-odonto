import Stripe from "stripe";
import { Request } from "express";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { ConflictError, NotFoundError } from "../../utils/errors.js";
import type { CreateCheckoutInput } from "./checkout.validators.js";

let stripeClient: Stripe | null = null;

function getStripe(): Stripe | null {
  if (!env.paymentGatewaySecret) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(env.paymentGatewaySecret);
  }
  return stripeClient;
}

function addBillingPeriod(billing: "MONTHLY" | "YEARLY", from: Date) {
  const date = new Date(from);
  if (billing === "YEARLY") {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date;
}

export async function createCheckout(userId: string, input: CreateCheckoutInput) {
  const plan = await prisma.membershipPlan.findUnique({ where: { id: input.planId } });
  if (!plan) throw new NotFoundError("Plano não encontrado");
  if (plan.status !== "ACTIVE") throw new ConflictError("Plano indisponível");
  if (plan.slug === "gratuito") throw new ConflictError("O plano gratuito não requer checkout");

  const amount = Number(plan.price);

  const order = await prisma.order.create({
    data: {
      userId,
      status: "PENDING",
      subtotal: amount,
      discount: 0,
      total: amount,
    },
    select: { id: true, status: true, total: true, createdAt: true },
  });

  await prisma.subscription.upsert({
    where: { userId_planId: { userId, planId: plan.id } },
    update: { status: "PENDING" },
    create: { userId, planId: plan.id, status: "PENDING" },
  });

  const stripe = getStripe();
  let checkoutSessionId: string | null = null;
  let checkoutUrl: string | null = null;

  if (stripe) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: plan.name,
                description: `Assinatura ${plan.billing === "MONTHLY" ? "mensal" : "anual"}`,
              },
              unit_amount: Math.round(amount * 100), // Stripe uses cents
              recurring: {
                interval: plan.billing === "MONTHLY" ? "month" : "year",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${env.webUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.webUrl}/checkout/cancel`,
        client_reference_id: order.id,
        customer_email: undefined, // Will be set from user data if needed
        metadata: {
          orderId: order.id,
          userId,
          planId: plan.id,
        },
      });

      checkoutSessionId = session.id;
      checkoutUrl = session.url;
    } catch (err) {
      console.error("[CHECKOUT] Failed to create Stripe session:", err);
    }
  }

  return {
    orderId: order.id,
    amount,
    plan: {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      price: amount,
      billing: plan.billing,
      benefits: plan.benefits,
    },
    gateway: env.paymentGateway || null,
    checkoutSessionId,
    checkoutUrl,
    status: "PENDING",
  };
}

export async function confirmCheckout(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
  if (!order) throw new NotFoundError("Pedido não encontrado");
  if (order.status !== "PENDING") throw new ConflictError("Pedido já processado");

  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });
  if (!subscription) {
    throw new ConflictError("Nenhuma assinatura pendente para confirmar");
  }

  const startsAt = new Date();
  const endsAt = addBillingPeriod(subscription.plan.billing, startsAt);

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: "PAID" } }),
    prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "ACTIVE", startsAt, endsAt },
    }),
    prisma.user.update({ where: { id: userId }, data: { planId: subscription.planId } }),
  ]);

  const referred = await prisma.user.findUnique({
    where: { id: userId },
    select: { referredById: true },
  });

  if (referred?.referredById) {
    const affiliate = await prisma.user.findUnique({
      where: { id: referred.referredById },
      select: { id: true, isAffiliate: true, commissionRate: true },
    });
    if (affiliate?.isAffiliate) {
      const existing = await prisma.affiliateCommission.findFirst({
        where: {
          affiliateId: affiliate.id,
          referredUserId: userId,
          status: "PENDING",
        },
      });
      if (!existing) {
        const amount = Math.round(Number(order.total) * Number(affiliate.commissionRate)) / 100;
        await prisma.affiliateCommission.create({
          data: {
            affiliateId: affiliate.id,
            referredUserId: userId,
            amount,
            percent: Number(affiliate.commissionRate),
            source: "PLAN",
            planName: subscription.plan.name,
          },
        });
      }
    }
  }

  return {
    ok: true,
    orderId: order.id,
    planId: subscription.planId,
    planName: subscription.plan.name,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
}

export async function getMyFinance(userId: string) {
  const [subscriptions, orders] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        startsAt: true,
        endsAt: true,
        createdAt: true,
        plan: {
          select: { id: true, name: true, slug: true, price: true, billing: true },
        },
      },
    }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        subtotal: true,
        discount: true,
        total: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            product: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    }),
  ]);

  return { subscriptions, orders };
}

export async function handleWebhook(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    console.warn("[WEBHOOK] Stripe not configured. Webhook ignored.");
    return { ok: false, message: "Payment gateway not configured" };
  }

  const sig = req.headers["stripe-signature"] as string;
  if (!sig) {
    return { ok: false, message: "Missing stripe-signature header" };
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      (req as any).rawBody || JSON.stringify(req.body),
      sig,
      env.paymentGatewaySecret
    );
  } catch (err) {
    console.error("[WEBHOOK] Signature verification failed:", err);
    return { ok: false, message: "Invalid signature" };
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.client_reference_id;
    const userId = session.metadata?.userId;

    if (orderId && userId) {
      try {
        await confirmCheckout(userId, orderId);
        console.log(`[WEBHOOK] Order ${orderId} confirmed via Stripe`);
      } catch (err) {
        console.error(`[WEBHOOK] Failed to confirm order ${orderId}:`, err);
      }
    }
  }

  return { ok: true };
}
