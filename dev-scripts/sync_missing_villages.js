const { execSync } = require('child_process');
const { Province, District, Commune, Village, sequelize } = require('../models');

const BASE_URL = 'https://data.mef.gov.kh/api/v1/public-datasets/pd_68e370856a965e00074a5e7b/json';
const PAGE_SIZE = 200;
const MAX_RETRIES = 12;
const RETRY_DELAY_MS = 7000;
const PAGE_DELAY_MS = 7500;

const normalize = (value) => (value || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();
const getProvinceKey = (nameEn, name) => `${normalize(nameEn)}|${normalize(name)}`;
const getDistrictKey = (provinceId, nameEn, name) => `${provinceId}|${normalize(nameEn)}|${normalize(name)}`;
const getCommuneKey = (districtId, nameEn, name) => `${districtId}|${normalize(nameEn)}|${normalize(name)}`;
const getVillageKey = (communeId, nameEn, name) => `${communeId}|${normalize(nameEn)}|${normalize(name)}`;

const getNamePair = (row, prefix) => {
  const nameEn = row[`${prefix}_en`] || '';
  const name = row[`${prefix}_kh`] || row[`${prefix}`] || '';
  return { name, nameEn };
};

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(page) {
    const url = `${BASE_URL}?page=${page}&page_size=${PAGE_SIZE}`;
  const cmd = `curl -skL --compressed -H 'Accept: application/json' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' -c /tmp/mef_cookies.txt -b /tmp/mef_cookies.txt "${url}"`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const output = execSync(cmd, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
      const trimmed = output.trim();
      if (trimmed.startsWith('<')) {
        console.error(`DEBUG page=${page} attempt=${attempt} got HTML response`);
        console.error(trimmed.slice(0, 400));
        throw new Error('HTML response received from API server. Possibly rate-limited.');
      }
      const json = JSON.parse(output);
      const items = json.items ?? json.data ?? json.results ?? json;
      console.log(`DEBUG page=${page} attempt=${attempt} itemsType=${Object.prototype.toString.call(items)} itemsLength=${Array.isArray(items) ? items.length : 'n/a'}`);
      if (!Array.isArray(items)) {
        console.error('DEBUG response body:', output.slice(0, 400));
        throw new Error('Unexpected response shape: expected array of items.');
      }

      const totalItems = json.total_items ?? json.totalItems ?? items.length;
      return { items, totalItems };
    } catch (err) {
      console.error(`Fetch failed page=${page} attempt=${attempt}: ${err.message}`);
      if (attempt === MAX_RETRIES) throw err;
      await delay(RETRY_DELAY_MS + page * 100);
    }
  }
}

async function fetchAllRows() {
  const firstPage = await fetchPage(1);
  const rows = [...firstPage.items];
  const totalItems = firstPage.totalItems;
  const totalPages = totalItems ? Math.ceil(totalItems / PAGE_SIZE) : null;

  if (totalPages) {
    for (let page = 2; page <= totalPages; page += 1) {
      console.log(`Fetching page ${page}/${totalPages}...`);
      const { items } = await fetchPage(page);
      if (!items.length) break;
      rows.push(...items);
      await delay(PAGE_DELAY_MS);
    }
  } else {
    let page = 2;
    while (true) {
      console.log(`Fetching page ${page}...`);
      const { items } = await fetchPage(page);
      if (!items.length) break;
      rows.push(...items);
      page += 1;
      await delay(150);
    }
  }

  console.log(`Fetched ${rows.length} rows from open data portal.`);
  return rows;
}

async function loadExistingLocationMaps() {
  const provinces = await Province.findAll();
  const districts = await District.findAll();
  const communes = await Commune.findAll();
  const villages = await Village.findAll();

  const provinceMap = new Map(provinces.map((p) => [getProvinceKey(p.name_en, p.name), p]));
  const districtMap = new Map(districts.map((d) => [getDistrictKey(d.province_id, d.name_en, d.name), d]));
  const communeMap = new Map(communes.map((c) => [getCommuneKey(c.district_id, c.name_en, c.name), c]));
  const villageMap = new Map(villages.map((v) => [getVillageKey(v.commune_id, v.name_en, v.name), v]));

  return { provinceMap, districtMap, communeMap, villageMap };
}

async function upsertMissingLocations(rows) {
  const { provinceMap, districtMap, communeMap, villageMap } = await loadExistingLocationMaps();

  const missingProvinces = new Map();
  const missingDistricts = new Map();
  const missingCommunes = new Map();
  const missingVillages = new Map();

  for (const row of rows) {
    const { name: provinceName, nameEn: provinceNameEn } = getNamePair(row, 'province');
    const provinceKey = getProvinceKey(provinceNameEn, provinceName);
    if (!provinceMap.has(provinceKey) && !missingProvinces.has(provinceKey)) {
      missingProvinces.set(provinceKey, { name: provinceName, name_en: provinceNameEn });
    }
  }

  if (missingProvinces.size) {
    console.log(`Creating ${missingProvinces.size} missing provinces...`);
    await Province.bulkCreate(Array.from(missingProvinces.values()), { ignoreDuplicates: true });
  }

  const provinces = await Province.findAll();
  const provinceByKey = new Map(provinces.map((p) => [getProvinceKey(p.name_en, p.name), p]));

  for (const row of rows) {
    const { name: provinceName, nameEn: provinceNameEn } = getNamePair(row, 'province');
    const province = provinceByKey.get(getProvinceKey(provinceNameEn, provinceName));
    if (!province) continue;

    const { name: districtName, nameEn: districtNameEn } = getNamePair(row, 'district');
    const districtKey = getDistrictKey(province.id, districtNameEn, districtName);
    if (!districtMap.has(districtKey) && !missingDistricts.has(districtKey)) {
      missingDistricts.set(districtKey, {
        name: districtName,
        name_en: districtNameEn,
        province_id: province.id
      });
    }
  }

  if (missingDistricts.size) {
    console.log(`Creating ${missingDistricts.size} missing districts...`);
    await District.bulkCreate(Array.from(missingDistricts.values()), { ignoreDuplicates: true });
  }

  const districts = await District.findAll();
  const districtByKey = new Map(districts.map((d) => [getDistrictKey(d.province_id, d.name_en, d.name), d]));

  for (const row of rows) {
    const { name: provinceName, nameEn: provinceNameEn } = getNamePair(row, 'province');
    const province = provinceByKey.get(getProvinceKey(provinceNameEn, provinceName));
    if (!province) continue;

    const { name: districtName, nameEn: districtNameEn } = getNamePair(row, 'district');
    const district = districtByKey.get(getDistrictKey(province.id, districtNameEn, districtName));
    if (!district) continue;

    const { name: communeName, nameEn: communeNameEn } = getNamePair(row, 'commune');
    const communeKey = getCommuneKey(district.id, communeNameEn, communeName);
    if (!communeMap.has(communeKey) && !missingCommunes.has(communeKey)) {
      missingCommunes.set(communeKey, {
        name: communeName,
        name_en: communeNameEn,
        district_id: district.id
      });
    }
  }

  if (missingCommunes.size) {
    console.log(`Creating ${missingCommunes.size} missing communes...`);
    await Commune.bulkCreate(Array.from(missingCommunes.values()), { ignoreDuplicates: true });
  }

  const communes = await Commune.findAll();
  const communeByKey = new Map(communes.map((c) => [getCommuneKey(c.district_id, c.name_en, c.name), c]));

  for (const row of rows) {
    const { name: provinceName, nameEn: provinceNameEn } = getNamePair(row, 'province');
    const province = provinceByKey.get(getProvinceKey(provinceNameEn, provinceName));
    if (!province) continue;

    const { name: districtName, nameEn: districtNameEn } = getNamePair(row, 'district');
    const district = districtByKey.get(getDistrictKey(province.id, districtNameEn, districtName));
    if (!district) continue;

    const { name: communeName, nameEn: communeNameEn } = getNamePair(row, 'commune');
    const commune = communeByKey.get(getCommuneKey(district.id, communeNameEn, communeName));
    if (!commune) continue;

    const { name: villageName, nameEn: villageNameEn } = getNamePair(row, 'village');
    const villageKey = getVillageKey(commune.id, villageNameEn, villageName);
    if (!villageMap.has(villageKey) && !missingVillages.has(villageKey)) {
      missingVillages.set(villageKey, {
        name: villageName,
        name_en: villageNameEn,
        commune_id: commune.id
      });
    }
  }

  if (missingVillages.size) {
    console.log(`Creating ${missingVillages.size} missing villages...`);
    const BATCH_SIZE = 500;
    const villages = Array.from(missingVillages.values());
    for (let i = 0; i < villages.length; i += BATCH_SIZE) {
      process.stdout.write(`Inserting villages batch ${Math.ceil((i + 1) / BATCH_SIZE)}/${Math.ceil(villages.length / BATCH_SIZE)}...\r`);
      await Village.bulkCreate(villages.slice(i, i + BATCH_SIZE), { ignoreDuplicates: true });
    }
    console.log('');
  }

  return {
    createdProvinces: missingProvinces.size,
    createdDistricts: missingDistricts.size,
    createdCommunes: missingCommunes.size,
    createdVillages: missingVillages.size
  };
}

(async function main() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const rows = await fetchAllRows();
    const result = await upsertMissingLocations(rows);

    console.log('Sync complete:');
    console.log(`  Provinces created: ${result.createdProvinces}`);
    console.log(`  Districts created: ${result.createdDistricts}`);
    console.log(`  Communes created: ${result.createdCommunes}`);
    console.log(`  Villages created: ${result.createdVillages}`);
    console.log('Done.');
    process.exit(0);
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
})();
