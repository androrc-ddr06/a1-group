import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";
import { createSessionClient, createServerClient } from "@/lib/supabase-server";

async function getOnboardingData() {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createServerClient();

  const { data: client } = await admin
    .from("clients")
    .select("id, company")
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!client) return null;

  const { data: response } = await admin
    .from("onboarding_responses")
    .select("*")
    .eq("client_id", client.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .single();

  return { company: client.company, response: response ?? null };
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="py-3 border-b border-[#0a1628]/5 last:border-0">
      <div className="text-[#0a1628]/40 text-xs font-medium mb-0.5">{label}</div>
      <div className="text-[#0a1628]/80 text-sm">{value || "—"}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#0a1628]/8 rounded-2xl p-6 mb-4">
      <h3 className="text-[#0a1628] font-bold text-base mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default async function OnboardingSummaryPage() {
  const data = await getOnboardingData();
  if (!data) redirect("/portal/login");

  const { company, response: r } = data;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-[#0a1628] border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img src="/logo-dark.svg" alt="A1 Group" className="h-8 w-auto" />
            </Link>
            <span className="text-white/20 text-xs">|</span>
            <span className="text-white/50 text-sm">Client Portal</span>
          </div>
          <span className="text-white/50 text-sm hidden sm:block">{company}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link
            href="/portal/dashboard"
            className="flex items-center gap-1.5 text-[#0a1628]/40 hover:text-[#0a1628]/70 text-sm transition-colors"
          >
            <ArrowLeft size={14} />
            Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-[#0a1628] rounded-xl flex items-center justify-center">
              <FileText size={16} className="text-[#c9a84c]" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#0a1628]">Onboarding Summary</h1>
          </div>
          <p className="text-[#0a1628]/40 text-sm mt-1 ml-12">Your submitted answers — read only</p>
        </div>

        {!r ? (
          <div className="bg-white border border-[#0a1628]/8 rounded-2xl p-12 text-center">
            <p className="text-[#0a1628]/40 text-sm">No onboarding submission found.</p>
          </div>
        ) : (
          <>
            <Section title="Business Info">
              <Field label="Company Name" value={r.company_name} />
              <Field label="Industry" value={r.industry} />
              <Field label="Website" value={r.website} />
              <Field label="Description" value={r.description} />
            </Section>

            <Section title="Goals & Audience">
              <Field label="Main Goal" value={r.main_goal} />
              <Field label="Target Audience" value={r.target_audience} />
              <Field label="Top Competitors" value={r.top_competitors} />
              <Field label="Monthly Budget" value={r.monthly_budget} />
            </Section>

            <Section title="Website">
              <Field label="Purpose" value={r.website_purpose} />
              <Field label="Pages" value={r.website_pages} />
              <Field label="Features" value={r.website_features} />
            </Section>

            {(r.ad_spend_budget) && (
              <Section title="Paid Ads">
                <Field label="Ad Spend Budget" value={r.ad_spend_budget} />
              </Section>
            )}

            {(r.instagram || r.facebook || r.tiktok || r.other_socials) && (
              <Section title="Social Media">
                <Field label="Instagram" value={r.instagram} />
                <Field label="Facebook" value={r.facebook} />
                <Field label="TikTok" value={r.tiktok} />
                <Field label="Other" value={r.other_socials} />
              </Section>
            )}

            <Section title="Brand">
              <Field label="Brand Colors" value={r.brand_colors} />
              <Field label="Font Preferences" value={r.font_preferences} />
            </Section>

            {r.automation_tasks && (
              <Section title="Automation & AI">
                <Field label="Automation Tasks" value={r.automation_tasks} />
              </Section>
            )}
          </>
        )}

        <p className="text-[#0a1628]/25 text-xs mt-6 text-center">
          Need to update something?{" "}
          <Link href="/#contact" className="text-[#c9a84c] hover:underline">Contact A1 Group</Link>
        </p>
      </main>
    </div>
  );
}
