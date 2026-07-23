const { sequelize, Province, District, Commune, Address } = require('./models');

(async () => {
  try {
    console.log('Starting location tables migration...');
    
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Create location tables first
    console.log('Creating location tables...');
    await Province.sync({ force: false });
    await District.sync({ force: false });
    await Commune.sync({ force: false });
    console.log('Location tables created successfully.');

    // Check if provinces exist
    const provinceCount = await Province.count();
    if (provinceCount === 0) {
      console.log('Seeding provinces, districts, and communes...');
      
      // Seed provinces
      const provinces = await Province.bulkCreate([
        { name: 'ភ្នំពេញ', name_en: 'Phnom Penh' },
        { name: 'សៀមរាប', name_en: 'Siem Reap' },
        { name: 'កំពង់ចាម', name_en: 'Kampong Cham' },
        { name: 'បាត់ដំបង', name_en: 'Battambang' },
        { name: 'តាកែវ', name_en: 'Takeo' }
      ]);
      console.log('Provinces seeded:', provinces.length);

      // Seed districts
      const districts = await District.bulkCreate([
        { province_id: 1, name: 'ចំការមន', name_en: 'Chamkar Mon' },
        { province_id: 1, name: 'ដូនពេញ', name_en: 'Doun Penh' },
        { province_id: 2, name: 'អង្គរធំ', name_en: 'Angkor Thom' },
        { province_id: 3, name: 'ស្ទឹងត្រង់', name_en: 'Stueng Trang' },
        { province_id: 4, name: 'ឯកភ្នំ', name_en: 'Ek Phnom' }
      ]);
      console.log('Districts seeded:', districts.length);

      // Seed communes
      const communes = await Commune.bulkCreate([
        { district_id: 1, name: 'ទន្លេបាសាក់', name_en: 'Tonle Bassac' },
        { district_id: 2, name: 'ផ្សារថ្មី', name_en: 'Psar Thmei' },
        { district_id: 3, name: 'ស្រុកថ្ម', name_en: 'Srok Thmei' },
        { district_id: 4, name: 'ព្រែកប្រហុក', name_en: 'Prey Phreah' },
        { district_id: 5, name: 'ស្លក', name_en: 'Slork' }
      ]);
      console.log('Communes seeded:', communes.length);
    } else {
      console.log('Location data already exists, skipping seed.');
    }

    // Get existing addresses
    const addresses = await Address.findAll();
    console.log('Found', addresses.length, 'existing addresses to migrate.');

    // Create a mapping for province names to IDs
    const allProvinces = await Province.findAll();
    const provinceMap = {};
    allProvinces.forEach(p => {
      provinceMap[p.name] = p.id;
      if (p.name_en) provinceMap[p.name_en] = p.id;
    });

    // Create a mapping for district names to IDs
    const allDistricts = await District.findAll();
    const districtMap = {};
    allDistricts.forEach(d => {
      districtMap[d.name] = d.id;
      if (d.name_en) districtMap[d.name_en] = d.id;
    });

    // Create a mapping for commune names to IDs
    const allCommunes = await Commune.findAll();
    const communeMap = {};
    allCommunes.forEach(c => {
      communeMap[c.name] = c.id;
      if (c.name_en) communeMap[c.name_en] = c.id;
    });

    // Update addresses with new foreign keys
    for (const address of addresses) {
      const updates = {};
      
      if (address.province && provinceMap[address.province]) {
        updates.province_id = provinceMap[address.province];
      }
      
      if (address.district && districtMap[address.district]) {
        updates.district_id = districtMap[address.district];
      }
      
      if (address.commune && communeMap[address.commune]) {
        updates.commune_id = communeMap[address.commune];
      }

      if (Object.keys(updates).length > 0) {
        await address.update(updates);
        console.log(`Updated address ${address.id}:`, updates);
      }
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();
