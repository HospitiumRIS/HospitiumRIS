/**
 * Research Impact AI Insights Service
 * Uses OpenAI to turn a researcher's computed impact metrics into a narrative
 * summary, growth recommendations, a standout-publication callout, and a
 * peer/field comparison. Falls back to rule-based text if OPENAI_API_KEY is
 * missing or the request fails, so the page never breaks without it.
 */

function buildFallbackInsights(metrics) {
  const { overview, topPublications } = metrics;
  const top = topPublications?.[0];

  return {
    narrativeSummary: `You have ${overview.totalPublications} publications with ${overview.totalCitations} tracked citations and an h-index of ${overview.hIndex}.`,
    growthRecommendations: [
      overview.collaborators < 5 ? 'Expand your co-author network — cross-institution collaborations tend to raise citation counts.' : 'Keep nurturing your existing collaborator network; it is a meaningful share of your output.',
      overview.totalPublications > 0 && overview.hIndex / overview.totalPublications < 0.3 ? 'Consider targeting higher-visibility journals for upcoming submissions to lift your h-index.' : 'Your h-index is tracking well relative to your publication count.'
    ],
    standoutPublication: top
      ? { title: top.title, reason: `Your most-cited work, with ${top.citations} tracked citations${top.year ? ` since ${top.year}` : ''}.` }
      : { title: null, reason: 'No publications with tracked citations yet.' },
    peerComparison: 'AI-generated peer benchmarking is unavailable right now (fallback mode) — figures above reflect your own data only.',
    isFallback: true
  };
}

export async function generateImpactInsights(metrics) {
  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackInsights(metrics);
  }

  const { overview, topPublications, trajectory, collaborationNetwork } = metrics;

  const compactPayload = {
    overview,
    trajectory,
    topPublications: (topPublications || []).slice(0, 5).map((p) => ({ title: p.title, citations: p.citations, year: p.year, journal: p.journal })),
    topCollaboratingInstitutions: (collaborationNetwork || []).slice(0, 5)
  };

  const prompt = `You are analyzing a researcher's impact analytics dashboard data. Based on the JSON data below, produce insights.

Data:
${JSON.stringify(compactPayload)}

Respond in JSON with this exact structure:
{
  "narrativeSummary": "2-3 sentence plain-language summary of what's driving their recent citation/publication trend",
  "growthRecommendations": ["2-4 short, specific, actionable recommendations based on THEIR data"],
  "standoutPublication": {"title": "title of their strongest publication from the list provided", "reason": "1-2 sentences on why it stands out"},
  "peerComparison": "1-2 sentences contextualizing their h-index/citations/publication count against typical benchmarks for a researcher at a comparable stage, phrased carefully since exact peer data isn't available"
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
            content: 'You are a research analytics assistant. You only make claims supported by the provided data, you avoid overstating precision on estimated figures, and you always respond with valid JSON.'
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
      growthRecommendations: Array.isArray(parsed.growthRecommendations) ? parsed.growthRecommendations : [],
      standoutPublication: parsed.standoutPublication || { title: null, reason: '' },
      peerComparison: parsed.peerComparison || '',
      isFallback: false
    };
  } catch (error) {
    console.error('Error generating impact insights with OpenAI:', error);
    return { ...buildFallbackInsights(metrics), aiError: error.message };
  }
}
