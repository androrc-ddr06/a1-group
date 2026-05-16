import { NextRequest, NextResponse } from "next/server";
import { createSessionClient, createServerClient } from "@/lib/supabase-server";
import { Resend } from "resend";

export async function PATCH(req: NextRequest) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contract_id, feedback } = await req.json();
  if (!contract_id || !feedback?.trim()) {
    return NextResponse.json({ error: "contract_id and feedback required" }, { status: 400 });
  }

  const admin = createServerClient();

  const { data: client } = await admin
    .from("clients")
    .select("id, name, company")
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { data: contract } = await admin
    .from("contracts")
    .select("id, contract_status")
    .eq("id", contract_id)
    .eq("client_id", client.id)
    .single();

  if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  if (contract.contract_status !== "approved") {
    return NextResponse.json({ error: "Contract must be approved to request changes" }, { status: 400 });
  }

  const { error } = await admin
    .from("contracts")
    .update({ contract_status: "changes_requested", client_feedback: feedback.trim() })
    .eq("id", contract_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "A1 Group Portal <onboarding@resend.dev>",
      to: process.env.NOTIFICATION_EMAIL ?? "andro.rc06@gmail.com",
      subject: `Contract Changes Requested — ${client.company}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: #0a1628; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
            <h2 style="color: #c9a84c; margin: 0; font-size: 20px;">Contract Changes Requested</h2>
            <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 14px;">
              <strong style="color: white;">${client.name}</strong> (${client.company}) has requested changes to their contract.
            </p>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="color: #666; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">Client Feedback</p>
            <p style="color: #1a202c; font-size: 14px; line-height: 1.7; margin: 0;">${feedback.trim()}</p>
          </div>
          <a href="https://a1group.it.com/admin/clients" style="display: inline-block; background: #c9a84c; color: #0a1628; font-weight: bold; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-size: 14px;">Review in Admin Panel →</a>
        </div>
      `,
    });
  } catch (_) {
    // Don't fail the request if email errors
  }

  return NextResponse.json({ success: true });
}
