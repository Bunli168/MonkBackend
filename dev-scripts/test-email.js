require('dotenv').config();
const { sendOtpEmail } = require('./utils/email');

async function test() {
  const result = await sendOtpEmail('bunliphi@gmail.com', '123456');
  console.log('Send OTP result:', result);
}
test();
