import { NextRequest, NextResponse } from "next/server";
import { createSessionClient, createServerClient } from "@/lib/supabase-server";

async function resolveClientId(userId: string, userEmail: string | undefined) {
  const admin = createServerClient();
  const { data: client } = await admin
    .from("clients")
    .select("id")
    .or(`auth_user_id.eq.${userId}${userEmail ? `,email.eq.${userEmail}` : ""}`)
    .single();
  return client?.id ?? null;
}

export async function GET() {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await resolveClientId(user.id, user.email ?? undefined);
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

  const clientId = await resolveClientId(user.id, user.email ?? undefined);
  if (!clientId) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { label, url } = await req.json();
  if (!label?.trim() || !url?.trim()) {
    return NextResponse.json({ error: "label and url are required" }, { status: 400 });
  }

  const admin = createServerClient();
  const { data, error } = await admin
    .from("client_assets")
    .insert({ client_id: clientId, label: label.trim(), url: url.trim(), submitted_by: "client" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ asset: data });
}

export async function DELETE(req: NextRequest) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await resolveClientId(user.id, user.email ?? undefined);
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
