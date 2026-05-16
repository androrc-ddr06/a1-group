"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Upload, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

const TOTAL_STEPS = 5;

const stepTitles = [
  "Company Basics",
  "Brand Assets",
  "Social Media",
  "Marketing Details",
  "Review & Submit",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [data, setData] = useState({
    companyName: "",
    industry: "",
    website: "",
    description: "",
    logoFile: null as File | null,
    brandColors: "",
    fontPreferences: "",
    instagramHandle: "",
    facebookPage: "",
    tiktokHandle: "",
    otherSocials: "",
    targetAudience: "",
    mainGoal: "",
    monthlyBudget: "",
    topCompetitors: "",
  });

  useEffect(() => {
    async function loadClientId() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("email", user.email)
        .single();

      if (client) setClientId(client.id);
    }
    loadClientId();
  }, []);

  function set(field: keyof typeof data, value: string | File | null) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function next() { if (step < TOTAL_STEPS) setStep(step + 1); }
  function back() { if (step > 1) setStep(step - 1); }

  async function handleSubmit() {
    if (!clientId) {
      setError("Could not identify your account. Please try signing out and back in.");
      return;
    }

    setSubmitting(true);
    setError("");

    // Upload logo if provided
    let logoUrl = "";
    if (data.logoFile) {
      const supabase = createClient();
      const ext = data.logoFile.name.split(".").pop();
      const path = `logos/${clientId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("client-assets")
        .upload(path, data.logoFile, { upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("client-assets").getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }
    }

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        company_name: data.companyName,
        industry: data.industry,
        website: data.website,
        description: data.description,
        brand_colors: data.brandColors,
        font_preferences: data.fontPreferences,
        logo_url: logoUrl,
        instagram_handle: data.instagramHandle,
        facebook_page: data.facebookPage,
        tiktok_handle: data.tiktokHandle,
        other_socials: data.otherSocials,
        target_audience: data.targetAudience,
        main_goal: data.mainGoal,
        monthly_budget: data.monthlyBudget,
        top_competitors: data.topCompetitors,
      }),
    });

    if (res.ok) {
      setDone(true);
    } else {
      const result = await res.json();
      setError(result.error || "Something went wrong. Please try again.");
    }

    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <CheckCircle size={64} className="text-[#c9a84c] mx-auto mb-6" />
          <h1 className="text-3xl font-extrabold text-white mb-3">You&apos;re All Set!</h1>
          <p className="text-white/50 text-base leading-relaxed mb-8">
            Your onboarding is complete. Alejandro will review everything and
            reach out within 24 hours to kick things off.
          </p>
          <button
            onClick={() => router.push("/portal/dashboard")}
            className="bg-[#c9a84c] hover:bg-[#d4af61] text-[#0a1628] font-bold px-8 py-4 rounded-full transition-all"
          >
            Go to My Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="flex mb-10">
          <img src="/logo-dark.svg" alt="A1 Group" className="h-10 w-auto" />
        </Link>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-xs uppercase tracking-widest font-medium">
              Step {step} of {TOTAL_STEPS}
            </span>
            <span className="text-[#c9a84c] text-xs font-semibold">
              {stepTitles[step - 1]}
            </span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#c9a84c] rounded-full transition-all duration-500"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-2xl mb-1">Tell Us About Your Company</h2>
              <p className="text-white/40 text-sm mb-6">
                This helps us understand your brand and tailor our work to your business.
              </p>
              <Field label="Company Name" required>
                <input type="text" value={data.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="Roosters Rolling Barbecue" className={inputClass} />
              </Field>
              <Field label="Industry">
                <input type="text" value={data.industry} onChange={(e) => set("industry", e.target.value)} placeholder="Food & Beverage, Retail, Services..." className={inputClass} />
              </Field>
              <Field label="Website (if you have one)">
                <input type="url" value={data.website} onChange={(e) => set("website", e.target.value)} placeholder="https://yourbusiness.com" className={inputClass} />
              </Field>
              <Field label="Describe Your Business" required>
                <textarea rows={4} value={data.description} onChange={(e) => set("description", e.target.value)} placeholder="What do you do, who do you serve, and what makes you different?" className={`${inputClass} resize-none`} />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-2xl mb-1">Your Brand Assets</h2>
              <p className="text-white/40 text-sm mb-6">
                Upload your logo and share any brand guidelines you already have.
              </p>
              <Field label="Company Logo">
                <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/15 rounded-xl py-8 cursor-pointer hover:border-[#c9a84c]/40 transition-colors">
                  <Upload size={24} className="text-white/30" />
                  <span className="text-white/40 text-sm">
                    {data.logoFile ? data.logoFile.name : "Click to upload PNG, SVG, or JPG"}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => set("logoFile", e.target.files?.[0] ?? null)} />
                </label>
              </Field>
              <Field label="Brand Colors (hex codes or describe them)">
                <input type="text" value={data.brandColors} onChange={(e) => set("brandColors", e.target.value)} placeholder="#FF5733, Navy Blue, White..." className={inputClass} />
              </Field>
              <Field label="Font Preferences (if any)">
                <input type="text" value={data.fontPreferences} onChange={(e) => set("fontPreferences", e.target.value)} placeholder="Modern, bold, serif... or 'we have no preference'" className={inputClass} />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-2xl mb-1">Social Media Accounts</h2>
              <p className="text-white/40 text-sm mb-6">
                Share your handles so we can audit your current presence and start building your strategy.
              </p>
              <Field label="Instagram Handle">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">@</span>
                  <input type="text" value={data.instagramHandle} onChange={(e) => set("instagramHandle", e.target.value)} placeholder="yourbusiness" className={`${inputClass} pl-8`} />
                </div>
              </Field>
              <Field label="Facebook Page">
                <input type="text" value={data.facebookPage} onChange={(e) => set("facebookPage", e.target.value)} placeholder="facebook.com/yourbusiness" className={inputClass} />
              </Field>
              <Field label="TikTok Handle">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">@</span>
                  <input type="text" value={data.tiktokHandle} onChange={(e) => set("tiktokHandle", e.target.value)} placeholder="yourbusiness" className={`${inputClass} pl-8`} />
                </div>
              </Field>
              <Field label="Any Other Platforms">
                <input type="text" value={data.otherSocials} onChange={(e) => set("otherSocials", e.target.value)} placeholder="YouTube, LinkedIn, Twitter/X..." className={inputClass} />
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-2xl mb-1">Marketing Details</h2>
              <p className="text-white/40 text-sm mb-6">
                This powers the strategy we build for you. The more detail, the better.
              </p>
              <Field label="Who is your target audience?" required>
                <textarea rows={3} value={data.targetAudience} onChange={(e) => set("targetAudience", e.target.value)} placeholder="Age range, location, interests, income level..." className={`${inputClass} resize-none`} />
              </Field>
              <Field label="What is your main goal right now?" required>
                <select value={data.mainGoal} onChange={(e) => set("mainGoal", e.target.value)} className={inputClass} style={{ colorScheme: "dark" }}>
                  <option value="" className="bg-[#0a1628]">Select your primary goal...</option>
                  <option className="bg-[#0a1628]">Grow my social media following</option>
                  <option className="bg-[#0a1628]">Drive more sales / leads</option>
                  <option className="bg-[#0a1628]">Build brand awareness</option>
                  <option className="bg-[#0a1628]">Launch a new product or service</option>
                  <option className="bg-[#0a1628]">Rebrand my business</option>
                  <option className="bg-[#0a1628]">Build a new website</option>
                  <option className="bg-[#0a1628]">All of the above</option>
                </select>
              </Field>
              <Field label="Monthly Marketing Budget">
                <select value={data.monthlyBudget} onChange={(e) => set("monthlyBudget", e.target.value)} className={inputClass} style={{ colorScheme: "dark" }}>
                  <option value="" className="bg-[#0a1628]">Select a range...</option>
                  <option className="bg-[#0a1628]">Under $500/month</option>
                  <option className="bg-[#0a1628]">$500 – $1,500/month</option>
                  <option className="bg-[#0a1628]">$1,500 – $3,000/month</option>
                  <option className="bg-[#0a1628]">$3,000 – $5,000/month</option>
                  <option className="bg-[#0a1628]">$5,000+/month</option>
                  <option className="bg-[#0a1628]">I&apos;m not sure yet</option>
                </select>
              </Field>
              <Field label="Who are your top 2–3 competitors?">
                <input type="text" value={data.topCompetitors} onChange={(e) => set("topCompetitors", e.target.value)} placeholder="Business names or Instagram handles" className={inputClass} />
              </Field>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-white font-bold text-2xl mb-1">Review & Submit</h2>
              <p className="text-white/40 text-sm mb-6">
                Everything looks good? Submit and we&apos;ll review within 24 hours.
              </p>
              <div className="space-y-3">
                {[
                  { label: "Company", value: data.companyName },
                  { label: "Industry", value: data.industry },
                  { label: "Website", value: data.website || "—" },
                  { label: "Instagram", value: data.instagramHandle ? `@${data.instagramHandle}` : "—" },
                  { label: "Main Goal", value: data.mainGoal || "—" },
                  { label: "Budget", value: data.monthlyBudget || "—" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-white/8">
                    <span className="text-white/40 text-sm">{row.label}</span>
                    <span className="text-white font-medium text-sm">{row.value}</span>
                  </div>
                ))}
              </div>
              {error && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
                  {error}
                </p>
              )}
              <div className="bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-xl p-4 text-sm text-[#c9a84c]">
                After submitting, Alejandro will review your information and reach out within 24 hours to schedule your kickoff call.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          <button onClick={back} disabled={step === 1} className="flex items-center gap-2 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed font-medium text-sm transition-colors">
            <ChevronLeft size={16} /> Back
          </button>
          {step < TOTAL_STEPS ? (
            <button onClick={next} className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4af61] text-[#0a1628] font-bold text-sm px-6 py-3 rounded-full transition-all">
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4af61] disabled:opacity-60 text-[#0a1628] font-bold text-sm px-6 py-3 rounded-full transition-all">
              {submitting ? "Submitting..." : "Submit Onboarding →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const inputClass = "w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-white/60 text-xs uppercase tracking-wide block mb-1.5">
        {label}{required && <span className="text-[#c9a84c] ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
