import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../../lib/auth-server';
import { getProjectsMetrics } from '../../../../../../lib/projectsMetrics';
import { generateProjectsInsights } from '../../../../../../services/projectsInsightsService';

// Separate, slower endpoint for AI-generated insights so the main metrics
// page can render immediately while this loads independently.
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metrics = await getProjectsMetrics(user.id);
    const insights = await generateProjectsInsights(metrics);

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error generating projects insights:', error);
    return NextResponse.json({ error: 'Failed to generate projects insights' }, { status: 500 });
  }
}
