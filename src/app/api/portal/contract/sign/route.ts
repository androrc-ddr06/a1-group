import { NextRequest, NextResponse } from "next/server";
import { createSessionClient, createServerClient } from "@/lib/supabase-server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contract_id } = await req.json();
  if (!contract_id) return NextResponse.json({ error: "contract_id required" }, { status: 400 });

  const admin = createServerClient();

  // Verify contract belongs to this client and is approved
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
    return NextResponse.json({ error: "Contract is not yet approved" }, { status: 400 });
  }

  const { error } = await admin
    .from("contracts")
    .update({ contract_status: "signed", signed_at: new Date().toISOString() })
    .eq("id", contract_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify admin
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://a1group.it.com";
    await resend.emails.send({
      from: "A1 Group Portal <onboarding@resend.dev>",
      to: process.env.NOTIFICATION_EMAIL ?? "andro.rc06@gmail.com",
      subject: `✅ ${client.name} signed their contract`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: #0a1628; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
            <h2 style="color: #c9a84c; margin: 0;">Contract Signed</h2>
            <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 14px;">
              <strong style="color: white;">${client.name}</strong> (${client.company}) has signed their service agreement.
            </p>
          </div>
          <p style="color: #4a5568; font-size: 14px;">They will now be directed to complete payment. Once paid, their dashboard will unlock.</p>
          <a href="${baseUrl}/admin/clients/${client.id}" style="display: inline-block; background: #c9a84c; color: #0a1628; font-weight: bold; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-size: 14px; margin-top: 8px;">View Client →</a>
        </div>
      `,
    });
  } catch { /* don't fail the sign request if email errors */ }

  return NextResponse.json({ success: true });
}
