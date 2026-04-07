const express = require('express');
const recipeController = require('../controllers/recipeController');
const auth = require('../middleware/auth');
const { recipeValidation } = require('../middleware/validation');
const { recipeLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Apply authentication to all recipe routes
router.use(auth);

// Recipe generation (with enhanced validation and rate limiting)
router.post('/generate', 
    recipeLimiter, 
    recipeValidation, 
    recipeController.generateRecipe
);

// Get all recipes for authenticated user (with pagination and filtering)
router.get('/', recipeController.getUserRecipes);

// Search recipes (with text search capabilities)
router.get('/search', recipeController.searchRecipes);

// Recipe CRUD operations (MongoDB ObjectId validation)
router.get('/:id([0-9a-fA-F]{24})', recipeController.getRecipeById);
router.put('/:id([0-9a-fA-F]{24})', recipeController.updateRecipe);
router.delete('/:id([0-9a-fA-F]{24})', recipeController.deleteRecipe);

// Recipe favorite management
router.patch('/:id([0-9a-fA-F]{24})/favorite', recipeController.toggleFavorite);

// ================================
// IMAGE GENERATION ENDPOINTS
// ================================

// Manual image generation for existing recipe
router.post('/:id([0-9a-fA-F]{24})/generate-image', 
    recipeLimiter, // Rate limit image generation requests
    recipeController.generateRecipeImage
);

// Retry failed image generation
router.post('/:id([0-9a-fA-F]{24})/retry-image', 
    recipeLimiter, // Rate limit retry requests
    recipeController.retryImageGeneration
);

// Check image generation status (for real-time updates)
router.get('/:id([0-9a-fA-F]{24})/image-status', 
    recipeController.getImageGenerationStatus
);

// Cancel ongoing image generation (if needed)
router.delete('/:id([0-9a-fA-F]{24})/cancel-image', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const Recipe = require('../models/Recipe');
        const recipe = await Recipe.findOne({ _id: id, user: userId });
        
        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: 'Recipe not found'
            });
        }

        if (!recipe.imageGenerationInProgress) {
            return res.status(400).json({
                success: false,
                message: 'No image generation in progress to cancel'
            });
        }

        // Reset image generation status
        await Recipe.findByIdAndUpdate(id, {
            imageGenerationInProgress: false,
            imageGenerationFailed: true // Mark as failed since it was cancelled
        });

        const logger = require('../utils/logger');
        logger.info(`Image generation cancelled for recipe: ${id} by user: ${req.user.email}`);

        res.json({
            success: true,
            message: 'Image generation cancelled successfully',
            data: {
                recipeId: id,
                imageGenerationInProgress: false,
                cancelled: true
            }
        });

    } catch (error) {
        console.error('Cancel image generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel image generation'
        });
    }
});

// ================================
// ADMIN/MAINTENANCE ENDPOINTS
// ================================

// Clean up stuck image generations (development only)
router.post('/admin/cleanup-stuck-images', async (req, res) => {
    try {
        // Only allow in development mode for safety
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                message: 'Admin endpoints are not available in production'
            });
        }

        const Recipe = require('../models/Recipe');
        const logger = require('../utils/logger');
        
        // Find recipes stuck in generation for more than 10 minutes
        const cutoffTime = new Date(Date.now() - 10 * 60 * 1000);
        const stuckRecipes = await Recipe.find({
            imageGenerationInProgress: true,
            updatedAt: { $lt: cutoffTime }
        });

        let cleaned = 0;
        for (const recipe of stuckRecipes) {
            await Recipe.findByIdAndUpdate(recipe._id, {
                imageGenerationInProgress: false,
                imageGenerationFailed: true
            });
            cleaned++;
            logger.info(`Cleaned stuck image generation for recipe: ${recipe._id}`);
        }

        res.json({
            success: true,
            message: `Cleaned up ${cleaned} stuck image generations`,
            data: {
                cleanedCount: cleaned,
                stuckRecipeIds: stuckRecipes.map(r => r._id)
            }
        });

    } catch (error) {
        console.error('Cleanup stuck images error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup stuck image generations'
        });
    }
});

// Bulk retry failed image generations (development only)
router.post('/admin/retry-failed-images', async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                message: 'Admin endpoints are not available in production'
            });
        }

        const Recipe = require('../models/Recipe');
        const logger = require('../utils/logger');
        
        // Find recipes with failed image generation that haven't exceeded retry limit
        const retryableRecipes = await Recipe.find({
            imageGenerationFailed: true,
            imageGenerationInProgress: false,
            imageGenerationAttempts: { $lt: 3 },
            updatedAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } // 5 minutes ago
        }).limit(10); // Limit to prevent overwhelming the system

        let retried = 0;
        for (const recipe of retryableRecipes) {
            // Start async retry for each recipe
            recipeController.retryImageGeneration({ 
                params: { id: recipe._id }, 
                user: { _id: recipe.user } 
            }, {
                json: () => {}, // Mock response object
                status: () => ({ json: () => {} })
            }).catch(error => {
                logger.error(`Bulk retry failed for recipe ${recipe._id}:`, error);
            });
            
            retried++;
        }

        res.json({
            success: true,
            message: `Started retry for ${retried} failed image generations`,
            data: {
                retriedCount: retried,
                retriedRecipeIds: retryableRecipes.map(r => r._id)
            }
        });

    } catch (error) {
        console.error('Retry failed images error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retry failed image generations'
        });
    }
});

// Get image generation statistics (development only)
router.get('/admin/image-stats', async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                message: 'Admin endpoints are not available in production'
            });
        }

        const Recipe = require('../models/Recipe');
        
        const stats = await Recipe.aggregate([
            {
                $group: {
                    _id: null,
                    totalRecipes: { $sum: 1 },
                    withImages: { $sum: { $cond: ['$imageGenerated', 1, 0] } },
                    imagesFailed: { $sum: { $cond: ['$imageGenerationFailed', 1, 0] } },
                    imagesInProgress: { $sum: { $cond: ['$imageGenerationInProgress', 1, 0] } },
                    averageAttempts: { $avg: '$imageGenerationAttempts' }
                }
            }
        ]);

        const result = stats[0] || {
            totalRecipes: 0,
            withImages: 0,
            imagesFailed: 0,
            imagesInProgress: 0,
            averageAttempts: 0
        };

        result.successRate = result.totalRecipes > 0 
            ? ((result.withImages / result.totalRecipes) * 100).toFixed(2) + '%'
            : '0%';

        res.json({
            success: true,
            message: 'Image generation statistics retrieved',
            data: result
        });

    } catch (error) {
        console.error('Get image stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get image statistics'
        });
    }
});

// ================================
// ERROR HANDLING MIDDLEWARE
// ================================

// Handle invalid ObjectId format only for routes that look like recipe IDs
router.use('/:id([0-9a-fA-F]{24})', (req, res, next) => {
    const { id } = req.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid recipe ID format'
        });
    }
    next();
});

// Handle 404 for undefined recipe routes
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Recipe endpoint not found'
    });
});

module.exports = router;