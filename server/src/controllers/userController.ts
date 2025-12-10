/**
 * User Controller
 * Purpose: Handle HTTP requests for user management
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { userService } from '../services/userService'

/**
 * Get all users
 */
export async function getAllUsers(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { page = '1', limit = '12', search = '', userType = '', status = '' } = request.query as any

    const result = await userService.getAllUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      userType,
      status
    })

    return reply.status(200).send({
      success: true,
      data: result.users,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch users'
    })
  }
}

/**
 * Get user by ID
 */
export async function getUserById(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string }
    const user = await userService.getUserById(id)

    return reply.status(200).send({
      success: true,
      data: user
    })
  } catch (error: any) {
    console.error('Error fetching user:', error)
    return reply.status(404).send({
      success: false,
      error: error.message || 'User not found'
    })
  }
}

/**
 * Create user
 */
export async function createUser(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const data = request.body as any
    const user = await userService.createUser(data)

    return reply.status(201).send({
      success: true,
      data: user
    })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return reply.status(400).send({
      success: false,
      error: error.message || 'Failed to create user'
    })
  }
}

/**
 * Update user
 */
export async function updateUser(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string }
    const data = request.body as any
    const user = await userService.updateUser(id, data)

    return reply.status(200).send({
      success: true,
      data: user
    })
  } catch (error: any) {
    console.error('Error updating user:', error)
    return reply.status(400).send({
      success: false,
      error: error.message || 'Failed to update user'
    })
  }
}

/**
 * Delete user
 */
export async function deleteUser(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string }
    await userService.deleteUser(id)

    return reply.status(200).send({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return reply.status(400).send({
      success: false,
      error: error.message || 'Failed to delete user'
    })
  }
}

/**
 * Toggle user status
 */
export async function toggleUserStatus(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string }
    const user = await userService.toggleUserStatus(id)

    return reply.status(200).send({
      success: true,
      data: user
    })
  } catch (error: any) {
    console.error('Error toggling user status:', error)
    return reply.status(400).send({
      success: false,
      error: error.message || 'Failed to toggle user status'
    })
  }
}

/**
 * Update user password
 */
export async function updatePassword(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string }
    const { password } = request.body as { password: string }
    
    if (!password || password.length < 6) {
      return reply.status(400).send({
        success: false,
        error: 'Password must be at least 6 characters'
      })
    }

    await userService.updatePassword(id, password)

    return reply.status(200).send({
      success: true,
      message: 'Password updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating password:', error)
    return reply.status(400).send({
      success: false,
      error: error.message || 'Failed to update password'
    })
  }
}

/**
 * Reset user password
 * Purpose: Generate new password, send email, and require password change on next login
 */
export async function resetPassword(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string }
    
    const newPassword = await userService.resetPassword(id)
    
    return reply.send({
      success: true,
      message: 'Password reset successfully',
      temporaryPassword: newPassword
    })
  } catch (error: any) {
    console.error('Error resetting password:', error)
    return reply.code(500).send({
      success: false,
      error: error.message || 'Failed to reset password'
    })
  }
}

/**
 * Get user audit logs
 * GET /api/users/:id/audit-logs
 */
export async function getUserAuditLogs(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string }
    
    const auditLogs = await userService.getUserAuditLogs(id)
    
    return reply.send({
      success: true,
      data: auditLogs
    })
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    return reply.code(500).send({
      success: false,
      error: error.message || 'Failed to fetch audit logs'
    })
  }
}

/**
 * Bulk import users from file
 * POST /api/users/bulk-import
 */
export async function bulkImport(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const data = await request.file()
    
    if (!data) {
      return reply.code(400).send({
        success: false,
        error: 'No file uploaded'
      })
    }

    const buffer = await data.toBuffer()
    const filename = data.filename
    
    const result = await userService.bulkImportUsers(buffer, filename)
    
    return reply.send(result)
  } catch (error: any) {
    console.error('Error in bulk import:', error)
    return reply.code(500).send({
      success: false,
      error: error.message || 'Failed to import users'
    })
  }
}

/**
 * Bulk import temporary users from file with session dates
 * POST /api/users/bulk-import-temporary
 */
export async function bulkImportTemporary(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const parts = request.parts()
    let fileBuffer: Buffer | null = null
    let filename = ''
    let startDate = ''
    let endDate = ''
    let purpose = ''

    // Parse multipart form data
    for await (const part of parts) {
      if (part.type === 'file') {
        fileBuffer = await part.toBuffer()
        filename = part.filename
      } else {
        // Handle form fields
        const fieldValue = (part as any).value
        if (part.fieldname === 'startDate') startDate = fieldValue
        if (part.fieldname === 'endDate') endDate = fieldValue
        if (part.fieldname === 'purpose') purpose = fieldValue
      }
    }

    if (!fileBuffer) {
      return reply.code(400).send({
        success: false,
        error: 'No file uploaded'
      })
    }

    if (!startDate || !endDate) {
      return reply.code(400).send({
        success: false,
        error: 'Start date and end date are required'
      })
    }

    const result = await userService.bulkImportTemporaryUsers(fileBuffer, filename, {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      purpose: purpose || undefined
    })
    
    return reply.send(result)
  } catch (error: any) {
    console.error('Error in bulk import temporary users:', error)
    return reply.code(500).send({
      success: false,
      error: error.message || 'Failed to import temporary users'
    })
  }
}
