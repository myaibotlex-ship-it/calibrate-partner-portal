-- Partners table for Calibrate HCM Partner Portal
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  industries TEXT[] DEFAULT '{}',
  industry_subcategory TEXT[] DEFAULT '{}',
  partnership_types TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'Researching',
  about TEXT,
  logo_url TEXT,
  notes TEXT,
  website TEXT,
  referral_to_percent DECIMAL(5,4),
  referral_from_percent DECIMAL(5,4),
  engagement_types TEXT[] DEFAULT '{}',
  calibrate_services_needed TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner leads table for "Become a Partner" form
CREATE TABLE IF NOT EXISTS partner_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  industry TEXT,
  partnership_interest TEXT, -- 'Refer TO', 'Refer FROM', 'Both'
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_leads ENABLE ROW LEVEL SECURITY;

-- Public read access for partners (only active, non-declined)
CREATE POLICY "Public can view active partners" ON partners
  FOR SELECT
  USING (is_active = true AND status != 'Declined');

-- Only authenticated users can insert/update
CREATE POLICY "Authenticated users can manage partners" ON partners
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Anyone can submit a partner lead
CREATE POLICY "Anyone can submit partner leads" ON partner_leads
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can view leads
CREATE POLICY "Authenticated users can view leads" ON partner_leads
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Index for search performance
CREATE INDEX IF NOT EXISTS idx_partners_slug ON partners(slug);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_industries ON partners USING GIN(industries);
CREATE INDEX IF NOT EXISTS idx_partners_partnership_types ON partners USING GIN(partnership_types);

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS partners_updated_at ON partners;
CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
