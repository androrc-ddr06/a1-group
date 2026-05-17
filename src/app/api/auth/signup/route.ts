import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const { email, password, accessCode } = await req.json();

  if (!email || !password || !accessCode) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const supabase = createServerClient();

  // Validate access code
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, email, access_code, status")
    .eq("access_code", accessCode.toUpperCase())
    .single();

  if (clientError || !client) {
    return NextResponse.json(
      { error: "Invalid access code. Please check the code A1 Group sent you." },
      { status: 400 }
    );
  }

  // Make sure code hasn't been used by a different email
  if (client.email && client.email !== email) {
    return NextResponse.json(
      { error: "This access code is registered to a different email address." },
      { status: 400 }
    );
  }

  // Create Supabase auth user
  const { data: authData, error: signupError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification for now
    user_metadata: { client_id: client.id },
  });

  if (signupError) {
    if (signupError.message.includes("already registered")) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: signupError.message }, { status: 400 });
  }

  // Link auth user to client record
  const { data: fullClient } = await supabase
    .from("clients")
    .update({ auth_user_id: authData.user.id, email })
    .eq("id", client.id)
    .select("name, company")
    .single();

  // Welcome email to client
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const firstName = fullClient?.name?.split(" ")[0] ?? "there";
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://a1group.it.com";
    await resend.emails.send({
      from: "A1 Group Portal <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to your A1 Group client portal",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: #0a1628; padding: 32px; border-radius: 16px; margin-bottom: 24px; text-align: center;">
            <h1 style="color: #c9a84c; margin: 0 0 8px; font-size: 24px;">Welcome, ${firstName}!</h1>
            <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 15px;">Your A1 Group client portal is ready.</p>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #1a202c; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">Here's what you can do from your portal:</p>
            <ul style="color: #4a5568; font-size: 14px; line-height: 2; margin: 0; padding-left: 20px;">
              <li>Track your project progress in real time</li>
              <li>View updates from A1 Group as work progresses</li>
              <li>Share files and brand assets with us</li>
              <li>Review your reports and timeline</li>
            </ul>
          </div>
          <div style="text-align: center;">
            <a href="${baseUrl}/portal/dashboard" style="display: inline-block; background: #c9a84c; color: #0a1628; font-weight: bold; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-size: 15px;">Go to My Portal →</a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 24px; text-align: center;">Questions? Reply to any of our emails or visit <a href="${baseUrl}/#contact" style="color: #c9a84c;">a1group.it.com</a></p>
        </div>
      `,
    });
  } catch { /* don't fail signup if email errors */ }

  return NextResponse.json({ success: true });
}
