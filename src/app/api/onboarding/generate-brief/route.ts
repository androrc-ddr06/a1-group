import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createClaudeClient } from "@/lib/claude";
import { generateAndSaveContract } from "@/lib/contract-generator";
import { Resend } from "resend";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { onboarding_id } = await req.json();
  if (!onboarding_id) return NextResponse.json({ error: "onboarding_id required" }, { status: 400 });

  const supabase = createServerClient();

  // Fetch onboarding data + client info
  const { data: onboarding } = await supabase
    .from("onboarding_responses")
    .select("*, clients(name, company, services, service_timeline, contract_months, admin_notes)")
    .eq("id", onboarding_id)
    .single();

  if (!onboarding) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Mark as generating
  await supabase
    .from("onboarding_responses")
    .update({ ai_brief_status: "generating" })
    .eq("id", onboarding_id);

  try {
    const claude = createClaudeClient();
    const client = onboarding.clients;
    const services = client?.services ?? [];
    const timeline = client?.service_timeline ?? [];

    // Build a rich prompt from all form answers
    const formSummary = buildFormSummary(onboarding, client);

    const response = await claude.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `You are a senior marketing strategist at A1 Group, a full-service marketing agency.
A new client has just completed their onboarding form. Your job is to:
1. Analyze their business and goals
2. Research their competitive landscape based on the information provided
3. Create a comprehensive strategy brief that Alejandro (the agency owner) will use in the kickoff call

Here is the client's onboarding information:

${formSummary}

Please generate a detailed strategy brief in the following format:

# Strategy Brief — ${client?.company ?? "New Client"}

## 1. Client Overview
[2-3 paragraph summary of who they are, what they do, and their current situation]

## 2. Market & Competitive Analysis
[Analyze the competitors they mentioned. Research the industry. Identify opportunities and threats. Be specific with actionable insights.]

## 3. Recommended Strategy by Service
[For each service they signed up for, provide a specific strategy recommendation with tactics]

## 4. Month-by-Month Execution Plan
[Based on their ${client?.contract_months ?? 1}-month timeline and selected services: ${services.join(", ")}, outline what happens each month]
${timeline.length > 0 ? `Timeline: ${JSON.stringify(timeline)}` : ""}

## 5. Key Questions for Kickoff Call
[10 specific questions Alejandro should ask this client during the onboarding call to fill in gaps]

## 6. Quick Wins (First 30 Days)
[5-7 specific actions that will show immediate results and build client confidence]

## 7. Potential Challenges & How to Handle Them
[Based on their answers, flag any red flags or challenges to address proactively]

Be specific, actionable, and professional. Use real marketing tactics and industry benchmarks where relevant.`,
        },
      ],
    });

    const briefContent = response.content[0].type === "text" ? response.content[0].text : "";

    // Generate PDF using HTML approach (simpler than @react-pdf/renderer for server)
    const pdfHtml = generateBriefHTML(briefContent, client?.company ?? "Client", client?.name ?? "");

    // Store as HTML in Supabase (PDF conversion via browser print is available)
    // Upload HTML brief to Supabase Storage
    const fileName = `briefs/${onboarding_id}.html`;
    const { error: uploadError } = await supabase.storage
      .from("client-assets")
      .upload(fileName, Buffer.from(pdfHtml, "utf-8"), {
        contentType: "text/html; charset=utf-8",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("client-assets")
      .getPublicUrl(fileName);

    const briefUrl = urlData.publicUrl;

    // Update onboarding record
    await supabase
      .from("onboarding_responses")
      .update({
        ai_brief_url: briefUrl,
        ai_brief_status: "ready",
      })
      .eq("id", onboarding_id);

    // Generate contract draft alongside brief
    try {
      await generateAndSaveContract(supabase, claude, onboarding, client, onboarding_id);
    } catch (contractErr) {
      console.error("Contract generation failed:", contractErr);
    }

    // Email Alejandro
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "A1 Group Portal <onboarding@resend.dev>",
        to: process.env.NOTIFICATION_EMAIL ?? "andro.rc06@gmail.com",
        subject: `AI Strategy Brief Ready — ${client?.company}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: #0a1628; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
              <h2 style="color: #c9a84c; margin: 0; font-size: 20px;">Strategy Brief Ready</h2>
              <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 14px;">
                The AI strategy brief for <strong style="color: white;">${client?.company}</strong> is ready for your review.
              </p>
            </div>
            <p style="color: #444; font-size: 14px;">The brief includes:</p>
            <ul style="color: #444; font-size: 14px; line-height: 1.8;">
              <li>Client & market overview</li>
              <li>Competitive analysis</li>
              <li>Service-specific strategy recommendations</li>
              <li>Month-by-month execution plan</li>
              <li>10 kickoff call questions</li>
              <li>Quick wins for the first 30 days</li>
            </ul>
            <a href="https://a1group.it.com/admin/brief?url=${encodeURIComponent(briefUrl)}" style="display: inline-block; margin-top: 16px; background: #c9a84c; color: #0a1628; font-weight: bold; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-size: 14px;">View Strategy Brief →</a>
            <p style="margin-top: 16px;">
              <a href="https://a1group.it.com/admin/clients" style="color: #c9a84c; font-size: 13px;">Open Admin Panel</a>
            </p>
          </div>
        `,
      });
    } catch (_) {
      // Don't fail if email errors
    }

    return NextResponse.json({ success: true, brief_url: briefUrl });
  } catch (err: unknown) {
    await supabase
      .from("onboarding_responses")
      .update({ ai_brief_status: "failed" })
      .eq("id", onboarding_id);

    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildFormSummary(onboarding: Record<string, unknown>, client: Record<string, unknown> | null): string {
  const lines: string[] = [];
  lines.push(`**Client:** ${client?.name} — ${client?.company}`);
  lines.push(`**Services:** ${(client?.services as string[] ?? []).join(", ")}`);
  lines.push(`**Contract Length:** ${client?.contract_months} months`);
  lines.push("");

  if (onboarding.company_name) lines.push(`**Company Name:** ${onboarding.company_name}`);
  if (onboarding.industry) lines.push(`**Industry:** ${onboarding.industry}`);
  if (onboarding.website) lines.push(`**Website:** ${onboarding.website}`);
  if (onboarding.description) lines.push(`**Business Description:** ${onboarding.description}`);
  if (onboarding.brand_colors) lines.push(`**Brand Colors:** ${onboarding.brand_colors}`);
  if (onboarding.font_preferences) lines.push(`**Font Preferences:** ${onboarding.font_preferences}`);

  // Website
  if (onboarding.website_purpose) lines.push(`\n**Website Purpose:** ${onboarding.website_purpose}`);
  if (onboarding.website_examples) lines.push(`**Website Examples They Like:** ${onboarding.website_examples}`);
  if (onboarding.has_photos) lines.push(`**Photos/Videos Ready:** ${onboarding.has_photos}`);
  if (onboarding.has_copy) lines.push(`**Copy Written:** ${onboarding.has_copy}`);
  if (onboarding.website_pages) lines.push(`**Pages Needed:** ${onboarding.website_pages}`);
  if (onboarding.has_domain) lines.push(`**Has Domain:** ${onboarding.has_domain}`);
  if (onboarding.website_features) lines.push(`**Special Features:** ${onboarding.website_features}`);

  // Branding
  if (onboarding.brand_personality) lines.push(`\n**Brand Personality:** ${onboarding.brand_personality}`);
  if (onboarding.brands_admired) lines.push(`**Brands They Admire:** ${onboarding.brands_admired}`);
  if (onboarding.brand_differentiator) lines.push(`**What Makes Them Different:** ${onboarding.brand_differentiator}`);

  // Social Media
  if (onboarding.instagram_handle) lines.push(`\n**Instagram:** @${onboarding.instagram_handle}`);
  if (onboarding.facebook_page) lines.push(`**Facebook:** ${onboarding.facebook_page}`);
  if (onboarding.tiktok_handle) lines.push(`**TikTok:** @${onboarding.tiktok_handle}`);
  if (onboarding.other_socials) lines.push(`**Other Platforms:** ${onboarding.other_socials}`);
  if (onboarding.social_struggles) lines.push(`**Social Media Struggles:** ${onboarding.social_struggles}`);
  if (onboarding.posting_frequency) lines.push(`**Current Posting Frequency:** ${onboarding.posting_frequency}`);
  if (onboarding.best_content) lines.push(`**Best Performing Content:** ${onboarding.best_content}`);
  if (onboarding.content_tone) lines.push(`**Desired Tone:** ${onboarding.content_tone}`);

  // Ads
  if (onboarding.ad_platform) lines.push(`\n**Ad Platform:** ${onboarding.ad_platform}`);
  if (onboarding.ad_goal) lines.push(`**Ad Campaign Goal:** ${onboarding.ad_goal}`);
  if (onboarding.ad_spend_budget) lines.push(`**Monthly Ad Spend:** ${onboarding.ad_spend_budget}`);
  if (onboarding.perfect_client) lines.push(`**Perfect Client Profile:** ${onboarding.perfect_client}`);
  if (onboarding.has_landing_page) lines.push(`**Has Landing Page:** ${onboarding.has_landing_page}`);
  if (onboarding.ad_history) lines.push(`**Ad History:** ${onboarding.ad_history}`);

  // Content
  if (onboarding.shooting_location) lines.push(`\n**Shooting Location:** ${onboarding.shooting_location}`);
  if (onboarding.has_props) lines.push(`**Props/Products Ready:** ${onboarding.has_props}`);
  if (onboarding.content_style) lines.push(`**Content Style:** ${onboarding.content_style}`);
  if (onboarding.posts_per_month) lines.push(`**Expected Posts/Month:** ${onboarding.posts_per_month}`);

  // AI Agents
  if (onboarding.automation_tasks) lines.push(`\n**Tasks to Automate:** ${onboarding.automation_tasks}`);
  if (onboarding.crm_system) lines.push(`**CRM/Booking System:** ${onboarding.crm_system}`);
  if (onboarding.ai_platforms) lines.push(`**Platforms:** ${onboarding.ai_platforms}`);
  if (onboarding.ai_main_problem) lines.push(`**Main Problem for AI:** ${onboarding.ai_main_problem}`);

  // General
  if (onboarding.target_audience) lines.push(`\n**Target Audience:** ${onboarding.target_audience}`);
  if (onboarding.main_goal) lines.push(`**Main Goal:** ${onboarding.main_goal}`);
  if (onboarding.monthly_budget) lines.push(`**Monthly Budget:** ${onboarding.monthly_budget}`);
  if (onboarding.top_competitors) lines.push(`**Top Competitors:** ${onboarding.top_competitors}`);

  return lines.filter(Boolean).join("\n");
}

function generateBriefHTML(content: string, company: string, clientName: string): string {
  // Convert markdown to basic HTML
  const html = content
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hul])/gm, "<p>")
    .replace(/(?<![>])$/gm, "</p>");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Strategy Brief — ${company}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a202c; background: #fff; padding: 0; }
  .header { background: #0a1628; color: white; padding: 40px 60px; }
  .header h1 { font-size: 28px; font-weight: 800; color: #c9a84c; margin-bottom: 4px; }
  .header p { color: rgba(255,255,255,0.6); font-size: 14px; }
  .content { padding: 48px 60px; max-width: 900px; }
  h1 { font-size: 26px; font-weight: 800; color: #0a1628; margin: 32px 0 12px; border-bottom: 3px solid #c9a84c; padding-bottom: 8px; }
  h2 { font-size: 20px; font-weight: 700; color: #0a1628; margin: 28px 0 10px; }
  h3 { font-size: 16px; font-weight: 600; color: #1b2e4b; margin: 20px 0 8px; }
  p { font-size: 14px; line-height: 1.8; color: #444; margin-bottom: 12px; }
  ul, ol { padding-left: 24px; margin-bottom: 16px; }
  li { font-size: 14px; line-height: 1.8; color: #444; margin-bottom: 4px; }
  strong { color: #0a1628; }
  .footer { margin-top: 60px; padding: 24px 60px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #999; }
  @media print { .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="header">
  <h1>Strategy Brief</h1>
  <p>${company} &nbsp;·&nbsp; Prepared by A1 Group &nbsp;·&nbsp; ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
</div>
<div class="content">
  ${html}
</div>
<div class="footer">
  Confidential — Prepared by A1 Group for ${clientName} · ${company} · a1group.it.com
</div>
</body>
</html>`;
}
