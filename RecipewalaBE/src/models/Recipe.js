const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
    item: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: String,
        required: true,
        trim: true
    },
    unit: {
        type: String,
        required: true,
        trim: true
    }
});

const instructionSchema = new mongoose.Schema({
    step: {
        type: Number,
        required: true
    },
    instruction: {
        type: String,
        required: true,
        trim: true
    }
});

// FIXED: All nutrition fields as String to handle ranges like "200-250"
const nutritionSchema = new mongoose.Schema({
    calories: {
        type: String,  // Changed from Number to String
        trim: true
    },
    protein: {
        type: String,  // Changed from Number to String
        trim: true
    },
    carbs: {
        type: String,  // Changed from Number to String  
        trim: true
    },
    fat: {
        type: String,  // Changed from Number to String
        trim: true
    },
    fiber: {
        type: String,  // Added fiber support
        trim: true
    },
    sugar: {
        type: String,  // Added sugar support
        trim: true
    },
    sodium: {
        type: String,  // Added sodium support
        trim: true
    }
});

const imageAttributionSchema = new mongoose.Schema({
    photographer: {
        type: String,
        trim: true
    },
    photographerUrl: {
        type: String,
        trim: true
    },
    pexelsUrl: {
        type: String,
        trim: true
    },
    unsplashUrl: {
        type: String,
        trim: true
    },
    source: {
        type: String,
        enum: ['pexels', 'unsplash', 'dalle', 'stability', 'generated', 'manual'],
        default: 'generated'
    },
    license: {
        type: String,
        trim: true
    }
});

const recipeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Recipe name is required'],
        trim: true,
        maxlength: [200, 'Recipe name must be less than 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description must be less than 1000 characters']
    },
    prepTime: {
        type: String,
        trim: true,
        default: '15 minutes'
    },
    cookTime: {
        type: String,
        trim: true,
        default: '30 minutes'
    },
    servings: {
        type: mongoose.Schema.Types.Mixed, // Allow both String and Number
        default: 4
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    ingredients: [ingredientSchema],
    instructions: [instructionSchema],
    tips: [{
        type: String,
        trim: true
    }],
    nutrition: nutritionSchema, // Now supports string values
    
    // User and metadata
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    originalPrompt: {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, 'Original prompt must be less than 500 characters']
    },
    
    // Favorites support
    isFavorite: {
        type: Boolean,
        default: false,
        index: true
    },
    
    // Tags support for better filtering
    tags: [{
        type: String,
        trim: true
    }],
    
    // Cuisine support
    cuisine: {
        type: String,
        trim: true
    },
    
    // Image support with enhanced tracking
    imageUrl: {
        type: String,
        trim: true
    },
    thumbnailUrl: {
        type: String,
        trim: true
    },
    imageGenerated: {
        type: Boolean,
        default: false,
        index: true
    },
    
    // Enhanced image generation tracking
    imageGenerationInProgress: {
        type: Boolean,
        default: false,
        index: true
    },
    imageGenerationFailed: {
        type: Boolean,
        default: false,
        index: true
    },
    imageGenerationAttempts: {
        type: Number,
        default: 0,
        max: 5 // Limit retry attempts
    },
    imageGenerationLastAttempt: {
        type: Date,
        default: null
    },
    imageAttribution: imageAttributionSchema,
    
    // Image generation prompt for reference
    imagePrompt: {
        type: String,
        trim: true
    },
    
    // User preferences that were used to generate this recipe
    userPreferences: {
        cuisine: {
            type: String,
            trim: true
        },
        dietaryRestrictions: [{
            type: String,
            trim: true
        }],
        servings: {
            type: Number,
            min: 1,
            max: 20
        },
        cookingTime: {
            type: String,
            trim: true
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard']
        },
        specialInstructions: {
            type: String,
            trim: true,
            maxlength: [500, 'Special instructions must be less than 500 characters']
        }
    },
    
    // Analytics and engagement
    viewCount: {
        type: Number,
        default: 0
    },
    generatedAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            // Remove sensitive fields from JSON output
            delete ret.__v;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Virtual for total time calculation
recipeSchema.virtual('totalTime').get(function() {
    try {
        const prepMinutes = this.prepTime ? parseInt(this.prepTime.match(/\d+/)?.[0]) || 0 : 0;
        const cookMinutes = this.cookTime ? parseInt(this.cookTime.match(/\d+/)?.[0]) || 0 : 0;
        const total = prepMinutes + cookMinutes;
        return total > 0 ? `${total} minutes` : 'Variable';
    } catch (error) {
        return 'Variable';
    }
});

// Virtual for image status
recipeSchema.virtual('imageStatus').get(function() {
    if (this.imageGenerationInProgress) return 'generating';
    if (this.imageGenerated && this.imageUrl) return 'ready';
    if (this.imageGenerationFailed) return 'failed';
    return 'pending';
});

// Indexes for performance and querying
recipeSchema.index({ user: 1, createdAt: -1 });
recipeSchema.index({ user: 1, isFavorite: 1 });
recipeSchema.index({ user: 1, cuisine: 1 });
recipeSchema.index({ user: 1, difficulty: 1 });
recipeSchema.index({ name: 'text', description: 'text', 'ingredients.item': 'text' });
recipeSchema.index({ imageGenerationInProgress: 1, imageGenerationLastAttempt: 1 });
recipeSchema.index({ generatedAt: -1 });

// Pre-save middleware for data cleanup and validation
recipeSchema.pre('save', function(next) {
    try {
        // Update imageGenerationLastAttempt when attempts change
        if (this.isModified('imageGenerationAttempts') && this.imageGenerationAttempts > 0) {
            this.imageGenerationLastAttempt = new Date();
        }
        
        // Ensure imageGenerationInProgress is false if image is ready or failed
        if (this.imageGenerated || this.imageGenerationFailed) {
            this.imageGenerationInProgress = false;
        }
        
        // Normalize servings to a reasonable format
        if (this.servings && typeof this.servings === 'string') {
            const servingNumber = parseInt(this.servings.match(/\d+/)?.[0]);
            if (servingNumber && servingNumber > 0 && servingNumber <= 20) {
                this.servings = servingNumber;
            }
        }
        
        // Ensure every ingredient has required fields
        if (this.ingredients && this.ingredients.length > 0) {
            this.ingredients = this.ingredients.map(ing => ({
                ...ing,
                unit: ing.unit || 'to taste'
            }));
        }
        
        // Clean up nutrition data - ensure all values are strings
        if (this.nutrition) {
            Object.keys(this.nutrition.toObject()).forEach(key => {
                if (this.nutrition[key] !== undefined && this.nutrition[key] !== null) {
                    this.nutrition[key] = String(this.nutrition[key]).trim();
                }
            });
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Static method to find recipes with stuck image generation
recipeSchema.statics.findStuckImageGenerations = function(timeoutMinutes = 10) {
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    
    return this.find({
        imageGenerationInProgress: true,
        imageGenerationLastAttempt: { $lt: cutoffTime }
    });
};

// Static method to find retryable failed image generations
recipeSchema.statics.findRetryableImageGenerations = function() {
    return this.find({
        imageGenerationFailed: true,
        imageGenerationInProgress: false,
        imageGenerationAttempts: { $lt: 3 },
        imageGenerationLastAttempt: { 
            $lt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
        }
    });
};

// Instance method to reset image generation status
recipeSchema.methods.resetImageGeneration = function() {
    this.imageGenerationInProgress = false;
    this.imageGenerationFailed = false;
    this.imageGenerationAttempts = 0;
    this.imageGenerationLastAttempt = null;
    this.imageUrl = null;
    this.thumbnailUrl = null;
    this.imageGenerated = false;
    this.imageAttribution = undefined;
    this.imagePrompt = null;
    
    return this.save();
};

// Instance method to mark image generation as failed
recipeSchema.methods.markImageGenerationFailed = function() {
    this.imageGenerationInProgress = false;
    this.imageGenerationFailed = true;
    this.imageGenerationLastAttempt = new Date();
    
    return this.save();
};

// Instance method to mark image generation as successful
recipeSchema.methods.markImageGenerationSuccess = function(imageData) {
    this.imageUrl = imageData.imageUrl;
    this.thumbnailUrl = imageData.thumbnailUrl;
    this.imageGenerated = true;
    this.imageGenerationInProgress = false;
    this.imageGenerationFailed = false;
    this.imageAttribution = imageData.attribution;
    
    return this.save();
};

// Instance method to increment view count
recipeSchema.methods.incrementViewCount = function() {
    this.viewCount = (this.viewCount || 0) + 1;
    return this.save();
};

module.exports = mongoose.model('Recipe', recipeSchema);