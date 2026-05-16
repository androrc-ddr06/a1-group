import { redirect } from "next/navigation";
import Link from "next/link";
import { FolderOpen, ExternalLink, ArrowLeft } from "lucide-react";
import { createSessionClient, createServerClient } from "@/lib/supabase-server";

type Asset = { label: string; url: string };

async function getClientAssets() {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createServerClient();
  const { data: client } = await admin
    .from("clients")
    .select("id, name, company, assets")
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!client) return null;
  return { company: client.company, assets: (client.assets ?? []) as Asset[] };
}

export default async function AssetsPage() {
  const data = await getClientAssets();
  if (!data) redirect("/portal/login");

  const { company, assets } = data;

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
              <FolderOpen size={16} className="text-[#c9a84c]" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#0a1628]">My Assets</h1>
          </div>
          <p className="text-[#0a1628]/40 text-sm mt-1 ml-12">Deliverables and files from A1 Group</p>
        </div>

        {assets.length === 0 ? (
          <div className="bg-white border border-[#0a1628]/8 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#f8fafc] border border-[#0a1628]/8 flex items-center justify-center mx-auto mb-5">
              <FolderOpen size={24} className="text-[#0a1628]/20" />
            </div>
            <h2 className="text-[#0a1628] font-bold text-base mb-2">Nothing here yet</h2>
            <p className="text-[#0a1628]/40 text-sm max-w-xs mx-auto">
              Your deliverables will appear here as we complete work on your project.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {assets.map((asset, i) => (
              <a
                key={i}
                href={asset.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between bg-white border border-[#0a1628]/8 hover:border-[#0a1628]/20 rounded-2xl px-6 py-5 transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#f8fafc] group-hover:bg-[#0a1628] rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                    <FolderOpen size={16} className="text-[#0a1628] group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-[#0a1628] font-semibold text-sm">{asset.label}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#c9a84c] text-xs font-semibold">
                  Open <ExternalLink size={12} />
                </div>
              </a>
            ))}
          </div>
        )}

        <p className="text-[#0a1628]/25 text-xs mt-10 text-center">
          Questions? <Link href="/#contact" className="text-[#c9a84c] hover:underline">Contact A1 Group</Link>
        </p>
      </main>
    </div>
  );
}
