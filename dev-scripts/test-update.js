const { updateProfile } = require('./services/authService');
const { User, UserProfile } = require('./models');

async function test() {
  try {
    const payload = { name: "Test Name", bio: "bio", phone: "123", gender: "MALE", dateOfBirth: "2000-01-01" };
    await updateProfile(1, payload);
    console.log("Success");
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
