const { User, Role, UserProfile, Kut, Address, Document, MonkSurvey } = require('./models');
async function test() {
  try {
    const user = await User.findByPk(1, {
      attributes: { exclude: ['password', 'verification_token'] },
      include: [
        { model: Role, attributes: ['id', 'name'] },
        { 
          model: UserProfile,
          include: [{ model: Kut }]
        }
      ]
    });
    
    if (user) {
      const profileData = user.toJSON();
      const formattedProfile = {
        ...profileData,
        firstName: profileData.UserProfile ? profileData.UserProfile.first_name_kh || profileData.UserProfile.first_name_en : null,
        lastName: profileData.UserProfile ? profileData.UserProfile.last_name_kh || profileData.UserProfile.last_name_en : null,
        isActive: profileData.is_active,
        name: profileData.UserProfile ? (profileData.UserProfile.first_name_kh || profileData.UserProfile.last_name_kh ? `${profileData.UserProfile.first_name_kh || ''} ${profileData.UserProfile.last_name_kh || ''}`.trim() : `${profileData.UserProfile.first_name_en || ''} ${profileData.UserProfile.last_name_en || ''}`.trim()) : '',
        role: profileData.Role ? { id: profileData.Role.id, name: profileData.Role.name } : null,
        profile: profileData.UserProfile ? {
          ...profileData.UserProfile,
          avatarUrl: profileData.UserProfile.avatar_url,
          phone: profileData.UserProfile.phone_number || profileData.phone || '',
          dateOfBirth: profileData.UserProfile.date_of_birth || '',
          kut: profileData.UserProfile.Kut ? profileData.UserProfile.Kut : null
        } : null
      };
      console.log(JSON.stringify(formattedProfile, null, 2));
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
test();
