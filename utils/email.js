const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: process.env.SMTP_PORT || 25,
  secure: false,
  connectionTimeout: 5000, // 5 seconds timeout
  greetingTimeout: 5000,
  socketTimeout: 5000,
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined
});

const sendOtpEmail = async (email, otp) => {
  if (!process.env.SMTP_HOST) {
    console.log(`\n[Mock Email] ------------------------------------------------`);
    console.log(`[Mock Email] To: ${email}`);
    console.log(`[Mock Email] Subject: Your OTP Code`);
    console.log(`[Mock Email] OTP Code: ${otp}`);
    console.log(`[Mock Email] ------------------------------------------------\n`);
    return true; // Pretend it sent successfully
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@pagoda.com',
    to: email,
    subject: 'លេខកូដសុវត្ថិភាព OTP របស់អ្នក - ប្រព័ន្ធគ្រប់គ្រងវត្ត',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0c97f; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #8B6914, #C9A84C); padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 22px;">🏯 ប្រព័ន្ធគ្រប់គ្រងវត្ត</h1>
          <p style="color: #ffe9a0; margin: 6px 0 0;">Pagoda Management System</p>
        </div>
        <div style="padding: 32px; text-align: center;">
          <h2 style="color: #333; margin-top: 0;">លេខកូដសុវត្ថិភាព OTP របស់អ្នក</h2>
          <p style="font-size: 16px; color: #555;">សូមប្រើប្រាស់លេខកូដខាងក្រោម ដើម្បីចូលប្រើប្រាស់គណនីរបស់អ្នក៖</p>
          <div style="background: #f9f5e8; border: 2px dashed #C9A84C; padding: 20px; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 24px 0; color: #8B6914; border-radius: 8px;">
            ${otp}
          </div>
          <p style="color: #e74c3c; font-size: 14px; font-weight: bold;">⚠️ លេខកូដនេះនឹងផុតកំណត់ក្នុងរយៈពេល ៥ នាទី។</p>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">ប្រសិនបើអ្នកមិនបានស្នើសុំលេខកូដនេះទេ សូមបដិសេធអ៊ីមែលនេះ។</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

const sendPasswordResetEmail = async (email, resetToken) => {
  if (!process.env.SMTP_HOST) {
    console.log(`[Mock Email] Skipping password reset email for ${email} (no SMTP_HOST configured)`);
    return false;
  }
  const resetUrl = `${process.env.CORS_ORIGIN}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@pagoda.com',
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666;">This link will expire in 1 hour.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

const sendWelcomeEmail = async (toEmail, generatedEmail, defaultPassword, fullName, verificationToken) => {
  const verifyUrl = verificationToken ? `${process.env.CORS_ORIGIN || 'http://localhost:5174'}/verify-email?token=${verificationToken}` : null;

  if (!process.env.SMTP_HOST) {
    console.log(`\n[Mock Email] ------------------------------------------------`);
    console.log(`[Mock Email] Skipping actual welcome email for ${toEmail} (no SMTP_HOST configured)`);
    console.log(`[Mock Email] Generated Email: ${generatedEmail}`);
    console.log(`[Mock Email] Default Password: ${defaultPassword}`);
    if (verificationToken) {
      console.log(`[Mock Email] VERIFICATION LINK: ${verifyUrl}`);
    }
    console.log(`[Mock Email] ------------------------------------------------\n`);
    return true;
  }


  const additionalContent = verificationToken ? `
    <div style="background: #eef2f5; padding: 15px; border-left: 4px solid #006D80; margin-top: 20px;">
      <p style="font-weight: bold; color: #006D80; margin-top: 0;">Account Verification Required</p>
      <p>Before you can log in, please verify your email address by clicking the link below:</p>
      <a href="${verifyUrl}" style="display: inline-block; background: #006D80; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Verify Account</a>
    </div>
  ` : '';

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@pagoda.kh',
    to: toEmail,
    subject: 'ស្វាគមន៍ — ព័ត៌មានចូលប្រព័ន្ធ Pagoda Management',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0c97f; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #8B6914, #C9A84C); padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 22px;">🏯 ប្រព័ន្ធគ្រប់គ្រងវត្ត</h1>
          <p style="color: #ffe9a0; margin: 6px 0 0;">Pagoda Management System</p>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #333;">សូមស្វាគមន៍ <strong>${fullName}</strong>,</p>
          <p style="color: #555;">គណនីរបស់អ្នកត្រូវបានបង្កើតដោយអ្នកគ្រប់គ្រង។ ${verificationToken ? 'សូមបញ្ជាក់អ៊ីមែលរបស់អ្នកដើម្បីទទួលបានលេខសម្ងាត់:' : 'ខាងក្រោមជាព័ត៌មានចូលប្រើប្រាស់:'}</p>
          <div style="background: #f9f5e8; border-left: 4px solid #C9A84C; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 6px 0;"><strong>អ៊ីមែល:</strong> <code style="background:#fff; padding:2px 8px; border-radius:3px;">${generatedEmail}</code></p>
            ${!verificationToken ? `<p style="margin: 6px 0;"><strong>លេខសម្ងាត់:</strong> <code style="background:#fff; padding:2px 8px; border-radius:3px;">${defaultPassword}</code></p>` : ''}
          </div>
          ${additionalContent}
          ${!verificationToken ? `<p style="color: #c0392b; font-weight: bold;">⚠️ សូមប្ដូរលេខសម្ងាត់ភ្លាមៗបន្ទាប់ពីចូល!</p>` : ''}
          <p style="color: #999; font-size: 12px; margin-top: 32px;">ប្រសិនបើអ្នកមិនបានស្នើសុំ សូមទាក់ទងអ្នកគ្រប់គ្រង។</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

const sendVerifiedPasswordEmail = async (toEmail, generatedEmail, defaultPassword, fullName) => {
  if (!process.env.SMTP_HOST) {
    console.log(`\n[Mock Email] ------------------------------------------------`);
    console.log(`[Mock Email] Verified Password Email for ${toEmail}`);
    console.log(`[Mock Email] Password: ${defaultPassword}`);
    console.log(`[Mock Email] ------------------------------------------------\n`);
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@pagoda.kh',
    to: toEmail,
    subject: 'គណនីរបស់អ្នកត្រូវបានបញ្ជាក់ — ព័ត៌មានចូលប្រព័ន្ធ',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0c97f; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #8B6914, #C9A84C); padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 22px;">🏯 ប្រព័ន្ធគ្រប់គ្រងវត្ត</h1>
          <p style="color: #ffe9a0; margin: 6px 0 0;">Pagoda Management System</p>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #333;">សួស្តី <strong>${fullName}</strong>,</p>
          <p style="color: #555;">គណនីរបស់អ្នកត្រូវបានបញ្ជាក់ដោយជោគជ័យ។ ខាងក្រោមជាព័ត៌មានចូលប្រើប្រាស់របស់អ្នក:</p>
          <div style="background: #f9f5e8; border-left: 4px solid #C9A84C; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 6px 0;"><strong>អ៊ីមែល:</strong> <code style="background:#fff; padding:2px 8px; border-radius:3px;">${generatedEmail}</code></p>
            <p style="margin: 6px 0;"><strong>លេខសម្ងាត់:</strong> <code style="background:#fff; padding:2px 8px; border-radius:3px;">${defaultPassword}</code></p>
          </div>
          <p style="color: #c0392b; font-weight: bold;">⚠️ សូមប្ដូរលេខសម្ងាត់ភ្លាមៗបន្ទាប់ពីចូល!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CORS_ORIGIN || 'http://localhost:5174'}/login" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              ចូលប្រព័ន្ធ / Login
            </a>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending verified password email:', error);
    return false;
  }
};

module.exports = {
  sendOtpEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendVerifiedPasswordEmail
};
