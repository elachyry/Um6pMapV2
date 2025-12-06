# Super Admin Initialization Guide

## Overview
This guide explains how to initialize a super admin user when the database is empty or after a fresh database reset.

---

## Automatic Initialization (Recommended)

### Using Database Seeding

When you run the database seed command, it will automatically create a super admin user **only if the user table is empty**.

```bash
cd server
npm run seed
```

**Default Credentials:**
- **Email:** `admin@um6p.ma`
- **Password:** `Admin@123`

**Environment Variables (Optional):**
You can customize the default credentials by setting environment variables in your `.env` file:

```env
SUPER_ADMIN_EMAIL=your-email@example.com
SUPER_ADMIN_PASSWORD=YourSecurePassword123
```

---

## Manual Initialization (Interactive)

### Using the Interactive Script

If you want to create a super admin with custom credentials interactively:

```bash
cd server
npm run init-super-admin
```

This will prompt you for:
- Email address
- Password
- First name
- Last name

**Example:**
```
🚀 Super Admin Initialization Script
=====================================

📝 Enter super admin details:

Email (default: admin@um6p.ma): admin@um6p.ma
Password (default: Admin@123): MySecurePass123
First Name (default: Super): Mohammed
Last Name (default: Admin): Elachyry

🔐 Hashing password...
👤 Creating super admin user...
🔑 Assigning SuperAdmin role...

✅ Super admin created successfully!
=====================================
📧 Email: admin@um6p.ma
🔑 Password: MySecurePass123
👤 Name: Mohammed Elachyry
=====================================
⚠️  IMPORTANT: Change the password after first login!
```

---

## After Database Reset

If you delete or reset your database, follow these steps:

1. **Run Prisma Migrations:**
   ```bash
   cd server
   npx prisma migrate dev
   ```

2. **Seed the Database (includes super admin):**
   ```bash
   npm run seed
   ```

This will:
- Create all roles and permissions
- Create campuses
- Create amenities
- **Create super admin user (if user table is empty)**

---

## Super Admin Capabilities

The super admin user has:
- ✅ **Full system access** across all campuses
- ✅ **All permissions** enabled
- ✅ **Global scope** (not limited to a single campus)
- ✅ Can manage users, roles, buildings, events, etc.

---

## Security Best Practices

1. **Change Default Password:**
   - Always change the default password after first login
   - Use a strong password with:
     - At least 12 characters
     - Mix of uppercase and lowercase
     - Numbers and special characters

2. **Secure Email:**
   - Use a real, monitored email address
   - Enable 2FA if available in the future

3. **Environment Variables:**
   - Never commit `.env` files to version control
   - Use strong, unique passwords in production
   - Rotate credentials regularly

4. **Production Setup:**
   ```env
   # .env (production)
   SUPER_ADMIN_EMAIL=admin@yourdomain.com
   SUPER_ADMIN_PASSWORD=VeryStrongPassword123!@#
   ```

---

## Troubleshooting

### "SuperAdmin role not found"
**Solution:** Run the seed command to create roles first:
```bash
npm run seed
```

### "User with email already exists"
**Solution:** The super admin already exists. Use the login credentials or reset the database.

### "User table is not empty"
**Solution:** The automatic seeding skips super admin creation if users exist. Use the interactive script:
```bash
npm run init-super-admin
```

---

## Files Created

- `/server/prisma/seeds/superAdmin.ts` - Super admin seeding logic
- `/server/scripts/init-super-admin.ts` - Interactive initialization script
- `/server/prisma/seed.ts` - Updated to include super admin seeding

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run seed` | Full database seed (includes super admin) |
| `npm run init-super-admin` | Interactive super admin creation |
| `npx prisma migrate dev` | Run database migrations |
| `npx prisma studio` | Open Prisma Studio to view data |

---

## Default Super Admin Details

**Email:** `admin@um6p.ma`  
**Password:** `Admin@123`  
**Role:** SuperAdmin (Global scope)  
**Status:** Active  

⚠️ **Remember to change these credentials after first login!**
