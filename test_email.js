require('dotenv').config();
const { sendVerifiedPasswordEmail } = require('./utils/email');
async function test() {
  const success = await sendVerifiedPasswordEmail('bunlykhmer42@gmail.com', 'bunlykhmer42@gmail.com', 'TestPass123', 'Bunli Phi');
  console.log('Success?', success);
}
test();
