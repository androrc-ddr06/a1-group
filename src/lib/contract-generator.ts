import Anthropic from "@anthropic-ai/sdk";
import { SupabaseClient } from "@supabase/supabase-js";

type ClientData = Record<string, unknown>;
type OnboardingData = Record<string, unknown>;

export async function generateAndSaveContract(
  supabase: SupabaseClient,
  claude: Anthropic,
  onboarding: OnboardingData,
  client: ClientData | null,
  onboarding_id: string,
  adminFeedback?: string
): Promise<{ contractUrl: string; totalCents: number; paymentSplit: Record<string, number> }> {
  const response = await claude.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 6000,
    messages: [{ role: "user", content: buildContractPrompt(onboarding, client, adminFeedback) }],
  });

  const rawContent = response.content[0].type === "text" ? response.content[0].text : "";
  const { amounts, cleanContent } = parseContractAmounts(rawContent);
  const contractHtml = generateContractHTML(cleanContent, client);

  const fileName = `contracts/${onboarding_id}.html`;
  await supabase.storage
    .from("client-assets")
    .upload(fileName, Buffer.from(contractHtml, "utf-8"), {
      contentType: "text/html; charset=utf-8",
      upsert: true,
    });

  const { data: urlData } = supabase.storage.from("client-assets").getPublicUrl(fileName);
  const contractUrl = urlData.publicUrl;

  // Delete any existing draft contract for this onboarding before inserting fresh
  await supabase
    .from("contracts")
    .delete()
    .eq("onboarding_id", onboarding_id)
    .eq("contract_status", "draft");

  const { error: insertError } = await supabase.from("contracts").insert({
    client_id: onboarding.client_id,
    onboarding_id,
    contract_html_url: contractUrl,
    contract_status: "draft",
    total_amount: amounts.total_cents,
    payment_split: {
      upfront_cents: amounts.upfront_cents,
      on_delivery_cents: amounts.on_delivery_cents,
      monthly_cents: amounts.monthly_cents,
    },
  });

  if (insertError) throw new Error(`Contract insert failed: ${insertError.message}`);

  return {
    contractUrl,
    totalCents: amounts.total_cents,
    paymentSplit: {
      upfront_cents: amounts.upfront_cents,
      on_delivery_cents: amounts.on_delivery_cents,
      monthly_cents: amounts.monthly_cents,
    },
  };
}

function buildContractPrompt(onboarding: OnboardingData, client: ClientData | null, adminFeedback?: string): string {
  const services = (client?.services as string[] ?? []).join(", ");
  const contractMonths = client?.contract_months ?? 1;
  const adminNotes = client?.admin_notes as string ?? "";

  const formSummary = buildFormSummary(onboarding, client);

  return `You are a professional contract drafter for A1 Group, a full-service digital marketing and creative agency.

Generate a formal Service Agreement between A1 Group ("Contractor") and ${client?.name} / ${client?.company} ("Client").

=== CLIENT CONTEXT ===
${formSummary}

=== ADMIN NOTES (internal context from Alejandro) ===
${adminNotes || "None provided."}

=== SERVICES & PRICING RATES ===
ONE-TIME SERVICES (payment: 50% upfront, 50% on delivery):
- Website Design & Development: $1,000–$2,000 (base $1,000; add $200 per page beyond 5 pages; max $2,000)
- Branding & Identity: $1,200 flat
- AI Agents Setup: $1,500–$2,000 (based on complexity)

RECURRING MONTHLY SERVICES (payment: 100% upfront per month):
- Social Media Management: $1,000/mo
- Content Creation: $800/mo
- Paid Ads Management: $800/mo (does NOT include client's ad spend budget)
- AI Agents Maintenance: $300/mo

PHOTOGRAPHY & VIDEOGRAPHY: $200/hour (one-time, charged at 50% upfront / 50% post-shoot)

Services contracted: ${services}
Contract length: ${contractMonths} month${contractMonths !== 1 ? "s" : ""}

=== INSTRUCTIONS ===
1. Price each service fairly based on the onboarding answers. For websites, count the pages requested.
2. Determine realistic timelines for each service based on complexity.
3. Write a complete, professional service agreement with ALL of these sections:
   1. PARTIES
   2. SCOPE OF WORK (detailed deliverables per service)
   3. PROJECT TIMELINE (per service with estimated start and completion)
   4. PRICING & PAYMENT TERMS (itemized per service, showing upfront vs on-delivery split)
   5. REVISION POLICY (2 rounds of revisions included per deliverable)
   6. CLIENT RESPONSIBILITIES (providing assets, feedback within 5 business days, etc.)
   7. INTELLECTUAL PROPERTY (client owns final deliverables upon full payment)
   8. CONFIDENTIALITY
   9. TERMINATION (30-day written notice; client pays for work completed)
   10. LIMITATION OF LIABILITY
   11. GOVERNING LAW (State of California)

4. Include a signature block at the end for both parties.

5. At the very end of your response, on its own line, output ONLY this JSON comment (no other text on that line):
<!--CONTRACT_AMOUNTS:{"total_cents":0,"upfront_cents":0,"on_delivery_cents":0,"monthly_cents":0}-->

Where:
- total_cents = sum of all fees (one-time totals + monthly × contract_months)
- upfront_cents = 50% of one-time fees + first month of all recurring services
- on_delivery_cents = 50% of one-time fees only
- monthly_cents = total recurring per month (for month 2 onward)
All amounts in USD cents (e.g. $1,500.00 = 150000).

Write in formal but clear legal language. Use "A1 Group" as the Contractor throughout.${adminFeedback ? `

=== REVISION FEEDBACK FROM ALEJANDRO ===
${adminFeedback}

Please revise the contract accordingly while keeping all other terms.` : ""}`;
}

function parseContractAmounts(content: string): {
  amounts: { total_cents: number; upfront_cents: number; on_delivery_cents: number; monthly_cents: number };
  cleanContent: string;
} {
  const match = content.match(/<!--CONTRACT_AMOUNTS:(\{[^}]+\})-->/);
  const cleanContent = content.replace(/<!--CONTRACT_AMOUNTS:[^>]+-->/g, "").trim();

  if (!match) {
    return {
      amounts: { total_cents: 0, upfront_cents: 0, on_delivery_cents: 0, monthly_cents: 0 },
      cleanContent,
    };
  }

  try {
    const amounts = JSON.parse(match[1]);
    return { amounts, cleanContent };
  } catch {
    return {
      amounts: { total_cents: 0, upfront_cents: 0, on_delivery_cents: 0, monthly_cents: 0 },
      cleanContent,
    };
  }
}

function buildFormSummary(onboarding: OnboardingData, client: ClientData | null): string {
  const lines: string[] = [];
  lines.push(`Client: ${client?.name} — ${client?.company}`);
  lines.push(`Services: ${(client?.services as string[] ?? []).join(", ")}`);
  lines.push(`Contract Length: ${client?.contract_months} months`);
  if (onboarding.company_name) lines.push(`Company Name: ${onboarding.company_name}`);
  if (onboarding.industry) lines.push(`Industry: ${onboarding.industry}`);
  if (onboarding.website) lines.push(`Current Website: ${onboarding.website}`);
  if (onboarding.description) lines.push(`Business Description: ${onboarding.description}`);
  if (onboarding.website_purpose) lines.push(`Website Purpose: ${onboarding.website_purpose}`);
  if (onboarding.website_pages) lines.push(`Website Pages Needed: ${onboarding.website_pages}`);
  if (onboarding.website_features) lines.push(`Special Features: ${onboarding.website_features}`);
  if (onboarding.ad_spend_budget) lines.push(`Monthly Ad Spend Budget: ${onboarding.ad_spend_budget}`);
  if (onboarding.automation_tasks) lines.push(`Automation Tasks: ${onboarding.automation_tasks}`);
  if (onboarding.main_goal) lines.push(`Main Goal: ${onboarding.main_goal}`);
  if (onboarding.monthly_budget) lines.push(`Monthly Budget: ${onboarding.monthly_budget}`);
  return lines.filter(Boolean).join("\n");
}

export async function regenerateContractFromText(
  supabase: SupabaseClient,
  contractId: string,
  onboarding_id: string,
  newMarkdown: string,
  client: ClientData | null
): Promise<{ contractUrl: string }> {
  const contractHtml = generateContractHTML(newMarkdown, client);

  const fileName = `contracts/${onboarding_id}.html`;
  await supabase.storage
    .from("client-assets")
    .upload(fileName, Buffer.from(contractHtml, "utf-8"), {
      contentType: "text/html; charset=utf-8",
      upsert: true,
    });

  const { data: urlData } = supabase.storage.from("client-assets").getPublicUrl(fileName);
  const contractUrl = urlData.publicUrl;

  const { error } = await supabase
    .from("contracts")
    .update({ contract_html_url: contractUrl })
    .eq("id", contractId);

  if (error) throw new Error(`Contract update failed: ${error.message}`);

  return { contractUrl };
}

export function generateContractHTML(content: string, client: ClientData | null): string {
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

  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Service Agreement — ${client?.company ?? "Client"}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1a202c; background: #fff; padding: 0; }
  .header { background: #0a1628; color: white; padding: 40px 60px; }
  .header h1 { font-size: 24px; font-weight: 700; color: #c9a84c; margin-bottom: 4px; font-family: 'Segoe UI', Arial, sans-serif; }
  .header p { color: rgba(255,255,255,0.6); font-size: 13px; font-family: 'Segoe UI', Arial, sans-serif; }
  .content { padding: 48px 60px; max-width: 860px; }
  h1 { font-size: 18px; font-weight: 700; color: #0a1628; margin: 32px 0 10px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #c9a84c; padding-bottom: 6px; font-family: 'Segoe UI', Arial, sans-serif; }
  h2 { font-size: 15px; font-weight: 700; color: #0a1628; margin: 20px 0 8px; font-family: 'Segoe UI', Arial, sans-serif; }
  h3 { font-size: 14px; font-weight: 600; color: #1b2e4b; margin: 16px 0 6px; font-family: 'Segoe UI', Arial, sans-serif; }
  p { font-size: 13.5px; line-height: 1.9; color: #333; margin-bottom: 10px; }
  ul, ol { padding-left: 24px; margin-bottom: 14px; }
  li { font-size: 13.5px; line-height: 1.9; color: #333; margin-bottom: 3px; }
  strong { color: #0a1628; font-family: 'Segoe UI', Arial, sans-serif; }
  .signature-block { margin-top: 60px; display: flex; gap: 60px; page-break-inside: avoid; }
  .sig-party { flex: 1; }
  .sig-line { border-bottom: 1px solid #333; margin-bottom: 8px; height: 40px; }
  .sig-party p { font-size: 12px; color: #555; margin-bottom: 4px; font-family: 'Segoe UI', Arial, sans-serif; }
  .footer { margin-top: 60px; padding: 20px 60px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #aaa; font-family: 'Segoe UI', Arial, sans-serif; }
  @media print { .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="header">
  <h1>Service Agreement</h1>
  <p>${client?.company ?? "Client"} &nbsp;·&nbsp; A1 Group &nbsp;·&nbsp; ${date}</p>
</div>
<div class="content">
  ${html}
  <div class="signature-block">
    <div class="sig-party">
      <div class="sig-line"></div>
      <p><strong>A1 Group</strong> — Authorized Representative</p>
      <p>Signature: _______________________</p>
      <p>Date: ___________________________</p>
    </div>
    <div class="sig-party">
      <div class="sig-line"></div>
      <p><strong>${client?.name ?? "Client"}</strong> — ${client?.company ?? ""}</p>
      <p>Signature: _______________________</p>
      <p>Date: ___________________________</p>
    </div>
  </div>
</div>
<div class="footer">
  Confidential Service Agreement — A1 Group &amp; ${client?.company ?? "Client"} · a1group.it.com
</div>
</body>
</html>`;
}
