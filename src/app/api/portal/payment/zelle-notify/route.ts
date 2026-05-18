import { NextRequest, NextResponse } from "next/server";
import { createSessionClient, createServerClient } from "@/lib/supabase-server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: client } = await admin
    .from("clients")
    .select("id, name, company")
    .eq("auth_user_id", user.id)
    .single();

  const resolvedClient = client ?? await (async () => {
    const { data } = await admin.from("clients").select("id, name, company").eq("email", user.email).single();
    return data;
  })();

  if (!resolvedClient) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://a1group.it.com";

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "A1 Group Portal <onboarding@resend.dev>",
      to: process.env.NOTIFICATION_EMAIL ?? "andro.rc06@gmail.com",
      subject: `💸 ${resolvedClient.name} sent a Zelle payment — verify and mark paid`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: #0a1628; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
            <h2 style="color: #c9a84c; margin: 0; font-size: 20px;">Zelle Payment Notification</h2>
            <p style="color: rgba(255,255,255,0.5); margin: 4px 0 0; font-size: 14px;">${resolvedClient.name} says they've sent their Zelle payment.</p>
          </div>
          <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
            <strong>${resolvedClient.name}</strong> (${resolvedClient.company}) has indicated they've sent payment via Zelle. Once you've confirmed receipt, mark them as paid in the admin panel to unlock their portal access.
          </p>
          <a href="${baseUrl}/admin/clients/${resolvedClient.id}" style="display: inline-block; background: #c9a84c; color: #0a1628; font-weight: 800; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-size: 14px;">Mark as Paid in Admin →</a>
        </div>
      `,
    });
  } catch { /* never fail the request */ }

  return NextResponse.json({ ok: true });
}
