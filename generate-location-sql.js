const fs = require('fs');

const input = fs.readFileSync('cambodia_locations.sql', 'utf8');
const output = fs.createWriteStream('monk_locations_seed.sql');

output.write('SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS = 0;\n\n');

output.write('TRUNCATE TABLE `villages`;\n');
output.write('TRUNCATE TABLE `communes`;\n');
output.write('TRUNCATE TABLE `districts`;\n');
output.write('TRUNCATE TABLE `provinces`;\n\n');

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
            output.write(`INSERT INTO \`provinces\` (\`id\`, \`name\`, \`name_en\`, \`createdAt\`, \`updatedAt\`) VALUES ('${code}', '${kh_name.replace(/'/g, "''").replace(/\\/g, "")}', '${en_name.replace(/'/g, "''").replace(/\\/g, "")}', NOW(), NOW());\n`);
        }
    }
    else if (line.startsWith("INSERT INTO `districts` VALUES (")) {
        const match = line.match(/\((\d+),\s*'(?:[^'\\]|\\.)*',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*(\d+)/);
        if (match) {
            const [, id, code, kh_name, en_name, prov_id] = match;
            districtIdToCode[id] = code;
            const pCode = provinceIdToCode[prov_id];
            output.write(`INSERT INTO \`districts\` (\`id\`, \`province_id\`, \`name\`, \`name_en\`, \`createdAt\`, \`updatedAt\`) VALUES ('${code}', '${pCode}', '${kh_name.replace(/'/g, "''").replace(/\\/g, "")}', '${en_name.replace(/'/g, "''").replace(/\\/g, "")}', NOW(), NOW());\n`);
        }
    }
    else if (line.startsWith("INSERT INTO `communes` VALUES (")) {
        const match = line.match(/\((\d+),\s*'(?:[^'\\]|\\.)*',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*\d+,\s*(\d+)/);
        if (match) {
            const [, id, code, kh_name, en_name, dist_id] = match;
            communeIdToCode[id] = code;
            const dCode = districtIdToCode[dist_id];
            output.write(`INSERT INTO \`communes\` (\`id\`, \`district_id\`, \`name\`, \`name_en\`, \`createdAt\`, \`updatedAt\`) VALUES ('${code}', '${dCode}', '${kh_name.replace(/'/g, "''").replace(/\\/g, "")}', '${en_name.replace(/'/g, "''").replace(/\\/g, "")}', NOW(), NOW());\n`);
        }
    }
    else if (line.startsWith("INSERT INTO `villages` VALUES (")) {
         const match = line.match(/\((\d+),\s*'(?:[^'\\]|\\.)*',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*\d+,\s*\d+,\s*(\d+)/);
         if (match) {
            const [, id, code, kh_name, en_name, com_id] = match;
            const cCode = communeIdToCode[com_id];
            output.write(`INSERT INTO \`villages\` (\`id\`, \`commune_id\`, \`name\`, \`name_en\`, \`createdAt\`, \`updatedAt\`) VALUES ('${code}', '${cCode}', '${kh_name.replace(/'/g, "''").replace(/\\/g, "")}', '${en_name.replace(/'/g, "''").replace(/\\/g, "")}', NOW(), NOW());\n`);
         }
    }
}

output.write('SET FOREIGN_KEY_CHECKS = 1;\n');
output.end();
console.log('Location seed generated successfully!');
