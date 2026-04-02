#!/usr/bin/env node
/**
 * Fetch news for all partners via Brave Search API
 * Run via: BRAVE_API_KEY=xxx node scripts/fetch-partner-news.mjs
 * 
 * This script is designed to be called by Clawdbot's cron system
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kfyhljqanxunrnnvnftc.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

if (!SUPABASE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function searchBrave(query) {
  if (!BRAVE_API_KEY) {
    console.log(`[SKIP] No Brave API key - would search: "${query}"`);
    return [];
  }
  
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "5");
  url.searchParams.set("freshness", "pw"); // past week
  
  const res = await fetch(url, {
    headers: { "X-Subscription-Token": BRAVE_API_KEY }
  });
  
  if (!res.ok) {
    console.error(`Brave search failed: ${res.status}`);
    return [];
  }
  
  const data = await res.json();
  return data.web?.results || [];
}

async function fetchNewsForPartner(partner) {
  console.log(`Searching news for: ${partner.name}`);
  
  // Search for recent news about this partner
  const query = `"${partner.name}" news OR announcement OR partnership 2026`;
  const results = await searchBrave(query);
  
  const newsItems = [];
  for (const result of results) {
    // Skip if we already have this URL
    const { data: existing } = await supabase
      .from("partner_news")
      .select("id")
      .eq("url", result.url)
      .single();
    
    if (existing) continue;
    
    // Parse published date if available
    let publishedAt = null;
    if (result.page_age) {
      publishedAt = new Date(result.page_age).toISOString();
    }
    
    newsItems.push({
      partner_id: partner.id,
      partner_name: partner.name,
      title: result.title,
      url: result.url,
      snippet: result.description,
      source: new URL(result.url).hostname.replace("www.", ""),
      published_at: publishedAt,
    });
  }
  
  if (newsItems.length > 0) {
    const { error } = await supabase.from("partner_news").insert(newsItems);
    if (error) {
      console.error(`Error inserting news for ${partner.name}:`, error.message);
    } else {
      console.log(`  Added ${newsItems.length} news items`);
    }
  } else {
    console.log(`  No new items found`);
  }
  
  return newsItems.length;
}

async function main() {
  console.log("=== Partner News Fetch ===");
  console.log(`Time: ${new Date().toISOString()}\n`);
  
  // Get all active partners
  const { data: partners, error } = await supabase
    .from("partners")
    .select("id, name")
    .eq("is_active", true);
  
  if (error) {
    console.error("Failed to fetch partners:", error.message);
    process.exit(1);
  }
  
  console.log(`Found ${partners.length} active partners\n`);
  
  let totalAdded = 0;
  for (const partner of partners) {
    const added = await fetchNewsForPartner(partner);
    totalAdded += added;
    
    // Rate limit: wait 500ms between searches
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\n=== Complete ===`);
  console.log(`Total new articles: ${totalAdded}`);
}

main().catch(console.error);
