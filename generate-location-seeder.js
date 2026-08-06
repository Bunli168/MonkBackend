const fs = require('fs');
const path = require('path');

const input = fs.readFileSync('cambodia_locations.sql', 'utf8');
const seederPath = path.join(__dirname, 'seeders', '20260806000000-locations-seeder.js');
const output = fs.createWriteStream(seederPath);

output.write(`'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const provinces = [];
    const districts = [];
    const communes = [];
    const villages = [];
`);

const provinceIdToCode = {};
const districtIdToCode = {};
const communeIdToCode = {};

const lines = input.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith("INSERT INTO `provinces` VALUES (")) {
        const match = line.match(/\((\d+),\s*'(?:[^'\\]|\\.)*',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)'/);
        if (match) {
            const [, id, code, kh_name, en_name] = match;
            provinceIdToCode[id] = code;
            output.write(`    provinces.push({ id: '${code}', name: ${JSON.stringify(kh_name.replace(/\\'/g, "'"))}, name_en: ${JSON.stringify(en_name.replace(/\\'/g, "'"))}, createdAt: new Date(), updatedAt: new Date() });\n`);
        }
    }
    else if (line.startsWith("INSERT INTO `districts` VALUES (")) {
        const match = line.match(/\((\d+),\s*'(?:[^'\\]|\\.)*',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*(\d+)/);
        if (match) {
            const [, id, code, kh_name, en_name, prov_id] = match;
            districtIdToCode[id] = code;
            const pCode = provinceIdToCode[prov_id];
            output.write(`    districts.push({ id: '${code}', province_id: '${pCode}', name: ${JSON.stringify(kh_name.replace(/\\'/g, "'"))}, name_en: ${JSON.stringify(en_name.replace(/\\'/g, "'"))}, createdAt: new Date(), updatedAt: new Date() });\n`);
        }
    }
    else if (line.startsWith("INSERT INTO `communes` VALUES (")) {
        const match = line.match(/\((\d+),\s*'(?:[^'\\]|\\.)*',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*\d+,\s*(\d+)/);
        if (match) {
            const [, id, code, kh_name, en_name, dist_id] = match;
            communeIdToCode[id] = code;
            const dCode = districtIdToCode[dist_id];
            output.write(`    communes.push({ id: '${code}', district_id: '${dCode}', name: ${JSON.stringify(kh_name.replace(/\\'/g, "'"))}, name_en: ${JSON.stringify(en_name.replace(/\\'/g, "'"))}, createdAt: new Date(), updatedAt: new Date() });\n`);
        }
    }
    else if (line.startsWith("INSERT INTO `villages` VALUES (")) {
         const match = line.match(/\((\d+),\s*'(?:[^'\\]|\\.)*',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*\d+,\s*\d+,\s*(\d+)/);
         if (match) {
            const [, id, code, kh_name, en_name, com_id] = match;
            const cCode = communeIdToCode[com_id];
            output.write(`    villages.push({ id: '${code}', commune_id: '${cCode}', name: ${JSON.stringify(kh_name.replace(/\\'/g, "'"))}, name_en: ${JSON.stringify(en_name.replace(/\\'/g, "'"))}, createdAt: new Date(), updatedAt: new Date() });\n`);
         }
    }
}

output.write(`
    // Bulk insert data
    await queryInterface.bulkInsert('provinces', provinces, {});
    await queryInterface.bulkInsert('districts', districts, {});
    await queryInterface.bulkInsert('communes', communes, {});
    
    // Split villages into chunks if needed, but usually a single bulkInsert works for ~14k rows.
    await queryInterface.bulkInsert('villages', villages, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('villages', null, {});
    await queryInterface.bulkDelete('communes', null, {});
    await queryInterface.bulkDelete('districts', null, {});
    await queryInterface.bulkDelete('provinces', null, {});
  }
};
`);

output.end();
console.log('Seeder generated successfully at ' + seederPath);
