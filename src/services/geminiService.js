/**
 * Google Gemini AI Service
 * Handles AI-powered summary generation and keyword extraction for publications
 */

import { GoogleGenAI } from '@google/genai';

// Initialize Gemini AI with API key from environment
const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GEMINI_API_KEY
});

/**
 * Generate academic summary and keywords for a single publication
 * @param {Object} publication - Publication object with title and abstract
 * @returns {Promise<{summary: string, keywords: string[]}>}
 */
export async function generatePublicationSummary(publication) {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
        throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
    }

    const prompt = `Analyze this publication and provide a concise 2-3 sentence academic summary, along with 5-7 key research terms/keywords.

Title: ${publication.title}
Abstract: ${publication.abstract || 'No abstract available'}`;

    let response;
    try {
        response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                temperature: 0.7,
                maxOutputTokens: 1024,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'object',
                    properties: {
                        summary: {
                            type: 'string',
                            description: 'A concise 2-3 sentence academic summary'
                        },
                        keywords: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            description: '5-7 key research terms/keywords'
                        }
                    },
                    required: ['summary', 'keywords']
                }
            }
        });
        
        // Extract text from the correct path in response
        let text;
        if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
            text = response.candidates[0].content.parts[0].text;
        } else if (response.text) {
            text = response.text;
        } else {
            throw new Error('Unable to extract text from response');
        }
        
        console.log('=== EXTRACTED TEXT ===');
        console.log(text);
        console.log('=== END TEXT ===');
        
        // Clean up and parse JSON
        let cleanText = text.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/```\n?/g, '');
        }
        
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanText = jsonMatch[0];
        }
        
        const parsed = JSON.parse(cleanText);
        
        return {
            summary: parsed.summary || '',
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords : []
        };
    } catch (error) {
        console.error('Error generating summary:', error);
        if (response?.text) {
            console.error('Raw response:', response.text);
        }
        
        // Parse and format user-friendly error messages
        let userMessage = 'Failed to generate AI summary';
        
        try {
            // Try to parse error object if it's stringified JSON
            let errorObj = error;
            if (typeof error.message === 'string' && error.message.includes('{')) {
                try {
                    const jsonMatch = error.message.match(/\{.*\}/s);
                    if (jsonMatch) {
                        errorObj = JSON.parse(jsonMatch[0]);
                    }
                } catch (e) {
                    // Not JSON, use original error
                }
            }
            
            // Check for quota/rate limit errors
            if (errorObj?.error?.code === 429 || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
                const retryInfo = errorObj?.error?.details?.find(d => d['@type']?.includes('RetryInfo'));
                const retryDelay = retryInfo?.retryDelay || '1 minute';
                userMessage = `API quota exceeded. The free tier allows 20 requests per day. Please retry in ${retryDelay}.`;
            } 
            // Check for API key errors
            else if (error.message?.includes('API key') || errorObj?.error?.code === 401) {
                userMessage = 'Invalid or missing API key. Please check your configuration.';
            }
            // Check for network errors
            else if (error.message?.includes('fetch') || error.message?.includes('network')) {
                userMessage = 'Network error. Please check your internet connection.';
            }
            // Generic error with message
            else if (errorObj?.error?.message) {
                userMessage = `AI service error: ${errorObj.error.message.split('\n')[0]}`;
            }
            // Fallback to original error message (cleaned)
            else if (error.message) {
                userMessage = `Failed to generate summary: ${error.message.substring(0, 100)}`;
            }
        } catch (parseError) {
            // If parsing fails, use a generic message
            console.error('Error parsing error message:', parseError);
        }
        
        throw new Error(userMessage);
    }
}

/**
 * Generate summaries for multiple publications with rate limiting
 * @param {Array} publications - Array of publication objects
 * @param {Function} onProgress - Callback function for progress updates (current, total)
 * @returns {Promise<Array>} Array of results with summary and keywords
 */
export async function batchGenerateSummaries(publications, onProgress) {
    const results = [];
    const batchSize = 3; // Process 3 at a time
    const delayMs = 2000; // 2 second delay between batches
    
    for (let i = 0; i < publications.length; i += batchSize) {
        const batch = publications.slice(i, i + batchSize);
        
        // Process batch in parallel
        const batchPromises = batch.map(async (pub) => {
            try {
                const result = await generatePublicationSummary(pub);
                return {
                    id: pub.id,
                    success: true,
                    ...result
                };
            } catch (error) {
                console.error(`Failed to generate summary for publication ${pub.id}:`, error);
                return {
                    id: pub.id,
                    success: false,
                    error: error.message,
                    summary: null,
                    keywords: []
                };
            }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Report progress
        if (onProgress) {
            onProgress(results.length, publications.length);
        }
        
        // Delay before next batch (except for last batch)
        if (i + batchSize < publications.length) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    
    return results;
}

/**
 * Delay helper function
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise}
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
