const { updateProfile } = require('./services/authService');
const { User, UserProfile } = require('./models');

async function test() {
  try {
    const payload = { name: "A B", bio: "", phone: "", gender: "", dateOfBirth: "" };
    await updateProfile(1, payload);
    console.log("Success with empty fields");
  } catch (err) {
    console.error("Error with empty fields:", err.message);
  }
}
test();
