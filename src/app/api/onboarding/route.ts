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

  const { error: onboardingError } = await supabase
    .from("onboarding_responses")
    .insert({ client_id, ...formData });

  if (onboardingError) {
    return NextResponse.json({ error: onboardingError.message }, { status: 500 });
  }

  await supabase
    .from("clients")
    .update({ status: "onboarding" })
    .eq("id", client_id);

  // Get client name for email
  const { data: client } = await supabase
    .from("clients")
    .select("name, company")
    .eq("id", client_id)
    .single();

  // Send notification email
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
            <p style="color: rgba(255,255,255,0.5); margin: 4px 0 0; font-size: 14px;">${client?.name ?? "A client"} just completed their onboarding form.</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            ${formData.company_name ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px; width: 140px;">Company</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #111; font-size: 14px; font-weight: 600;">${formData.company_name}</td></tr>` : ""}
            ${formData.industry ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">Industry</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #111; font-size: 14px;">${formData.industry}</td></tr>` : ""}
            ${formData.instagram_handle ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">Instagram</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #111; font-size: 14px;">@${formData.instagram_handle}</td></tr>` : ""}
            ${formData.main_goal ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">Main Goal</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #111; font-size: 14px;">${formData.main_goal}</td></tr>` : ""}
            ${formData.monthly_budget ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">Budget</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #111; font-size: 14px;">${formData.monthly_budget}</td></tr>` : ""}
          </table>
          <a href="https://a1group.it.com/admin/clients" style="display: inline-block; margin-top: 24px; background: #c9a84c; color: #0a1628; font-weight: bold; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-size: 14px;">View in Admin Panel →</a>
        </div>
      `,
    });
  } catch (_) {
    // Don't fail the request if email fails
  }

  return NextResponse.json({ success: true });
}
