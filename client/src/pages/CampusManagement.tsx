import { useState, useEffect } from 'react'
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CampusForm } from '@/components/CampusForm'
import { CampusDetail } from '@/components/CampusDetail'
import { PasswordConfirmDialog } from '@/components/ui/PasswordConfirmDialog'
import { useToast } from '@/hooks/useToast'
import { getAllCampuses, createCampus, updateCampus, getCampusById, deleteCampus } from '@/api/campusApi'

export default function CampusManagement() {
  const toast = useToast()
  const [campuses, setCampuses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCampus, setEditingCampus] = useState<any | null>(null)
  const [selectedCampus, setSelectedCampus] = useState<any | null>(null)
  const [deletingCampus, setDeletingCampus] = useState<any | null>(null)

  /**
   * Fetch campuses from API
   * Purpose: Load real campus data
   */
  const fetchCampuses = async () => {
    setIsLoading(true)
    try {
      const response = await getAllCampuses(1, 100) // Get all campuses
      setCampuses(response.campuses || [])
    } catch (error: any) {
      console.error('Failed to fetch campuses:', error)
      toast.error(error.message || 'Failed to load campuses')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCampuses()
  }, [])

  /**
   * Handle add new campus
   * Purpose: Open form for new campus
   */
  const handleAddCampus = () => {
    setEditingCampus(null)
    setShowForm(true)
  }

  /**
   * Handle edit campus
   * Purpose: Open form with campus data
   */
  const handleEditCampus = (campus: any) => {
    setEditingCampus(campus)
    setShowForm(true)
    setSelectedCampus(null)
  }

  /**
   * Handle view campus details
   * Purpose: Show full campus details
   */
  const handleViewCampus = async (campusId: string) => {
    try {
      const response = await getCampusById(campusId)
      setSelectedCampus(response.data)
    } catch (error: any) {
      console.error('Failed to fetch campus details:', error)
      toast.error(error.message || 'Failed to load campus details')
    }
  }

  /**
   * Handle form submit
   * Purpose: Create or update campus
   */
  const handleFormSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        coordinates: data.coordinates ? JSON.stringify(data.coordinates) : null,
      }

      if (editingCampus) {
        await updateCampus(editingCampus.id, payload)
      } else {
        await createCampus(payload)
      }

      setShowForm(false)
      setEditingCampus(null)
      await fetchCampuses()
      toast.success(editingCampus ? 'Campus updated successfully' : 'Campus created successfully')
    } catch (error: any) {
      console.error('Failed to save campus:', error)
      toast.error(error.message || 'Failed to save campus')
    }
  }

  /**
   * Handle delete campus
   * Purpose: Open password confirmation dialog
   */
  const handleDeleteCampus = (campus: any) => {
    setDeletingCampus(campus)
  }

  /**
   * Handle delete confirmation
   * Purpose: Delete campus with password verification
   */
  const handleDeleteConfirm = async (password: string) => {
    if (!deletingCampus) return

    try {
      await deleteCampus(deletingCampus.id, password)
      setDeletingCampus(null)
      await fetchCampuses()
      toast.success('Campus deleted successfully')
    } catch (error: any) {
      console.error('Failed to delete campus:', error)
      const errorMsg = error.message || 'Failed to delete campus'
      
      if (errorMsg.includes('password') || errorMsg.includes('Invalid password')) {
        toast.error('Invalid password')
      } else if (errorMsg.includes('Unauthorized') || errorMsg.includes('logged in')) {
        toast.error('You must be logged in to delete a campus')
      } else if (errorMsg.includes('User not found')) {
        toast.error('Your session has expired. Please log in again.')
      } else {
        toast.error(errorMsg)
      }
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campus Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage multiple campus locations and settings
          </p>
        </div>
        <Button onClick={handleAddCampus}>
          <Plus className="w-4 h-4 mr-2" />
          Add Campus
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {isLoading ? (
          <div className="col-span-3 text-center py-12 text-muted-foreground">
            Loading campuses...
          </div>
        ) : campuses.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-muted-foreground">
            No campuses found. Add your first campus to get started.
          </div>
        ) : (
          campuses.map((campus) => (
          <Card 
            key={campus.id} 
            className="hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => handleViewCampus(campus.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{campus.name}</CardTitle>
                <Badge variant={campus.isActive ? 'success' : 'secondary'}>
                  {campus.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {campus.address || 'No address provided'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {campus.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {campus.description}
                </p>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Buildings:</span>
                <span className="font-medium">{campus._count?.buildings || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Users:</span>
                <span className="font-medium">{campus._count?.users || 0}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditCampus(campus)
                  }}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteCampus(campus)
                  }}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
        )}
      </div>

      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-12">
          <Button variant="outline" size="lg" onClick={handleAddCampus}>
            <Plus className="w-5 h-5 mr-2" />
            Add New Campus
          </Button>
        </CardContent>
      </Card>

      {/* Campus Form */}
      {showForm && (
        <CampusForm
          campus={editingCampus}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false)
            setEditingCampus(null)
          }}
        />
      )}

      {/* Campus Detail View */}
      {selectedCampus && (
        <CampusDetail
          campus={selectedCampus}
          onClose={() => setSelectedCampus(null)}
          onEdit={() => handleEditCampus(selectedCampus)}
        />
      )}

      {/* Delete Confirmation with Password */}
      <PasswordConfirmDialog
        isOpen={!!deletingCampus}
        title="Delete Campus"
        message="This will permanently delete the campus and ALL related data including buildings, users, events, and more. This action cannot be undone."
        itemName={deletingCampus?.name}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingCampus(null)}
      />
    </div>
  )
}
