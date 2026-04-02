"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ExternalLink, Newspaper, Clock } from "lucide-react";

interface NewsItem {
  id: string;
  partner_name: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  published_at: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function NewsFeed({ limit = 5 }: { limit?: number }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      const { data, error } = await supabase
        .from("partner_news")
        .select("*")
        .eq("is_relevant", true)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching news:", error);
      } else {
        setNews(data || []);
      }
      setLoading(false);
    }

    fetchNews();
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p>No partner news yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {news.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white dark:bg-gray-900 rounded-lg p-4 border shadow-sm hover:shadow-md transition-shadow group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span className="font-medium text-[#1A4B84]">{item.partner_name}</span>
                <span>•</span>
                <span>{item.source}</span>
                {item.published_at && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.published_at)}
                    </span>
                  </>
                )}
              </div>
              <h4 className="font-medium text-sm leading-snug group-hover:text-[#1A4B84] transition-colors line-clamp-2">
                {item.title}
              </h4>
              {item.snippet && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {item.snippet}
                </p>
              )}
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-[#1A4B84] flex-shrink-0 mt-1" />
          </div>
        </a>
      ))}
    </div>
  );
}
