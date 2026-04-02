import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupContactsTable() {
  console.log('Creating partner_contacts table...');
  
  await client.connect();
  
  // Create partner_contacts table
  await client.query(`
    CREATE TABLE IF NOT EXISTS partner_contacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      phone TEXT,
      position TEXT,
      is_primary BOOLEAN DEFAULT false,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  console.log('✓ partner_contacts table created');
  
  // Create indexes
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_partner_contacts_partner_id ON partner_contacts(partner_id);
  `).catch(() => {}); // Ignore if exists
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_partner_contacts_email ON partner_contacts(email);
  `).catch(() => {}); // Ignore if exists
  
  console.log('✓ Indexes created');
  
  // Enable RLS
  await client.query(`
    ALTER TABLE partner_contacts ENABLE ROW LEVEL SECURITY;
  `).catch(() => {});
  
  // Create policies (ignore errors if they exist)
  const policies = [
    `CREATE POLICY "Allow public read for partner_contacts" ON partner_contacts FOR SELECT USING (true)`,
    `CREATE POLICY "Allow insert for partner_contacts" ON partner_contacts FOR INSERT WITH CHECK (true)`,
    `CREATE POLICY "Allow update for partner_contacts" ON partner_contacts FOR UPDATE USING (true)`,
    `CREATE POLICY "Allow delete for partner_contacts" ON partner_contacts FOR DELETE USING (true)`
  ];
  
  for (const policy of policies) {
    try {
      await client.query(policy);
    } catch (e) {
      // Policy already exists
    }
  }
  console.log('✓ RLS policies created');
  
  // Ensure website column exists on partners
  await client.query(`
    ALTER TABLE partners ADD COLUMN IF NOT EXISTS website TEXT;
  `).catch(() => {});
  console.log('✓ Website column ensured');
  
  await client.end();
  console.log('\nSetup complete!');
}

setupContactsTable().catch(console.error);
