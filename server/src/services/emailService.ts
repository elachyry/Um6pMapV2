/**
 * Email Service
 * Purpose: Send emails using Nodemailer
 * Inputs: recipient email, subject, content
 * Outputs: success/failure status
 */

import nodemailer from 'nodemailer'

// Email configuration from environment
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@um6p.ma'
const FROM_NAME = process.env.FROM_NAME || 'UM6P Map'

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: SMTP_USER && SMTP_PASS ? {
    user: SMTP_USER,
    pass: SMTP_PASS,
  } : undefined,
})

interface WelcomeEmailData {
  email: string
  firstName: string
  lastName: string
  password: string
  userType: string
}

/**
 * Send welcome email with temporary password
 * Purpose: Send credentials to new user
 * Inputs: user data with generated password
 * Outputs: void (throws on error)
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️  SMTP credentials not configured. Email not sent.')
    console.log('📧 Would send email to:', data.email)
    console.log('🔑 Temporary password:', data.password)
    console.log('\n💡 To enable email sending:')
    console.log('   1. Add to .env:')
    console.log('      SMTP_HOST="smtp.gmail.com"')
    console.log('      SMTP_PORT="587"')
    console.log('      SMTP_USER="your-email@gmail.com"')
    console.log('      SMTP_PASS="your-app-password"')
    console.log('      FROM_EMAIL="your-email@gmail.com"')
    console.log('   2. For Gmail: Enable 2FA and create App Password')
    console.log('      https://myaccount.google.com/apppasswords\n')
    return
  }

  console.log(`📧 Attempting to send welcome email to ${data.email}...`)
  console.log(`   From: ${FROM_EMAIL}`)
  console.log(`   Password: ${data.password}`)

  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: data.email,
    subject: 'Welcome to UM6P Map - Your Account Credentials',
    text: `
Hello ${data.firstName} ${data.lastName},

Welcome to UM6P Map! Your account has been created successfully.

Your login credentials:
Email: ${data.email}
Temporary Password: ${data.password}

For security reasons, you will be required to change your password upon first login.

Account Type: ${data.userType === 'PERMANENT' ? 'Permanent User' : 'Temporary User'}

Please keep this information secure and do not share it with anyone.

Best regards,
UM6P System Administrator

This is an automated message. Please do not reply to this email.
    `.trim(),
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to UM6P Map</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #EA3B15 0%, #C02D0F 100%); padding: 30px 40px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Welcome to UM6P Map</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px;">
      <h2 style="color: #111827; font-size: 20px; margin: 0 0 20px 0;">Hello ${data.firstName} ${data.lastName},</h2>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Your account has been created successfully. Below are your login credentials:
      </p>
      
      <!-- Credentials Box -->
      <div style="background-color: #f3f4f6; border-left: 4px solid #EA3B15; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #374151; font-size: 14px; margin: 0 0 10px 0;"><strong>Email:</strong></p>
        <p style="color: #111827; font-size: 16px; margin: 0 0 20px 0;">${data.email}</p>
        
        <p style="color: #374151; font-size: 14px; margin: 0 0 10px 0;"><strong>Temporary Password:</strong></p>
        <p style="background-color: #ffffff; color: #EA3B15; font-size: 20px; font-weight: bold; font-family: 'Courier New', monospace; padding: 15px; margin: 0 0 20px 0; border-radius: 4px; letter-spacing: 2px; text-align: center;">${data.password}</p>
        
        <p style="color: #374151; font-size: 14px; margin: 0;"><strong>Account Type:</strong> ${data.userType === 'PERMANENT' ? 'Permanent User' : 'Temporary User'}</p>
      </div>
      
      <!-- Warning Box -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #92400e; font-size: 14px; margin: 0;">
          <strong>⚠️ Important:</strong> For security reasons, you will be required to change your password upon first login.
        </p>
      </div>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
        Please keep this information secure and do not share it with anyone.
      </p>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
        If you did not request this account, please contact the administrator immediately.
      </p>
      
      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">Best regards,<br><strong>UM6P System Administrator</strong></p>
        <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim(),
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(`✅ Welcome email sent successfully to ${data.email}`)
    console.log(`   Message ID: ${info.messageId}`)
  } catch (error: any) {
    console.error('❌ Failed to send email:')
    console.error('   Error:', error.message)
    
    if (error.code) {
      console.error('   Error Code:', error.code)
    }
    
    console.error('\n💡 Common issues:')
    console.error('   1. Invalid SMTP credentials')
    console.error('   2. SMTP server not reachable')
    console.error('   3. For Gmail: Need App Password (not regular password)')
    console.error('   4. Firewall blocking SMTP port')
    console.error('   5. Recipient email invalid\n')
    
    throw new Error('Failed to send welcome email')
  }
}

/**
 * Send password reset email
 * Purpose: Send new password to user after reset
 * Inputs: user data with new generated password
 * Outputs: void (throws on error)
 */
export async function sendPasswordResetEmail(data: WelcomeEmailData): Promise<void> {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️  SMTP credentials not configured. Email not sent.')
    console.log('📧 Would send password reset email to:', data.email)
    console.log('🔑 New temporary password:', data.password)
    console.log('\n💡 To enable email sending:')
    console.log('   1. Add to .env:')
    console.log('      SMTP_HOST="smtp.gmail.com"')
    console.log('      SMTP_PORT="587"')
    console.log('      SMTP_USER="your-email@gmail.com"')
    console.log('      SMTP_PASS="your-app-password"')
    console.log('      FROM_EMAIL="your-email@gmail.com"')
    console.log('   2. For Gmail: Enable 2FA and create App Password')
    console.log('      https://myaccount.google.com/apppasswords\n')
    return
  }

  console.log(`📧 Attempting to send password reset email to ${data.email}...`)

  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: data.email,
    subject: 'UM6P Map - Password Reset',
    text: `
Hello ${data.firstName} ${data.lastName},

Your password has been reset as requested.

Your new login credentials:
Email: ${data.email}
Temporary Password: ${data.password}

For security reasons, you will be required to change your password upon next login.

If you did not request this password reset, please contact the administrator immediately.

Best regards,
UM6P System Administrator

This is an automated message. Please do not reply to this email.
    `.trim(),
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - UM6P Map</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #EA3B15 0%, #C02D0F 100%); padding: 30px 40px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Password Reset</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px;">
      <h2 style="color: #111827; font-size: 20px; margin: 0 0 20px 0;">Hello ${data.firstName} ${data.lastName},</h2>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Your password has been reset as requested. Below are your new login credentials:
      </p>
      
      <!-- Credentials Box -->
      <div style="background-color: #f3f4f6; border-left: 4px solid #EA3B15; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #374151; font-size: 14px; margin: 0 0 10px 0;"><strong>Email:</strong></p>
        <p style="color: #111827; font-size: 16px; margin: 0 0 20px 0;">${data.email}</p>
        
        <p style="color: #374151; font-size: 14px; margin: 0 0 10px 0;"><strong>New Temporary Password:</strong></p>
        <p style="background-color: #ffffff; color: #EA3B15; font-size: 20px; font-weight: bold; font-family: 'Courier New', monospace; padding: 15px; margin: 0; border-radius: 4px; letter-spacing: 2px; text-align: center;">${data.password}</p>
      </div>
      
      <!-- Warning Box -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #92400e; font-size: 14px; margin: 0;">
          <strong>⚠️ Important:</strong> For security reasons, you will be required to change your password upon next login.
        </p>
      </div>
      
      <!-- Security Notice -->
      <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #991b1b; font-size: 14px; margin: 0;">
          <strong>🔒 Security Notice:</strong> If you did not request this password reset, please contact the administrator immediately.
        </p>
      </div>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
        Please keep this information secure and do not share it with anyone.
      </p>
      
      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">Best regards,<br><strong>UM6P System Administrator</strong></p>
        <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim(),
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(`✅ Password reset email sent successfully to ${data.email}`)
    console.log(`📬 Message ID: ${info.messageId}`)
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error)
    
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
      })
      
      // Provide helpful troubleshooting tips
      console.log('\n🔍 Troubleshooting tips:')
      console.log('1. Verify SMTP credentials in .env file')
      console.log('2. For Gmail: Make sure you are using an App Password, not your regular password')
      console.log('3. Check if 2-Factor Authentication is enabled on your Google account')
      console.log('4. Verify SMTP_HOST and SMTP_PORT are correct')
      console.log('5. Check your firewall settings')
    }
    
    throw error
  }
}

/**
 * Send email verification link
 * Purpose: Send verification email to new signups
 * Inputs: user email, name, verification token
 * Outputs: void (throws on error)
 */
export async function sendVerificationEmail(data: {
  email: string
  firstName: string
  lastName: string
  verificationToken: string
}): Promise<void> {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️  SMTP credentials not configured. Email not sent.')
    console.log('📧 Would send verification email to:', data.email)
    console.log('🔗 Verification token:', data.verificationToken)
    console.log(`🔗 Verification link: ${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${data.verificationToken}`)
    return
  }

  console.log(`📧 Attempting to send verification email to ${data.email}...`)

  const verificationLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${data.verificationToken}`

  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: data.email,
    subject: 'UM6P Map - Verify Your Email',
    text: `
Hello ${data.firstName} ${data.lastName},

Thank you for signing up for UM6P Map!

Please verify your email address by clicking the link below:
${verificationLink}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

Best regards,
UM6P System Administrator

This is an automated message. Please do not reply to this email.
    `.trim(),
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - UM6P Map</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #EA3B15 0%, #C02D0F 100%); padding: 30px 40px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Verify Your Email</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px;">
      <h2 style="color: #111827; font-size: 20px; margin: 0 0 20px 0;">Hello ${data.firstName} ${data.lastName},</h2>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Thank you for signing up for UM6P Map! We're excited to have you join our campus community.
      </p>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        To complete your registration, please verify your email address by clicking the button below:
      </p>
      
      <!-- Verification Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" style="display: inline-block; background-color: #EA3B15; color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Verify Email Address
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
        Or copy and paste this link into your browser:
      </p>
      <p style="color: #EA3B15; font-size: 14px; word-break: break-all; background-color: #f3f4f6; padding: 12px; border-radius: 4px; margin: 0 0 20px 0;">
        ${verificationLink}
      </p>
      
      <!-- Warning Box -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #92400e; font-size: 14px; margin: 0;">
          <strong>⏰ Important:</strong> This verification link will expire in 24 hours.
        </p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
        If you didn't create an account with UM6P Map, please ignore this email.
      </p>
      
      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">Best regards,<br><strong>UM6P System Administrator</strong></p>
        <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim(),
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(`✅ Verification email sent successfully to ${data.email}`)
    console.log(`📬 Message ID: ${info.messageId}`)
  } catch (error) {
    console.error('❌ Failed to send verification email:', error)
    
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
      })
    }
    
    throw error
  }
}

/**
 * Send generic email
 * Purpose: Send any email with custom content
 * Inputs: email options (to, subject, html, text)
 * Outputs: void (throws on error)
 */
export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<void> {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️  SMTP credentials not configured. Email not sent.')
    console.log('📧 Would send email to:', options.to)
    console.log('📝 Subject:', options.subject)
    return
  }

  console.log(`📧 Sending email to ${options.to}...`)

  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    text: options.text || '',
    html: options.html,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(`✅ Email sent successfully to ${options.to}`)
    console.log(`📬 Message ID: ${info.messageId}`)
  } catch (error: any) {
    console.error('❌ Failed to send email:', error)
    throw new Error('Failed to send email')
  }
}

/**
 * Generate secure random password
 * Purpose: Create a strong temporary password
 * Inputs: length (default 12)
 * Outputs: random password string
 */
export function generatePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'
  
  const allChars = uppercase + lowercase + numbers + symbols
  
  let password = ''
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

interface MagicLinkEmailData {
  email: string
  firstName: string
  lastName: string
  magicLink: string
  expiresIn: string
}

/**
 * Send magic link email for temporary users
 * Purpose: Send passwordless login link to temporary user
 * Inputs: user data with magic link
 * Outputs: void (throws on error)
 */
export async function sendMagicLinkEmail(data: MagicLinkEmailData): Promise<void> {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️  SMTP credentials not configured. Email not sent.')
    console.log('📧 Would send magic link to:', data.email)
    console.log('🔗 Magic link:', data.magicLink)
    console.log('\n💡 To enable email sending, configure SMTP settings in .env\n')
    return
  }

  console.log(`📧 Attempting to send magic link email to ${data.email}...`)
  console.log(`   From: ${FROM_EMAIL}`)
  console.log(`   Magic Link: ${data.magicLink}`)

  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: data.email,
    subject: 'Your UM6P Map Access Link - No Password Required',
    text: `
Hello ${data.firstName} ${data.lastName},

Welcome to UM6P Map! You have been granted temporary access to the campus map.

Click the link below to access the map (no password required):
${data.magicLink}

This link will expire in ${data.expiresIn}.

For security reasons, this link can only be used once. If you need a new link, please contact your administrator.

Best regards,
UM6P System Administrator

This is an automated message. Please do not reply to this email.
    `.trim(),
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your UM6P Map Access Link</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #EA3B15 0%, #C02D0F 100%); padding: 30px 40px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Welcome to UM6P Map</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hello <strong>${data.firstName} ${data.lastName}</strong>,
      </p>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        You have been granted temporary access to the UM6P campus map. Click the button below to access the map - no password required!
      </p>
      
      <!-- Access Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.magicLink}" style="display: inline-block; background: linear-gradient(135deg, #EA3B15 0%, #C02D0F 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(234, 59, 21, 0.3);">
          Access UM6P Map
        </a>
      </div>
      
      <!-- Info Box -->
      <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #92400E; font-size: 14px; margin: 0; line-height: 1.5;">
          <strong>⏱️ Important:</strong> This link will expire in <strong>${data.expiresIn}</strong> and can only be used once.
        </p>
      </div>
      
      <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="color: #EA3B15; font-size: 13px; word-break: break-all; background-color: #F9FAFB; padding: 12px; border-radius: 4px; margin: 10px 0;">
        ${data.magicLink}
      </p>
      
      <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
        If you need a new access link, please contact your administrator.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #F9FAFB; padding: 20px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
      <p style="color: #6B7280; font-size: 12px; margin: 0;">
        Best regards,<br>
        <strong>UM6P System Administrator</strong>
      </p>
      <p style="color: #9CA3AF; font-size: 11px; margin: 10px 0 0 0;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('✅ Magic link email sent successfully to', data.email)
  } catch (error: any) {
    console.error('❌ Failed to send magic link email:', error.message)
    throw new Error(`Failed to send magic link email: ${error.message}`)
  }
}
