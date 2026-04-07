import { useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { 
  ChefHat, 
  Sparkles, 
  Clock, 
  Users, 
  RefreshCw,
  Save,
  Eye,
  Loader2,
  Lightbulb,
  Settings,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Zap,
  ChevronDown
} from 'lucide-react'
import { generateRecipe, clearError, clearCurrentRecipe } from '../../features/recipes/recipeSlice'
import { recipeService } from '../../services/recipeService'
import toast from 'react-hot-toast'
import logoImg from '../../assets/images/logo.png'

// Enhanced validation schema
const recipeSchema = yup.object({
  recipeName: yup
    .string()
    .required('Recipe name is required')
    .min(3, 'Recipe name must be at least 3 characters')
    .max(100, 'Recipe name must be less than 100 characters')
    .matches(/^[a-zA-Z0-9\s\-'.,&()]+$/, 'Recipe name contains invalid characters'),
  cuisine: yup.string().optional(),
  dietaryRestrictions: yup.array().optional(),
  servings: yup.number().min(1, 'Minimum 1 serving').max(20, 'Maximum 20 servings').optional(),
  cookingTime: yup.string().optional(),
  difficulty: yup.string().optional(),
  ingredients: yup.string().optional(),
  instructions: yup.string().max(500, 'Instructions must be less than 500 characters').optional(),
})

const RecipeGenerator = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { currentRecipe, isGenerating, error } = useSelector((state) => state.recipes)
  
  // Component state
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [generationStage, setGenerationStage] = useState('')
  const [imageStatus, setImageStatus] = useState(null)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [startTime, setStartTime] = useState(null)

  // Add debug logging
  console.log('RecipeGenerator - Redux State:', {
    currentRecipe,
    isGenerating,
    error,
    showSuccess,
    imageStatus
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm({
    resolver: yupResolver(recipeSchema),
    defaultValues: {
      servings: 4,
      difficulty: 'medium',
      cookingTime: '30-60 minutes',
      dietaryRestrictions: []
    }
  })

  const watchedRecipeName = watch('recipeName')

  // Timer for tracking generation time
  useEffect(() => {
    let interval = null
    if (isGenerating && startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        setTimeElapsed(elapsed)
        
        // Update generation stage based on time
        if (elapsed < 5) {
          setGenerationStage('Analyzing your request...')
        } else if (elapsed < 15) {
          setGenerationStage('Generating recipe with AI...')
        } else if (elapsed < 30) {
          setGenerationStage('Creating perfect ingredients list...')
        } else if (elapsed < 45) {
          setGenerationStage('Writing detailed instructions...')
        } else {
          setGenerationStage('Finalizing your recipe...')
        }
      }, 1000)
    } else {
      setTimeElapsed(0)
      setGenerationStage('')
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isGenerating, startTime])

  // Clear errors when component mounts
  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  // Enhanced error handling
  useEffect(() => {
    if (error) {
      let errorMessage = error
      let duration = 5000
      let icon = '❌'
      
      if (error.includes('timeout')) {
        errorMessage = 'Generation took longer than expected. Try a simpler recipe name.'
        icon = '⏰'
        duration = 6000
      } else if (error.includes('rate limit') || error.includes('Too many')) {
        errorMessage = 'Please wait a moment before generating another recipe.'
        icon = '🚫'
        duration = 4000
      } else if (error.includes('already exists')) {
        errorMessage = 'You already have a recipe with this name. Try a different name.'
        icon = '📝'
        duration = 4000
      } else if (error.includes('service unavailable') || error.includes('502')) {
        errorMessage = 'Recipe service is temporarily unavailable. Please try again.'
        icon = '🔧'
        duration = 5000
      }
      
      toast.error(errorMessage, { duration, icon })
      setShowSuccess(false)
      setStartTime(null)
    }
  }, [error])

  // Success state management with image status tracking
  useEffect(() => {
    console.log('Success effect - checking conditions:', {
      currentRecipe: !!currentRecipe,
      isGenerating,
      error: !!error,
      recipeId: currentRecipe?.id || currentRecipe?._id,
      recipeName: currentRecipe?.name || currentRecipe?.title
    })
    
    if (currentRecipe && !isGenerating && !error) {
      console.log('✅ Setting showSuccess to true')
      setShowSuccess(true)
      setStartTime(null)
      
      // Start checking image status if recipe has ID
      const recipeId = currentRecipe.id || currentRecipe._id
      if (recipeId) {
        checkImageStatus(recipeId)
      }
      
      // Auto-scroll to success section
      setTimeout(() => {
        const element = document.getElementById('recipe-success')
        console.log('Scrolling to element:', element)
        element?.scrollIntoView({ 
          behavior: 'smooth' 
        })
      }, 100)
    } else {
      console.log('❌ Not showing success - conditions not met')
    }
  }, [currentRecipe, isGenerating, error])

  // Check image generation status
  const checkImageStatus = useCallback(async (recipeId) => {
    try {
      const response = await recipeService.getImageGenerationStatus(recipeId)
      setImageStatus(response.data)
      
      // If image is still generating, check again in 5 seconds
      if (response.data.imageGenerationInProgress) {
        setTimeout(() => checkImageStatus(recipeId), 5000)
      }
    } catch (error) {
      console.error('Failed to check image status:', error)
    }
  }, [])

  // Enhanced form submission with better error handling
  const onSubmit = async (data) => {
    try {
      console.log('📝 Submitting recipe generation:', data)
      
      // Validate recipe name doesn't exist
      if (!data.recipeName || data.recipeName.trim().length < 3) {
        toast.error('Please enter a valid recipe name (at least 3 characters)')
        return
      }

      // Reset states
      setShowSuccess(false)
      setImageStatus(null)
      setStartTime(Date.now())
      dispatch(clearError())
      
      // Show loading toast with progress
      const loadingToast = toast.loading('Starting recipe generation...', {
        duration: 10000
      })

      // Generate recipe with extended timeout handling
      const result = await dispatch(generateRecipe(data)).unwrap()
      
      console.log('✅ Recipe generation result:', result)
      
      // Dismiss loading toast
      toast.dismiss(loadingToast)
      
      // Show success toast
      toast.success('Recipe generated successfully! 🎉', {
        duration: 3000,
        icon: '✨'
      })

    } catch (err) {
      console.error('❌ Recipe generation failed:', err)
      setShowSuccess(false)
      setStartTime(null)
      
      // Error is handled by useEffect above
    }
  }

  const handleRegenerateRecipe = async () => {
    const formData = {
      recipeName: watchedRecipeName + ' (regenerated)',
      // Include other form values
      cuisine: watch('cuisine'),
      dietaryRestrictions: watch('dietaryRestrictions'),
      servings: watch('servings'),
      cookingTime: watch('cookingTime'),
      difficulty: watch('difficulty'),
      instructions: watch('instructions')
    }
    
    setShowSuccess(false)
    await onSubmit(formData)
  }

  const handleViewRecipe = () => {
    if (currentRecipe && (currentRecipe.id || currentRecipe._id)) {
      navigate(`/recipes/${currentRecipe.id || currentRecipe._id}`)
    }
  }

  const handleGenerateAnother = () => {
    setShowSuccess(false)
    setImageStatus(null)
    dispatch(clearCurrentRecipe())
    reset()
    // Scroll back to the form
    setTimeout(() => {
      document.getElementById('recipe-form')?.scrollIntoView({ 
        behavior: 'smooth' 
      })
    }, 100)
  }

  const handleRetryImageGeneration = async () => {
    if (!currentRecipe || !currentRecipe.id) return
    
    try {
      toast.loading('Retrying image generation...', { duration: 3000 })
      await recipeService.retryImageGeneration(currentRecipe.id)
      checkImageStatus(currentRecipe.id)
      toast.success('Image generation retry started!')
    } catch (error) {
      toast.error('Failed to retry image generation')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Enhanced options and suggestions
  const cuisineOptions = [
    'Italian', 'Chinese', 'Indian', 'Mexican', 'Thai', 'French', 
    'Japanese', 'Mediterranean', 'American', 'Middle Eastern',
    'Korean', 'Vietnamese', 'Greek', 'Spanish', 'Moroccan'
  ]

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 
    'Keto', 'Paleo', 'Low-Carb', 'High-Protein', 'Low-Sodium'
  ]

  const difficultyOptions = [
    { value: 'easy', label: 'Easy (15-30 min)' },
    { value: 'medium', label: 'Medium (30-60 min)' },
    { value: 'hard', label: 'Hard (60+ min)' }
  ]

  const timeOptions = [
    '15-30 minutes',
    '30-60 minutes',
    '1-2 hours',
    '2+ hours'
  ]

  const quickSuggestions = [
    'Palak Paneer',
    'Chicken Biryani',
    'Pani Puri',
    'Dhokla',
    'Butter Chicken',
    'Masala Dosa',
    'Veg Thali',
    'Rajma Chawal',
    'Chole Bhature'
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6 px-1 sm:px-0">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-4 sm:p-6 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative">
          <div className="mb-3 items-center flex gap-3 flex-row sm:items-center sm:space-x-3">
            <div className="rounded-lg bg-white bg-opacity-20 p-2">
              <Sparkles className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">AI Recipe Generator</h1>
              <p className="text-sm text-orange-100">Powered by advanced AI technology</p>
            </div>
          </div>
          <p className="text-sm leading-6 text-orange-100 sm:text-lg sm:leading-7">
            Describe your ideal dish and let our AI chef create a perfect recipe with beautiful images!
          </p>
        </div>
      </div>

      {/* Recipe Generation Form */}
      <div id="recipe-form" className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
          {/* Main Recipe Input with Enhanced UI */}
          <div>
            <label htmlFor="recipeName" className="mb-2 block text-base font-semibold text-gray-900 sm:text-lg">
              What would you like to cook? ✨
            </label>
            <div className="relative">
              <ChefHat className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 sm:top-4" />
              <input
                {...register('recipeName')}
                type="text"
                id="recipeName"
                className={`w-full rounded-lg border py-3 pl-12 pr-12 text-base transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent sm:text-lg ${
                  errors.recipeName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Spicy Chicken Curry, Chocolate Lava Cake, Healthy Quinoa Salad..."
                disabled={isGenerating}
                maxLength={100}
              />
              <div className="absolute right-3 top-3.5 text-xs text-gray-400 sm:top-4">
                {watchedRecipeName?.length || 0}/100
              </div>
            </div>
            {errors.recipeName && (
              <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.recipeName.message}</span>
              </p>
            )}
            
            {/* Enhanced Quick Suggestions */}
            <div className="mt-4">
              <p className="mb-3 flex items-center space-x-1 text-sm text-gray-600">
                <Zap className="h-4 w-4" />
                <span>Popular suggestions:</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {quickSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setValue('recipeName', suggestion)}
                    className="rounded-full border border-orange-200 bg-gradient-to-r from-orange-100 to-yellow-100 px-3 py-2 text-sm text-orange-700 transition-all hover:from-orange-200 hover:to-yellow-200 sm:hover:scale-105"
                    disabled={isGenerating}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 text-sm font-medium text-orange-600 transition-colors hover:text-orange-700 sm:text-base"
              disabled={isGenerating}
            >
              <Settings className="h-4 w-4" />
              <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Enhanced Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Cuisine Type */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    🌍 Cuisine Type
                  </label>
                  <select
                    {...register('cuisine')}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={isGenerating}
                  >
                    <option value="">Any cuisine</option>
                    {cuisineOptions.map((cuisine) => (
                      <option key={cuisine} value={cuisine.toLowerCase()}>
                        {cuisine}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Servings */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    <Users className="inline h-4 w-4 mr-1" />
                    Servings
                  </label>
                  <input
                    {...register('servings')}
                    type="number"
                    min="1"
                    max="20"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={isGenerating}
                  />
                  {errors.servings && (
                    <p className="mt-1 text-xs text-red-600">{errors.servings.message}</p>
                  )}
                </div>

                {/* Cooking Time */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Cooking Time
                  </label>
                  <select
                    {...register('cookingTime')}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={isGenerating}
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    🎯 Difficulty Level
                  </label>
                  <select
                    {...register('difficulty')}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={isGenerating}
                  >
                    {difficultyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dietary Restrictions */}
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">
                  🥗 Dietary Restrictions
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {dietaryOptions.map((option) => (
                    <label key={option} className="flex cursor-pointer items-center space-x-2 rounded-lg border border-gray-200 p-2 hover:bg-gray-50">
                      <input
                        {...register('dietaryRestrictions')}
                        type="checkbox"
                        value={option.toLowerCase()}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        disabled={isGenerating}
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  📝 Special Instructions (Optional)
                </label>
                <textarea
                  {...register('instructions')}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Make it extra spicy, use only organic ingredients, avoid nuts, make it kid-friendly..."
                  disabled={isGenerating}
                  maxLength={500}
                />
                <div className="flex justify-between mt-1">
                  {errors.instructions && (
                    <p className="text-xs text-red-600">{errors.instructions.message}</p>
                  )}
                  <p className="text-xs text-gray-400 ml-auto">
                    {watch('instructions')?.length || 0}/500
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Generate Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isGenerating || !watchedRecipeName?.trim() || watchedRecipeName?.trim().length < 3}
              className="inline-flex w-full items-center justify-center space-x-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:from-orange-600 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none sm:w-auto sm:px-10 sm:text-lg sm:hover:scale-105"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin sm:h-6 sm:w-6" />
                  <span>Generating Recipe...</span>
                  {timeElapsed > 0 && (
                    <span className="text-orange-200">({formatTime(timeElapsed)})</span>
                  )}
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Generate Recipe</span>
                  <span className="text-orange-200">✨</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Enhanced Loading State */}
      {isGenerating && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-semibold sm:text-lg">Creating Your Recipe...</h3>
              <div className="flex items-center space-x-2 text-blue-200">
                <Clock className="h-4 w-4" />
                <span>{formatTime(timeElapsed)}</span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 mb-4 sm:h-20 sm:w-20">
                <img src={logoImg} alt="RecipeWala Logo" className="h-10 w-10 rounded-xl bg-white object-contain shadow-lg sm:h-12 sm:w-12" />
              </div>
              <p className="mb-4 text-sm text-gray-600 sm:text-base">
                Our AI chef is working on something delicious for you!
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-right text-xs text-gray-500 sm:text-sm">{generationStage}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${Math.min((timeElapsed / 60) * 100, 90)}%` 
                  }}
                ></div>
              </div>
              
              <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>This usually takes 30-60 seconds</span>
              </div>
              
              {timeElapsed > 45 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <p className="text-sm text-amber-700">
                      Taking a bit longer than usual. We're generating a detailed recipe with perfect images!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Success State with Image Status */}
      {showSuccess && currentRecipe && !isGenerating && (currentRecipe.id || currentRecipe._id) && (
        <div id="recipe-success" className="mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white sm:p-6">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8" />
              <h2 className="text-lg font-bold leading-tight sm:text-2xl">Recipe Generated Successfully! 🎉</h2>
            </div>
            <p className="text-sm leading-relaxed text-green-100 sm:text-base">
              Your delicious recipe for "{currentRecipe.title || currentRecipe.name}" is ready!
            </p>
          </div>

          {/* Recipe Preview */}
          <div className="p-4 sm:p-6">
            <div className="mb-6 rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6">
              <h3 className="mb-2 text-base font-semibold leading-snug text-gray-900 sm:text-xl">
                {currentRecipe.title || currentRecipe.name}
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-gray-600 sm:text-base">
                {currentRecipe.description || 'A delicious AI-generated recipe just for you!'}
              </p>
              
              {/* Quick Recipe Info */}
              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 sm:gap-x-6 sm:text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{currentRecipe.cookTime || currentRecipe.prepTime || '30 mins'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{currentRecipe.servings || 4} servings</span>
                </div>
                <div className="flex items-center gap-1">
                  <ChefHat className="h-4 w-4" />
                  <span className="capitalize">{currentRecipe.difficulty || 'Medium'}</span>
                </div>
              </div>

              {/* Image Status */}
              {imageStatus && (
                <div className="border-t pt-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm leading-6">
                    <ImageIcon className="h-4 w-4" />
                    <span className="font-medium">Image Status:</span>
                    {imageStatus.imageGenerationInProgress && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Generating...</span>
                      </span>
                    )}
                    {imageStatus.imageGenerated && (
                      <span className="text-green-600">✅ Ready</span>
                    )}
                    {imageStatus.imageGenerationFailed && (
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="h-3 w-3" />
                        <span>Failed</span>
                        <button
                          onClick={handleRetryImageGeneration}
                          className="text-blue-600 hover:text-blue-700 underline ml-2"
                        >
                          Retry
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button
                onClick={handleViewRecipe}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 text-sm font-medium text-white transition-all hover:from-orange-600 hover:to-red-600 sm:px-6 sm:text-base sm:hover:scale-105"
              >
                <Eye className="h-5 w-5" />
                <span>View Full Recipe</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              
              <button
                onClick={handleRegenerateRecipe}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-500 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-gray-600 sm:px-6 sm:text-base sm:hover:scale-105"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Regenerate</span>
              </button>
              
              <button
                onClick={handleGenerateAnother}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-blue-600 sm:px-6 sm:text-base sm:hover:scale-105"
              >
                <Sparkles className="h-5 w-5" />
                <span>Generate Another</span>
              </button>
            </div>

            {/* Enhanced Additional Info */}
            <div className="mt-6 space-y-3">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm leading-relaxed text-blue-700">
                      <strong>Pro Tip:</strong> Your recipe has been saved automatically. 
                      {imageStatus?.imageGenerationInProgress && ' An AI image is being generated and will appear shortly!'}
                    </p>
                  </div>
                </div>
              </div>

              {timeElapsed > 0 && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-sm leading-relaxed text-green-700">
                    ⚡ Generated in {formatTime(timeElapsed)} - That's fast cooking! 
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Tips Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h3 className="mb-4 flex items-center space-x-2 text-lg font-semibold text-gray-800">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <span>Tips for amazing results</span>
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Be Specific:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• "Thai Green Curry with Chicken" vs "curry"</li>
              <li>• "Chocolate Lava Cake" vs "cake"</li>
              <li>• "Mediterranean Quinoa Salad" vs "salad"</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Include Details:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Cooking method: "baked", "grilled", "fried"</li>
              <li>• Flavor profile: "spicy", "sweet", "tangy"</li>
              <li>• Special ingredients: "with coconut", "garlic-free"</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3">
          <p className="text-sm text-orange-700">
            <strong>⏱️ Generation Time:</strong> Most recipes are ready in 30-60 seconds. Complex recipes with special requirements may take up to 2 minutes.
          </p>
        </div>
      </div>
    </div>
  )
}

export default RecipeGenerator