import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { name, email, company, service, message } = await req.json();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: "A1 Group Website <onboarding@resend.dev>",
    to: process.env.NOTIFICATION_EMAIL ?? "andro.rc06@gmail.com",
    replyTo: email,
    subject: `New inquiry from ${name}${company ? ` — ${company}` : ""}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #0a1628; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
          <h2 style="color: #c9a84c; margin: 0; font-size: 20px;">New Website Inquiry</h2>
          <p style="color: rgba(255,255,255,0.5); margin: 4px 0 0; font-size: 14px;">From A1 Group website contact form</p>
        </div>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px; width: 120px;">Name</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #111; font-size: 14px; font-weight: 600;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">Email</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #111; font-size: 14px;"><a href="mailto:${email}" style="color: #c9a84c;">${email}</a></td>
          </tr>
          ${company ? `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">Company</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #111; font-size: 14px;">${company}</td>
          </tr>` : ""}
          ${service ? `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">Service</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #111; font-size: 14px;">${service}</td>
          </tr>` : ""}
        </table>

        <div style="margin-top: 24px;">
          <p style="color: #666; font-size: 14px; margin-bottom: 8px;">Message</p>
          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; color: #111; font-size: 14px; line-height: 1.6;">
            ${message.replace(/\n/g, "<br/>")}
          </div>
        </div>

        <p style="color: #aaa; font-size: 12px; margin-top: 24px;">
          Reply directly to this email to respond to ${name}.
        </p>
      </div>
    `,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
