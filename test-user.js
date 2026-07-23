const { User, UserProfile, Address, Document, Role } = require('./models');

async function test() {
  try {
    const user = await User.findOne({ 
      attributes: { exclude: ['password', 'verification_token'] },
      include: [
        { model: Role, attributes: ['name'] },
        { model: UserProfile },
        { model: Address },
        { model: Document }
      ]
    });
    console.log(JSON.stringify(user, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit();
}

test();
