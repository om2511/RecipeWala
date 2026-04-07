const Recipe = require('../models/Recipe');
const geminiConfig = require('../config/gemini');
const logger = require('../utils/logger');
const { responseHandler } = require('../utils/responseHandler');

// Simplified data sanitization (essential only)
const sanitizeRecipeData = (recipeData) => {
    try {
        return {
            name: String(recipeData.name || 'Untitled Recipe').trim(),
            description: String(recipeData.description || 'A delicious recipe').trim(),
            prepTime: String(recipeData.prepTime || '15 minutes').trim(),
            cookTime: String(recipeData.cookTime || '30 minutes').trim(),
            servings: recipeData.servings || 4,
            difficulty: ['Easy', 'Medium', 'Hard'].includes(recipeData.difficulty) ? recipeData.difficulty : 'Medium',
            ingredients: Array.isArray(recipeData.ingredients) ? recipeData.ingredients.map(ing => ({
                item: String(ing.item || ing.ingredient || '').trim(),
                amount: String(ing.amount || '1').trim(),
                unit: String(ing.unit || 'piece').trim()
            })) : [],
            instructions: Array.isArray(recipeData.instructions) ? recipeData.instructions.map((inst, index) => ({
                step: index + 1,
                instruction: String(inst.instruction || inst.text || inst).trim()
            })) : [],
            tips: Array.isArray(recipeData.tips) ? recipeData.tips.map(tip => String(tip).trim()) : [],
            // CRITICAL: All nutrition as strings to avoid validation errors
            nutrition: {
                calories: String(recipeData.nutrition?.calories || 'Not specified'),
                protein: String(recipeData.nutrition?.protein || 'Not specified'),
                carbs: String(recipeData.nutrition?.carbs || 'Not specified'),
                fat: String(recipeData.nutrition?.fat || 'Not specified')
            },
            tags: Array.isArray(recipeData.tags) ? recipeData.tags : [],
            cuisine: recipeData.cuisine ? String(recipeData.cuisine).trim() : null
        };
    } catch (error) {
        logger.error('Data sanitization error:', error);
        throw new Error('Failed to sanitize recipe data');
    }
};

const normalizeDifficulty = (difficulty) => {
    const value = String(difficulty || '').trim().toLowerCase();

    if (value === 'easy') return 'Easy';
    if (value === 'medium') return 'Medium';
    if (value === 'hard') return 'Hard';

    return 'Medium';
};

const generateSmartFallbackRecipe = (recipeName, options = {}) => {
    const cuisine = options.cuisine ? String(options.cuisine).trim() : 'International';
    const servings = Number(options.servings) || 4;
    const difficulty = normalizeDifficulty(options.difficulty);
    const description = `A flavorful ${cuisine.toLowerCase()} style ${recipeName.toLowerCase()} that is quick to prepare and easy to enjoy.`;

    const ingredients = [
        { item: recipeName, amount: '1', unit: 'main portion' },
        { item: 'Onion', amount: '1', unit: 'medium' },
        { item: 'Garlic', amount: '2', unit: 'cloves' },
        { item: 'Tomato', amount: '2', unit: 'medium' },
        { item: 'Oil', amount: '2', unit: 'tbsp' }
    ];

    const instructions = [
        { step: 1, instruction: `Prep all ingredients for the ${recipeName} and keep them ready.` },
        { step: 2, instruction: 'Heat oil in a pan and sauté the aromatics until fragrant.' },
        { step: 3, instruction: `Add the main ingredients and cook until well combined and heated through.` },
        { step: 4, instruction: 'Season to taste, finish with fresh herbs if available, and serve warm.' }
    ];

    return {
        name: recipeName,
        description,
        prepTime: '15 minutes',
        cookTime: '30 minutes',
        servings,
        difficulty,
        ingredients,
        instructions,
        tips: [
            'Adjust seasoning at the end for the best flavor.',
            'Serve immediately for the freshest taste.'
        ],
        nutrition: {
            calories: '250 per serving',
            protein: '12g',
            carbs: '28g',
            fat: '10g'
        },
        tags: [recipeName.toLowerCase(), cuisine.toLowerCase(), difficulty.toLowerCase()],
        cuisine,
    };
};

const generateRecipe = async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { recipeName, cuisine, dietaryRestrictions, servings, cookingTime, difficulty, instructions } = req.body;
        const userId = req.user._id;

        logger.info(`[${Date.now() - startTime}ms] Starting recipe generation for: "${recipeName}" by user: ${req.user.email}`);

        // Quick validation
        if (!recipeName || recipeName.trim().length < 3) {
            return responseHandler.error(res, 'Recipe name must be at least 3 characters long', 400);
        }

        if (recipeName.trim().length > 200) {
            return responseHandler.error(res, 'Recipe name must be less than 200 characters', 400);
        }

        // Check for existing recipe
        const existingRecipe = await Recipe.findOne({ 
            name: { $regex: new RegExp(`^${recipeName.trim()}$`, 'i') }, 
            user: userId 
        });

        if (existingRecipe) {
            return responseHandler.error(res, 'You already have a recipe with this name. Please choose a different name.', 400);
        }

        logger.info(`[${Date.now() - startTime}ms] Database check completed`);

        // Prepare enhanced prompt
        let enhancedPrompt = recipeName.trim();
        if (cuisine) enhancedPrompt += ` (${cuisine} cuisine)`;
        if (dietaryRestrictions?.length) enhancedPrompt += ` - ${dietaryRestrictions.join(', ')} friendly`;
        if (servings && servings !== 4) enhancedPrompt += ` for ${servings} servings`;
        if (cookingTime) enhancedPrompt += ` ready in ${cookingTime}`;
        if (difficulty) enhancedPrompt += ` (${difficulty} difficulty level)`;
        if (instructions) enhancedPrompt += `. Special: ${instructions}`;

        logger.info(`[${Date.now() - startTime}ms] Attempting Gemini generation...`);

        let recipeData;
        let usingFallback = false;

        // Try Gemini first, but with short timeout
        try {
            recipeData = await Promise.race([
                geminiConfig.generateRecipe(enhancedPrompt),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Gemini timeout - switching to fallback')), 20000) // 20 seconds
                )
            ]);
            logger.info(`[${Date.now() - startTime}ms] ✅ Gemini generation successful`);
        } catch (geminiError) {
            logger.warn(`[${Date.now() - startTime}ms] Gemini failed, using fallback: ${geminiError.message}`);
            
            // Generate smart fallback recipe
            recipeData = generateSmartFallbackRecipe(recipeName.trim(), {
                cuisine,
                dietaryRestrictions,
                servings: servings || 4,
                cookingTime,
                difficulty,
                instructions
            });
            usingFallback = true;
        }

        if (!recipeData) {
            logger.error(`[${Date.now() - startTime}ms] Both Gemini and fallback failed`);
            return responseHandler.error(res, 'Failed to generate recipe. Please try again.', 500);
        }

        logger.info(`[${Date.now() - startTime}ms] Recipe data generated (${usingFallback ? 'fallback' : 'Gemini'})`);

        // Sanitize data
        const sanitizedData = sanitizeRecipeData(recipeData);
        
        // Apply user preferences
        if (servings) sanitizedData.servings = servings;
        if (difficulty) sanitizedData.difficulty = normalizeDifficulty(difficulty);

        // Create recipe object
        const recipeObject = {
            ...sanitizedData,
            user: userId,
            originalPrompt: enhancedPrompt,
            isFavorite: false,
            imageUrl: null,
            imageGenerated: false,
            imageGenerationFailed: false,
            imageGenerationAttempts: 0,
            imageGenerationInProgress: false,
            // Mark if using fallback
            generationMethod: usingFallback ? 'fallback' : 'gemini',
            userPreferences: {
                cuisine: cuisine || null,
                dietaryRestrictions: dietaryRestrictions || [],
                servings: servings || null,
                cookingTime: cookingTime || null,
                difficulty: difficulty ? String(difficulty).trim().toLowerCase() : null,
                specialInstructions: instructions || null
            }
        };

        logger.info(`[${Date.now() - startTime}ms] Starting database save`);

        // Save to database
        const recipe = new Recipe(recipeObject);
        await recipe.save();
        
        logger.info(`[${Date.now() - startTime}ms] Recipe saved successfully: ${recipe._id}`);

        // Prepare response
        const responseRecipe = {
            _id: recipe._id,
            id: recipe._id.toString(),
            name: recipe.name,
            title: recipe.name,
            description: recipe.description,
            prepTime: recipe.prepTime,
            cookTime: recipe.cookTime,
            servings: recipe.servings,
            difficulty: recipe.difficulty,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            tips: recipe.tips,
            nutrition: recipe.nutrition,
            originalPrompt: recipe.originalPrompt,
            isFavorite: recipe.isFavorite,
            tags: recipe.tags || [],
            cuisine: recipe.cuisine,
            imageUrl: null,
            thumbnailUrl: null,
            imageGenerated: false,
            imageGenerationInProgress: false,
            imageGenerationFailed: false,
            generationMethod: recipe.generationMethod,
            createdAt: recipe.createdAt,
            updatedAt: recipe.updatedAt
        };

        const totalTime = Date.now() - startTime;
        logger.info(`[${totalTime}ms] SENDING IMMEDIATE RESPONSE for recipe: ${recipe._id}`);

        // Send response immediately
        const message = usingFallback 
            ? 'Recipe generated successfully (AI temporarily unavailable, using smart fallback)' 
            : 'Recipe generated successfully';

        responseHandler.success(res, {
            recipe: responseRecipe
        }, message, 201);

        logger.info(`[${totalTime}ms] Recipe generation complete`);

    } catch (error) {
        const totalTime = Date.now() - startTime;
        logger.error(`[${totalTime}ms] Recipe generation error:`, {
            error: error.message,
            stack: error.stack,
            user: req.user?.email,
            recipeName: req.body?.recipeName
        });

        if (error?.name === 'ValidationError') {
            return responseHandler.error(res, error.message, 400);
        }

        responseHandler.error(res, 'An unexpected error occurred during recipe generation. Please try again.', 500);
    }
};



// Enhanced retry image generation
const retryImageGeneration = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
            return responseHandler.error(res, 'Invalid recipe ID format', 400);
        }

        const recipe = await Recipe.findOne({ _id: id, user: userId });

        if (!recipe) {
            return responseHandler.error(res, 'Recipe not found', 404);
        }

        if (recipe.imageGenerated && recipe.imageUrl) {
            return responseHandler.success(res, {
                imageUrl: recipe.imageUrl,
                thumbnailUrl: recipe.thumbnailUrl,
                message: 'Image already exists'
            }, 'Image already generated');
        }

        if (recipe.imageGenerationInProgress) {
            return responseHandler.error(res, 'Image generation is already in progress', 400);
        }

        if (recipe.imageGenerationAttempts >= 5) {
            return responseHandler.error(res, 'Maximum retry attempts reached', 400);
        }

        // Start retry immediately and return response
        await Recipe.findByIdAndUpdate(id, {
            imageGenerationFailed: false,
            imageGenerationInProgress: true,
            $inc: { imageGenerationAttempts: 1 }
        });

        logger.info(`Starting image retry for recipe: ${id}, attempt: ${recipe.imageGenerationAttempts + 1}`);

        // Send immediate response
        responseHandler.success(res, {
            message: 'Image generation retry started',
            recipeId: id,
            attempt: recipe.imageGenerationAttempts + 1
        }, 'Image generation retry initiated');

        // Background retry
        process.nextTick(async () => {
            try {
                const imageService = require('../services/imageService');
                const imageResult = await Promise.race([
                    imageService.generateRecipeImage(recipe.name, recipe.description),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Retry timeout')), 90000)
                    )
                ]);

                if (imageResult?.imageUrl) {
                    await Recipe.findByIdAndUpdate(id, {
                        imageUrl: imageResult.imageUrl,
                        thumbnailUrl: imageResult.thumbnailUrl,
                        imageGenerated: true,
                        imageGenerationInProgress: false,
                        imageGenerationFailed: false,
                        imageAttribution: imageResult.attribution
                    });
                    logger.info(`✅ Image retry successful for recipe: ${id}`);
                } else {
                    await Recipe.findByIdAndUpdate(id, {
                        imageGenerationInProgress: false,
                        imageGenerationFailed: true
                    });
                    logger.warn(`⚠️ Image retry failed for recipe: ${id}`);
                }
            } catch (retryError) {
                await Recipe.findByIdAndUpdate(id, {
                    imageGenerationInProgress: false,
                    imageGenerationFailed: true
                }).catch(() => {});
                logger.error(`❌ Image retry error for recipe: ${id}:`, retryError.message);
            }
        });

    } catch (error) {
        logger.error('Retry image generation error:', error);
        responseHandler.error(res, 'Failed to retry image generation', 500);
    }
};

// Immediate image generation
const generateRecipeImage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const recipe = await Recipe.findOne({ _id: id, user: userId });

        if (!recipe) {
            return responseHandler.error(res, 'Recipe not found', 404);
        }

        if (recipe.imageUrl && recipe.imageGenerated) {
            return responseHandler.success(res, {
                imageUrl: recipe.imageUrl,
                thumbnailUrl: recipe.thumbnailUrl,
                cached: true
            }, 'Image already exists');
        }

        if (recipe.imageGenerationInProgress) {
            return responseHandler.success(res, {
                message: 'Image generation already in progress',
                imageGenerationInProgress: true
            }, 'Image generation in progress');
        }

        // Start generation and return immediately
        await Recipe.findByIdAndUpdate(id, {
            imageGenerationInProgress: true,
            $inc: { imageGenerationAttempts: 1 }
        });

        logger.info(`Manual image generation started for recipe: ${id}`);

        // Send immediate response
        responseHandler.success(res, {
            message: 'Image generation started',
            imageGenerationInProgress: true
        }, 'Image generation initiated');

        // Background generation
        process.nextTick(async () => {
            try {
                const imageService = require('../services/imageService');
                const imageResult = await Promise.race([
                    imageService.generateRecipeImage(recipe.name, recipe.description),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Image generation timeout')), 90000)
                    )
                ]);

                if (imageResult?.imageUrl) {
                    await Recipe.findByIdAndUpdate(id, {
                        imageUrl: imageResult.imageUrl,
                        thumbnailUrl: imageResult.thumbnailUrl,
                        imageGenerated: true,
                        imageGenerationInProgress: false,
                        imageGenerationFailed: false,
                        imageAttribution: imageResult.attribution
                    });
                    logger.info(`✅ Manual image generation successful for recipe: ${id}`);
                } else {
                    await Recipe.findByIdAndUpdate(id, {
                        imageGenerationInProgress: false,
                        imageGenerationFailed: true
                    });
                    logger.warn(`⚠️ Manual image generation failed for recipe: ${id}`);
                }
            } catch (error) {
                await Recipe.findByIdAndUpdate(id, {
                    imageGenerationInProgress: false,
                    imageGenerationFailed: true
                }).catch(() => {});
                logger.error(`❌ Manual image generation error for recipe: ${id}:`, error.message);
            }
        });

    } catch (error) {
        logger.error('Generate recipe image error:', error);
        responseHandler.error(res, 'Failed to generate recipe image', 500);
    }
};

// Check image generation status
const getImageGenerationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const recipe = await Recipe.findOne({ _id: id, user: userId })
            .select('imageGenerationInProgress imageGenerated imageGenerationFailed imageUrl thumbnailUrl imageGenerationAttempts');

        if (!recipe) {
            return responseHandler.error(res, 'Recipe not found', 404);
        }

        responseHandler.success(res, {
            recipeId: id,
            imageGenerationInProgress: recipe.imageGenerationInProgress || false,
            imageGenerated: recipe.imageGenerated || false,
            imageGenerationFailed: recipe.imageGenerationFailed || false,
            imageUrl: recipe.imageUrl,
            thumbnailUrl: recipe.thumbnailUrl,
            attempts: recipe.imageGenerationAttempts || 0
        }, 'Image generation status retrieved');

    } catch (error) {
        logger.error('Get image generation status error:', error);
        responseHandler.error(res, 'Failed to get image status', 500);
    }
};

// Other methods (keep existing implementations)
const getUserRecipes = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = { user: userId };
        if (req.query.favorites === 'true') {
            filter.isFavorite = true;
        }

        const recipes = await Recipe.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('name description difficulty prepTime cookTime servings createdAt isFavorite tags cuisine imageUrl thumbnailUrl imageGenerated imageGenerationInProgress imageGenerationFailed');

        const total = await Recipe.countDocuments(filter);

        responseHandler.success(res, {
            recipes,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        }, 'Recipes retrieved successfully');

    } catch (error) {
        logger.error('Get user recipes error:', error);
        responseHandler.error(res, 'Failed to retrieve recipes', 500);
    }
};

const getRecipeById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const recipe = await Recipe.findOne({ _id: id, user: userId });

        if (!recipe) {
            return responseHandler.error(res, 'Recipe not found', 404);
        }

        responseHandler.success(res, {
            recipe
        }, 'Recipe retrieved successfully');

    } catch (error) {
        logger.error('Get recipe by ID error:', error);
        responseHandler.error(res, 'Failed to retrieve recipe', 500);
    }
};

const deleteRecipe = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const recipe = await Recipe.findOneAndDelete({ _id: id, user: userId });

        if (!recipe) {
            return responseHandler.error(res, 'Recipe not found', 404);
        }

        logger.info(`Recipe deleted: ${recipe._id} by user: ${req.user.email}`);

        responseHandler.success(res, null, 'Recipe deleted successfully');

    } catch (error) {
        logger.error('Delete recipe error:', error);
        responseHandler.error(res, 'Failed to delete recipe', 500);
    }
};

const toggleFavorite = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const recipe = await Recipe.findOne({ _id: id, user: userId });

        if (!recipe) {
            return responseHandler.error(res, 'Recipe not found', 404);
        }

        recipe.isFavorite = !recipe.isFavorite;
        await recipe.save();

        logger.info(`Recipe favorite toggled: ${recipe._id} to ${recipe.isFavorite} by user: ${req.user.email}`);

        responseHandler.success(res, {
            recipe: {
                _id: recipe._id,
                id: recipe._id,
                isFavorite: recipe.isFavorite
            }
        }, `Recipe ${recipe.isFavorite ? 'added to' : 'removed from'} favorites`);

    } catch (error) {
        logger.error('Toggle favorite error:', error);
        responseHandler.error(res, 'Failed to update favorite status', 500);
    }
};

const updateRecipe = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const updateData = req.body;

        // Remove protected fields
        delete updateData.user;
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        delete updateData.imageGenerationAttempts;
        delete updateData.imageGenerationInProgress;

        const recipe = await Recipe.findOneAndUpdate(
            { _id: id, user: userId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!recipe) {
            return responseHandler.error(res, 'Recipe not found', 404);
        }

        logger.info(`Recipe updated: ${recipe._id} by user: ${req.user.email}`);

        responseHandler.success(res, {
            recipe
        }, 'Recipe updated successfully');

    } catch (error) {
        logger.error('Update recipe error:', error);
        responseHandler.error(res, 'Failed to update recipe', 500);
    }
};

const searchRecipes = async (req, res) => {
    try {
        const { query } = req.query;
        const userId = req.user._id;

        if (!query || query.trim().length < 2) {
            return responseHandler.error(res, 'Search query must be at least 2 characters', 400);
        }

        const recipes = await Recipe.find({
            user: userId,
            $text: { $search: query }
        })
        .select('name description difficulty prepTime cookTime servings createdAt isFavorite tags cuisine imageUrl thumbnailUrl imageGenerated')
        .sort({ score: { $meta: 'textScore' } })
        .limit(20);

        responseHandler.success(res, {
            recipes,
            query: query.trim()
        }, 'Search completed successfully');

    } catch (error) {
        logger.error('Search recipes error:', error);
        responseHandler.error(res, 'Search failed', 500);
    }
};

module.exports = {
    generateRecipe,
    getUserRecipes,
    getRecipeById,
    deleteRecipe,
    toggleFavorite,
    updateRecipe,
    searchRecipes,
    generateRecipeImage,
    retryImageGeneration,
    getImageGenerationStatus
};