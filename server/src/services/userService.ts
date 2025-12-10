/**
 * User Service
 * Purpose: Business logic for user management
 */

import { userRepository } from '../repositories/userRepository'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { generatePassword, sendWelcomeEmail, sendPasswordResetEmail, sendMagicLinkEmail } from './emailService'
import * as XLSX from 'xlsx'

export class UserService {
  /**
   * Get all users with pagination and filters
   */
  async getAllUsers(params: {
    page: number
    limit: number
    search?: string
    userType?: string
    status?: string
  }) {
    const { page, limit, search, userType, status } = params
    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { department: { contains: search } }
      ]
    }

    if (userType) {
      where.userType = userType
    }

    if (status) {
      where.status = status
    }

    const result = await userRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { createdAt: 'desc' }
    })

    return {
      users: result.users,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string) {
    const user = await userRepository.findById(id)
    if (!user) {
      throw new Error('User not found')
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  /**
   * Create new user
   * Purpose: Create permanent or temporary user with appropriate authentication method
   * - Permanent users: Email/password authentication
   * - Temporary users: Magic link authentication (no password required)
   */
  async createUser(data: {
    email: string
    password?: string
    firstName?: string
    lastName?: string
    phone?: string
    department?: string
    userType: string
    status?: string
    campusId?: string
    startDate?: Date
    endDate?: Date
    purpose?: string
  }) {
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(data.email)
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const isTemporaryUser = data.userType === 'TEMPORARY'
    let plainPassword = ''
    let hashedPassword = ''
    let magicLinkToken = ''
    let magicLinkExpiry: Date | undefined

    if (isTemporaryUser) {
      // For temporary users: generate magic link token
      magicLinkToken = crypto.randomBytes(32).toString('hex')
      magicLinkExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      // Use a dummy password (they won't use it)
      hashedPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10)
      console.log('🔗 Generated magic link token for temporary user:', magicLinkToken.substring(0, 10) + '...')
      console.log('📅 Token expires:', magicLinkExpiry)
    } else {
      // For permanent users: use password authentication
      plainPassword = data.password || generatePassword(12)
      hashedPassword = await bcrypt.hash(plainPassword, 10)
    }

    // Prepare user data with proper Prisma format
    const { campusId, ...userData } = data
    console.log('🏫 Creating user with campusId:', campusId || 'none')
    
    // Create user
    const user = await userRepository.create({
      ...userData,
      password: hashedPassword,
      mustChangePassword: !isTemporaryUser && !data.password, // Only for permanent users with auto-generated password
      ...(isTemporaryUser && {
        verificationToken: magicLinkToken,
        verificationTokenExpiry: magicLinkExpiry
      }),
      ...(campusId && {
        campus: {
          connect: { id: campusId }
        }
      })
    } as any)

    // Send appropriate email
    try {
      if (isTemporaryUser) {
        // Send magic link email for temporary users
        const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/magic-login?token=${magicLinkToken}`
        await sendMagicLinkEmail({
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          magicLink,
          expiresIn: '7 days'
        })
        console.log('🔗 Magic link sent to temporary user:', user.email)
      } else {
        // Send welcome email with password for permanent users
        await sendWelcomeEmail({
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          password: plainPassword,
          userType: user.userType
        })
        console.log('📧 Welcome email sent to permanent user:', user.email)
      }
    } catch (error: any) {
      console.error('⚠️  Failed to send email:', error.message)
      if (!isTemporaryUser) {
        console.log('🔑 User created successfully. Temporary password:', plainPassword)
        console.log('📧 Email:', user.email)
        console.log('\n💡 Please provide these credentials to the user manually.\n')
      }
      // Don't fail user creation if email fails
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: {
    email?: string
    firstName?: string
    lastName?: string
    phone?: string
    department?: string
    userType?: string
    status?: string
    campusId?: string
    startDate?: Date
    endDate?: Date
    purpose?: string
  }) {
    // If email is being updated, check if it's already taken
    if (data.email) {
      const existingUser = await userRepository.findByEmail(data.email)
      if (existingUser && existingUser.id !== id) {
        throw new Error('Email already in use')
      }
    }

    // Prepare update data with proper Prisma format
    const { campusId, ...updateData } = data
    
    const user = await userRepository.update(id, {
      ...updateData,
      ...(campusId && {
        campus: {
          connect: { id: campusId }
        }
      })
    })
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id: string) {
    await userRepository.delete(id)
    return { message: 'User deleted successfully' }
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await userRepository.update(id, { password: hashedPassword })
    return { message: 'Password updated successfully' }
  }

  /**
   * Toggle user status
   */
  async toggleUserStatus(id: string) {
    const user = await userRepository.findById(id)
    if (!user) {
      throw new Error('User not found')
    }

    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    const updatedUser = await userRepository.update(id, { status: newStatus })
    
    const { password, ...userWithoutPassword } = updatedUser
    return userWithoutPassword
  }

  /**
   * Reset user password
   * Purpose: Generate new password, send email, and require password change on next login
   * Inputs: userId
   * Outputs: Updated user without password
   */
  async resetPassword(id: string) {
    const user = await userRepository.findById(id)
    if (!user) {
      throw new Error('User not found')
    }

    // Generate new password
    const newPassword = generatePassword()

   

    // Send password reset email
    await sendPasswordResetEmail({
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      password: newPassword,
      userType: user.userType
    })

    return newPassword
  }

  /**
   * Get user audit logs
   * Purpose: Fetch all audit logs for a specific user
   */
  async getUserAuditLogs(userId: string) {
    const auditLogs = await prisma!.auditLog.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit to last 100 entries
    })

    return auditLogs
  }

  /**
   * Bulk import users from file
   * Purpose: Parse file and create multiple users
   * Inputs: File buffer and filename
   * Outputs: Import results with success/failure counts
   */
  async bulkImportUsers(buffer: Buffer, filename: string) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; email: string; error: string }>
    }

    try {
      // Check file type
      const fileExtension = filename.toLowerCase().split('.').pop()
      
      // Check if it's a PDF
      if (fileExtension === 'pdf') {
        throw new Error('PDF files are not yet supported. Please convert to CSV or Excel format.')
      }
      
      // Check if it's an image
      if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '')) {
        throw new Error('Image files are not yet supported. Please convert to CSV or Excel format.')
      }

      let rows: any[] = []

      // Parse Excel or CSV
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel file
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      } else {
        // Parse CSV data - handle different line endings
        const fileContent = buffer.toString('utf-8')
        const lines = fileContent
          .replace(/\r\n/g, '\n') // Windows line endings
          .replace(/\r/g, '\n')   // Old Mac line endings
          .split('\n')
          .filter(line => line.trim())
        
        // Parse CSV line - handle quoted values
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = []
          let current = ''
          let inQuotes = false
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }
          result.push(current.trim())
          return result
        }

        rows = lines.map(line => parseCSVLine(line))
      }
      
      if (rows.length < 2) {
        throw new Error('File is empty or has no data rows')
      }

      const headers = rows[0].map((h: any) => String(h).trim())
      
      // Validate required headers
      const requiredHeaders = ['firstName', 'lastName', 'email', 'phone', 'department', 'userCategory']
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}. Found: ${headers.join(', ')}`)
      }

      // Process each data row
      for (let i = 1; i < rows.length; i++) {
        const rowNumber = i + 1
        const values = rows[i].map((v: any) => String(v || '').trim())
        
        if (values.length !== headers.length) {
          results.failed++
          results.errors.push({
            row: rowNumber,
            email: values[headers.indexOf('email')] || 'unknown',
            error: `Invalid number of columns. Expected ${headers.length}, got ${values.length}`
          })
          continue
        }

        // Create user object
        const userData: any = {}
        headers.forEach((header: string, index: number) => {
          userData[header] = values[index]
        })

        try {
          // Validate email - allow any valid email format for admin imports
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
          if (!userData.email || !userData.email.match(emailRegex)) {
            throw new Error('Invalid email address format')
          }

          // Validate user category
          if (!['STUDENT', 'STAFF'].includes(userData.userCategory?.toUpperCase())) {
            throw new Error('userCategory must be STUDENT or STAFF')
          }

          // Check if user already exists
          const existingUser = await userRepository.findByEmail(userData.email.toLowerCase())
          if (existingUser) {
            throw new Error('User with this email already exists')
          }

          // Generate random password
          const tempPassword = generatePassword()
          const hashedPassword = await bcrypt.hash(tempPassword, 10)

          // Get default campus (first active campus)
          const defaultCampus = await prisma!.campus.findFirst({
            where: { isActive: true }
          })

          if (!defaultCampus) {
            throw new Error('No active campus found')
          }

          // Create user
          await userRepository.create({
            email: userData.email.toLowerCase(),
            password: hashedPassword,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            department: userData.department,
            userType: 'PERMANENT',
            status: 'ACTIVE',
            mustChangePassword: true,
            campus: {
              connect: { id: defaultCampus.id }
            }
          })

          // TODO: Send welcome email with temporary password
          // await sendWelcomeEmail({ ...userData, password: tempPassword })

          results.success++
        } catch (error: any) {
          results.failed++
          results.errors.push({
            row: rowNumber,
            email: userData.email || 'unknown',
            error: error.message || 'Failed to create user'
          })
        }
      }

      return results
    } catch (error: any) {
      throw new Error(`Bulk import failed: ${error.message}`)
    }
  }

  /**
   * Bulk import temporary users with session dates
   * Purpose: Import multiple temporary users from CSV/Excel with shared session dates
   * Inputs: File buffer, filename, session dates (startDate, endDate, purpose)
   * Outputs: Import results with success/failed counts
   */
  async bulkImportTemporaryUsers(
    buffer: Buffer,
    filename: string,
    sessionData: { startDate: Date; endDate: Date; purpose?: string }
  ) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; email: string; error: string }>
    }

    try {
      let rows: any[] = []

      // Parse file based on extension
      if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      } else {
        // Parse CSV
        const content = buffer.toString('utf-8')
        const lines = content.split(/\r?\n/).filter(line => line.trim())
        
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = []
          let current = ''
          let inQuotes = false
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }
          result.push(current.trim())
          return result
        }

        rows = lines.map(line => parseCSVLine(line))
      }
      
      if (rows.length < 2) {
        throw new Error('File is empty or has no data rows')
      }

      const headers = rows[0].map((h: any) => String(h).trim())
      
      // Validate required headers (only firstName, lastName, email for temporary users)
      const requiredHeaders = ['firstName', 'lastName', 'email']
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}. Found: ${headers.join(', ')}`)
      }

      console.log(`📋 Importing ${rows.length - 1} temporary users with session dates:`)
      console.log(`   Start: ${sessionData.startDate}`)
      console.log(`   End: ${sessionData.endDate}`)
      console.log(`   Purpose: ${sessionData.purpose || 'N/A'}`)

      // Process each data row
      for (let i = 1; i < rows.length; i++) {
        const rowNumber = i + 1
        const values = rows[i].map((v: any) => String(v || '').trim())
        
        if (values.every((v: string) => !v)) continue // Skip empty rows

        try {
          const userData: any = {}
          headers.forEach((header: string, index: number) => {
            userData[header] = values[index]
          })

          // Validate email
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
          if (!userData.email || !userData.email.match(emailRegex)) {
            throw new Error('Invalid email address format')
          }

          // Check for duplicate email
          const existingUser = await userRepository.findByEmail(userData.email.toLowerCase())
          if (existingUser) {
            throw new Error('Email already exists')
          }

          // Create temporary user with session dates
          await this.createUser({
            email: userData.email.toLowerCase(),
            firstName: userData.firstName,
            lastName: userData.lastName,
            userType: 'TEMPORARY',
            status: 'ACTIVE',
            startDate: sessionData.startDate,
            endDate: sessionData.endDate,
            purpose: sessionData.purpose
          })

          results.success++
          console.log(`✅ Row ${rowNumber}: ${userData.email}`)
        } catch (error: any) {
          results.failed++
          results.errors.push({
            row: rowNumber,
            email: values[headers.indexOf('email')] || 'unknown',
            error: error.message
          })
          console.error(`❌ Row ${rowNumber}: ${error.message}`)
        }
      }

      console.log(`\n📊 Import complete: ${results.success} success, ${results.failed} failed`)
      return results
    } catch (error: any) {
      throw new Error(`Bulk import temporary users failed: ${error.message}`)
    }
  }
}

export const userService = new UserService()
