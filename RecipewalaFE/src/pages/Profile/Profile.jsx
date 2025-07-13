/*
 * BACKEND REQUIREMENTS for Profile Image CORS Fix:
 * 
 * To properly handle profile images and avoid CORS issues, add this route to your backend:
 * 
 * // Route: GET /api/users/profile-image/:filename
 * router.get('/profile-image/:filename', auth, async (req, res) => {
 *   try {
 *     const { filename } = req.params;
 *     const imagePath = path.join(__dirname, '../uploads', filename);
 *     
 *     if (!fs.existsSync(imagePath)) {
 *       return res.status(404).json({ message: 'Image not found' });
 *     }
 *     
 *     const ext = path.extname(filename).toLowerCase();
 *     const mimeTypes = {
 *       '.jpg': 'image/jpeg',
 *       '.jpeg': 'image/jpeg',
 *       '.png': 'image/png',
 *       '.gif': 'image/gif',
 *       '.webp': 'image/webp'
 *     };
 *     
 *     const contentType = mimeTypes[ext] || 'application/octet-stream';
 *     
 *     res.setHeader('Content-Type', contentType);
 *     res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
 *     res.setHeader('Access-Control-Allow-Credentials', 'true');
 *     
 *     const imageStream = fs.createReadStream(imagePath);
 *     imageStream.pipe(res);
 *   } catch (error) {
 *     console.error('Error serving profile image:', error);
 *     res.status(500).json({ message: 'Error serving image' });
 *   }
 * });
 * 
 * Alternative: Add CORS middleware to serve uploads folder:
 * app.use('/uploads', cors({ origin: 'http://localhost:5173', credentials: true }), express.static('uploads'));
 */

import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  Camera,
  Settings,
  ChefHat,
  Calendar,
  Trophy,
  Heart,
  Clock,
  Edit2,
  Check,
  X,
  Upload,
  Trash2,
  AlertTriangle,
  UserX,
  Download,
  Eye,
  EyeOff,
  Sparkles,
  Award,
  TrendingUp
} from 'lucide-react'
import { userService } from '../../services/userService'
import { setCredentials, logout } from '../../features/auth/authSlice'
import { getRecipeStats } from '../../features/recipes/recipeSlice'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
import toast from 'react-hot-toast'

// Validation schemas
const profileSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
})

const passwordSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(6, 'Password must be at least 6 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
})

const Profile = () => {
  const { user } = useSelector((state) => state.auth)
  const { stats } = useSelector((state) => state.recipes)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const previousImagePreviewRef = useRef(null)
  
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [profileData, setProfileData] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm({
    resolver: yupResolver(profileSchema)
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword
  } = useForm({
    resolver: yupResolver(passwordSchema)
  })

  // Helper function to extract user data from API response
  const extractUserData = (response) => {
    return response.data?.user || response.data?.data?.user || response.data
  }

  // Helper function to construct image URL with CORS handling
  const constructImageUrl = async (imagePath) => {
    if (!imagePath) return null
    
    // If it's already a blob URL, return as is
    if (imagePath.startsWith('blob:')) {
      return imagePath
    }
    
    // If it's an external URL, return as is
    if (imagePath.startsWith('http') && !imagePath.includes('localhost:5000')) {
      return imagePath
    }
    
    // For backend uploads, we need to handle CORS
    if (imagePath.startsWith('/uploads/') || imagePath.includes('localhost:5000')) {
      try {
        // Extract just the filename
        const filename = imagePath.split('/').pop()
        
        // Try to fetch image through API endpoint (requires backend route: GET /api/users/profile-image/:filename)
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
        const response = await fetch(`${apiBaseUrl}/users/profile-image/${filename}`, {
          headers: {
            'Authorization': `Bearer ${getCurrentAccessToken()}`
          }
        })
        
        if (response.ok) {
          const blob = await response.blob()
          return URL.createObjectURL(blob)
        } else {
          console.warn('Profile image API endpoint not available, using direct URL (may have CORS issues)')
          // Fallback to direct URL (might still have CORS issues)
          const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'
          return `${baseUrl}${imagePath.startsWith('/') ? imagePath : '/uploads/' + imagePath}`
        }
      } catch (error) {
        console.warn('Error fetching profile image through API, using direct URL:', error)
        // Fallback to direct URL (might still have CORS issues)
        const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'
        return `${baseUrl}${imagePath.startsWith('/') ? imagePath : '/uploads/' + imagePath}`
      }
    }
    
    return imagePath
  }

  // Helper function to load image with CORS handling
  const loadProfileImage = async (imagePath) => {
    if (!imagePath) return null
    
    try {
      setIsLoadingImage(true)
      const imageUrl = await constructImageUrl(imagePath)
      return imageUrl
    } catch (error) {
      console.error('Failed to load profile image:', error)
      return null
    } finally {
      setIsLoadingImage(false)
    }
  }

  // Helper function to get current access token
  const getCurrentAccessToken = () => {
    try {
      let accessToken = user?.accessToken
      
      if (!accessToken && typeof window !== 'undefined') {
        const persistedState = localStorage.getItem('persist:recipewala-root')
        if (persistedState) {
          const parsed = JSON.parse(persistedState)
          const authState = JSON.parse(parsed.auth)
          accessToken = authState.accessToken
        }
      }
      
      return accessToken
    } catch (error) {
      console.error('Error getting access token:', error)
      return null
    }
  }

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfile()
    dispatch(getRecipeStats())
  }, [dispatch])

  // Cleanup blob URLs to prevent memory leaks
  useEffect(() => {
    // Clean up previous blob URL when imagePreview changes
    const previousUrl = previousImagePreviewRef.current
    if (previousUrl && previousUrl.startsWith('blob:') && previousUrl !== imagePreview) {
      console.log('🧹 Cleaning up previous blob URL:', previousUrl)
      URL.revokeObjectURL(previousUrl)
    }
    
    // Update ref with current imagePreview
    previousImagePreviewRef.current = imagePreview
    
    // Cleanup on unmount
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        console.log('🧹 Cleaning up blob URL on unmount:', imagePreview)
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const fetchProfile = async () => {
    try {
      console.log('🔄 Fetching profile data...')
      const response = await userService.getProfile()
      console.log('✅ Profile response:', response.data)
      
      const userData = extractUserData(response)
      
      if (!userData) {
        throw new Error('No user data received from server')
      }
      
      setProfileData(userData)
      
      // Update Redux state
      const accessToken = getCurrentAccessToken()
      dispatch(setCredentials({
        user: userData,
        accessToken
      }))

      // Reset form with fetched data
      resetProfile({
        username: userData.username || '',
        email: userData.email || '',
      })

      // Load image with CORS handling
      if (userData.image) {
        console.log('🔄 Loading profile image:', userData.image)
        try {
          const imageUrl = await loadProfileImage(userData.image)
          setImagePreview(imageUrl)
          console.log('✅ Profile image loaded:', imageUrl)
        } catch (error) {
          console.error('❌ Failed to load profile image:', error)
          setImagePreview(null)
        }
      } else {
        setImagePreview(null)
      }
      
      console.log('✅ Profile data loaded successfully')
    } catch (error) {
      console.error('❌ Failed to fetch profile:', error)
      toast.error(error.response?.data?.message || 'Failed to load profile')
    }
  }

  const handleImageChange = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size should be less than 5MB')
      return
    }

    setImageFile(file)
    
    // Create blob URL for immediate preview
    const blobUrl = URL.createObjectURL(file)
    setImagePreview(blobUrl)
    
    console.log('📷 Image file selected:', {
      name: file.name,
      size: file.size,
      type: file.type,
      blobUrl
    })
    
    toast.success('Image selected. Don\'t forget to save your changes!')
  }

  const onSubmitProfile = async (data) => {
    try {
      setIsUpdatingProfile(true)
      console.log('🔄 Updating profile...')
      
      const formData = new FormData()
      formData.append('username', data.username)
      
      if (imageFile) {
        formData.append('image', imageFile)
        console.log('📷 Including image file in update')
      }

      const response = await userService.updateProfile(formData)
      console.log('✅ Profile update response:', response.data)
      
      // Use consistent data extraction
      const updatedUser = extractUserData(response)
      console.log('📋 Extracted user data:', {
        user: updatedUser,
        hasImage: !!updatedUser?.image,
        imagePath: updatedUser?.image
      })
      
      if (!updatedUser) {
        throw new Error('No user data received from update response')
      }

      // Update local state
      setProfileData(updatedUser)
      
      // Update Redux state
      const accessToken = getCurrentAccessToken()
      dispatch(setCredentials({
        user: updatedUser,
        accessToken
      }))

      // Update image preview
      if (updatedUser.image) {
        console.log('🖼️ Loading updated profile image:', updatedUser.image)
        
        // Clean up old blob URL if exists
        if (imagePreview && imagePreview.startsWith('blob:')) {
          URL.revokeObjectURL(imagePreview)
        }
        
        try {
          const imageUrl = await loadProfileImage(updatedUser.image)
          setImagePreview(imageUrl)
          console.log('✅ Updated profile image loaded:', imageUrl)
        } catch (error) {
          console.error('❌ Failed to load updated profile image:', error)
          setImagePreview(null)
        }
      } else if (imageFile) {
        // If we uploaded a file but no image path returned, keep the blob URL temporarily
        console.log('⚠️ No image path returned from server, keeping blob URL')
      } else {
        setImagePreview(null)
      }

      setIsEditingProfile(false)
      setImageFile(null)
      toast.success('Profile updated successfully!')
      
      console.log('✅ Profile updated successfully')
    } catch (error) {
      console.error('❌ Profile update error:', error)
      console.error('❌ Error response:', error.response?.data)
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const onSubmitPassword = async (data) => {
    try {
      setIsChangingPassword(true)
      console.log('🔄 Changing password...')
      
      await userService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      })
      
      resetPassword()
      toast.success('Password changed successfully!')
      console.log('✅ Password changed successfully')
    } catch (error) {
      console.error('❌ Password change error:', error)
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password to confirm deletion')
      return
    }

    try {
      setIsDeletingAccount(true)
      console.log('🔄 Deleting account...')
      
      await userService.deleteAccount(deletePassword)
      
      // Clear Redux state and redirect to login
      dispatch(logout())
      navigate('/login')
      toast.success('Account deleted successfully')
      console.log('✅ Account deleted successfully')
    } catch (error) {
      console.error('❌ Account deletion error:', error)
      toast.error(error.response?.data?.message || 'Failed to delete account')
    } finally {
      setIsDeletingAccount(false)
      setShowDeleteDialog(false)
      setDeletePassword('')
    }
  }

  const handleCancelEdit = async () => {
    setIsEditingProfile(false)
    resetProfile({
      username: profileData?.username || '',
      email: profileData?.email || '',
    })
    
    // Clean up blob URL if exists (the useEffect will handle this, but we do it explicitly too)
    if (imagePreview && imagePreview.startsWith('blob:')) {
      console.log('🧹 Manually cleaning up blob URL on cancel:', imagePreview)
      URL.revokeObjectURL(imagePreview)
    }
    
    setImageFile(null)
    
    // Reset image preview to original
    if (profileData?.image) {
      try {
        const imageUrl = await loadProfileImage(profileData.image)
        setImagePreview(imageUrl)
      } catch (error) {
        console.error('❌ Failed to reload original profile image:', error)
        setImagePreview(null)
      }
    } else {
      setImagePreview(null)
    }
  }

  const getInitials = (username) => {
    if (!username) return 'U'
    return username.charAt(0).toUpperCase()
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User, color: 'blue' },
    { id: 'stats', label: 'Statistics', icon: Trophy, color: 'yellow' },
    { id: 'security', label: 'Security', icon: Lock, color: 'green' },
    { id: 'danger', label: 'Account', icon: AlertTriangle, color: 'red' },
  ]

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner size="large" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Enhanced Profile Header */}
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white bg-opacity-10 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-white bg-opacity-5 rounded-full blur-2xl"></div>
        
        <div className="relative flex items-start justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative group">
              {isLoadingImage ? (
                <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center shadow-xl">
                  <LoadingSpinner size="small" className="text-white" />
                </div>
              ) : imagePreview ? (
                <img
                  src={imagePreview}
                  alt={profileData.username}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white border-opacity-30 shadow-xl group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    console.error('❌ Image load error:', {
                      src: e.target.src,
                      imagePath: profileData.image,
                      error: 'Likely CORS issue - image blocked by browser'
                    })
                    setImagePreview(null)
                    toast.error('Unable to load profile image (CORS issue)')
                  }}
                  onLoad={() => {
                    console.log('✅ Image loaded successfully:', imagePreview)
                  }}
                />
              ) : (
                <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-200">
                  <span className="text-3xl font-bold text-white">
                    {getInitials(profileData.username)}
                  </span>
                </div>
              )}
              
              {/* Enhanced Image Upload Button */}
              {isEditingProfile && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center text-purple-500 hover:bg-gray-100 transition-all duration-200 shadow-lg hover:scale-110 disabled:opacity-50"
                >
                  {isUploadingImage ? (
                    <LoadingSpinner size="small" className="w-4 h-4" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
              )}
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            
            <div>
              <h1 className="text-3xl font-bold mb-1">{profileData.username}</h1>
              <div className="text-purple-100 text-lg mb-2 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                {profileData.email}
              </div>
              <div className="text-purple-200 text-sm flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Member since {formatDate(profileData.createdAt)}
              </div>
            </div>
          </div>

          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              disabled={isUploadingImage}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 backdrop-blur-sm hover:scale-105"
            >
              <Edit2 className="h-5 w-5" />
              <span className="font-medium">Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-4 font-medium border-b-3 transition-all duration-200 flex items-center space-x-3 relative ${
                  activeTab === tab.id
                    ? `border-${tab.color}-500 text-${tab.color}-600 bg-white`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white hover:bg-opacity-50'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${tab.color}-500`}></div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              {isEditingProfile ? (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <Settings className="h-6 w-6 text-blue-500" />
                    <h3 className="text-xl font-semibold text-gray-900">Edit Profile</h3>
                  </div>
                  
                  <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Username */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Username
                        </label>
                        <input
                          {...registerProfile('username')}
                          type="text"
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                            profileErrors.username ? 'border-red-500' : 'border-gray-300'
                          }`}
                          disabled={isUpdatingProfile}
                        />
                        {profileErrors.username && (
                          <p className="mt-2 text-sm text-red-600">{profileErrors.username.message}</p>
                        )}
                      </div>

                      {/* Email (Read-only) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          {...registerProfile('email')}
                          type="email"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed"
                          disabled={true}
                        />
                        <p className="mt-2 text-xs text-gray-500">Email cannot be changed</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4 pt-4">
                      <button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="bg-blue-500 text-white px-8 py-3 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2 font-medium"
                      >
                        {isUpdatingProfile ? (
                          <>
                            <LoadingSpinner size="small" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-5 w-5" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isUpdatingProfile}
                        className="bg-gray-200 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50 flex items-center space-x-2 font-medium"
                      >
                        <X className="h-5 w-5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <User className="h-6 w-6 text-blue-500" />
                    <h3 className="text-xl font-semibold text-gray-900">Profile Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Personal Information</h4>
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <label className="text-sm font-medium text-gray-500">Username</label>
                          <div className="text-lg text-gray-900 mt-1">{profileData.username}</div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <label className="text-sm font-medium text-gray-500">Email</label>
                          <div className="text-lg text-gray-900 mt-1">{profileData.email}</div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <label className="text-sm font-medium text-gray-500">Member Since</label>
                          <div className="text-lg text-gray-900 mt-1">{formatDate(profileData.createdAt)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Account Status</h4>
                      <div className="space-y-4">
                        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                          <label className="text-sm font-medium text-gray-500">Status</label>
                          <div className="text-lg text-green-700 font-semibold mt-1 flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            Active
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <label className="text-sm font-medium text-gray-500">Last Activity</label>
                          <div className="text-lg text-gray-900 mt-1">{formatDate(profileData.lastLogin || profileData.updatedAt)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-8">
              <div className="flex items-center space-x-3 mb-6">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <h3 className="text-xl font-semibold text-gray-900">Your Cooking Journey</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center border border-blue-200">
                  <ChefHat className="h-10 w-10 text-blue-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-blue-600">{stats?.totalRecipes || 0}</div>
                  <div className="text-sm text-blue-700 font-medium">Total Recipes</div>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 text-center border border-red-200">
                  <Heart className="h-10 w-10 text-red-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-red-600">{stats?.favorites || 0}</div>
                  <div className="text-sm text-red-700 font-medium">Favorites</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center border border-green-200">
                  <TrendingUp className="h-10 w-10 text-green-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-green-600">{stats?.thisWeek || 0}</div>
                  <div className="text-sm text-green-700 font-medium">This Week</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center border border-purple-200">
                  <Clock className="h-10 w-10 text-purple-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-purple-600">{stats?.totalCookTime || '0h'}</div>
                  <div className="text-sm text-purple-700 font-medium">Cook Time</div>
                </div>
              </div>

              {/* Enhanced Achievements */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-yellow-500" />
                  Achievements
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                    <Trophy className="h-8 w-8 text-yellow-500 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-yellow-800">First Recipe</div>
                      <div className="text-sm text-yellow-600">Generated your first AI recipe</div>
                    </div>
                  </div>
                  
                  {(stats?.totalRecipes >= 10) && (
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                      <Sparkles className="h-8 w-8 text-green-500 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-green-800">Recipe Collector</div>
                        <div className="text-sm text-green-600">Created 10+ recipes</div>
                      </div>
                    </div>
                  )}
                  
                  {(stats?.favorites >= 5) && (
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
                      <Heart className="h-8 w-8 text-red-500 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-red-800">Recipe Lover</div>
                        <div className="text-sm text-red-600">Favorited 5+ recipes</div>
                      </div>
                    </div>
                  )}
                  
                  {(stats?.totalRecipes >= 25) && (
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                      <ChefHat className="h-8 w-8 text-purple-500 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-purple-800">Master Chef</div>
                        <div className="text-sm text-purple-600">Created 25+ recipes</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-8">
              <div className="flex items-center space-x-3 mb-6">
                <Lock className="h-6 w-6 text-green-500" />
                <h3 className="text-xl font-semibold text-gray-900">Security Settings</h3>
              </div>
              
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <h4 className="text-lg font-semibold text-green-800 mb-4">Change Password</h4>
                <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        {...registerPassword('currentPassword')}
                        type={showPasswords.current ? 'text' : 'password'}
                        className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                          passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="mt-2 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        {...registerPassword('newPassword')}
                        type={showPasswords.new ? 'text' : 'password'}
                        className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                          passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="mt-2 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        {...registerPassword('confirmPassword')}
                        type={showPasswords.confirm ? 'text' : 'password'}
                        className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                          passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="bg-green-500 text-white px-8 py-3 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center space-x-2 font-medium"
                  >
                    {isChangingPassword ? (
                      <>
                        <LoadingSpinner size="small" />
                        <span>Changing Password...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5" />
                        <span>Change Password</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Account Deletion Tab */}
          {activeTab === 'danger' && (
            <div className="space-y-8">
              <div className="flex items-center space-x-3 mb-6">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <h3 className="text-xl font-semibold text-gray-900">Danger Zone</h3>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  <h4 className="font-semibold text-red-800">Account Deletion</h4>
                </div>
                <div className="text-sm text-red-600 mb-4">
                  These actions are irreversible. Please proceed with extreme caution.
                </div>
              </div>

              {/* Delete Account */}
              <div className="border border-red-300 rounded-xl p-8 bg-red-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 mb-2 text-lg">Delete Account</h4>
                    <div className="text-sm text-red-600 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </div>
                    <div className="text-sm text-red-500 bg-red-100 rounded-lg p-4">
                      <div className="font-medium mb-2">⚠️ This will permanently delete:</div>
                      <ul className="list-disc list-inside space-y-1">
                        <li>All your recipes and collections</li>
                        <li>Profile information and preferences</li>
                        <li>Account login credentials</li>
                        <li>All associated data</li>
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isDeletingAccount}
                    className="ml-6 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50 flex-shrink-0 font-medium"
                  >
                    <UserX className="h-5 w-5" />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Account Deletion Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDeleteDialog(false)} />

            <div className="inline-block w-full max-w-md p-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Delete Account</h3>
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-semibold text-red-800">
                      This action cannot be undone
                    </span>
                  </div>
                  <div className="text-sm text-red-600">
                    All your data will be permanently deleted from our servers.
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  To confirm deletion, please enter your password:
                </div>
                
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-3 border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter your password"
                  disabled={isDeletingAccount}
                />

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => setShowDeleteDialog(false)}
                    disabled={isDeletingAccount}
                    className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount || !deletePassword}
                    className="flex-1 px-6 py-3 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isDeletingAccount ? (
                      <>
                        <LoadingSpinner size="small" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <span>Delete Account</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile

/*
 * CORS ISSUE RESOLUTION SUMMARY:
 * 
 * The frontend now attempts to fetch profile images through an API endpoint first,
 * which bypasses CORS restrictions. If that fails, it falls back to direct URLs.
 * 
 * TO COMPLETELY RESOLVE THE CORS ISSUE, choose ONE of these backend solutions:
 * 
 * OPTION 1: Add the profile image API route (recommended)
 * - See the comment at the top of this file for the exact code
 * 
 * OPTION 2: Configure CORS for uploads folder
 * - Add this to your backend server setup:
 *   app.use('/uploads', cors({ 
 *     origin: 'http://localhost:5173', 
 *     credentials: true 
 *   }), express.static('uploads'));
 * 
 * OPTION 3: Global CORS configuration
 * - Configure your backend CORS to allow localhost:5173
 *   app.use(cors({ 
 *     origin: ['http://localhost:5173', 'http://localhost:3000'], 
 *     credentials: true 
 *   }));
 * 
 * The frontend will work with any of these backend solutions.
 */