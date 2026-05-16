import { NextRequest, NextResponse } from "next/server";
import { createSessionClient, createServerClient } from "@/lib/supabase-server";
import Stripe from "stripe";

// Called by the payment page after Stripe redirects back with ?session_id=...
// Verifies the session directly with Stripe and marks the payment paid if confirmed.
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return NextResponse.json({ paid: false });
  }

  const admin = createServerClient();
  await admin
    .from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString(), stripe_payment_intent_id: session.payment_intent as string })
    .eq("stripe_session_id", sessionId);

  const clientId = session.metadata?.client_id;
  if (clientId) {
    await admin.from("clients").update({ status: "active" }).eq("id", clientId);
  }

  return NextResponse.json({ paid: true });
}

export async function POST() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();

  const { data: client } = await admin
    .from("clients")
    .select("id, name, company, contracts(id, contract_status, payment_split)")
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const contracts = (client.contracts as Array<{ id: string; contract_status: string; payment_split: Record<string, number> }>) ?? [];
  const contract = contracts.find((c) => c.contract_status === "signed");
  if (!contract) return NextResponse.json({ error: "No signed contract found" }, { status: 400 });

  const upfrontCents = contract.payment_split?.upfront_cents ?? 0;
  if (upfrontCents <= 0) return NextResponse.json({ error: "No payment amount found" }, { status: 400 });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://a1group.it.com";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: upfrontCents,
          product_data: {
            name: `A1 Group — ${client.company} — Initial Payment`,
            description: "Deposit per signed service agreement",
          },
        },
        quantity: 1,
      },
    ],
    customer_email: user.email ?? undefined,
    success_url: `${baseUrl}/portal/payment?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/portal/payment`,
    metadata: { client_id: client.id, contract_id: contract.id },
  });

  await admin.from("payments").insert({
    client_id: client.id,
    contract_id: contract.id,
    stripe_session_id: checkoutSession.id,
    amount_cents: upfrontCents,
    status: "pending",
    payment_type: "upfront",
  });

  return NextResponse.json({ url: checkoutSession.url });
}
