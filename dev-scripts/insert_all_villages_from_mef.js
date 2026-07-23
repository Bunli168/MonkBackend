const { execSync } = require('child_process');
const { Province, District, Commune, Village, sequelize } = require('../models');

const BASE_URL = 'https://data.mef.gov.kh/api/v1/public-datasets/pd_68e370856a965e00074a5e7b/json';
const PAGE_SIZE = 200;
const MAX_PAGES = 200;
const MAX_RETRIES = 6;
const RETRY_DELAY_MS = 3000;
const PAGE_DELAY_MS = 500;
const BATCH_SIZE = 500;

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
function safeJsonParse(s) {
  try { return JSON.parse(s); } catch (e) { return null; }
}
function normalizeName(s) {
  if (!s) return '';
  const t = s.toString().trim().toLowerCase();
  // remove diacritics
  const noDiacritics = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // remove punctuation and collapse spaces
  return noDiacritics.replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchPage(page) {
  const url = `${BASE_URL}?page=${page}&page_size=${PAGE_SIZE}`;
  const cmd = `curl -sS -kL --compressed "${url}"`;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const out = execSync(cmd, { encoding: 'utf8', maxBuffer: 200 * 1024 * 1024 });
      if (!out) return null;
      if (out.trim().startsWith('<')) throw new Error('HTML_RESPONSE');
      const j = safeJsonParse(out);
      if (!j) throw new Error('INVALID_JSON');
      const items = j.items ?? j.data ?? j.results ?? j;
      if (!Array.isArray(items)) throw new Error('UNEXPECTED_SHAPE');
      return items;
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      await sleep(RETRY_DELAY_MS + attempt * 500);
    }
  }
  return null;
}

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    // Load existing locations
    const [provinces, districts, communes] = await Promise.all([
      Province.findAll(), District.findAll(), Commune.findAll()
    ]);

    const provinceByNorm = new Map(provinces.map(p => [normalizeName(p.name || p.name_en || ''), p]));
    const districtByNorm = new Map(districts.map(d => [normalizeName(d.name || d.name_en || ''), d]));
    const communesByDistrictAndNorm = new Map(); // key: districtId|norm -> commune
    const communesByNorm = new Map(); // norm -> [communes]

    for (const c of communes) {
      const norm = normalizeName(c.name || c.name_en || '');
      const key = `${c.district_id}|${norm}`;
      communesByDistrictAndNorm.set(key, c);
      const arr = communesByNorm.get(norm) || [];
      arr.push(c);
      communesByNorm.set(norm, arr);
    }

    const villagesToInsert = new Map(); // communeId -> Map(name-> {name,name_en,commune_id})
    const missingCommunes = new Map();

    for (let page = 1; page <= MAX_PAGES; page++) {
      console.log(`Fetching page ${page}`);
      let items;
      try {
        items = await fetchPage(page);
      } catch (err) {
        console.error('Failed to fetch page', page, err.message);
        break;
      }
      if (!items || items.length === 0) break;

      for (const row of items) {
        const provinceRaw = (row.province_kh || row.province || '').toString();
        const districtRaw = (row.district_kh || row.district || '').toString();
        const communeRaw = (row.commune_kh || row.commune || '').toString();
        const communeEnRaw = (row.commune_en || '').toString();
        const villageRaw = (row.village_kh || row.village || '').toString();
        const villageEnRaw = (row.village_en || '').toString();
        if (!communeRaw || !villageRaw) continue;

        const provinceNorm = normalizeName(provinceRaw || row.province_en);
        const districtNorm = normalizeName(districtRaw || row.district_en);
        const communeNorm = normalizeName(communeRaw);
        const communeEnNorm = normalizeName(communeEnRaw);

        // Attempt to find commune by district+commune
        let commune = null;
        if (districtNorm) {
          // try matching by district name -> find district id(s)
          const possibleDistricts = districts.filter(d => normalizeName(d.name || d.name_en || '') === districtNorm);
          if (possibleDistricts.length === 1) {
            const dId = possibleDistricts[0].id;
            const key = `${dId}|${communeNorm}`;
            commune = communesByDistrictAndNorm.get(key);
          } else if (possibleDistricts.length > 1) {
            // try province-scoped
            let found = null;
            for (const pd of possibleDistricts) {
              const key = `${pd.id}|${communeNorm}`;
              if (communesByDistrictAndNorm.has(key)) { found = communesByDistrictAndNorm.get(key); break; }
            }
            commune = found;
          }
        }

        // Fallback: commune name unique match
        if (!commune) {
          const arr = communesByNorm.get(communeNorm) || [];
          if (arr.length === 1) commune = arr[0];
        }

        // fallback: match by commune_en normalized
        if (!commune && communeEnNorm) {
          const arr = communesByNorm.get(communeEnNorm) || [];
          if (arr.length === 1) commune = arr[0];
        }

        // last resort: try to match by district name mapped to district id, then find commune by that district id and closest name
        if (!commune && districtNorm) {
          const possibleDistricts = districts.filter(d => normalizeName(d.name || d.name_en || '') === districtNorm);
          for (const pd of possibleDistricts) {
            const cands = communes.filter(c => c.district_id === pd.id);
            const match = cands.find(c => normalizeName(c.name || c.name_en || '') === communeNorm);
            if (match) { commune = match; break; }
          }
        }

        if (!commune) {
          // record missing
          const key = `${provinceRaw} | ${districtRaw} | ${communeRaw}`;
          missingCommunes.set(key, (missingCommunes.get(key) || 0) + 1);
          continue;
        }

        const cId = commune.id;
        const vName = villageRaw.trim();
        const vEn = villageEnRaw.trim();
        const mapForComm = villagesToInsert.get(cId) || new Map();
        if (!mapForComm.has(vName)) mapForComm.set(vName, { name: vName, name_en: vEn, commune_id: cId });
        villagesToInsert.set(cId, mapForComm);
      }

      await sleep(PAGE_DELAY_MS);
    }

    // Prepare bulk insert
    let totalToInsert = 0;
    const insertRows = [];
    for (const [communeId, map] of villagesToInsert.entries()) {
      for (const v of map.values()) { insertRows.push(v); }
    }
    totalToInsert = insertRows.length;

    console.log('Total unique villages discovered to insert:', totalToInsert);
    console.log('Missing communes (could not map):', missingCommunes.size);

    if (totalToInsert > 0) {
      for (let i = 0; i < insertRows.length; i += BATCH_SIZE) {
        const batch = insertRows.slice(i, i + BATCH_SIZE);
        console.log(`Inserting batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length})`);
        await Village.bulkCreate(batch, { ignoreDuplicates: true });
      }
      console.log('Insert complete');
    }

    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
})();
