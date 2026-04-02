"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Partner } from "@/types/partner";
import { PartnerCard } from "@/components/PartnerCard";
import { PartnerFilters } from "@/components/PartnerFilters";
import { Handshake, Users, TrendingUp } from "lucide-react";

export default function Home() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [partnershipType, setPartnershipType] = useState("");

  useEffect(() => {
    async function fetchPartners() {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .neq("status", "Declined")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("name");

      if (error) {
        console.error("Error fetching partners:", error);
      } else {
        setPartners(data || []);
      }
      setLoading(false);
    }

    fetchPartners();
  }, []);

  const industries = useMemo(() => {
    const allIndustries = partners.flatMap((p) => p.industries);
    return [...new Set(allIndustries)].sort();
  }, [partners]);

  const partnershipTypes = useMemo(() => {
    const allTypes = partners.flatMap((p) => p.partnership_types);
    return [...new Set(allTypes)].sort();
  }, [partners]);

  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      const matchesSearch =
        !search ||
        partner.name.toLowerCase().includes(search.toLowerCase()) ||
        partner.about?.toLowerCase().includes(search.toLowerCase()) ||
        partner.industries.some((i) =>
          i.toLowerCase().includes(search.toLowerCase())
        );

      const matchesIndustry =
        !industry || partner.industries.includes(industry);

      const matchesType =
        !partnershipType ||
        partner.partnership_types.includes(partnershipType);

      return matchesSearch && matchesIndustry && matchesType;
    });
  }, [partners, search, industry, partnershipType]);

  const stats = useMemo(() => {
    const activePartners = partners.filter(
      (p) => p.status === "Active Partnership"
    );
    const referTo = partners.filter((p) =>
      p.partnership_types.includes("Refer TO")
    );
    const referFrom = partners.filter((p) =>
      p.partnership_types.includes("Refer FROM")
    );

    return {
      total: partners.length,
      active: activePartners.length,
      referTo: referTo.length,
      referFrom: referFrom.length,
    };
  }, [partners]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1A4B84] via-[#1A4B84] to-[#3BB4C1] text-white py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Our Partner Ecosystem
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Calibrate HCM collaborates with industry-leading technology
              providers, benefits brokers, and consultants to deliver
              comprehensive HR solutions for your business.
            </p>
            <div className="grid grid-cols-3 gap-6 max-w-lg">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-sm text-blue-200">Total Partners</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.active}</div>
                <div className="text-sm text-blue-200">Active</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {industries.length}
                </div>
                <div className="text-sm text-blue-200">Industries</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Types Info */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#1A4B84]/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#1A4B84]" />
                </div>
                <h3 className="font-semibold text-lg">Refer TO Partners</h3>
              </div>
              <p className="text-muted-foreground">
                Partners we recommend to clients for complementary services like
                payroll, benefits administration, and HR technology.
              </p>
              <div className="mt-3 text-sm font-medium text-[#1A4B84]">
                {stats.referTo} partners
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#3BB4C1]/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#3BB4C1]" />
                </div>
                <h3 className="font-semibold text-lg">Refer FROM Partners</h3>
              </div>
              <p className="text-muted-foreground">
                Partners who refer clients to Calibrate HCM for data migration,
                HR consulting, and technology integration services.
              </p>
              <div className="mt-3 text-sm font-medium text-[#3BB4C1]">
                {stats.referFrom} partners
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Directory */}
      <section className="py-12">
        <div className="container">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Partner Directory</h2>
            <p className="text-muted-foreground">
              Browse our network of trusted partners
            </p>
          </div>

          <PartnerFilters
            search={search}
            onSearchChange={setSearch}
            industry={industry}
            onIndustryChange={setIndustry}
            partnershipType={partnershipType}
            onPartnershipTypeChange={setPartnershipType}
            industries={industries}
            partnershipTypes={partnershipTypes}
          />

          <div className="mt-8">
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-64 bg-muted animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : filteredPartners.length === 0 ? (
              <div className="text-center py-12">
                <Handshake className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No partners found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPartners.map((partner) => (
                  <PartnerCard key={partner.id} partner={partner} />
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Showing {filteredPartners.length} of {partners.length} partners
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-muted/20">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div>
              © {new Date().getFullYear()} Calibrate HCM. All rights reserved.
            </div>
            <a
              href="/admin/login"
              className="hover:text-foreground transition-colors"
            >
              Admin
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
