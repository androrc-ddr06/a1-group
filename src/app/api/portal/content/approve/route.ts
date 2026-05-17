import { NextRequest, NextResponse } from "next/server";
import { createSessionClient, createServerClient } from "@/lib/supabase-server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { batch_id } = await req.json();
  if (!batch_id) return NextResponse.json({ error: "batch_id required" }, { status: 400 });

  const admin = createServerClient();

  const { data: client } = await admin
    .from("clients")
    .select("id, name, company")
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { data: batch } = await admin
    .from("content_batches")
    .select("id, label, drive_url, status")
    .eq("id", batch_id)
    .eq("client_id", client.id)
    .single();

  if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  if (batch.status === "approved") return NextResponse.json({ error: "Already approved" }, { status: 400 });

  const { error } = await admin
    .from("content_batches")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", batch_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://a1group.it.com";
    await resend.emails.send({
      from: "A1 Group Portal <onboarding@resend.dev>",
      to: process.env.NOTIFICATION_EMAIL ?? "andro.rc06@gmail.com",
      subject: `✅ ${client.name} approved their content — ${batch.label}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: #0a1628; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
            <h2 style="color: #c9a84c; margin: 0;">Content Approved</h2>
            <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 14px;">
              <strong style="color: white;">${client.name}</strong> (${client.company}) approved their content batch.
            </p>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="color: #718096; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.05em;">Batch</p>
            <p style="color: #1a202c; font-size: 15px; font-weight: 600; margin: 0 0 12px;">${batch.label}</p>
            <a href="${batch.drive_url}" style="color: #c9a84c; font-size: 14px; word-break: break-all;">${batch.drive_url}</a>
          </div>
          <a href="${baseUrl}/admin/clients/${client.id}" style="display: inline-block; background: #c9a84c; color: #0a1628; font-weight: bold; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-size: 14px;">View Client →</a>
        </div>
      `,
    });
  } catch { /* don't fail if email errors */ }

  return NextResponse.json({ ok: true });
}
