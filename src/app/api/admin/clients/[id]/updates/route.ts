import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { Resend } from "resend";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { message, send_email } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: update, error } = await supabase
    .from("client_updates")
    .insert({ client_id: id, message: message.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (send_email) {
    const { data: client } = await supabase
      .from("clients")
      .select("name, company, email")
      .eq("id", id)
      .single();

    if (client?.email) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "A1 Group Portal <onboarding@resend.dev>",
          to: client.email,
          subject: `New Update from A1 Group — ${client.company}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
              <div style="background: #0a1628; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
                <h2 style="color: #c9a84c; margin: 0; font-size: 20px;">New Update from A1 Group</h2>
                <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 14px;">
                  Hi <strong style="color: white;">${client.name}</strong>, you have a new update on your project.
                </p>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="color: #1a202c; font-size: 15px; line-height: 1.7; margin: 0;">${message.trim()}</p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL ?? "https://a1group.it.com"}/portal/dashboard" style="display: inline-block; background: #c9a84c; color: #0a1628; font-weight: bold; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-size: 14px;">View in Client Portal →</a>
              <p style="color: #999; font-size: 12px; margin-top: 24px;">You're receiving this because you're a client of A1 Group.</p>
            </div>
          `,
        });
      } catch {
        // Don't fail the request if email errors
      }
    }
  }

  return NextResponse.json({ update });
}
