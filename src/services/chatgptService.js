/**
 * OpenAI ChatGPT Service
 * Handles AI-powered summary generation and keyword extraction for publications
 */

/**
 * Generate summary and keywords for a single publication using ChatGPT
 * @param {Object} publication - Publication object with title and abstract
 * @returns {Promise<{summary: string, keywords: string[]}>}
 */
export async function generatePublicationSummary(publication) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured');
    }

    const prompt = `Give a summary of this article, along with key research terms/keywords.

Title: ${publication.title}
Abstract: ${publication.abstract || 'No abstract available'}

Please respond in JSON format with the following structure:
{
  "summary": "A concise summary",
  "keywords": ["keyword1", "keyword2", "keyword3", ...]
}`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a research assistant that provides concise summaries and extracts key terms from academic publications. Always respond with valid JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1024,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        // Extract the content from the response
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('No content in API response');
        }

        console.log('=== CHATGPT RESPONSE ===');
        console.log(content);
        console.log('=== END RESPONSE ===');

        // Parse the JSON response
        const parsed = JSON.parse(content);

        return {
            summary: parsed.summary || '',
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords : []
        };
    } catch (error) {
        console.error('Error generating summary with ChatGPT:', error);

        // Parse and format user-friendly error messages
        let userMessage = 'Failed to generate AI summary';

        try {
            // Check for quota/rate limit errors
            if (error.message?.includes('quota') || error.message?.includes('rate_limit_exceeded')) {
                userMessage = 'API quota exceeded. Please check your OpenAI usage limits and try again later.';
            }
            // Check for API key errors
            else if (error.message?.includes('API key') || error.message?.includes('Incorrect API key') || error.message?.includes('invalid_api_key')) {
                userMessage = 'Invalid or missing OpenAI API key. Please check your configuration.';
            }
            // Check for network errors
            else if (error.message?.includes('fetch') || error.message?.includes('network')) {
                userMessage = 'Network error. Please check your internet connection.';
            }
            // Check for model errors
            else if (error.message?.includes('model')) {
                userMessage = 'Model error. The requested model may not be available.';
            }
            // Use the error message if available
            else if (error.message) {
                userMessage = `Failed to generate summary: ${error.message.substring(0, 100)}`;
            }
        } catch (parseError) {
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
