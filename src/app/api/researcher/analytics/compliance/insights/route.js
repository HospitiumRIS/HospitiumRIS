import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../../lib/auth-server';
import { getComplianceMetrics } from '../../../../../../lib/complianceMetrics';
import { generateComplianceInsights } from '../../../../../../services/complianceInsightsService';

// Separate, slower endpoint for AI-generated insights so the main metrics
// page can render immediately while this loads independently.
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metrics = await getComplianceMetrics(user.id);
    const insights = await generateComplianceInsights(metrics);

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error generating compliance insights:', error);
    return NextResponse.json({ error: 'Failed to generate compliance insights' }, { status: 500 });
  }
}
