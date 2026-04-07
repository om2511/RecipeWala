// Updated ImageService.js with Pexels API replacing Unsplash

class ImageService {
    constructor() {
        this.timeout = 30000; // 30 seconds
        this.maxRetries = 3;
        this.model = null;
        this.initializeGemini();
    }

    async initializeGemini() {
        try {
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            console.log('✅ Gemini AI initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Gemini AI:', error);
        }
    }

    withTimeout(promise, timeoutMs) {
        return Promise.race([
            promise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
            )
        ]);
    }

    async generateImagePrompt(recipeName, recipeDescription = '') {
        if (!this.model) {
            throw new Error('Gemini AI not initialized');
        }

        try {
            const prompt = `
                Create a detailed, professional food photography prompt for: "${recipeName}"
                ${recipeDescription ? `Description: ${recipeDescription}` : ''}
                
                Generate a photorealistic prompt that includes:
                - The finished dish beautifully plated
                - Proper lighting and styling
                - Appetizing presentation
                - Relevant garnishes or accompaniments
                
                Format the response as a single descriptive paragraph suitable for image generation APIs.
                Focus on visual details, colors, textures, and professional food photography style.
                Keep it under 200 words.
            `;

            const result = await this.withTimeout(
                this.model.generateContent(prompt),
                this.timeout
            );
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error('Error generating image prompt:', error);
            return `Professional food photography of ${recipeName}, beautifully plated on a white ceramic plate, garnished appropriately, soft natural lighting, appetizing presentation, high quality, detailed`;
        }
    }

    /**
     * Generate recipe image using Pexels API (free alternative with better quality than Unsplash)
     */
    async generateRecipeImagePexels(recipeName) {
        if (!process.env.PEXELS_API_KEY) {
            console.log('Pexels API key not configured');
            return null;
        }

        try {
            // Create a more specific search query for better results
            const searchQuery = this.createPexelsSearchQuery(recipeName);
            const pexelsUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=landscape`;
            
            console.log(`Fetching image from Pexels for: ${recipeName} (Query: ${searchQuery})`);
            
            const response = await this.withTimeout(
                fetch(pexelsUrl, {
                    headers: {
                        'Authorization': process.env.PEXELS_API_KEY,
                        'Accept': 'application/json'
                    }
                }),
                this.timeout
            );

            if (!response.ok) {
                throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.photos && data.photos.length > 0) {
                // Select the best photo (first one is usually highest quality)
                const selectedPhoto = data.photos[0];
                
                console.log(`Image found on Pexels for: ${recipeName}`);
                return {
                    imageUrl: selectedPhoto.src.large,
                    thumbnailUrl: selectedPhoto.src.medium,
                    generated: false,
                    attribution: {
                        photographer: selectedPhoto.photographer,
                        photographerUrl: selectedPhoto.photographer_url,
                        pexelsUrl: selectedPhoto.url,
                        source: 'pexels'
                    }
                };
            }
            
            console.log(`No image found on Pexels for: ${recipeName}`);
            return null;
        } catch (error) {
            console.error(`Error fetching image from Pexels for ${recipeName}:`, error.message);
            return null;
        }
    }

    /**
     * Create optimized search query for Pexels
     */
    createPexelsSearchQuery(recipeName) {
        // Remove special characters and normalize
        let query = recipeName.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        // Add food-related keywords for better results
        const foodKeywords = ['food', 'dish', 'meal', 'cuisine'];
        
        // Check if query already contains food-related terms
        const hasFoodTerm = foodKeywords.some(keyword => query.includes(keyword));
        
        if (!hasFoodTerm) {
            query += ' food';
        }

        // Limit query length for better API performance
        if (query.length > 50) {
            query = query.substring(0, 47) + '...';
        }

        return query;
    }

    /**
     * Generate recipe image using OpenAI DALL-E (paid service)
     */
    async generateRecipeImageDALLE(recipeName, imagePrompt) {
        if (!process.env.OPENAI_API_KEY) {
            console.log('OpenAI API key not configured');
            return null;
        }

        try {
            console.log(`Generating DALL-E image for: ${recipeName}`);

            const response = await this.withTimeout(
                fetch('https://api.openai.com/v1/images/generations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "dall-e-3",
                        prompt: imagePrompt,
                        n: 1,
                        size: "1024x1024",
                        quality: "standard"
                    })
                }),
                30000 // 30 seconds for DALL-E
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`DALL-E API error: ${response.status} ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                console.log(`DALL-E image generated for: ${recipeName}`);
                return {
                    imageUrl: data.data[0].url,
                    thumbnailUrl: data.data[0].url,
                    generated: true,
                    attribution: {
                        source: 'dalle'
                    }
                };
            }
            
            return null;
        } catch (error) {
            console.error(`Error generating DALL-E image for ${recipeName}:`, error.message);
            return null;
        }
    }

    /**
     * Main method to generate recipe image with fallback options and retries
     */
    async generateRecipeImage(recipeName, recipeDescription = '') {
        console.log(`Starting image generation for: ${recipeName}`);
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`Image generation attempt ${attempt}/${this.maxRetries} for: ${recipeName}`);

                // Step 1: Generate image prompt using Gemini (with timeout)
                let imagePrompt;
                try {
                    imagePrompt = await this.withTimeout(
                        this.generateImagePrompt(recipeName, recipeDescription),
                        10000 // 10 seconds for prompt generation
                    );
                    console.log(`Generated image prompt for ${recipeName}:`, imagePrompt.substring(0, 100) + '...');
                } catch (promptError) {
                    console.warn(`Failed to generate prompt for ${recipeName}, using fallback:`, promptError.message);
                    imagePrompt = `Professional food photography of ${recipeName}, beautifully plated, appetizing presentation`;
                }

                // Step 2: Try different image generation services in order of preference
                let imageResult = null;

                // Option 1: Try DALL-E (best quality, paid)
                if (process.env.OPENAI_API_KEY && !imageResult) {
                    try {
                        imageResult = await this.generateRecipeImageDALLE(recipeName, imagePrompt);
                        if (imageResult) {
                            console.log(`✅ Image generated using DALL-E for: ${recipeName}`);
                            return imageResult;
                        }
                    } catch (dalleError) {
                        console.warn(`DALL-E failed for ${recipeName}:`, dalleError.message);
                    }
                }

                // Option 2: Try Pexels (free, high-quality stock photos)
                if (process.env.PEXELS_API_KEY && !imageResult) {
                    try {
                        imageResult = await this.generateRecipeImagePexels(recipeName);
                        if (imageResult) {
                            console.log(`✅ Image found using Pexels for: ${recipeName}`);
                            return imageResult;
                        }
                    } catch (pexelsError) {
                        console.warn(`Pexels failed for ${recipeName}:`, pexelsError.message);
                    }
                }

                // If we reach here, all methods failed for this attempt
                if (attempt === this.maxRetries) {
                    console.error(`❌ All image generation methods failed for: ${recipeName} after ${this.maxRetries} attempts`);
                    return null;
                }

                // Wait before retrying (exponential backoff)
                const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                console.log(`Retrying image generation for ${recipeName} in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));

            } catch (error) {
                console.error(`Unexpected error in image generation attempt ${attempt} for ${recipeName}:`, error);
                
                if (attempt === this.maxRetries) {
                    return null;
                }
            }
        }

        return null;
    }

    /**
     * Check if image generation services are available
     */
    async checkServiceAvailability() {
        const services = {
            openai: !!process.env.OPENAI_API_KEY,
            pexels: !!process.env.PEXELS_API_KEY,
            gemini: !!process.env.GEMINI_API_KEY
        };

        console.log('Image service availability:', services);
        return services;
    }
}

module.exports = new ImageService();