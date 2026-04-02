import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(request: Request) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10");
  const partnerId = searchParams.get("partner_id");

  let query = supabase
    .from("partner_news")
    .select("*")
    .eq("is_relevant", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (partnerId) {
    query = query.eq("partner_id", partnerId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
