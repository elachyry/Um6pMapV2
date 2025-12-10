# Email Setup Guide - Nodemailer

The application uses Nodemailer to send welcome emails with auto-generated passwords to new users.

## Quick Setup (Gmail)

### 1. Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com/security
2. Enable 2-Step Verification if not already enabled

### 2. Create App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter "UM6P Map" as the name
4. Click "Generate"
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### 3. Configure Environment Variables

Add these to your `.env` file:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="abcdefghijklmnop"  # App password (no spaces)
FROM_EMAIL="your-email@gmail.com"
FROM_NAME="UM6P Map"
```

### 4. Restart Server

```bash
npm run dev
```

## Other Email Providers

### Outlook/Office 365

```env
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_USER="your-email@outlook.com"
SMTP_PASS="your-password"
FROM_EMAIL="your-email@outlook.com"
```

### Custom SMTP Server

```env
SMTP_HOST="mail.yourdomain.com"
SMTP_PORT="587"  # or 465 for SSL
SMTP_USER="noreply@yourdomain.com"
SMTP_PASS="your-password"
FROM_EMAIL="noreply@yourdomain.com"
```

## How It Works

When you create a new user:

1. **Password Generation:** A secure 12-character password is automatically generated
2. **User Creation:** User is created in database with `mustChangePassword: true`
3. **Email Sending:** Welcome email is sent with credentials
4. **First Login:** User must change password on first login

## Email Template

The welcome email includes:

- User's full name
- Login email
- Temporary password (displayed prominently)
- Account type (Permanent/Temporary)
- Security warning about password change requirement
- Professional HTML formatting

## Development Mode

If SMTP credentials are not configured:

- User creation still works
- Password is logged to console
- No email is sent
- You can manually share credentials

Example console output:
```
⚠️  SMTP credentials not configured. Email not sent.
📧 Would send email to: user@example.com
🔑 Temporary password: $a82bMnKp8Iw
```

## Troubleshooting

### Email not received

1. **Check spam/junk folder**
2. **Verify SMTP credentials** in `.env`
3. **Check server logs** for error messages
4. **Test SMTP connection:**
   ```bash
   telnet smtp.gmail.com 587
   ```

### Common Errors

**"Invalid login"**
- For Gmail: Use App Password, not regular password
- Verify 2FA is enabled
- Check username/password are correct

**"Connection timeout"**
- Check firewall settings
- Verify SMTP_HOST and SMTP_PORT
- Try port 465 (SSL) instead of 587 (TLS)

**"Self signed certificate"**
- Add to transporter config:
  ```javascript
  tls: { rejectUnauthorized: false }
  ```

### Testing Email Sending

Create a test user through the admin panel and check:

1. **Server console** for email sending logs
2. **User's email inbox** (including spam)
3. **Database** to verify user was created

## Security Best Practices

### Production Recommendations

1. **Use dedicated email account** for sending
2. **Enable rate limiting** to prevent abuse
3. **Use environment-specific configs**
4. **Monitor email delivery rates**
5. **Implement email queue** for reliability
6. **Add retry logic** for failed sends
7. **Log email activities** for audit trail

### Password Security

- Passwords are 12+ characters
- Mix of uppercase, lowercase, numbers, symbols
- Cryptographically random generation
- Hashed with bcrypt (10 rounds)
- Never stored in plain text
- Sent only once via email
- Must be changed on first login

## Email Service Comparison

| Feature | Nodemailer | SendGrid |
|---------|-----------|----------|
| Setup | Simple | Complex |
| Cost | Free (use your SMTP) | Free tier: 100/day |
| Reliability | Depends on SMTP | High |
| Deliverability | Good | Excellent |
| Analytics | No | Yes |
| Templates | Manual | Built-in |
| Rate Limits | SMTP provider | Plan-based |

## Alternative: Development Email Testing

For development, you can use services like:

### Mailtrap (Recommended for Dev)

```env
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT="587"
SMTP_USER="your-mailtrap-username"
SMTP_PASS="your-mailtrap-password"
FROM_EMAIL="noreply@um6p.ma"
```

Benefits:
- Catches all emails
- No emails sent to real addresses
- Web interface to view emails
- Free tier available

### Ethereal Email (Testing)

Nodemailer can create test accounts automatically:

```javascript
const testAccount = await nodemailer.createTestAccount()
// Use testAccount.user and testAccount.pass
```

## Support

For issues:
1. Check server logs for detailed error messages
2. Verify `.env` configuration
3. Test SMTP connection manually
4. Review this documentation

For Gmail-specific issues:
- https://support.google.com/accounts/answer/185833
- https://support.google.com/mail/answer/7126229
