import { redirect } from "next/navigation";
import Link from "next/link";
import { TrendingUp, CheckCircle, Circle, Clock, ArrowLeft, Calendar } from "lucide-react";
import { createSessionClient, createServerClient } from "@/lib/supabase-server";

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

async function getReportsData() {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createServerClient();

  const { data: client } = await admin
    .from("clients")
    .select("id, name, company, service_timeline")
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!client) return null;

  const [projectRes, tasksRes, updatesRes] = await Promise.all([
    admin
      .from("projects")
      .select("*")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    admin
      .from("client_tasks")
      .select("*")
      .eq("client_id", client.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    admin
      .from("client_updates")
      .select("*")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return {
    company: client.company,
    serviceTimeline: (client.service_timeline ?? []) as { month: number; service: string; status: string }[],
    project: projectRes.data ?? null,
    tasks: tasksRes.data ?? [],
    updates: updatesRes.data ?? [],
  };
}

export default async function ReportsPage() {
  const data = await getReportsData();
  if (!data) redirect("/portal/login");

  const { company, project, tasks, updates, serviceTimeline } = data;

  const completedTasks = tasks.filter((t) => t.completed);
  const pendingTasks = tasks.filter((t) => !t.completed);

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
        <div className="mb-8 flex items-center gap-4">
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
              <TrendingUp size={16} className="text-[#c9a84c]" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#0a1628]">Project Report</h1>
          </div>
          <p className="text-[#0a1628]/40 text-sm mt-1 ml-12">Full breakdown of your project status</p>
        </div>

        {/* Project header card */}
        {project ? (
          <div className="bg-[#0a1628] rounded-2xl p-8 mb-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div>
                <span className="text-[#c9a84c] text-xs font-semibold uppercase tracking-widest">Active Project</span>
                <h2 className="text-xl font-bold mt-1">{project.name}</h2>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 self-start">
                <Clock size={14} className="text-[#c9a84c]" />
                <span className="text-sm font-semibold">{project.days_remaining} days remaining</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-xs text-white/50 mb-2">
                <span>Overall Progress</span>
                <span className="font-bold text-white text-base">{project.progress_percent}%</span>
              </div>
              <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#c9a84c] rounded-full transition-all duration-700"
                  style={{ width: `${project.progress_percent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
              <div>
                <div className="text-white/40 text-xs mb-1">Start Date</div>
                <div className="text-white text-sm font-semibold">{formatDate(project.start_date)}</div>
              </div>
              <div>
                <div className="text-white/40 text-xs mb-1">Due Date</div>
                <div className="text-white text-sm font-semibold">{formatDate(project.due_date)}</div>
              </div>
              <div>
                <div className="text-white/40 text-xs mb-1">Tasks Completed</div>
                <div className="text-white text-sm font-semibold">{completedTasks.length} / {tasks.length}</div>
              </div>
              <div>
                <div className="text-white/40 text-xs mb-1">Status</div>
                <div className="text-[#c9a84c] text-sm font-semibold capitalize">{project.status ?? "Active"}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0a1628] rounded-2xl p-8 mb-6 text-white text-center">
            <p className="text-white/50">Your project is being set up. Check back soon!</p>
          </div>
        )}

        {/* Task checklist */}
        {tasks.length > 0 && (
          <div className="bg-white border border-[#0a1628]/8 rounded-2xl p-6 mb-6">
            <h3 className="text-[#0a1628] font-bold text-lg mb-5">Task Checklist</h3>

            {pendingTasks.length > 0 && (
              <div className="mb-6">
                <div className="text-[#0a1628]/40 text-xs font-semibold uppercase tracking-widest mb-3">In Progress</div>
                <div className="space-y-2">
                  {pendingTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 py-2.5 border-b border-[#0a1628]/5 last:border-0">
                      <Circle size={16} className="text-[#0a1628]/20 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[#0a1628]/70 text-sm">{task.title}</div>
                        {task.due_date && (
                          <div className="flex items-center gap-1 text-[#0a1628]/30 text-xs mt-0.5">
                            <Calendar size={10} />
                            Due {formatDate(task.due_date)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completedTasks.length > 0 && (
              <div>
                <div className="text-[#0a1628]/40 text-xs font-semibold uppercase tracking-widest mb-3">Completed</div>
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 py-2.5 border-b border-[#0a1628]/5 last:border-0">
                      <CheckCircle size={16} className="text-[#c9a84c] mt-0.5 flex-shrink-0" />
                      <div className="text-[#0a1628]/40 text-sm line-through">{task.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Service timeline */}
        {serviceTimeline.length > 0 && (
          <div className="bg-white border border-[#0a1628]/8 rounded-2xl p-6 mb-6">
            <h3 className="text-[#0a1628] font-bold text-lg mb-5">Service Timeline</h3>
            <div className="space-y-3">
              {serviceTimeline.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#f8fafc] border border-[#0a1628]/8 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#0a1628]/50 text-xs font-bold">M{item.month}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-[#0a1628] text-sm font-semibold">{item.service}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    item.status === "active"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-[#0a1628]/5 text-[#0a1628]/40"
                  }`}>
                    {item.status === "active" ? "Active" : "Upcoming"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent updates */}
        {updates.length > 0 && (
          <div className="bg-white border border-[#0a1628]/8 rounded-2xl p-6 mb-6">
            <h3 className="text-[#0a1628] font-bold text-lg mb-5">Recent Updates</h3>
            <div className="space-y-4">
              {updates.map((u) => (
                <div key={u.id} className="flex gap-4 pb-4 border-b border-[#0a1628]/6 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-[#0a1628] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">A1</span>
                  </div>
                  <div>
                    <p className="text-[#0a1628]/80 text-sm leading-relaxed">{u.message}</p>
                    <span className="text-[#0a1628]/30 text-xs mt-1 block">{formatDate(u.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[#0a1628]/25 text-xs mt-6 text-center">
          Questions? <Link href="/#contact" className="text-[#c9a84c] hover:underline">Contact A1 Group</Link>
        </p>
      </main>
    </div>
  );
}
