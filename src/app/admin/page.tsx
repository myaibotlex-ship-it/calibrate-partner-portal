"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Partner } from "@/types/partner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, RefreshCw, ExternalLink } from "lucide-react";
import Image from "next/image";

export default function AdminDashboard() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = sessionStorage.getItem("admin_auth");
    if (auth !== "authenticated") {
      router.push("/admin/login");
      return;
    }
    setIsAuthenticated(true);
    fetchPartners();
  }, [router]);

  async function fetchPartners() {
    setLoading(true);
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching partners:", error);
    } else {
      setPartners(data || []);
    }
    setLoading(false);
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_auth");
    router.push("/admin/login");
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4B84]"></div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    "Active Partnership": "bg-green-100 text-green-800",
    "In Discussion": "bg-blue-100 text-blue-800",
    "Researching": "bg-yellow-100 text-yellow-800",
    "Outreach Pending": "bg-orange-100 text-orange-800",
    "Declined": "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-[#1A4B84] text-white py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image 
            src="/calibrate-logo.png" 
            alt="Calibrate HCM" 
            width={120} 
            height={35}
            className="h-8 w-auto brightness-0 invert"
          />
          <span className="text-white/70">|</span>
          <span className="font-medium">Partner Portal Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchPartners}
            className="text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Partner Management</h1>
          <p className="text-gray-600">Manage your partner directory ({partners.length} partners)</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {["Active Partnership", "In Discussion", "Researching", "Outreach Pending", "Declined"].map((status) => (
            <div key={status} className="bg-white rounded-lg p-4 border shadow-sm">
              <div className="text-2xl font-bold text-gray-900">
                {partners.filter(p => p.status === status).length}
              </div>
              <div className="text-sm text-gray-600">{status}</div>
            </div>
          ))}
        </div>

        {/* Partner Table */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Partner</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Industry</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Loading partners...
                    </td>
                  </tr>
                ) : partners.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No partners found
                    </td>
                  </tr>
                ) : (
                  partners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {partner.logo_url ? (
                            <img 
                              src={partner.logo_url} 
                              alt={partner.name}
                              className="w-10 h-10 rounded object-contain bg-gray-100"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-medium">
                              {partner.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{partner.name}</div>
                            {partner.is_featured && (
                              <span className="text-xs text-[#3BB4C1]">Featured</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusColors[partner.status || ""] || "bg-gray-100 text-gray-800"}>
                          {partner.status || "Unknown"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {partner.partnership_types?.map((type) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">
                          {partner.industries?.join(", ") || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <a 
                          href={`/partners/${partner.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1A4B84] hover:underline inline-flex items-center gap-1 text-sm"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
