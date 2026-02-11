import { NextResponse } from 'next/server';
import { batchGenerateSummaries } from '../../../../services/geminiService';

/**
 * POST /api/ai/summarize
 * Generate AI summaries and keywords for publications
 * 
 * Request body: { publications: Array<{id, title, abstract}> }
 * Response: { results: Array<{id, success, summary, keywords, error}> }
 */
export async function POST(request) {
    try {
        const { publications } = await request.json();

        if (!publications || !Array.isArray(publications)) {
            return NextResponse.json(
                { error: 'Invalid request: publications array is required' },
                { status: 400 }
            );
        }

        if (publications.length === 0) {
            return NextResponse.json({ results: [] });
        }

        // Check if API key is configured
        if (!process.env.GOOGLE_GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'Google Gemini API key is not configured' },
                { status: 500 }
            );
        }

        // Generate summaries with progress tracking
        const results = await batchGenerateSummaries(publications, (current, total) => {
            console.log(`Generated ${current}/${total} summaries`);
        });

        return NextResponse.json({ results });

    } catch (error) {
        console.error('Error in /api/ai/summarize:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate summaries' },
            { status: 500 }
        );
    }
}
