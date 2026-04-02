import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.kfyhljqanxunrnnvnftc:z7MwQPRXiEGnL5cC@aws-0-us-west-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const schema = `
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
  partnership_interest TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for search performance
CREATE INDEX IF NOT EXISTS idx_partners_slug ON partners(slug);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_industries ON partners USING GIN(industries);
CREATE INDEX IF NOT EXISTS idx_partners_partnership_types ON partners USING GIN(partnership_types);
`;

async function setup() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    await client.query(schema);
    console.log('Schema created successfully');
    
    await client.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setup();
