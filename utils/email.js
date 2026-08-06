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
    return true; // Pretend it sent successfully
  }

  const mailOptions = {
    from: `"Neakavorn" <${process.env.EMAIL_FROM || 'noreply@pagoda.com'}>`,
    to: email,
    subject: 'លេខកូដសុវត្ថិភាព OTP របស់អ្នក - ប្រព័ន្ធគ្រប់គ្រងវត្ត',
    html: `
      <div style="background-color: #F8FAFC; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
          <div style="border-top: 4px solid #0F172A; padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #F1F5F9;">
            <h1 style="color: #0F172A; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">ប្រព័ន្ធគ្រប់គ្រងវត្ត</h1>
            <p style="color: #64748B; margin: 6px 0 0; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Pagoda Management System</p>
          </div>
          <div style="padding: 32px; text-align: center;">
            <h2 style="color: #1E293B; margin-top: 0; font-size: 20px; font-weight: 600;">លេខកូដសុវត្ថិភាព OTP របស់អ្នក</h2>
            <p style="font-size: 15px; color: #475569; line-height: 1.6;">សូមប្រើប្រាស់លេខកូដខាងក្រោម ដើម្បីចូលប្រើប្រាស់គណនីរបស់អ្នក៖</p>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 24px; font-size: 38px; font-weight: 700; letter-spacing: 12px; margin: 32px 0; color: #0F172A; border-radius: 12px; display: inline-block;">
              ${otp}
            </div>
            <div style="margin-top: 16px;">
              <span style="background: #FEF2F2; color: #991B1B; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 500; border: 1px solid #FEE2E2;">⚠️ លេខកូដនេះនឹងផុតកំណត់ក្នុងរយៈពេល ៥ នាទី។</span>
            </div>
          </div>
          <div style="background: #F8FAFC; padding: 24px 32px; border-top: 1px solid #E2E8F0; text-align: center;">
            <p style="color: #64748B; font-size: 12px; margin: 0; line-height: 1.6;">
              ប្រសិនបើអ្នកមិនបានស្នើសុំលេខកូដនេះទេ សូមបដិសេធអ៊ីមែលនេះ។<br/>
              If you didn't request this, please ignore this email.
            </p>
          </div>
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
    return false;
  }
  const resetUrl = `${process.env.CORS_ORIGIN}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Neakavorn" <${process.env.EMAIL_FROM || 'noreply@pagoda.com'}>`,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="background-color: #F8FAFC; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
          <div style="border-top: 4px solid #0F172A; padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #F1F5F9;">
            <h1 style="color: #0F172A; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">ប្រព័ន្ធគ្រប់គ្រងវត្ត</h1>
            <p style="color: #64748B; margin: 6px 0 0; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Pagoda Management System</p>
          </div>
          <div style="padding: 32px; text-align: center;">
            <h2 style="color: #1E293B; margin-top: 0; font-size: 20px; font-weight: 600;">Password Reset Request</h2>
            <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 32px;">You recently requested to reset your password for your account. Click the button below to reset it:</p>
            <a href="${resetUrl}" style="display: inline-block; background: #0F172A; color: #FFFFFF; font-weight: 600; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.2);">Reset Password</a>
            <p style="color: #94A3B8; font-size: 13px; margin-top: 24px;">This link will expire in 1 hour.</p>
          </div>
          <div style="background: #F8FAFC; padding: 24px 32px; border-top: 1px solid #E2E8F0; text-align: center;">
            <p style="color: #64748B; font-size: 12px; margin: 0; line-height: 1.6;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
        </div>
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
  const verifyUrl = verificationToken ? `${process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5174'}/verify-email?token=${verificationToken}` : null;

  if (!process.env.SMTP_HOST) {
    if (verificationToken) {}
    return true;
  }


  const additionalContent = verificationToken ? `
      <div style="text-align: center; margin: 32px 0;">
        <h3 style="margin-top: 0; color: #0F172A; font-size: 16px; font-weight: 600;">Account Verification Required</h3>
        <p style="color: #475569; font-size: 14px; margin-bottom: 24px;">Before you can log in, please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #0F172A; color: #FFFFFF; font-weight: 600; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.2);">Verify Account</a>
      </div>
  ` : '';

  const mailOptions = {
    from: `"Neakavorn" <${process.env.EMAIL_FROM || 'noreply@pagoda.kh'}>`,
    to: toEmail,
    subject: 'ស្វាគមន៍ — ព័ត៌មានចូលប្រព័ន្ធ Pagoda Management',
    html: `
      <div style="background-color: #F8FAFC; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
          <div style="border-top: 4px solid #0F172A; padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #F1F5F9;">
            <h1 style="color: #0F172A; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">ប្រព័ន្ធគ្រប់គ្រងវត្ត</h1>
            <p style="color: #64748B; margin: 6px 0 0; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Pagoda Management System</p>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 16px; color: #1E293B; margin-top: 0; font-weight: 600;">សូមស្វាគមន៍ <strong>${fullName}</strong>,</p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">គណនីរបស់អ្នកត្រូវបានបង្កើតដោយអ្នកគ្រប់គ្រង។ ${verificationToken ? 'សូមបញ្ជាក់អ៊ីមែលរបស់អ្នកដើម្បីទទួលបានលេខសម្ងាត់:' : 'ខាងក្រោមជាព័ត៌មានចូលប្រើប្រាស់របស់អ្នក:'}</p>
            
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0; color: #64748B; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">ព័ត៌មានគណនី (Account Details)</p>
              <p style="margin: 0 0 ${!verificationToken ? '16px' : '0'} 0; color: #475569; font-size: 14px;">
                <strong>អ៊ីមែល (Email):</strong><br/>
                <span style="display: block; margin-top: 6px; color: #0F172A; font-weight: 600; font-size: 16px;">${generatedEmail}</span>
              </p>
              ${!verificationToken ? `<p style="margin: 0; color: #475569; font-size: 14px;">
                <strong>លេខសម្ងាត់ (Password):</strong><br/>
                <span style="display: inline-block; margin-top: 6px; color: #0F172A; font-weight: 600; font-size: 16px; background: #E2E8F0; padding: 4px 12px; border-radius: 6px;">${defaultPassword}</span>
              </p>` : ''}
            </div>
            
            ${additionalContent}
            
            ${!verificationToken ? `<div style="background: #FEF2F2; border: 1px solid #FEE2E2; border-left: 4px solid #EF4444; padding: 16px; border-radius: 8px; margin-top: 8px;">
              <p style="color: #991B1B; margin: 0; font-size: 14px; font-weight: 500; display: flex; align-items: center;">
                <span style="font-size: 18px; margin-right: 8px;">⚠️</span> សូមប្ដូរលេខសម្ងាត់ភ្លាមៗបន្ទាប់ពីចូលប្រព័ន្ធ!
              </p>
            </div>` : ''}
          </div>
          
          <div style="background: #F8FAFC; padding: 24px 32px; border-top: 1px solid #E2E8F0; text-align: center;">
            <p style="color: #64748B; font-size: 12px; margin: 0; line-height: 1.6;">
              ប្រសិនបើអ្នកមិនបានស្នើសុំ សូមទាក់ទងអ្នកគ្រប់គ្រង។<br/>
              If you did not request this, please contact the administrator.
            </p>
          </div>
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
    return true;
  }

  const mailOptions = {
    from: `"Neakavorn" <${process.env.EMAIL_FROM || 'noreply@pagoda.kh'}>`,
    to: toEmail,
    subject: 'គណនីរបស់អ្នកត្រូវបានបញ្ជាក់ — ព័ត៌មានចូលប្រព័ន្ធ',
    html: `
      <div style="background-color: #F8FAFC; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
          <div style="border-top: 4px solid #0F172A; padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #F1F5F9;">
            <h1 style="color: #0F172A; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">ប្រព័ន្ធគ្រប់គ្រងវត្ត</h1>
            <p style="color: #64748B; margin: 6px 0 0; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Pagoda Management System</p>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 16px; color: #1E293B; margin-top: 0; font-weight: 600;">សួស្តី <strong>${fullName}</strong>,</p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">គណនីរបស់អ្នកត្រូវបានបញ្ជាក់ដោយជោគជ័យ។ ខាងក្រោមជាព័ត៌មានចូលប្រើប្រាស់របស់អ្នក:</p>
            
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0; color: #64748B; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">ព័ត៌មានគណនី (Account Details)</p>
              <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px;">
                <strong>អ៊ីមែល (Email):</strong><br/>
                <span style="display: block; margin-top: 6px; color: #0F172A; font-weight: 600; font-size: 16px;">${generatedEmail}</span>
              </p>
              <p style="margin: 0; color: #475569; font-size: 14px;">
                <strong>លេខសម្ងាត់ (Password):</strong><br/>
                <span style="display: inline-block; margin-top: 6px; color: #0F172A; font-weight: 600; font-size: 16px; background: #E2E8F0; padding: 4px 12px; border-radius: 6px;">${defaultPassword}</span>
              </p>
            </div>
            
            <div style="background: #FEF2F2; border: 1px solid #FEE2E2; border-left: 4px solid #EF4444; padding: 16px; border-radius: 8px; margin-bottom: 32px;">
              <p style="color: #991B1B; margin: 0; font-size: 14px; font-weight: 500; display: flex; align-items: center;">
                <span style="font-size: 18px; margin-right: 8px;">⚠️</span> សូមប្ដូរលេខសម្ងាត់ភ្លាមៗបន្ទាប់ពីចូលប្រព័ន្ធ!
              </p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5174'}/login" style="display: inline-block; background: #0F172A; color: #FFFFFF; font-weight: 600; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.2);">
                ចូលប្រព័ន្ធ (Login)
              </a>
            </div>
          </div>
          
          <div style="background: #F8FAFC; padding: 24px 32px; border-top: 1px solid #E2E8F0; text-align: center;">
            <p style="color: #64748B; font-size: 12px; margin: 0; line-height: 1.6;">
              ប្រសិនបើអ្នកមានចម្ងល់ សូមទាក់ទងអ្នកគ្រប់គ្រង។
            </p>
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
