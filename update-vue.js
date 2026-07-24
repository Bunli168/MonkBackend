const fs = require('fs');

function updateFile(path) {
    let content = fs.readFileSync(path, 'utf8');

    // Replace form.pob_village with a lookup
    content = content.replace(/form\.pob_village(\s|\|\|)/g, "getLocationName(pobLoc.villages, form.pob_village_id, 'village')$1");
    content = content.replace(/form\.pob_commune(\s|\|\|)/g, "getLocationName(pobLoc.communes, form.pob_commune_id, 'commune')$1");
    content = content.replace(/form\.pob_district(\s|\|\|)/g, "getLocationName(pobLoc.districts, form.pob_district_id, 'district')$1");
    content = content.replace(/form\.pob_province(\s|\|\|)/g, "getLocationName(pobLoc.provinces, form.pob_province_id, 'province')$1");

    content = content.replace(/form\.ordination_commune(\s|\|\|)/g, "getLocationName(ordLoc.communes, form.ordination_commune_id, 'commune')$1");
    content = content.replace(/form\.ordination_district(\s|\|\|)/g, "getLocationName(ordLoc.districts, form.ordination_district_id, 'district')$1");
    content = content.replace(/form\.ordination_province(\s|\|\|)/g, "getLocationName(ordLoc.provinces, form.ordination_province_id, 'province')$1");

    content = content.replace(/form\.current_commune(\s|\|\|)/g, "getLocationName(currLoc.communes, form.current_commune_id, 'commune')$1");
    content = content.replace(/form\.current_district(\s|\|\|)/g, "getLocationName(currLoc.districts, form.current_district_id, 'district')$1");
    content = content.replace(/form\.current_province(\s|\|\|)/g, "getLocationName(currLoc.provinces, form.current_province_id, 'province')$1");

    fs.writeFileSync(path, content, 'utf8');
}

updateFile('/Volumes/MyFolder/Pagoda Managemant/MonkManage/src/views/pagoda/PagodaMonkBiographyView.vue');
console.log('Updated PagodaMonkBiographyView.vue');
