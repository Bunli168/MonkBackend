const fs = require('fs');
fs.writeFileSync('./trigger-restart', Date.now().toString());
