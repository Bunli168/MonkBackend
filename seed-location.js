/**
 * Seed provinces, districts, communes, and villages from Cambodia MEF Open Data Portal.
 * Run: node seed-location.js
 */
const { Province, District, Commune, Village } = require('./models');
const { execSync } = require('child_process');

const BASE_URL = 'https://data.mef.gov.kh/api/v1/public-datasets/pd_68e370856a965e00074a5e7b/json';
const PAGE_SIZE = 200;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchPage(page) {
    const url = `${BASE_URL}?page=${page}&page_size=${PAGE_SIZE}`;
    const cmd = `curl -sk "${url}"`;
    for (let attempts = 0; attempts < 5; attempts++) {
        try {
            const output = execSync(cmd, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
            const parsed = JSON.parse(output);
            if (!parsed.items) throw new Error("No items in JSON");
            return parsed;
        } catch (e) {
            console.log(`\nRetry page ${page}... (attempt ${attempts + 1})`);
            execSync('sleep 5');
        }
    }
    throw new Error(`Failed to fetch page ${page}`);
}

async function seed() {
    try {
        console.log('Fetching total records...');
        const first = await fetchPage(1);
        const totalPages = Math.ceil(first.total_items / PAGE_SIZE);
        console.log(`Total records: ${first.total_items} | Pages: ${totalPages}`);

        // Collect all rows across all pages
        let allRows = [...first.items];
        for (let page = 2; page <= totalPages; page++) {
            process.stdout.write(`Fetching page ${page}/${totalPages}...\r`);
            await sleep(1000);
            const result = await fetchPage(page);
            allRows = allRows.concat(result.items);
        }
        console.log(`\nFetched ${allRows.length} rows total.`);

        // --- De-duplicate and build maps ---
        const provinceMap = new Map(); // province_code -> Province record
        const districtMap = new Map(); // district_code -> District record
        const communeMap  = new Map(); // commune_code  -> Commune record

        // 1. Extract unique provinces
        for (const row of allRows) {
            if (!provinceMap.has(row.province_code)) {
                provinceMap.set(row.province_code, { name: row.province_kh, name_en: row.province_en });
            }
        }
        console.log(`Unique provinces: ${provinceMap.size}`);

        // 2. Bulk create provinces
        console.log('Inserting provinces...');
        const createdProvinces = await Province.bulkCreate(
            Array.from(provinceMap.values()),
            { ignoreDuplicates: true, returning: true }
        );

        // Build province_code -> DB id map
        const allProvinces = await Province.findAll();
        const provinceNameToId = new Map(allProvinces.map(p => [p.name_en, p.id]));

        // 3. Extract unique districts
        for (const row of allRows) {
            if (!districtMap.has(row.district_code)) {
                const province_id = provinceNameToId.get(row.province_en);
                if (province_id) {
                    districtMap.set(row.district_code, { name: row.district_kh, name_en: row.district_en, province_id });
                }
            }
        }
        console.log(`Unique districts: ${districtMap.size}`);

        // 4. Bulk create districts
        console.log('Inserting districts...');
        await District.bulkCreate(Array.from(districtMap.values()), { ignoreDuplicates: true });

        // Build district name+province -> DB id map
        const allDistricts = await District.findAll();
        const districtKeyToId = new Map(allDistricts.map(d => [`${d.province_id}-${d.name_en}`, d.id]));

        // 5. Extract unique communes
        for (const row of allRows) {
            if (!communeMap.has(row.commune_code)) {
                const province_id = provinceNameToId.get(row.province_en);
                const district_id = districtKeyToId.get(`${province_id}-${row.district_en}`);
                if (district_id) {
                    communeMap.set(row.commune_code, { name: row.commune_kh, name_en: row.commune_en, district_id });
                }
            }
        }
        console.log(`Unique communes: ${communeMap.size}`);

        // 6. Bulk create communes
        console.log('Inserting communes...');
        await Commune.bulkCreate(Array.from(communeMap.values()), { ignoreDuplicates: true });

        // Build commune name+district -> DB id map
        const allCommunes = await Commune.findAll();
        const communeKeyToId = new Map(allCommunes.map(c => [`${c.district_id}-${c.name_en}`, c.id]));

        // 7. Extract unique villages
        const villageMap = new Map();
        for (const row of allRows) {
            if (!villageMap.has(row.village_code)) {
                const province_id = provinceNameToId.get(row.province_en);
                const district_id = districtKeyToId.get(`${province_id}-${row.district_en}`);
                const commune_id  = communeKeyToId.get(`${district_id}-${row.commune_en}`);
                if (commune_id) {
                    villageMap.set(row.village_code, { name: row.village_kh, name_en: row.village_en, commune_id });
                }
            }
        }
        console.log(`Unique villages: ${villageMap.size}`);

        // 8. Bulk create villages in batches (large dataset)
        console.log('Inserting villages (in batches)...');
        const villageArr = Array.from(villageMap.values());
        const BATCH = 500;
        for (let i = 0; i < villageArr.length; i += BATCH) {
            process.stdout.write(`Villages batch ${Math.ceil((i+1)/BATCH)}/${Math.ceil(villageArr.length/BATCH)}...\r`);
            await Village.bulkCreate(villageArr.slice(i, i + BATCH), { ignoreDuplicates: true });
        }

        console.log('\n✅ Seeding complete!');
        console.log(`  Provinces: ${provinceMap.size}`);
        console.log(`  Districts: ${districtMap.size}`);
        console.log(`  Communes:  ${communeMap.size}`);
        console.log(`  Villages:  ${villageMap.size}`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    }
}

seed();
