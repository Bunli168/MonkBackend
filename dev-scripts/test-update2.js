const { updateProfile } = require('./services/authService');
const { User, UserProfile } = require('./models');

async function test() {
  try {
    const payload = { name: "Test Name", bio: "bio", phone: "123", gender: "MALE", dateOfBirth: "" };
    await updateProfile(1, payload);
    console.log("Success with empty dateOfBirth");
  } catch (err) {
    console.error("Error with empty dateOfBirth:", err);
  }
}
test();
