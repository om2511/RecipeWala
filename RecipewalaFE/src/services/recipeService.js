// RecipewallaFE/src/services/recipeService.js - Optimized for immediate response

import api from './api'

export const recipeService = {
  async getUserRecipes(params = {}) {
    try {
      if (params.search?.trim()) {
        const response = await this.searchRecipes(params.search.trim())
        const recipes = response.data?.recipes || response.data?.data?.recipes || []

        return {
          ...response,
          data: {
            ...response.data,
            recipes,
            pagination: response.data?.pagination || {
              current: 1,
              pages: 1,
              total: recipes.length,
            },
          },
        }
      }

      return await this.getRecipes(params)
    } catch (error) {
      console.error('Failed to get user recipes:', error)
      throw error
    }
  },

  // Generate recipe with shorter timeout (backend now responds immediately)
  async generateRecipe(recipeData) {
    try {
      console.log('🔄 Starting recipe generation:', recipeData)
      
      // Reduced timeout since backend responds immediately (30 seconds max)
      const response = await api.post('/recipes/generate', recipeData, { 
        timeout: 30000, // 30 seconds - backend should respond in 15-30 seconds
        onUploadProgress: (progressEvent) => {
          console.log('📤 Upload progress:', progressEvent)
        },
        onDownloadProgress: (progressEvent) => {
          console.log('📥 Download progress:', progressEvent)
        }
      })
      
      console.log('✅ Recipe generation successful:', response.data)
      return response
    } catch (error) {
      console.error('❌ Recipe generation failed:', error)
      
      // Enhanced error handling with specific messages
      if (error.code === 'ECONNABORTED') {
        if (error.message.includes('timeout')) {
          throw new Error('Recipe generation is taking longer than expected. The AI service might be busy - please try again in a moment.')
        }
        throw new Error('Connection interrupted. Please check your internet connection and try again.')
      }
      
      if (error.response?.status === 408) {
        throw new Error('Server processing timeout. Please try again with a simpler recipe name.')
      }
      
      if (error.response?.status === 429) {
        throw new Error('Too many requests. Please wait 30 seconds before generating another recipe.')
      }
      
      if (error.response?.status === 400) {
        const message = error.response?.data?.message || ''
        if (message.includes('already exists')) {
          throw new Error('You already have a recipe with this name. Please choose a different name.')
        }
        if (message.includes('validation')) {
          throw new Error('Recipe data validation failed. Please check your input and try again.')
        }
        if (message.includes('characters')) {
          throw new Error('Recipe name must be between 3-200 characters long.')
        }
        throw new Error(message || 'Invalid recipe data. Please check your input.')
      }
      
      if (error.response?.status === 502) {
        throw new Error('AI service is temporarily unavailable. Please try again in a few minutes.')
      }
      
      if (error.response?.status === 503) {
        throw new Error('Recipe generation service is temporarily unavailable. Please try again later.')
      }
      
      if (error.response?.status >= 500) {
        throw new Error('Server error occurred. Our team has been notified. Please try again in a few minutes.')
      }
      
      // Network errors
      if (error.request && !error.response) {
        throw new Error('Unable to connect to the server. Please check your internet connection.')
      }
      
      // Default error message
      throw new Error(error.response?.data?.message || 'Failed to generate recipe. Please try again.')
    }
  },

  // Get recipes with normal timeout
  async getRecipes(params = {}) {
    try {
      const response = await api.get('/recipes', { 
        params,
        timeout: 15000 // 15 seconds for listing
      })
      return response
    } catch (error) {
      console.error('Failed to fetch recipes:', error)
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Loading recipes is taking longer than expected. Please try again.')
      }
      
      throw new Error(error.response?.data?.message || 'Failed to fetch recipes')
    }
  },

  async getRecipeById(id) {
    try {
      return await this.getRecipe(id)
    } catch (error) {
      console.error('Failed to get recipe by id:', error)
      throw error
    }
  },

  async saveRecipe(recipeData) {
    try {
      if (!recipeData) {
        throw new Error('Recipe data is required')
      }

      const response = await api.post('/recipes', recipeData, {
        timeout: 30000,
      })
      return response
    } catch (error) {
      console.error('Failed to save recipe:', error)
      throw new Error(error.response?.data?.message || 'Failed to save recipe')
    }
  },

  async getRecipeStats() {
    try {
      const response = await api.get('/recipes/stats', {
        timeout: 10000,
      })
      return response
    } catch (error) {
      console.error('Failed to fetch recipe stats:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch recipe stats')
    }
  },

  // Get single recipe
  async getRecipe(id) {
    try {
      if (!id) {
        throw new Error('Recipe ID is required')
      }
      
      const response = await api.get(`/recipes/${id}`, {
        timeout: 10000 // 10 seconds for single recipe
      })
      return response
    } catch (error) {
      console.error('Failed to fetch recipe:', error)
      
      if (error.response?.status === 404) {
        throw new Error('Recipe not found')
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Loading recipe is taking too long. Please try again.')
      }
      
      throw new Error(error.response?.data?.message || 'Failed to fetch recipe')
    }
  },

  // Update recipe
  async updateRecipe(id, data) {
    try {
      if (!id) {
        throw new Error('Recipe ID is required')
      }
      
      const response = await api.put(`/recipes/${id}`, data, {
        timeout: 15000
      })
      return response
    } catch (error) {
      console.error('Failed to update recipe:', error)
      
      if (error.response?.status === 404) {
        throw new Error('Recipe not found')
      }
      
      if (error.response?.status === 400) {
        throw new Error(error.response?.data?.message || 'Invalid recipe data')
      }
      
      throw new Error(error.response?.data?.message || 'Failed to update recipe')
    }
  },

  // Delete recipe
  async deleteRecipe(id) {
    try {
      if (!id) {
        throw new Error('Recipe ID is required')
      }
      
      const response = await api.delete(`/recipes/${id}`, {
        timeout: 10000
      })
      return response
    } catch (error) {
      console.error('Failed to delete recipe:', error)
      
      if (error.response?.status === 404) {
        throw new Error('Recipe not found')
      }
      
      throw new Error(error.response?.data?.message || 'Failed to delete recipe')
    }
  },

  // Toggle favorite status
  async toggleFavorite(id) {
    try {
      if (!id) {
        throw new Error('Recipe ID is required')
      }
      
      const response = await api.patch(`/recipes/${id}/favorite`, {}, {
        timeout: 5000 // Quick operation
      })
      return response
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      
      if (error.response?.status === 404) {
        throw new Error('Recipe not found')
      }
      
      throw new Error(error.response?.data?.message || 'Failed to toggle favorite')
    }
  },

  // Search recipes
  async searchRecipes(query) {
    try {
      if (!query || query.trim().length < 2) {
        throw new Error('Search query must be at least 2 characters')
      }
      
      const response = await api.get('/recipes/search', {
        params: { query: query.trim() },
        timeout: 15000
      })
      return response
    } catch (error) {
      console.error('Failed to search recipes:', error)
      throw new Error(error.response?.data?.message || 'Failed to search recipes')
    }
  },

  // ================================
  // IMAGE GENERATION ENDPOINTS
  // ================================

  // Generate recipe image (immediate response, processes in background)
  async generateRecipeImage(id) {
    try {
      if (!id) {
        throw new Error('Recipe ID is required')
      }
      
      console.log('🔄 Starting image generation for recipe:', id)
      
      const response = await api.post(`/recipes/${id}/generate-image`, {}, {
        timeout: 10000 // 10 seconds - should respond immediately
      })
      
      console.log('✅ Image generation request successful:', response.data)
      return response
    } catch (error) {
      console.error('❌ Image generation failed:', error)
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Image generation request timed out. Please try again.')
      }
      
      if (error.response?.status === 404) {
        throw new Error('Recipe not found')
      }
      
      if (error.response?.status === 400) {
        const message = error.response?.data?.message || ''
        if (message.includes('already in progress')) {
          throw new Error('Image generation is already in progress for this recipe')
        }
        throw new Error(message)
      }
      
      throw new Error(error.response?.data?.message || 'Failed to start image generation')
    }
  },

  // Retry failed image generation (immediate response)
  async retryImageGeneration(id) {
    try {
      if (!id) {
        throw new Error('Recipe ID is required')
      }
      
      console.log('🔄 Retrying image generation for recipe:', id)
      
      const response = await api.post(`/recipes/${id}/retry-image`, {}, {
        timeout: 10000 // 10 seconds - immediate response
      })
      
      console.log('✅ Image generation retry successful:', response.data)
      return response
    } catch (error) {
      console.error('❌ Image generation retry failed:', error)
      
      if (error.response?.status === 404) {
        throw new Error('Recipe not found')
      }
      
      if (error.response?.status === 400) {
        const message = error.response?.data?.message || ''
        if (message.includes('already exists')) {
          throw new Error('Image already exists for this recipe')
        }
        if (message.includes('Maximum retry')) {
          throw new Error('Maximum retry attempts reached. Please try again later.')
        }
        if (message.includes('already in progress')) {
          throw new Error('Image generation is already in progress')
        }
        throw new Error(message)
      }
      
      throw new Error(error.response?.data?.message || 'Failed to retry image generation')
    }
  },

  // Check image generation status (quick check)
  async getImageGenerationStatus(id) {
    try {
      if (!id) {
        throw new Error('Recipe ID is required')
      }
      
      const response = await api.get(`/recipes/${id}/image-status`, {
        timeout: 5000 // 5 seconds for status check
      })
      
      return response
    } catch (error) {
      console.error('Failed to get image status:', error)
      
      if (error.response?.status === 404) {
        throw new Error('Recipe not found')
      }
      
      throw new Error(error.response?.data?.message || 'Failed to get image status')
    }
  },

  // Cancel image generation
  async cancelImageGeneration(id) {
    try {
      if (!id) {
        throw new Error('Recipe ID is required')
      }
      
      const response = await api.delete(`/recipes/${id}/cancel-image`, {
        timeout: 5000
      })
      
      console.log('✅ Image generation cancelled for recipe:', id)
      return response
    } catch (error) {
      console.error('Failed to cancel image generation:', error)
      
      if (error.response?.status === 404) {
        throw new Error('Recipe not found')
      }
      
      if (error.response?.status === 400) {
        throw new Error('No image generation in progress to cancel')
      }
      
      throw new Error(error.response?.data?.message || 'Failed to cancel image generation')
    }
  },

  // ================================
  // UTILITY METHODS
  // ================================

  // Check if recipe name already exists (quick validation)
  async checkRecipeNameExists(name) {
    try {
      if (!name || name.trim().length < 3) {
        return false
      }
      
      const response = await this.searchRecipes(name.trim())
      const recipes = response.data?.recipes || []
      
      // Check for exact match
      return recipes.some(recipe => 
        recipe.name.toLowerCase().trim() === name.toLowerCase().trim()
      )
    } catch (error) {
      // If search fails, assume name doesn't exist
      console.warn('Failed to check recipe name:', error)
      return false
    }
  },

  // Get recipes with specific filters
  async getFilteredRecipes(filters = {}) {
    try {
      const params = {}
      
      if (filters.favorites) {
        params.favorites = 'true'
      }
      
      if (filters.page) {
        params.page = filters.page
      }
      
      if (filters.limit) {
        params.limit = filters.limit
      }
      
      if (filters.cuisine) {
        params.cuisine = filters.cuisine
      }
      
      if (filters.difficulty) {
        params.difficulty = filters.difficulty
      }
      
      return await this.getRecipes(params)
    } catch (error) {
      console.error('Failed to get filtered recipes:', error)
      throw error
    }
  },

  // Validate recipe data before submission
  validateRecipeData(data) {
    const errors = []
    
    if (!data.recipeName || data.recipeName.trim().length < 3) {
      errors.push('Recipe name must be at least 3 characters long')
    }
    
    if (data.recipeName && data.recipeName.trim().length > 200) {
      errors.push('Recipe name must be less than 200 characters')
    }
    
    if (data.servings && (data.servings < 1 || data.servings > 20)) {
      errors.push('Servings must be between 1 and 20')
    }
    
    if (data.instructions && data.instructions.length > 500) {
      errors.push('Special instructions must be less than 500 characters')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Format recipe data for display
  formatRecipeForDisplay(recipe) {
    return {
      id: recipe._id || recipe.id,
      name: recipe.name || recipe.title,
      description: recipe.description || 'No description available',
      prepTime: recipe.prepTime || 'N/A',
      cookTime: recipe.cookTime || 'N/A',
      totalTime: this.calculateTotalTime(recipe.prepTime, recipe.cookTime),
      servings: recipe.servings || 'N/A',
      difficulty: recipe.difficulty || 'Medium',
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      tips: recipe.tips || [],
      nutrition: recipe.nutrition || {},
      imageUrl: recipe.imageUrl,
      thumbnailUrl: recipe.thumbnailUrl,
      imageGenerated: recipe.imageGenerated || false,
      imageGenerationInProgress: recipe.imageGenerationInProgress || false,
      imageGenerationFailed: recipe.imageGenerationFailed || false,
      isFavorite: recipe.isFavorite || false,
      tags: recipe.tags || [],
      cuisine: recipe.cuisine,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt
    }
  },

  // Calculate total cooking time
  calculateTotalTime(prepTime, cookTime) {
    try {
      const prepMinutes = prepTime ? parseInt(prepTime.match(/\d+/)?.[0]) || 0 : 0
      const cookMinutes = cookTime ? parseInt(cookTime.match(/\d+/)?.[0]) || 0 : 0
      const total = prepMinutes + cookMinutes
      return total > 0 ? `${total} minutes` : 'Variable'
    } catch (error) {
      return 'Variable'
    }
  },

  // Export recipe data
  exportRecipeAsText(recipe) {
    let text = `${recipe.name}\n`
    text += `${'='.repeat(recipe.name.length)}\n\n`
    
    if (recipe.description) {
      text += `${recipe.description}\n\n`
    }
    
    text += `Prep Time: ${recipe.prepTime || 'N/A'}\n`
    text += `Cook Time: ${recipe.cookTime || 'N/A'}\n`
    text += `Servings: ${recipe.servings || 'N/A'}\n`
    text += `Difficulty: ${recipe.difficulty || 'N/A'}\n\n`
    
    text += `INGREDIENTS:\n`
    text += `------------\n`
    if (recipe.ingredients?.length > 0) {
      recipe.ingredients.forEach((ing, index) => {
        text += `${index + 1}. ${ing.amount || ''} ${ing.unit || ''} ${ing.item || ing}\n`
      })
    }
    text += '\n'
    
    text += `INSTRUCTIONS:\n`
    text += `-------------\n`
    if (recipe.instructions?.length > 0) {
      recipe.instructions.forEach((inst, index) => {
        const instruction = typeof inst === 'string' ? inst : inst.instruction || inst
        text += `${index + 1}. ${instruction}\n\n`
      })
    }
    
    if (recipe.tips?.length > 0) {
      text += `TIPS:\n`
      text += `-----\n`
      recipe.tips.forEach((tip) => {
        text += `• ${tip}\n`
      })
    }
    
    return text
  }
}