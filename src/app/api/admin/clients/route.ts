import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { Resend } from "resend";

function isAdmin(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  return secret === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerClient();
  const { data: clients, error } = await supabase
    .from("clients")
    .select("*, projects(*), onboarding_responses(id, ai_brief_status, ai_brief_url, submitted_at), contracts(id, contract_status, contract_html_url, total_amount, created_at, client_feedback)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, company, email, access_code, services, service_timeline, contract_months, admin_notes } = body;

  if (!name || !email || !access_code) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      company,
      email,
      access_code,
      status: "pending",
      services: services ?? [],
      service_timeline: service_timeline ?? [],
      contract_months: contract_months ?? 1,
      admin_notes: admin_notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send welcome email with access code and login instructions
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const firstName = name.split(" ")[0];
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://a1group.it.com";
    await resend.emails.send({
      from: "A1 Group Portal <onboarding@resend.dev>",
      to: email,
      subject: "You're invited to the A1 Group client portal",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: #0a1628; padding: 32px; border-radius: 16px; margin-bottom: 24px; text-align: center;">
            <p style="color: #c9a84c; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px;">A1 Group</p>
            <h1 style="color: white; margin: 0 0 8px; font-size: 24px;">Welcome, ${firstName}!</h1>
            <p style="color: rgba(255,255,255,0.5); margin: 0; font-size: 14px;">Your client portal is ready.</p>
          </div>

          <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
            Alejandro has set up your A1 Group client portal. Use the access code below to create your account and complete your onboarding form — it only takes about 5 minutes.
          </p>

          <div style="background: #f8fafc; border: 2px solid #c9a84c; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
            <p style="color: #718096; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.08em;">Your Access Code</p>
            <p style="color: #0a1628; font-size: 28px; font-weight: 800; font-family: monospace; letter-spacing: 0.15em; margin: 0;">${access_code}</p>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #1a202c; font-size: 14px; font-weight: 700; margin: 0 0 16px;">How to get started:</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="vertical-align: top; padding: 6px 12px 6px 0; width: 28px;">
                  <span style="display: inline-block; background: #0a1628; color: #c9a84c; font-weight: 700; font-size: 12px; width: 22px; height: 22px; border-radius: 50%; text-align: center; line-height: 22px;">1</span>
                </td>
                <td style="vertical-align: top; padding: 6px 0; color: #4a5568; font-size: 14px; line-height: 1.5;">
                  Visit <a href="${baseUrl}/portal/login" style="color: #c9a84c; font-weight: 600;">${baseUrl}/portal/login</a>
                </td>
              </tr>
              <tr>
                <td style="vertical-align: top; padding: 6px 12px 6px 0;">
                  <span style="display: inline-block; background: #0a1628; color: #c9a84c; font-weight: 700; font-size: 12px; width: 22px; height: 22px; border-radius: 50%; text-align: center; line-height: 22px;">2</span>
                </td>
                <td style="vertical-align: top; padding: 6px 0; color: #4a5568; font-size: 14px; line-height: 1.5;">
                  Click <strong style="color: #1a202c;">New Client</strong>
                </td>
              </tr>
              <tr>
                <td style="vertical-align: top; padding: 6px 12px 6px 0;">
                  <span style="display: inline-block; background: #0a1628; color: #c9a84c; font-weight: 700; font-size: 12px; width: 22px; height: 22px; border-radius: 50%; text-align: center; line-height: 22px;">3</span>
                </td>
                <td style="vertical-align: top; padding: 6px 0; color: #4a5568; font-size: 14px; line-height: 1.5;">
                  Enter your email address, choose a password, and paste your access code
                </td>
              </tr>
              <tr>
                <td style="vertical-align: top; padding: 6px 12px 6px 0;">
                  <span style="display: inline-block; background: #0a1628; color: #c9a84c; font-weight: 700; font-size: 12px; width: 22px; height: 22px; border-radius: 50%; text-align: center; line-height: 22px;">4</span>
                </td>
                <td style="vertical-align: top; padding: 6px 0; color: #4a5568; font-size: 14px; line-height: 1.5;">
                  Complete the onboarding form — it takes about 5 minutes and helps us build your strategy
                </td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${baseUrl}/portal/login" style="display: inline-block; background: #c9a84c; color: #0a1628; font-weight: 800; padding: 14px 36px; border-radius: 999px; text-decoration: none; font-size: 15px; letter-spacing: 0.01em;">Create My Account →</a>
          </div>

          <p style="color: #a0aec0; font-size: 12px; text-align: center; margin: 0;">
            Questions? Reply to this email or visit <a href="${baseUrl}/#contact" style="color: #c9a84c;">a1group.it.com</a>
          </p>
        </div>
      `,
    });
  } catch { /* don't fail client creation if email errors */ }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { client_id, services, service_timeline, contract_months, admin_notes } = body;

  if (!client_id) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("clients")
    .update({ services, service_timeline, contract_months, admin_notes })
    .eq("id", client_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
