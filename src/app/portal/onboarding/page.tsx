"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Upload, CheckCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 = loading services
  const [steps, setSteps] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [activeServices, setActiveServices] = useState<string[]>([]);
  const [error, setError] = useState("");

  const [data, setData] = useState({
    // General
    companyName: "", industry: "", website: "", description: "",
    logoFile: null as File | null, brandColors: "", fontPreferences: "",
    // Website
    websitePurpose: "", websiteExamples: "", hasPhotos: "", hasCopy: "",
    websitePages: [] as string[], hasDomain: "", websiteFeatures: "",
    // Branding
    brandPersonality: "", brandsAdmired: "", brandDifferentiator: "",
    // Social Media
    instagramHandle: "", facebookPage: "", tiktokHandle: "", youtubeHandle: "",
    linkedinPage: "", twitterHandle: "", otherSocials: "",
    socialStruggles: "", postingFrequency: "", bestContent: "",
    idealClient: "", contentTone: "",
    // Content Creation
    shootingLocation: "", hasProps: "", contentStyle: "", postsPerMonth: "",
    // Paid Ads
    adPlatform: "", adGoal: "", adSpendBudget: "", perfectClient: "",
    hasLandingPage: "", adHistory: "",
    // AI Agents
    automationTasks: "", crmSystem: "", aiPlatforms: "", aiMainProblem: "",
    existingScripts: "",
    // General marketing
    targetAudience: "", mainGoal: "", monthlyBudget: "", topCompetitors: "",
  });

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/portal/me");
      if (res.status === 401) { router.push("/portal/login"); return; }
      if (!res.ok) { router.push("/portal/login"); return; }

      const client = await res.json();
      setClientId(client.id);

      const active = (client.service_timeline ?? [])
        .filter((e: { status: string }) => e.status === "active")
        .map((e: { service: string }) => e.service);

      // Fallback: if no timeline yet, show all services they have
      const services = active.length > 0 ? active : (client.services ?? []);
      setActiveServices(services);

      // Build step list
      const stepList = ["General Info"];
      if (services.includes("Website")) stepList.push("Website");
      if (services.includes("Branding")) stepList.push("Branding");
      if (services.includes("Social Media") || services.includes("Content Creation")) stepList.push("Social Media");
      if (services.includes("Content Creation")) stepList.push("Content Creation");
      if (services.includes("Paid Ads")) stepList.push("Paid Ads");
      if (services.includes("AI Agents")) stepList.push("AI Agents");
      stepList.push("Goals & Review");
      setSteps(stepList);
      setStep(1);
    }
    load();
  }, []);

  function set(field: keyof typeof data, value: string | File | null | string[]) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function togglePage(page: string) {
    setData((prev) => ({
      ...prev,
      websitePages: prev.websitePages.includes(page)
        ? prev.websitePages.filter((p) => p !== page)
        : [...prev.websitePages, page],
    }));
  }

  function next() { if (step < steps.length) setStep(step + 1); }
  function back() { if (step > 1) setStep(step - 1); }

  async function handleSubmit() {
    if (!clientId) { setError("Could not identify your account. Please sign out and back in."); return; }
    setSubmitting(true);
    setError("");

    let logoUrl = "";
    if (data.logoFile) {
      const supabase = createClient();
      const ext = data.logoFile.name.split(".").pop();
      const path = `logos/${clientId}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("client-assets").upload(path, data.logoFile, { upsert: true });
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
        // Website
        website_purpose: data.websitePurpose,
        website_examples: data.websiteExamples,
        has_photos: data.hasPhotos,
        has_copy: data.hasCopy,
        website_pages: data.websitePages.join(", "),
        has_domain: data.hasDomain,
        website_features: data.websiteFeatures,
        // Branding
        brand_personality: data.brandPersonality,
        brands_admired: data.brandsAdmired,
        brand_differentiator: data.brandDifferentiator,
        // Social
        instagram_handle: data.instagramHandle,
        facebook_page: data.facebookPage,
        tiktok_handle: data.tiktokHandle,
        youtube_handle: data.youtubeHandle,
        linkedin_page: data.linkedinPage,
        twitter_handle: data.twitterHandle,
        other_socials: data.otherSocials,
        social_struggles: data.socialStruggles,
        posting_frequency: data.postingFrequency,
        best_content: data.bestContent,
        ideal_client: data.idealClient,
        content_tone: data.contentTone,
        // Content
        shooting_location: data.shootingLocation,
        has_props: data.hasProps,
        content_style: data.contentStyle,
        posts_per_month: data.postsPerMonth,
        // Ads
        ad_platform: data.adPlatform,
        ad_goal: data.adGoal,
        ad_spend_budget: data.adSpendBudget,
        perfect_client: data.perfectClient,
        has_landing_page: data.hasLandingPage,
        ad_history: data.adHistory,
        // AI
        automation_tasks: data.automationTasks,
        crm_system: data.crmSystem,
        ai_platforms: data.aiPlatforms,
        ai_main_problem: data.aiMainProblem,
        existing_scripts: data.existingScripts,
        // General
        target_audience: data.targetAudience,
        main_goal: data.mainGoal,
        monthly_budget: data.monthlyBudget,
        top_competitors: data.topCompetitors,
      }),
    });

    if (res.ok) { setDone(true); }
    else {
      const result = await res.json();
      setError(result.error || "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  if (step === 0) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 size={32} className="text-[#c9a84c] animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <CheckCircle size={64} className="text-[#c9a84c] mx-auto mb-6" />
          <h1 className="text-3xl font-extrabold text-white mb-3">You&apos;re All Set!</h1>
          <p className="text-white/50 text-base leading-relaxed mb-4">
            Your onboarding is complete. Alejandro will review everything and reach out within 24 hours to kick things off.
          </p>
          <p className="text-white/30 text-sm mb-8">
            We&apos;re also generating a personalized strategy brief for your business — you&apos;ll hear from us soon.
          </p>
          <button onClick={() => router.push("/portal/dashboard")} className="bg-[#c9a84c] hover:bg-[#d4af61] text-[#0a1628] font-bold px-8 py-4 rounded-full transition-all">
            Go to My Dashboard →
          </button>
        </div>
      </div>
    );
  }

  const currentStepName = steps[step - 1];
  const totalSteps = steps.length;

  return (
    <div className="min-h-screen bg-[#0a1628] px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="flex mb-10">
          <img src="/logo-dark.svg" alt="A1 Group" className="h-10 w-auto" />
        </Link>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-xs uppercase tracking-widest font-medium">Step {step} of {totalSteps}</span>
            <span className="text-[#c9a84c] text-xs font-semibold">{currentStepName}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#c9a84c] rounded-full transition-all duration-500" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
          {/* Step dots */}
          <div className="flex gap-1.5 mt-3">
            {steps.map((s, i) => (
              <div key={s} className={`h-1 rounded-full flex-1 transition-all ${i < step ? "bg-[#c9a84c]" : "bg-white/10"}`} />
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {/* STEP: General Info */}
          {currentStepName === "General Info" && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-2xl mb-1">Tell Us About Your Company</h2>
              <p className="text-white/40 text-sm mb-6">This helps us understand your brand and tailor our work.</p>
              <Field label="Company Name" required><input type="text" value={data.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="Roosters Rolling Barbecue" className={ic} /></Field>
              <Field label="Industry"><input type="text" value={data.industry} onChange={(e) => set("industry", e.target.value)} placeholder="Food & Beverage, Retail, Services..." className={ic} /></Field>
              <Field label="Website (if you have one)"><input type="url" value={data.website} onChange={(e) => set("website", e.target.value)} placeholder="https://yourbusiness.com" className={ic} /></Field>
              <Field label="Describe Your Business" required><textarea rows={4} value={data.description} onChange={(e) => set("description", e.target.value)} placeholder="What do you do, who do you serve, and what makes you different?" className={`${ic} resize-none`} /></Field>
              <Field label="Company Logo">
                <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/15 rounded-xl py-8 cursor-pointer hover:border-[#c9a84c]/40 transition-colors">
                  <Upload size={24} className="text-white/30" />
                  <span className="text-white/40 text-sm">{data.logoFile ? data.logoFile.name : "Click to upload PNG, SVG, or JPG"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => set("logoFile", e.target.files?.[0] ?? null)} />
                </label>
              </Field>
              <Field label="Brand Colors"><input type="text" value={data.brandColors} onChange={(e) => set("brandColors", e.target.value)} placeholder="#FF5733, Navy Blue, White..." className={ic} /></Field>
              <Field label="Font Preferences"><input type="text" value={data.fontPreferences} onChange={(e) => set("fontPreferences", e.target.value)} placeholder="Modern, bold, serif... or 'no preference'" className={ic} /></Field>
            </div>
          )}

          {/* STEP: Website */}
          {currentStepName === "Website" && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-2xl mb-1">Website</h2>
              <p className="text-white/40 text-sm mb-6">Help us understand what you need before our kickoff call.</p>
              <Field label="What is the purpose of your website?" required>
                <textarea rows={3} value={data.websitePurpose} onChange={(e) => set("websitePurpose", e.target.value)} placeholder="e.g. Showcase our BBQ catering services, let customers book events, and build our brand online." className={`${ic} resize-none`} />
              </Field>
              <Field label="2-3 websites you like (paste links)">
                <textarea rows={3} value={data.websiteExamples} onChange={(e) => set("websiteExamples", e.target.value)} placeholder="https://example1.com&#10;https://example2.com&#10;https://example3.com" className={`${ic} resize-none`} />
              </Field>
              <Field label="Do you have photos & videos ready?">
                <select value={data.hasPhotos} onChange={(e) => set("hasPhotos", e.target.value)} className={ic} style={{ colorScheme: "dark" }}>
                  <option value="" className="bg-[#0a1628]">Select...</option>
                  <option className="bg-[#0a1628]">Yes, I have everything ready</option>
                  <option className="bg-[#0a1628]">I have some, need more</option>
                  <option className="bg-[#0a1628]">No, I need help with this</option>
                </select>
              </Field>
              <Field label="Do you have your website copy (text) written?">
                <select value={data.hasCopy} onChange={(e) => set("hasCopy", e.target.value)} className={ic} style={{ colorScheme: "dark" }}>
                  <option value="" className="bg-[#0a1628]">Select...</option>
                  <option className="bg-[#0a1628]">Yes, fully written</option>
                  <option className="bg-[#0a1628]">Partially written</option>
                  <option className="bg-[#0a1628]">No, I need help writing it</option>
                </select>
              </Field>
              <Field label="Which pages do you need?">
                <div className="grid grid-cols-2 gap-2">
                  {["Home", "About", "Services", "Contact", "Blog", "Portfolio", "Booking", "eCommerce", "FAQ", "Testimonials"].map((page) => (
                    <button key={page} type="button" onClick={() => togglePage(page)} className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-all border ${data.websitePages.includes(page) ? "bg-[#c9a84c]/20 border-[#c9a84c] text-[#c9a84c]" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30"}`}>
                      {page}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Do you have a domain name?"><input type="text" value={data.hasDomain} onChange={(e) => set("hasDomain", e.target.value)} placeholder="Yes — mybusiness.com / No, I need one" className={ic} /></Field>
              <Field label="Any special features needed?"><input type="text" value={data.websiteFeatures} onChange={(e) => set("websiteFeatures", e.target.value)} placeholder="Online booking, ecommerce, contact form, live chat..." className={ic} /></Field>
            </div>
          )}

          {/* STEP: Branding */}
          {currentStepName === "Branding" && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-2xl mb-1">Branding</h2>
              <p className="text-white/40 text-sm mb-6">Let&apos;s build a brand identity that stands out.</p>
              <Field label="How would you describe your brand personality?">
                <div className="grid grid-cols-3 gap-2">
                  {["Modern", "Classic", "Bold", "Minimal", "Playful", "Luxurious", "Edgy", "Friendly", "Professional"].map((p) => (
                    <button key={p} type="button" onClick={() => set("brandPersonality", data.brandPersonality === p ? "" : p)} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${data.brandPersonality === p ? "bg-[#c9a84c]/20 border-[#c9a84c] text-[#c9a84c]" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="3 brands you admire and why">
                <textarea rows={3} value={data.brandsAdmired} onChange={(e) => set("brandsAdmired", e.target.value)} placeholder="e.g. Nike — bold and motivational. Apple — minimal and premium. Chipotle — authentic and honest." className={`${ic} resize-none`} />
              </Field>
              <Field label="What makes your business different from competitors?" required>
                <textarea rows={3} value={data.brandDifferentiator} onChange={(e) => set("brandDifferentiator", e.target.value)} placeholder="What do you do that no one else does?" className={`${ic} resize-none`} />
              </Field>
            </div>
          )}

          {/* STEP: Social Media */}
          {currentStepName === "Social Media" && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-2xl mb-1">Social Media</h2>
              <p className="text-white/40 text-sm mb-6">Share your handles so we can audit your current presence.</p>
              {[
                { label: "Instagram", field: "instagramHandle", prefix: "@", placeholder: "yourbusiness" },
                { label: "TikTok", field: "tiktokHandle", prefix: "@", placeholder: "yourbusiness" },
                { label: "YouTube", field: "youtubeHandle", prefix: "@", placeholder: "yourbusiness" },
              ].map(({ label, field, prefix, placeholder }) => (
                <Field key={field} label={label}>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">{prefix}</span>
                    <input type="text" value={data[field as keyof typeof data] as string} onChange={(e) => set(field as keyof typeof data, e.target.value)} placeholder={placeholder} className={`${ic} pl-8`} />
                  </div>
                </Field>
              ))}
              <Field label="Facebook Page"><input type="text" value={data.facebookPage} onChange={(e) => set("facebookPage", e.target.value)} placeholder="facebook.com/yourbusiness" className={ic} /></Field>
              <Field label="LinkedIn"><input type="text" value={data.linkedinPage} onChange={(e) => set("linkedinPage", e.target.value)} placeholder="linkedin.com/company/yourbusiness" className={ic} /></Field>
              <Field label="Other platforms"><input type="text" value={data.otherSocials} onChange={(e) => set("otherSocials", e.target.value)} placeholder="Twitter/X, Pinterest, etc." className={ic} /></Field>
              <Field label="What are you currently struggling with on social media?" required>
                <textarea rows={3} value={data.socialStruggles} onChange={(e) => set("socialStruggles", e.target.value)} placeholder="e.g. Not getting enough engagement, don't know what to post, no time to create content..." className={`${ic} resize-none`} />
              </Field>
              <Field label="How often do you currently post?">
                <select value={data.postingFrequency} onChange={(e) => set("postingFrequency", e.target.value)} className={ic} style={{ colorScheme: "dark" }}>
                  <option value="" className="bg-[#0a1628]">Select...</option>
                  {["Daily", "3-5x per week", "1-2x per week", "A few times a month", "Rarely / Never"].map((o) => <option key={o} className="bg-[#0a1628]">{o}</option>)}
                </select>
              </Field>
              <Field label="What content has performed best for you?"><textarea rows={2} value={data.bestContent} onChange={(e) => set("bestContent", e.target.value)} placeholder="Videos, behind the scenes, product photos, reels..." className={`${ic} resize-none`} /></Field>
              <Field label="Who is your ideal client?"><textarea rows={2} value={data.idealClient} onChange={(e) => set("idealClient", e.target.value)} placeholder="Age, gender, location, job, income level, interests..." className={`${ic} resize-none`} /></Field>
              <Field label="What tone do you want for your content?">
                <select value={data.contentTone} onChange={(e) => set("contentTone", e.target.value)} className={ic} style={{ colorScheme: "dark" }}>
                  <option value="" className="bg-[#0a1628]">Select...</option>
                  {["Funny & Casual", "Professional & Clean", "Educational", "Inspirational", "Bold & Edgy", "Warm & Personal"].map((o) => <option key={o} className="bg-[#0a1628]">{o}</option>)}
                </select>
              </Field>
            </div>
          )}

          {/* STEP: Content Creation */}
          {currentStepName === "Content Creation" && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-2xl mb-1">Content Creation</h2>
              <p className="text-white/40 text-sm mb-6">Let&apos;s plan what we&apos;re going to shoot together.</p>
              <Field label="Do you have a shooting location?"><input type="text" value={data.shootingLocation} onChange={(e) => set("shootingLocation", e.target.value)} placeholder="Our store, my kitchen, outdoor locations, studio..." className={ic} /></Field>
              <Field label="Do you have products or props ready to shoot?">
                <select value={data.hasProps} onChange={(e) => set("hasProps", e.target.value)} className={ic} style={{ colorScheme: "dark" }}>
                  <option value="" className="bg-[#0a1628]">Select...</option>
                  <option className="bg-[#0a1628]">Yes, fully ready</option>
                  <option className="bg-[#0a1628]">Some items ready</option>
                  <option className="bg-[#0a1628]">Need to prepare</option>
                </select>
              </Field>
              <Field label="What style of content fits your brand?">
                <select value={data.contentStyle} onChange={(e) => set("contentStyle", e.target.value)} className={ic} style={{ colorScheme: "dark" }}>
                  <option value="" className="bg-[#0a1628]">Select...</option>
                  {["Lifestyle", "Product-focused", "Behind the Scenes", "Educational / Tips", "Testimonials", "Mix of everything"].map((o) => <option key={o} className="bg-[#0a1628]">{o}</option>)}
                </select>
              </Field>
              <Field label="How many posts/reels per month are you expecting?">
                <select value={data.postsPerMonth} onChange={(e) => set("postsPerMonth", e.target.value)} className={ic} style={{ colorScheme: "dark" }}>
                  <option value="" className="bg-[#0a1628]">Select...</option>
                  {["8-12 posts/month", "12-20 posts/month", "20-30 posts/month", "30+ posts/month", "Not sure yet"].map((o) => <option key={o} className="bg-[#0a1628]">{o}</option>)}
                </select>
              </Field>
            </div>
          )}

          {/* STEP: Paid Ads */}
          {currentStepName === "Paid Ads" && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-2xl mb-1">Paid Advertising</h2>
              <p className="text-white/40 text-sm mb-6">Let&apos;s map out your ad strategy before our kickoff call.</p>
              <Field label="Which platform(s) do you want to advertise on?">
                <div className="grid grid-cols-3 gap-2">
                  {["Meta / Instagram", "Google", "TikTok", "YouTube", "LinkedIn", "Not sure yet"].map((p) => (
                    <button key={p} type="button" onClick={() => set("adPlatform", data.adPlatform === p ? "" : p)} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${data.adPlatform === p ? "bg-[#c9a84c]/20 border-[#c9a84c] text-[#c9a84c]" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="What is the main goal of your ad campaign?" required>
                <select value={data.adGoal} onChange={(e) => set("adGoal", e.target.value)} className={ic} style={{ colorScheme: "dark" }}>
                  <option value="" className="bg-[#0a1628]">Select...</option>
                  {["More leads / inquiries", "More sales / revenue", "More followers / reach", "Brand awareness", "App downloads", "Event promotion"].map((o) => <option key={o} className="bg-[#0a1628]">{o}</option>)}
                </select>
              </Field>
              <Field label="Monthly ad spend budget (separate from management fee)">
                <select value={data.adSpendBudget} onChange={(e) => set("adSpendBudget", e.target.value)} className={ic} style={{ colorScheme: "dark" }}>
                  <option value="" className="bg-[#0a1628]">Select...</option>
                  {["Under $300/mo", "$300–$700/mo", "$700–$1,500/mo", "$1,500–$3,000/mo", "$3,000+/mo", "Not sure yet"].map((o) => <option key={o} className="bg-[#0a1628]">{o}</option>)}
                </select>
              </Field>
              <Field label="Describe your perfect customer" required>
                <textarea rows={3} value={data.perfectClient} onChange={(e) => set("perfectClient", e.target.value)} placeholder="Age, gender, location, job title, income level, what they care about..." className={`${ic} resize-none`} />
              </Field>
              <Field label="Do you have a landing page or should we build one?">
                <select value={data.hasLandingPage} onChange={(e) => set("hasLandingPage", e.target.value)} className={ic} style={{ colorScheme: "dark" }}>
                  <option value="" className="bg-[#0a1628]">Select...</option>
                  <option className="bg-[#0a1628]">Yes, I have one</option>
                  <option className="bg-[#0a1628]">No, I need one built</option>
                  <option className="bg-[#0a1628]">I'll use my website homepage</option>
                </select>
              </Field>
              <Field label="Have you run ads before? What worked or didn&apos;t?">
                <textarea rows={3} value={data.adHistory} onChange={(e) => set("adHistory", e.target.value)} placeholder="e.g. Tried Facebook ads last year, got clicks but no sales. Never tried Google." className={`${ic} resize-none`} />
              </Field>
            </div>
          )}

          {/* STEP: AI Agents */}
          {currentStepName === "AI Agents" && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-2xl mb-1">AI Agents & Automation</h2>
              <p className="text-white/40 text-sm mb-6">Let&apos;s figure out where AI can save you the most time.</p>
              <Field label="What repetitive tasks do you want to automate?" required>
                <textarea rows={3} value={data.automationTasks} onChange={(e) => set("automationTasks", e.target.value)} placeholder="e.g. Responding to Instagram DMs, booking appointments, answering FAQs, following up with leads..." className={`${ic} resize-none`} />
              </Field>
              <Field label="Do you use a CRM or booking system?"><input type="text" value={data.crmSystem} onChange={(e) => set("crmSystem", e.target.value)} placeholder="HubSpot, Calendly, Square, none..." className={ic} /></Field>
              <Field label="Which platforms do you want the AI to work on?">
                <div className="grid grid-cols-2 gap-2">
                  {["Instagram DMs", "WhatsApp", "Email", "SMS", "Website Chat", "Facebook Messenger"].map((p) => (
                    <button key={p} type="button" onClick={() => { const cur = data.aiPlatforms.split(", ").filter(Boolean); const updated = cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]; set("aiPlatforms", updated.join(", ")); }} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${data.aiPlatforms.includes(p) ? "bg-[#c9a84c]/20 border-[#c9a84c] text-[#c9a84c]" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="What is the #1 problem you want AI to solve?" required>
                <textarea rows={2} value={data.aiMainProblem} onChange={(e) => set("aiMainProblem", e.target.value)} placeholder="e.g. I miss too many DMs and lose leads. I need someone to respond 24/7." className={`${ic} resize-none`} />
              </Field>
              <Field label="Do you have existing scripts, FAQs, or responses we can train on?">
                <textarea rows={2} value={data.existingScripts} onChange={(e) => set("existingScripts", e.target.value)} placeholder="Paste them here or describe what you have..." className={`${ic} resize-none`} />
              </Field>
            </div>
          )}

          {/* STEP: Goals & Review */}
          {currentStepName === "Goals & Review" && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-2xl mb-1">Goals & Final Review</h2>
              <p className="text-white/40 text-sm mb-6">Last step — help us understand the bigger picture.</p>
              <Field label="Who is your target audience?">
                <textarea rows={2} value={data.targetAudience} onChange={(e) => set("targetAudience", e.target.value)} placeholder="Age range, location, interests, income..." className={`${ic} resize-none`} />
              </Field>
              <Field label="What is your main goal right now?" required>
                <select value={data.mainGoal} onChange={(e) => set("mainGoal", e.target.value)} className={ic} style={{ colorScheme: "dark" }}>
                  <option value="" className="bg-[#0a1628]">Select...</option>
                  {["Grow social media following", "Drive more sales / leads", "Build brand awareness", "Launch a new product/service", "Rebrand", "Build a new website", "All of the above"].map((o) => <option key={o} className="bg-[#0a1628]">{o}</option>)}
                </select>
              </Field>
              <Field label="Monthly marketing management budget">
                <select value={data.monthlyBudget} onChange={(e) => set("monthlyBudget", e.target.value)} className={ic} style={{ colorScheme: "dark" }}>
                  <option value="" className="bg-[#0a1628]">Select...</option>
                  {["Under $500/mo", "$500–$1,500/mo", "$1,500–$3,000/mo", "$3,000–$5,000/mo", "$5,000+/mo", "Not sure yet"].map((o) => <option key={o} className="bg-[#0a1628]">{o}</option>)}
                </select>
              </Field>
              <Field label="Who are your top 2–3 competitors?">
                <input type="text" value={data.topCompetitors} onChange={(e) => set("topCompetitors", e.target.value)} placeholder="Business names or Instagram handles" className={ic} />
              </Field>

              {/* Summary */}
              <div className="bg-white/5 rounded-xl p-4 space-y-2 mt-2">
                {[
                  { label: "Company", value: data.companyName },
                  { label: "Services", value: activeServices.join(", ") },
                  { label: "Instagram", value: data.instagramHandle ? `@${data.instagramHandle}` : "—" },
                  { label: "Main Goal", value: data.mainGoal || "—" },
                  { label: "Budget", value: data.monthlyBudget || "—" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between py-1.5 border-b border-white/8 last:border-0">
                    <span className="text-white/40 text-sm">{row.label}</span>
                    <span className="text-white font-medium text-sm">{row.value || "—"}</span>
                  </div>
                ))}
              </div>

              {error && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">{error}</p>}

              <div className="bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-xl p-4 text-sm text-[#c9a84c]">
                After submitting, Alejandro will review your answers and we&apos;ll reach out within 24 hours to schedule your kickoff call.
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={back} disabled={step === 1} className="flex items-center gap-2 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed font-medium text-sm transition-colors">
            <ChevronLeft size={16} /> Back
          </button>
          {step < totalSteps ? (
            <button onClick={next} className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4af61] text-[#0a1628] font-bold text-sm px-6 py-3 rounded-full transition-all">
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4af61] disabled:opacity-60 text-[#0a1628] font-bold text-sm px-6 py-3 rounded-full transition-all">
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : "Submit Onboarding →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const ic = "w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c9a84c]/60 transition-all";

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
