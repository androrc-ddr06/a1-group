import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { client_id, ...formData } = body;

  if (!client_id) {
    return NextResponse.json({ error: "client_id required" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: saved, error: onboardingError } = await supabase
    .from("onboarding_responses")
    .insert({ client_id, ...formData, ai_brief_status: "pending" })
    .select()
    .single();

  if (onboardingError) {
    return NextResponse.json({ error: onboardingError.message }, { status: 500 });
  }

  await supabase
    .from("clients")
    .update({ status: "onboarding" })
    .eq("id", client_id);

  // Get client info for email
  const { data: client } = await supabase
    .from("clients")
    .select("name, company")
    .eq("id", client_id)
    .single();

  // Send immediate notification email
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "A1 Group Portal <onboarding@resend.dev>",
      to: process.env.NOTIFICATION_EMAIL ?? "andro.rc06@gmail.com",
      subject: `New onboarding submitted — ${client?.company ?? "New Client"}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: #0a1628; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
            <h2 style="color: #c9a84c; margin: 0; font-size: 20px;">New Onboarding Submitted</h2>
            <p style="color: rgba(255,255,255,0.5); margin: 4px 0 0; font-size: 14px;">${client?.name} just completed their onboarding. AI strategy brief is being generated.</p>
          </div>
          <p style="color: #666; font-size: 14px;">You'll receive another email in ~5-10 minutes when the strategy brief is ready.</p>
          <a href="https://a1group.it.com/admin/clients" style="display: inline-block; margin-top: 16px; background: #c9a84c; color: #0a1628; font-weight: bold; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-size: 14px;">View in Admin Panel →</a>
        </div>
      `,
    });
  } catch (_) {}

  // Fire brief generation in background (don't await)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://a1group.it.com";
  fetch(`${baseUrl}/api/onboarding/generate-brief`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ onboarding_id: saved.id }),
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
