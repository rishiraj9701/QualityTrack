const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from backend folder if exists
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
if (!fs.existsSync(schemaPath)) {
  console.error('[Prisma Prepare] Error: schema.prisma not found at:', schemaPath);
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL || '';
const isPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://');
const targetProvider = isPostgres ? 'postgresql' : 'sqlite';

let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Regex to match provider inside datasource db { ... }
const datasourceRegex = /(datasource\s+db\s*\{[\s\S]*?provider\s*=\s*")[^"]+("\s*[\s\S]*?\})/;

if (datasourceRegex.test(schemaContent)) {
  const currentProviderMatch = schemaContent.match(/datasource\s+db\s*\{[\s\S]*?provider\s*=\s*"([^"]+)"/);
  const currentProvider = currentProviderMatch ? currentProviderMatch[1] : null;

  if (currentProvider !== targetProvider) {
    const updatedContent = schemaContent.replace(datasourceRegex, `$1${targetProvider}$2`);
    fs.writeFileSync(schemaPath, updatedContent, 'utf8');
    console.log(`[Prisma Prepare] Switched datasource provider from '${currentProvider}' to '${targetProvider}'.`);
  } else {
    console.log(`[Prisma Prepare] Datasource provider is already set to '${targetProvider}'.`);
  }
} else {
  console.warn('[Prisma Prepare] Warning: Could not match datasource db block in schema.prisma.');
}
