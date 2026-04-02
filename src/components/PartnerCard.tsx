"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowRight, Star } from "lucide-react";
import { Partner } from "@/types/partner";

interface PartnerCardProps {
  partner: Partner;
}

export function PartnerCard({ partner }: PartnerCardProps) {
  const partnershipColors: Record<string, string> = {
    "Refer TO": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    "Refer FROM": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  };

  return (
    <Link href={`/partners/${partner.slug}`}>
      <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer group relative overflow-hidden">
        {partner.is_featured && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-amber-500 text-white hover:bg-amber-600">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Featured
            </Badge>
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {partner.logo_url ? (
                <Image
                  src={partner.logo_url}
                  alt={`${partner.name} logo`}
                  width={64}
                  height={64}
                  className="object-contain"
                />
              ) : (
                <Building2 className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                {partner.name}
              </h3>
              {partner.industries.length > 0 && (
                <p className="text-sm text-muted-foreground truncate">
                  {partner.industries.join(", ")}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {partner.about && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {partner.about}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            {partner.partnership_types.map((type) => (
              <Badge
                key={type}
                className={partnershipColors[type] || ""}
                variant="secondary"
              >
                {type}
              </Badge>
            ))}
          </div>
          {partner.industry_subcategory.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {partner.industry_subcategory.slice(0, 3).map((sub) => (
                <Badge key={sub} variant="outline" className="text-xs">
                  {sub}
                </Badge>
              ))}
              {partner.industry_subcategory.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{partner.industry_subcategory.length - 3}
                </Badge>
              )}
            </div>
          )}
          <div className="mt-4 flex items-center text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            View Partner <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
