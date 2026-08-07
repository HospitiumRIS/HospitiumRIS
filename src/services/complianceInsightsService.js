/**
 * Compliance Analytics AI Insights Service
 * Turns a researcher's ethics/IRB, data protection, image integrity, and
 * training compliance metrics into a narrative summary, recommendations, a
 * priority callout, and a benchmark comparison. Falls back to rule-based
 * text if OPENAI_API_KEY is missing or the request fails.
 */

function buildFallbackInsights(metrics) {
  const { overview, ethics, training } = metrics;
  const recommendations = [];

  if (overview.expiringSoon > 0) {
    recommendations.push(`${overview.expiringSoon} ethics approval(s) expire within 90 days — start renewal paperwork now to avoid a lapse.`);
  }
  if (overview.expiredApprovals > 0) {
    recommendations.push(`${overview.expiredApprovals} ethics approval(s) have expired — any active data collection under these should pause until renewed.`);
  }
  if (overview.flaggedImageCases > 0) {
    recommendations.push(`${overview.flaggedImageCases} image integrity case(s) were flagged for manipulation or similarity — review these before submission or publication.`);
  }
  if (overview.overdueTrainings > 0) {
    recommendations.push(`${overview.overdueTrainings} required training(s) are overdue — completing these keeps your compliance record current.`);
  }
  if (recommendations.length === 0) {
    recommendations.push('No urgent compliance action items — approvals, image checks, and training are all current.');
  }

  const nextExpiry = ethics.expiringApprovals?.[0];
  const nextOverdueTraining = training.overdueTrainings?.[0];
  let priorityCallout = { title: null, detail: 'Nothing urgent to flag right now.' };
  if (nextExpiry) {
    priorityCallout = { title: nextExpiry.title, detail: `Ethics approval expires ${new Date(nextExpiry.expiryDate).toLocaleDateString()}.` };
  } else if (nextOverdueTraining) {
    priorityCallout = { title: nextOverdueTraining.title, detail: `Training ended ${new Date(nextOverdueTraining.endDate).toLocaleDateString()} without a completion recorded.` };
  }

  return {
    narrativeSummary: `You have ${overview.activeEthicsApprovals} active ethics approval(s), a ${overview.imageIntegrityCleanRate !== null ? Math.round(overview.imageIntegrityCleanRate) + '%' : 'not yet established'} image integrity clean rate, and ${overview.certificatesHeld} training certificate(s) on file.`,
    recommendations: recommendations.slice(0, 4),
    priorityCallout,
    benchmarkComparison: 'AI-generated benchmarking is unavailable right now (fallback mode) — figures above reflect your own data only.',
    isFallback: true
  };
}

export async function generateComplianceInsights(metrics) {
  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackInsights(metrics);
  }

  const { overview, ethics, imageIntegrity, training } = metrics;

  const compactPayload = {
    overview,
    ethicsStatusCounts: ethics.statusCounts,
    expiringApprovals: ethics.expiringApprovals?.slice(0, 5),
    imageIntegrityStatusCounts: imageIntegrity.statusCounts,
    flaggedImageCases: imageIntegrity.flaggedCases?.slice(0, 5),
    trainingStatusCounts: training.statusCounts,
    overdueTrainings: training.overdueTrainings?.slice(0, 5)
  };

  const prompt = `You are analyzing a researcher's compliance and governance dashboard data (ethics/IRB approvals, data protection, image integrity checks, and training certification). Based on the JSON data below, produce insights.

Data:
${JSON.stringify(compactPayload)}

Respond in JSON with this exact structure:
{
  "narrativeSummary": "2-3 sentence plain-language summary of their overall compliance posture",
  "recommendations": ["2-4 short, specific, actionable recommendations based on THEIR data (e.g. renewing expiring approvals, resolving flagged image cases, completing overdue training)"],
  "priorityCallout": {"title": "the single most time-sensitive compliance item from the data provided, or null if none", "detail": "1 sentence on why it needs attention now"},
  "benchmarkComparison": "1-2 sentences contextualizing their compliance standing against typical expectations for an active researcher, phrased carefully since exact peer data isn't available"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a research compliance assistant. You only make claims supported by the provided data, you treat expiring approvals and flagged integrity cases as high priority, and you always respond with valid JSON.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 700,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content in API response');

    const parsed = JSON.parse(content);

    return {
      narrativeSummary: parsed.narrativeSummary || '',
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      priorityCallout: parsed.priorityCallout || { title: null, detail: '' },
      benchmarkComparison: parsed.benchmarkComparison || '',
      isFallback: false
    };
  } catch (error) {
    console.error('Error generating compliance insights with OpenAI:', error);
    return { ...buildFallbackInsights(metrics), aiError: error.message };
  }
}
