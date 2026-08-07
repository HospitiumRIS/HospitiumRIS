import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../../lib/auth-server';
import { getImpactMetrics } from '../../../../../../lib/impactMetrics';
import { generateImpactInsights } from '../../../../../../services/impactInsightsService';

// Separate, slower endpoint for AI-generated insights so the main metrics
// page can render immediately while this loads independently.
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metrics = await getImpactMetrics(user.id);
    const insights = await generateImpactInsights(metrics);

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error generating impact insights:', error);
    return NextResponse.json({ error: 'Failed to generate impact insights' }, { status: 500 });
  }
}
