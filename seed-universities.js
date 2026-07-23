const { sequelize, University } = require('./models');

const CSV_URL = 'https://data.opendevelopmentcambodia.net/en/dataset/ba29bd88-0bce-442b-89ce-d73c958c02f3/resource/2b8d5c12-4f47-4a2a-bb61-a0a7e5698acb/download/public-university-of-cambodia-english-language.csv';

function parseCSV(text) {
  const lines = text.trim().split('\n').map(l => l.replace(/\r$/, ''));
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += char; }
    }
    values.push(current.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = values[i] || ''; });
    return obj;
  });
}

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    
    await sequelize.sync({ alter: true });
    console.log('Tables synced');
    
    const response = await fetch(CSV_URL);
    const text = await response.text();
    const rows = parseCSV(text);
    
    console.log(`Found ${rows.length} universities`);
    
    // Clear existing
    await University.destroy({ where: {} });
    
    let seeded = 0;
    for (const row of rows) {
      await University.create({
        name: row['university_name'] || '',
        province: row['province'] || '',
        district: row['district'] || '',
        commune: row['commune'] || '',
        village: row['village'] || '',
        website: row['website'] || '',
        email: row['email'] || '',
        tel: row['tel'] || '',
        rector: row['rector'] || '',
        establish_date: row['establish _date'] || row['establish_date'] || '',
        faculties: row['faculty_kh'] || '',
        language: row['language'] || ''
      });
      seeded++;
    }
    
    console.log(`✅ Seeded ${seeded} universities`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

seed();
