import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// POST /api/onboarding — save onboarding form data
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { client_id, ...formData } = body;

  if (!client_id) {
    return NextResponse.json({ error: "client_id required" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Save onboarding responses
  const { error: onboardingError } = await supabase
    .from("onboarding_responses")
    .insert({ client_id, ...formData });

  if (onboardingError) {
    return NextResponse.json({ error: onboardingError.message }, { status: 500 });
  }

  // Update client status to onboarding
  await supabase
    .from("clients")
    .update({ status: "onboarding" })
    .eq("id", client_id);

  return NextResponse.json({ success: true });
}
