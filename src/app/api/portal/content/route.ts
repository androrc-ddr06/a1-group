import { NextResponse } from "next/server";
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
  const { data: batches } = await admin
    .from("content_batches")
    .select("*, content_revisions(*)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ batches: batches ?? [] });
}
