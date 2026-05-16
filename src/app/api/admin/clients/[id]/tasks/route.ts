import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

async function recalculateProgress(supabase: ReturnType<typeof createServerClient>, clientId: string) {
  const { data: allTasks } = await supabase
    .from("client_tasks")
    .select("*")
    .eq("client_id", clientId);

  if (!allTasks || allTasks.length === 0) return;

  const total = allTasks.length;
  const completedCount = allTasks.filter((t) => t.completed).length;
  const progress = Math.round((completedCount / total) * 100);

  const incomplete = allTasks
    .filter((t) => !t.completed && t.due_date)
    .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());

  const furthestDueDate = incomplete[0]?.due_date ?? null;
  let daysRemaining: number | null = null;
  if (furthestDueDate) {
    const diff = new Date(furthestDueDate).getTime() - new Date().getTime();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("client_id", clientId)
    .limit(1)
    .single();

  if (project) {
    await supabase
      .from("projects")
      .update({
        progress_percent: progress,
        ...(daysRemaining !== null ? { days_remaining: daysRemaining } : {}),
      })
      .eq("id", project.id);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { action, task_id, title, due_date } = body;

  const supabase = createServerClient();

  if (action === "toggle") {
    if (!task_id) return NextResponse.json({ error: "task_id required" }, { status: 400 });

    const { data: task } = await supabase
      .from("client_tasks")
      .select("*")
      .eq("id", task_id)
      .eq("client_id", id)
      .single();

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    await supabase
      .from("client_tasks")
      .update({ completed: !task.completed })
      .eq("id", task_id);

    await recalculateProgress(supabase, id);

    const { data: tasks } = await supabase
      .from("client_tasks")
      .select("*")
      .eq("client_id", id)
      .order("sort_order")
      .order("created_at");

    return NextResponse.json({ tasks: tasks ?? [] });
  }

  if (action === "add") {
    if (!title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });

    const { data: existing } = await supabase
      .from("client_tasks")
      .select("sort_order")
      .eq("client_id", id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

    const { data: newTask, error } = await supabase
      .from("client_tasks")
      .insert({
        client_id: id,
        title: title.trim(),
        due_date: due_date || null,
        completed: false,
        sort_order: nextOrder,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: tasks } = await supabase
      .from("client_tasks")
      .select("*")
      .eq("client_id", id)
      .order("sort_order")
      .order("created_at");

    return NextResponse.json({ task: newTask, tasks: tasks ?? [] });
  }

  if (action === "delete") {
    if (!task_id) return NextResponse.json({ error: "task_id required" }, { status: 400 });

    await supabase
      .from("client_tasks")
      .delete()
      .eq("id", task_id)
      .eq("client_id", id);

    await recalculateProgress(supabase, id);

    const { data: tasks } = await supabase
      .from("client_tasks")
      .select("*")
      .eq("client_id", id)
      .order("sort_order")
      .order("created_at");

    return NextResponse.json({ tasks: tasks ?? [] });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
