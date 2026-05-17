import { NextRequest, NextResponse } from "next/server";
import { createSessionClient, createServerClient } from "@/lib/supabase-server";
import { Resend } from "resend";

async function resolveClient(userId: string, userEmail: string | undefined) {
  const admin = createServerClient();
  const { data: client } = await admin
    .from("clients")
    .select("id, name, company")
    .or(`auth_user_id.eq.${userId}${userEmail ? `,email.eq.${userEmail}` : ""}`)
    .single();
  return client ?? null;
}

export async function GET() {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await resolveClient(user.id, user.email ?? undefined);
  const clientId = client?.id ?? null;
  if (!clientId) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const admin = createServerClient();
  const { data: assets } = await admin
    .from("client_assets")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ assets: assets ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await resolveClient(user.id, user.email ?? undefined);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { label, url } = await req.json();
  if (!label?.trim() || !url?.trim()) {
    return NextResponse.json({ error: "label and url are required" }, { status: 400 });
  }

  const admin = createServerClient();
  const { data, error } = await admin
    .from("client_assets")
    .insert({ client_id: client.id, label: label.trim(), url: url.trim(), submitted_by: "client" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify admin
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://a1group.it.com";
    await resend.emails.send({
      from: "A1 Group Portal <onboarding@resend.dev>",
      to: process.env.NOTIFICATION_EMAIL ?? "andro.rc06@gmail.com",
      subject: `📁 ${client.name} shared a file — ${label.trim()}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: #0a1628; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
            <h2 style="color: #c9a84c; margin: 0;">New File Shared</h2>
            <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 14px;">
              <strong style="color: white;">${client.name}</strong> (${client.company}) shared a file with you.
            </p>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="color: #718096; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.05em;">File</p>
            <p style="color: #1a202c; font-size: 15px; font-weight: 600; margin: 0 0 12px;">${label.trim()}</p>
            <a href="${url.trim()}" style="color: #c9a84c; font-size: 14px; word-break: break-all;">${url.trim()}</a>
          </div>
          <a href="${baseUrl}/admin/clients/${client.id}" style="display: inline-block; background: #c9a84c; color: #0a1628; font-weight: bold; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-size: 14px;">View in Admin →</a>
        </div>
      `,
    });
  } catch { /* don't fail the request if email errors */ }

  return NextResponse.json({ asset: data });
}

export async function DELETE(req: NextRequest) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolvedClient = await resolveClient(user.id, user.email ?? undefined);
  const clientId = resolvedClient?.id ?? null;
  if (!clientId) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createServerClient();
  const { error } = await admin
    .from("client_assets")
    .delete()
    .eq("id", id)
    .eq("client_id", clientId)
    .eq("submitted_by", "client");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
