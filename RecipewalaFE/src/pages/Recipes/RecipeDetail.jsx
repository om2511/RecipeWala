import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  ChefHat, 
  Heart, 
  Share2,
  Download,
  Edit,
  Trash2,
  Printer,
  Star,
  BookOpen
} from 'lucide-react'
import { getRecipeById, deleteRecipe } from '../../features/recipes/recipeSlice'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
import toast from 'react-hot-toast'

const RecipeDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentRecipe: recipe, isLoading } = useSelector(state => state.recipes)
  const [activeTab, setActiveTab] = useState('ingredients')
  const [servings, setServings] = useState(4)

  // Fetch recipe details from Redux
  useEffect(() => {
    if (id) {
      dispatch(getRecipeById(id)).then((action) => {
        if (action.error) {
          toast.error('Failed to load recipe')
          navigate('/recipes')
        }
      })
    }
    // eslint-disable-next-line
  }, [id, dispatch, navigate])

  // Reset servings when recipe changes
  useEffect(() => {
    if (recipe && recipe.servings) {
      setServings(Number(recipe.servings)) // Convert to number
    }
  }, [recipe])

  const handleServingsChange = (newServings) => {
    setServings(Math.max(1, Number(newServings))) // Ensure it's a number
  }

  const handleDeleteRecipe = async () => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await dispatch(deleteRecipe(id)).unwrap()
        toast.success('Recipe deleted successfully')
        navigate('/recipes')
      } catch (error) {
        toast.error('Failed to delete recipe')
      }
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.description,
          url: window.location.href
        })
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast.success('Recipe link copied to clipboard!')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const calculateIngredients = (ingredients, originalServings, newServings) => {
    if (!ingredients || !Array.isArray(ingredients)) {
      console.warn('Invalid ingredients data:', ingredients)
      return []
    }

    const ratio = newServings / originalServings

    return ingredients.map((ingredient, index) => {
      // Debug log each ingredient
      console.log(`Processing ingredient ${index}:`, ingredient)

      // Handle null or undefined ingredients
      if (!ingredient) {
        return 'Invalid ingredient'
      }

      // If ingredient is a string
      if (typeof ingredient === 'string') {
        // Handle empty strings
        if (!ingredient.trim()) {
          return 'Empty ingredient'
        }

        // Find numbers in the string and scale them, keep as strings
        const numbers = ingredient.match(/\d+\.?\d*/g)
        if (numbers && numbers.length > 0) {
          let scaledIngredient = ingredient
          numbers.forEach(num => {
            const originalNum = parseFloat(num)
            // Scale but keep as string (no integer conversion)
            const scaledNum = String(originalNum * ratio)
            scaledIngredient = scaledIngredient.replace(new RegExp(num, 'g'), scaledNum)
          })
          return scaledIngredient
        }
        // Return as-is if no numbers found
        return ingredient
      }

      // If ingredient is an object
      if (typeof ingredient === 'object' && ingredient !== null) {
        // Handle different possible object structures
        let amount = ingredient.quantity || ingredient.amount || ingredient.qty || ''
        let name = ingredient.name || ingredient.ingredient || ingredient.item || ''

        // If it's a nested object, try to extract meaningful data
        if (!name && !amount) {
          // Try to find any text properties
          const textProps = Object.values(ingredient).filter(val => 
            typeof val === 'string' && val.trim().length > 0
          )
          if (textProps.length > 0) {
            return textProps.join(' ')
          }
          return JSON.stringify(ingredient)
        }

        // Scale the amount string (if it contains numbers) but keep the full string format
        let scaledAmount = amount
        if (amount && typeof amount === 'string') {
          const numbers = amount.match(/\d+\.?\d*/g)
          if (numbers && numbers.length > 0) {
            scaledAmount = amount
            numbers.forEach(num => {
              const originalNum = parseFloat(num)
              const scaledNum = String(originalNum * ratio)
              scaledAmount = scaledAmount.replace(new RegExp(num, 'g'), scaledNum)
            })
          }
        } else if (amount && !isNaN(parseFloat(amount))) {
          // If amount is just a number, scale it
          scaledAmount = String(parseFloat(amount) * ratio)
        }

        // Convert to strings
        const amountStr = scaledAmount ? String(scaledAmount) : ''
        const nameStr = name ? String(name) : ''

        // Build ingredient string - amount (with its units) and name
        const parts = [amountStr, nameStr].filter(part => 
          part && part.trim().length > 0
        )
        
        return parts.join(' ').trim() || 'Invalid ingredient format'
      }

      // Handle arrays (in case ingredients are nested)
      if (Array.isArray(ingredient)) {
        return ingredient.join(' ')
      }

      // Fallback for other types
      return String(ingredient) || 'Unknown ingredient'
    })
  }

  const tabs = [
    { id: 'ingredients', label: 'Ingredients', icon: BookOpen },
    { id: 'instructions', label: 'Instructions', icon: ChefHat },
    { id: 'nutrition', label: 'Nutrition', icon: null },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner size="large" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading recipe...</p>
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Recipe not found</h2>
        <p className="text-gray-600 mb-4">The recipe you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/recipes')}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          Back to Recipes
        </button>
      </div>
    )
  }

  // Debug log the raw ingredients data
  console.log('Raw recipe ingredients:', recipe.ingredients)
  console.log('Recipe servings:', recipe.servings)

  const scaledIngredients = recipe.ingredients ? 
    calculateIngredients(recipe.ingredients, recipe.servings || 4, servings) : 
    []

  // Debug log the processed ingredients
  console.log('Processed ingredients:', scaledIngredients)

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 sm:space-y-6 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate('/recipes')}
          className="inline-flex items-center gap-2 self-start text-sm text-gray-600 transition-colors hover:text-gray-900 sm:text-base"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Recipes</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleShare}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 transition-colors hover:bg-gray-50"
          >
            <Share2 className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={handlePrint}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 transition-colors hover:bg-gray-50 no-print"
          >
            <Printer className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => navigate(`/recipes/${id}/edit`)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 transition-colors hover:bg-gray-50 no-print"
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={handleDeleteRecipe}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-300 text-red-600 transition-colors hover:bg-red-50 no-print"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Recipe Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-4 text-white sm:p-6">
          <h1 className="mb-2 text-2xl font-bold leading-tight sm:text-3xl">{recipe.title}</h1>
          <p className="mb-4 text-sm leading-relaxed text-orange-100 sm:text-base">{recipe.description}</p>
          
          {/* Recipe Meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:gap-x-6">
            <div className="flex items-center gap-1">
              <Clock className="h-5 w-5" />
              <span>{recipe.cookTime || '30 mins'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-5 w-5" />
              <span>{recipe.servings || 4} servings</span>
            </div>
            <div className="flex items-center gap-1">
              <ChefHat className="h-5 w-5" />
              <span className="capitalize">{recipe.difficulty || 'Medium'}</span>
            </div>
            {recipe.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-current" />
                <span>{recipe.rating}/5</span>
              </div>
            )}
          </div>
        </div>

        {/* Servings Adjuster */}
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium text-gray-900 sm:text-base">Adjust Servings:</span>
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <button
                onClick={() => handleServingsChange(Number(servings) - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white transition-colors hover:bg-orange-600"
              >
                -
              </button>
              <span className="w-8 text-center text-base font-semibold sm:text-lg">{servings}</span>
              <button
                onClick={() => handleServingsChange(Number(servings) + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white transition-colors hover:bg-orange-600"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Recipe Content Tabs */}
        <div className="border-b border-gray-200">
          <div className="grid grid-cols-3 gap-1 p-2 sm:flex sm:gap-0 sm:p-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-colors sm:rounded-none sm:px-6 sm:py-3 sm:text-base sm:border-b-2 ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon && <tab.icon className="h-4 w-4" />}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'ingredients' && (
            <div>
              <h3 className="mb-4 text-base font-semibold text-gray-900 sm:text-lg">
                Ingredients {servings !== (recipe.servings || 4) && `(scaled for ${servings} servings)`}
              </h3>
              
              {/* Debug information - remove this in production */}
              {/* {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-sm">
                  <strong>Debug Info:</strong>
                  <br />Raw ingredients: {JSON.stringify(recipe.ingredients)}
                  <br />Processed count: {scaledIngredients.length}
                </div>
              )} */}

              {scaledIngredients.length > 0 ? (
                <ul className="space-y-3">
                  {scaledIngredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-sm leading-relaxed text-gray-700 sm:text-base">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No ingredients available</p>
              )}
            </div>
          )}

          {activeTab === 'instructions' && (
            <div>
              <h3 className="mb-4 text-base font-semibold text-gray-900 sm:text-lg">Instructions</h3>
              <ol className="space-y-4">
                {Array.isArray(recipe.instructions) && recipe.instructions.length > 0 ? (
                  recipe.instructions.map((step, index) => {
                    let text = ''
                    if (typeof step === 'string') text = step
                    else if (typeof step === 'object' && step !== null) text = step.instruction || step.step || JSON.stringify(step)
                    return (
                      <li key={index} className="flex gap-3 sm:gap-4">
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-medium text-white">
                          {index + 1}
                        </span>
                        <p className="pt-1 text-sm leading-relaxed text-gray-700 sm:text-base">{text}</p>
                      </li>
                    )
                  })
                ) : (
                  <li className="text-gray-500">No instructions available</li>
                )}
              </ol>
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div>
              <h3 className="mb-4 text-base font-semibold text-gray-900 sm:text-lg">
                Nutritional Information {servings !== (recipe.servings || 4) && `(per serving, scaled)`}
              </h3>
              {recipe.nutrition && typeof recipe.nutrition === 'object' ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                  {Object.entries(recipe.nutrition)
                    .filter(([key, _]) => key.toLowerCase() !== 'id' && key.toLowerCase() !== '_id')
                    .map(([key, value]) => {
                      // If value is an object or array, skip or stringify
                      let displayValue = value
                      if (typeof value === 'object' && value !== null) {
                        displayValue = JSON.stringify(value)
                      } else if (typeof value === 'number' && servings !== (recipe.servings || 4)) {
                        displayValue = Math.round(value * servings / (recipe.servings || 4))
                      }
                      return (
                        <div key={key} className="rounded-lg bg-gray-50 p-3 text-center sm:p-4">
                          <p className="text-lg font-bold text-gray-900 sm:text-2xl">{displayValue}</p>
                          <p className="text-xs capitalize text-gray-600 sm:text-sm">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <p className="text-gray-500">Nutritional information not available</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recipe Notes */}
      {recipe.notes && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">Chef's Notes</p>
              <div className="mt-1 text-sm text-yellow-700">
                {recipe.notes}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecipeDetail