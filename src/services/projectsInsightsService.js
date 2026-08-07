/**
 * Projects Analytics AI Insights Service
 * Turns a researcher's computed proposal/grant/milestone metrics into a
 * narrative summary, actionable recommendations, a risk/priority callout,
 * and a benchmark comparison. Falls back to rule-based text if
 * OPENAI_API_KEY is missing or the request fails.
 */

function buildFallbackInsights(metrics) {
  const { overview, milestoneBreakdown, upcomingMilestones } = metrics;

  const recommendations = [];

  if (overview.totalProposals === 0) {
    recommendations.push('No proposals are linked to your profile yet — add your ORCID iD if you have submitted proposals elsewhere in the system.');
  } else if (overview.approvalRate !== null && overview.approvalRate < 50) {
    recommendations.push('Your proposal approval rate is below 50% — consider requesting reviewer feedback earlier in the drafting process.');
  } else if (overview.approvalRate !== null) {
    recommendations.push('Your proposal approval rate is healthy — keep using the same review and drafting process for future submissions.');
  }

  if (milestoneBreakdown.overdue > 0) {
    recommendations.push(`You have ${milestoneBreakdown.overdue} overdue milestone(s) — resolving these first will protect your on-time completion rate.`);
  }

  if (overview.conversionRate !== null && overview.conversionRate < 25 && overview.totalGrantApplications > 0) {
    recommendations.push('Grant conversion rate is on the low side — consider targeting funders whose priorities closely match your research areas.');
  }

  if (recommendations.length === 0) {
    recommendations.push('No immediate action items — your proposals, milestones, and grants are all tracking normally.');
  }

  const nextMilestone = upcomingMilestones?.[0];

  return {
    narrativeSummary: overview.totalProposals > 0 || overview.totalGrantApplications > 0
      ? `You have ${overview.totalProposals} proposal(s) on record and ${overview.totalGrantApplications} grant application(s), with ${formatMoney(overview.totalAwarded)} awarded so far.`
      : 'No proposal or grant application data is on file yet for your account.',
    recommendations: recommendations.slice(0, 4),
    priorityCallout: nextMilestone
      ? { title: nextMilestone.title, detail: `${nextMilestone.status === 'Overdue' ? 'Overdue' : 'Due'} on ${new Date(nextMilestone.dueDate).toLocaleDateString()} (${nextMilestone.grantTitle}).` }
      : { title: null, detail: 'No upcoming milestones tracked.' },
    benchmarkComparison: 'AI-generated benchmarking is unavailable right now (fallback mode) — figures above reflect your own data only.',
    isFallback: true
  };
}

function formatMoney(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
}

export async function generateProjectsInsights(metrics) {
  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackInsights(metrics);
  }

  const { overview, proposalStatusCounts, pipeline, milestoneBreakdown, upcomingMilestones } = metrics;

  const compactPayload = {
    overview,
    proposalStatusCounts,
    grantPipeline: pipeline,
    milestoneBreakdown,
    nextMilestones: (upcomingMilestones || []).slice(0, 5)
  };

  const prompt = `You are analyzing a researcher's project/proposal/grant analytics dashboard data. Based on the JSON data below, produce insights.

Data:
${JSON.stringify(compactPayload)}

Respond in JSON with this exact structure:
{
  "narrativeSummary": "2-3 sentence plain-language summary of their proposal, milestone, and funding performance",
  "recommendations": ["2-4 short, specific, actionable recommendations based on THEIR data (e.g. addressing overdue milestones, improving approval rate, targeting grant conversion)"],
  "priorityCallout": {"title": "the single most time-sensitive milestone or proposal from the data provided, or null if none", "detail": "1 sentence on why it needs attention now"},
  "benchmarkComparison": "1-2 sentences contextualizing their approval rate / on-time rate / grant conversion rate against typical benchmarks for a researcher at a comparable stage, phrased carefully since exact peer data isn't available"
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
            content: 'You are a research operations assistant. You only make claims supported by the provided data, you avoid overstating precision on estimated figures, and you always respond with valid JSON.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
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
    console.error('Error generating projects insights with OpenAI:', error);
    return { ...buildFallbackInsights(metrics), aiError: error.message };
  }
}
