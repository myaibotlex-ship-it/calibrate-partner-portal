export interface Partner {
  id: string;
  airtable_id: string;
  name: string;
  slug: string;
  industries: string[];
  industry_subcategory: string[];
  partnership_types: string[];
  status: string;
  about: string | null;
  logo_url: string | null;
  notes: string | null;
  website: string | null;
  referral_to_percent: number | null;
  referral_from_percent: number | null;
  engagement_types: string[];
  calibrate_services_needed: string[];
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PartnershipType = 'Refer TO' | 'Refer FROM';
export type PartnerStatus = 'Active Partnership' | 'In Discussion' | 'Researching' | 'Outreach Pending' | 'Declined';

export interface PartnerFilters {
  search: string;
  industry: string;
  partnershipType: string;
}
