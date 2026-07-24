
const { Province, District, Commune, Village, sequelize } = require('./models');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
    try {
        console.log("Connecting to database...");
        await sequelize.authenticate();
        console.log("Connected.");
        
        const pageSize = 200;
        let totalPages = 1;
        let allItems = [];

        console.log("Fetching page 1 from MEF API...");
        const res1 = await fetch(`https://data.mef.gov.kh/api/v1/public-datasets/pd_68e370856a965e00074a5e7b/json?page=1&page_size=${pageSize}`);
        const data1 = await res1.json();
        const records1 = data1.items || data1.data || data1.results || data1;
        allItems = allItems.concat(records1 || []);
        totalPages = data1.total_pages || 1;

        console.log(`Total Pages: ${totalPages}`);

        // Fetch remaining pages slowly to avoid 429
        for (let page = 2; page <= totalPages; page++) {
            console.log(`Fetching page ${page}/${totalPages}...`);
            let success = false;
            let retries = 3;
            while(!success && retries > 0) {
                try {
                    const r = await fetch(`https://data.mef.gov.kh/api/v1/public-datasets/pd_68e370856a965e00074a5e7b/json?page=${page}&page_size=${pageSize}`);
                    const json = await r.json(); const recs = json.items || json.data || json.results || json || r.data || r.results || r.data;
                    allItems = allItems.concat(recs || []);
                    success = true;
                    // wait 500ms between requests to avoid rate limits
                    await delay(500); 
                } catch(e) {
                    console.log(`Error on page ${page}, retrying...`);
                    retries--;
                    await delay(2000);
                }
            }
            if (!success) {
                console.error(`Failed completely to fetch page ${page}`);
            }
        }
        
        console.log(`Fetched ${allItems.length} records. Processing...`);

        // Deduplicate and map
        const provincesMap = new Map();
        const districtsMap = new Map();
        const communesMap = new Map();
        const villagesMap = new Map();

        for (const item of allItems) {
            if (item.province_code) {
                provincesMap.set(item.province_code, {
                    id: item.province_code,
                    name: item.province_kh,
                    name_en: item.province_en
                });
            }
            if (item.district_code && item.province_code) {
                districtsMap.set(item.district_code, {
                    id: item.district_code,
                    province_id: item.province_code,
                    name: item.district_kh,
                    name_en: item.district_en
                });
            }
            if (item.commune_code && item.district_code) {
                communesMap.set(item.commune_code, {
                    id: item.commune_code,
                    district_id: item.district_code,
                    name: item.commune_kh,
                    name_en: item.commune_en
                });
            }
            if (item.village_code && item.commune_code) {
                villagesMap.set(item.village_code, {
                    id: item.village_code,
                    commune_id: item.commune_code,
                    name: item.village_kh,
                    name_en: item.village_en
                });
            }
        }

        console.log(`Unique items: ${provincesMap.size} Provinces, ${districtsMap.size} Districts, ${communesMap.size} Communes, ${villagesMap.size} Villages.`);

        console.log("Saving to DB...");
        // Disable FK checks just to be safe during bulk insert
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

        console.log("Inserting provinces...");
        await Province.bulkCreate(Array.from(provincesMap.values()), { ignoreDuplicates: true });
        
        console.log("Inserting districts...");
        await District.bulkCreate(Array.from(districtsMap.values()), { ignoreDuplicates: true });
        
        console.log("Inserting communes...");
        await Commune.bulkCreate(Array.from(communesMap.values()), { ignoreDuplicates: true });
        
        console.log("Inserting villages...");
        // Insert villages in chunks to avoid max allowed packet size issues
        const villagesArr = Array.from(villagesMap.values());
        const chunkSize = 2000;
        for (let i = 0; i < villagesArr.length; i += chunkSize) {
            const chunk = villagesArr.slice(i, i + chunkSize);
            await Village.bulkCreate(chunk, { ignoreDuplicates: true });
        }

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

        console.log("All done!");
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
run();
