"use client";

import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PartnerFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  industry: string;
  onIndustryChange: (value: string) => void;
  partnershipType: string;
  onPartnershipTypeChange: (value: string) => void;
  industries: string[];
  partnershipTypes: string[];
}

export function PartnerFilters({
  search,
  onSearchChange,
  industry,
  onIndustryChange,
  partnershipType,
  onPartnershipTypeChange,
  industries,
  partnershipTypes,
}: PartnerFiltersProps) {
  const hasFilters = search || industry || partnershipType;

  const clearFilters = () => {
    onSearchChange("");
    onIndustryChange("");
    onPartnershipTypeChange("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search partners..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        {hasFilters && (
          <Button variant="outline" onClick={clearFilters} className="gap-2">
            <X className="w-4 h-4" />
            Clear filters
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Filter className="w-4 h-4" />
            Industry:
          </span>
          <Button
            variant={industry === "" ? "default" : "outline"}
            size="sm"
            onClick={() => onIndustryChange("")}
          >
            All
          </Button>
          {industries.map((ind) => (
            <Button
              key={ind}
              variant={industry === ind ? "default" : "outline"}
              size="sm"
              onClick={() => onIndustryChange(ind)}
            >
              {ind}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">
            Partnership:
          </span>
          <Button
            variant={partnershipType === "" ? "default" : "outline"}
            size="sm"
            onClick={() => onPartnershipTypeChange("")}
          >
            All
          </Button>
          {partnershipTypes.map((type) => (
            <Button
              key={type}
              variant={partnershipType === type ? "default" : "outline"}
              size="sm"
              onClick={() => onPartnershipTypeChange(type)}
              className={
                type === "Refer TO"
                  ? partnershipType === type
                    ? "bg-blue-600 hover:bg-blue-700"
                    : ""
                  : partnershipType === type
                  ? "bg-purple-600 hover:bg-purple-700"
                  : ""
              }
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {hasFilters && (
        <div className="flex items-center gap-2 pt-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {search && (
            <Badge variant="secondary" className="gap-1">
              Search: {search}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => onSearchChange("")}
              />
            </Badge>
          )}
          {industry && (
            <Badge variant="secondary" className="gap-1">
              {industry}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => onIndustryChange("")}
              />
            </Badge>
          )}
          {partnershipType && (
            <Badge variant="secondary" className="gap-1">
              {partnershipType}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => onPartnershipTypeChange("")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
