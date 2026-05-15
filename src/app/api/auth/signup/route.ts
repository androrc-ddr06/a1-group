import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { email, password, accessCode } = await req.json();

  if (!email || !password || !accessCode) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const supabase = createServerClient();

  // Validate access code
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, email, access_code, status")
    .eq("access_code", accessCode.toUpperCase())
    .single();

  if (clientError || !client) {
    return NextResponse.json(
      { error: "Invalid access code. Please check the code A1 Group sent you." },
      { status: 400 }
    );
  }

  // Make sure code hasn't been used by a different email
  if (client.email && client.email !== email) {
    return NextResponse.json(
      { error: "This access code is registered to a different email address." },
      { status: 400 }
    );
  }

  // Create Supabase auth user
  const { data: authData, error: signupError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification for now
    user_metadata: { client_id: client.id },
  });

  if (signupError) {
    if (signupError.message.includes("already registered")) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: signupError.message }, { status: 400 });
  }

  // Link auth user to client record
  await supabase
    .from("clients")
    .update({ auth_user_id: authData.user.id, email })
    .eq("id", client.id);

  return NextResponse.json({ success: true });
}
