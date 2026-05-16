import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createClaudeClient } from "@/lib/claude";

export const maxDuration = 60;

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const today = new Date().toISOString().split("T")[0];
  const supabase = createServerClient();

  const [onboardingRes, callNoteRes, clientRes] = await Promise.all([
    supabase
      .from("onboarding_responses")
      .select("*")
      .eq("client_id", id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .single(),
    supabase.from("call_notes").select("*").eq("client_id", id).single(),
    supabase
      .from("clients")
      .select("name, company, services, contract_months")
      .eq("id", id)
      .single(),
  ]);

  if (!onboardingRes.data) {
    return NextResponse.json({ error: "No onboarding response found" }, { status: 400 });
  }

  const onboarding = onboardingRes.data;
  const callNote = callNoteRes.data;
  const client = clientRes.data;

  const prompt = `Today's date: ${today}

You are a project manager for A1 Group, a digital marketing agency.
Based on the following client information, generate a task checklist for completing this client's project.

CLIENT: ${client?.name ?? "Unknown"} — ${client?.company ?? "Unknown"}
SERVICES: ${(client?.services ?? []).join(", ")}
CONTRACT LENGTH: ${client?.contract_months ?? 3} months
INDUSTRY: ${onboarding.industry ?? "N/A"}
MAIN GOAL: ${onboarding.main_goal ?? "N/A"}
WEBSITE PURPOSE: ${onboarding.website_purpose ?? "N/A"}
WEBSITE PAGES: ${onboarding.website_pages ?? "N/A"}
WEBSITE FEATURES: ${onboarding.website_features ?? "N/A"}
TARGET AUDIENCE: ${onboarding.target_audience ?? "N/A"}
TOP COMPETITORS: ${onboarding.top_competitors ?? "N/A"}
BRAND COLORS: ${onboarding.brand_colors ?? "N/A"}
FONT PREFERENCES: ${onboarding.font_preferences ?? "N/A"}
MONTHLY BUDGET: ${onboarding.monthly_budget ?? "N/A"}
CALL NOTES: ${callNote?.notes ?? "None provided"}

Generate 8-15 actionable, specific tasks ordered chronologically to complete this client's project.
Tasks should be concrete and deliverable (e.g. "Design homepage wireframe", "Send brand assets request to client", "Launch Facebook ad campaign").
Use realistic due dates spread across the contract period starting from today.

Return ONLY a JSON array with no other text, no markdown, no code fences:
[{"title": "...", "due_date": "YYYY-MM-DD"}, ...]`;

  const claude = createClaudeClient();
  const response = await claude.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText = response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = rawText
    .replace(/^```json\n?/, "")
    .replace(/^```\n?/, "")
    .replace(/\n?```$/, "")
    .trim();

  let parsed: { title: string; due_date: string }[];
  try {
    parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error("Not an array");
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response", raw: rawText }, { status: 500 });
  }

  // Ensure a project row exists for this client (create if missing)
  const { data: existingProject } = await supabase
    .from("projects")
    .select("id")
    .eq("client_id", id)
    .limit(1)
    .single();

  if (!existingProject) {
    const furthestDate = parsed
      .map((t) => t.due_date)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;
    await supabase.from("projects").insert({
      client_id: id,
      name: `${client?.company ?? "Project"} — ${(client?.services ?? []).join(", ") || "Services"}`,
      progress_percent: 0,
      days_remaining: furthestDate
        ? Math.max(0, Math.ceil((new Date(furthestDate).getTime() - Date.now()) / 86400000))
        : 30,
      start_date: today,
      due_date: furthestDate,
      status: "active",
    });
  }

  // Delete existing incomplete tasks — preserve completed ones
  await supabase
    .from("client_tasks")
    .delete()
    .eq("client_id", id)
    .eq("completed", false);

  const tasksToInsert = parsed.map((t, i) => ({
    client_id: id,
    title: t.title,
    due_date: t.due_date || null,
    completed: false,
    sort_order: i,
  }));

  const { data: newTasks, error: insertError } = await supabase
    .from("client_tasks")
    .insert(tasksToInsert)
    .select();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // Recalculate progress now that tasks exist
  const total = newTasks.length;
  const completedCount = newTasks.filter((t) => t.completed).length;
  const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const furthestDue = newTasks
    .map((t) => t.due_date)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;
  const daysRemaining = furthestDue
    ? Math.max(0, Math.ceil((new Date(furthestDue).getTime() - Date.now()) / 86400000))
    : null;

  await supabase
    .from("projects")
    .update({
      progress_percent: progress,
      ...(daysRemaining !== null ? { days_remaining: daysRemaining } : {}),
      ...(furthestDue ? { due_date: furthestDue } : {}),
    })
    .eq("client_id", id);

  return NextResponse.json({ tasks: newTasks });
}
