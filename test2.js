const origin = 'https://neakavorn-pagoda.netlify.app';
const config = { corsOrigin: ['http://localhost:5173', 'https://neakavorn-pagoda.netlify.app'] };
if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
  console.log('1');
} else if (Array.isArray(config.corsOrigin) && config.corsOrigin.includes(origin)) {
  console.log('2');
} else if (config.corsOrigin === origin) {
  console.log('3');
} else {
  console.log('4');
}
