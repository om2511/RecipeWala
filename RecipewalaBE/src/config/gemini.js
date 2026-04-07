const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

class GeminiConfig {
    constructor() {
        this.genAI = null;
        this.model = null;
        this.isInitialized = false;
        this.lastError = null;
        this.connectionAttempts = 0;
        this.maxRetries = 3;
        
        // Network-related settings
        this.networkTimeout = 30000; // 30 seconds
        this.quickTestTimeout = 5000; // 5 seconds for availability checks
        
        // Skip initialization on startup to avoid blocking
        // Initialize on first use instead
        this.initializeOnFirstUse = true;
        
        logger.info('Gemini AI Config created - will initialize on first use');
    }

    async initializeGemini() {
        try {
            if (!process.env.GEMINI_API_KEY) {
                throw new Error('GEMINI_API_KEY environment variable is required');
            }

            // Check for example/placeholder keys
            const placeholderKeys = [
                'AIzaSyBJobERR8SphnG9KlXvPcxs3QPeG1O63yE',
                'your_gemini_api_key_here',
                'YOUR_GEMINI_API_KEY_HERE'
            ];

            if (placeholderKeys.includes(process.env.GEMINI_API_KEY)) {
                throw new Error('Please replace the placeholder GEMINI_API_KEY with your actual API key from https://makersuite.google.com/app/apikey');
            }

            logger.info('Initializing Gemini AI with API key: ' + process.env.GEMINI_API_KEY.substring(0, 20) + '...');
            
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            
            // Skip connection test during initialization to avoid blocking startup
            // Test will happen on first actual use
            this.isInitialized = true;
            logger.info('✅ Gemini AI initialized (connection will be tested on first use)');
            
        } catch (error) {
            this.lastError = error;
            this.isInitialized = false;
            logger.error('❌ Failed to initialize Gemini AI:', {
                error: error.message,
                isAPIKeySet: !!process.env.GEMINI_API_KEY,
                apiKeyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'NOT SET'
            });
        }
    }

    async testConnectionWithRetry() {
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                logger.info(`Testing Gemini connection (attempt ${attempt}/${this.maxRetries})...`);
                
                const result = await Promise.race([
                    this.model.generateContent("Hello"),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error(`Connection test timeout after ${this.networkTimeout}ms`)), this.networkTimeout)
                    )
                ]);
                
                const response = await result.response;
                const text = response.text();
                
                if (text.length === 0) {
                    throw new Error('Gemini returned empty response');
                }
                
                logger.info(`✅ Gemini connection test successful (attempt ${attempt})`);
                return true;
                
            } catch (error) {
                logger.warn(`Gemini connection test failed (attempt ${attempt}/${this.maxRetries}):`, error.message);
                
                if (attempt < this.maxRetries) {
                    // Wait before retry with exponential backoff
                    const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                    logger.info(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    throw error;
                }
            }
        }
    }

    async generateRecipe(recipeName) {
        // Initialize on first use if not already done
        if (!this.isInitialized) {
            await this.initializeGemini();
        }

        if (!this.isInitialized) {
            throw new Error(`Gemini AI not available: ${this.lastError?.message}`);
        }

        try {
            // Test connection before generating if we haven't tested recently
            if (this.connectionAttempts === 0) {
                await this.testConnectionWithRetry();
                this.connectionAttempts++;
            }

            const prompt = `Generate a detailed recipe for "${recipeName}". 
            Please provide the response in the following JSON format:
            {
                "name": "${recipeName}",
                "description": "Brief description of the dish",
                "prepTime": "15 minutes",
                "cookTime": "30 minutes", 
                "servings": 4,
                "difficulty": "Easy",
                "ingredients": [
                    {"item": "ingredient name", "amount": "1", "unit": "cup"}
                ],
                "instructions": [
                    {"step": 1, "instruction": "detailed step description"}
                ],
                "tips": ["helpful cooking tip"],
                "nutrition": {
                    "calories": "250 per serving",
                    "protein": "15g",
                    "carbs": "30g",
                    "fat": "8g"
                },
                "tags": ["tag1", "tag2"],
                "cuisine": "cuisine type"
            }
            
            Make sure the response is valid JSON with realistic values.
            For nutrition, always use strings with units.`;

            logger.info(`Generating recipe with Gemini for: "${recipeName}"`);

            // Use extended timeout for recipe generation
            const result = await Promise.race([
                this.model.generateContent(prompt),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error(`Recipe generation timeout after ${this.networkTimeout * 2}ms`)), this.networkTimeout * 2)
                )
            ]);

            const response = await result.response;
            const text = response.text();

            logger.info('Received response from Gemini, parsing JSON...');

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger.error('No valid JSON found in Gemini response:', text.substring(0, 200));
                throw new Error('No valid JSON found in Gemini response');
            }

            const recipeData = JSON.parse(jsonMatch[0]);
            
            // Validate and sanitize
            this.validateAndSanitizeRecipeData(recipeData);
            
            logger.info(`✅ Recipe generated successfully: "${recipeData.name}"`);
            return recipeData;

        } catch (error) {
            logger.error('Gemini recipe generation error:', {
                error: error.message,
                recipeName,
                isInitialized: this.isInitialized,
                connectionAttempts: this.connectionAttempts
            });

            // Provide specific error messages
            if (error.message.includes('timeout')) {
                throw new Error('AI service is taking too long to respond. This may be a network connectivity issue. Please try again.');
            } else if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
                throw new Error('AI service quota exceeded. Please try again later.');
            } else if (error.message.includes('API_KEY_INVALID')) {
                throw new Error('Invalid Gemini API key. Please check your API key configuration.');
            } else if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
                throw new Error('Cannot connect to AI service. This may be a network or firewall issue.');
            } else if (error.message.includes('JSON')) {
                throw new Error('AI returned invalid response format. Please try again.');
            }
            
            throw new Error(`Failed to generate recipe: ${error.message}`);
        }
    }

    validateAndSanitizeRecipeData(recipeData) {
        const requiredFields = ['name', 'ingredients', 'instructions'];
        
        for (const field of requiredFields) {
            if (!recipeData[field]) {
                throw new Error(`Missing required field: ${field} in recipe data`);
            }
        }

        if (!Array.isArray(recipeData.ingredients) || recipeData.ingredients.length === 0) {
            throw new Error('Recipe must have at least one ingredient');
        }

        if (!Array.isArray(recipeData.instructions) || recipeData.instructions.length === 0) {
            throw new Error('Recipe must have at least one instruction');
        }

        // Ensure nutrition is properly formatted as strings
        if (recipeData.nutrition) {
            Object.keys(recipeData.nutrition).forEach(key => {
                if (recipeData.nutrition[key] && typeof recipeData.nutrition[key] !== 'string') {
                    recipeData.nutrition[key] = String(recipeData.nutrition[key]);
                }
            });
        }

        // Set defaults for missing fields
        recipeData.prepTime = recipeData.prepTime || '15 minutes';
        recipeData.cookTime = recipeData.cookTime || '30 minutes';
        recipeData.servings = recipeData.servings || 4;
        recipeData.difficulty = recipeData.difficulty || 'Medium';
        recipeData.description = recipeData.description || `A delicious ${recipeData.name} recipe.`;
        recipeData.tips = recipeData.tips || [];
        recipeData.tags = recipeData.tags || [];
        recipeData.cuisine = recipeData.cuisine || 'International';

        logger.info('Recipe data validation and sanitization completed');
    }

    async isServiceAvailable() {
        if (!this.isInitialized) {
            return false;
        }

        try {
            // Quick availability check with short timeout
            const result = await Promise.race([
                this.model.generateContent("Hello"),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Quick service check timeout')), this.quickTestTimeout)
                )
            ]);
            
            const response = await result.response;
            return response.text().length > 0;
        } catch (error) {
            logger.warn('Gemini service availability check failed:', error.message);
            return false;
        }
    }

    // Network diagnostic information
    async getNetworkDiagnostics() {
        const diagnostics = {
            isInitialized: this.isInitialized,
            hasApiKey: !!process.env.GEMINI_API_KEY,
            apiKeyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'NOT SET',
            lastError: this.lastError?.message,
            connectionAttempts: this.connectionAttempts,
            model: 'gemini-2.0-flash',
            networkTimeout: this.networkTimeout,
            timestamp: new Date().toISOString()
        };

        // Try a quick network test
        try {
            const startTime = Date.now();
            await Promise.race([
                this.model?.generateContent("ping"),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Network test timeout')), 5000)
                )
            ]);
            diagnostics.networkLatency = Date.now() - startTime + 'ms';
            diagnostics.networkStatus = 'OK';
        } catch (error) {
            diagnostics.networkStatus = 'FAILED';
            diagnostics.networkError = error.message;
        }

        return diagnostics;
    }

    // Reset connection state (useful for retrying after network issues)
    resetConnection() {
        this.connectionAttempts = 0;
        this.lastError = null;
        logger.info('Gemini connection state reset');
    }
}

module.exports = new GeminiConfig();