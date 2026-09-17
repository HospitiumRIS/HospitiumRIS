/**
 * Article-level ranking for import search results.
 *
 * Uses NIH iCite Relative Citation Ratio (field- and year-normalized,
 * the closest open analog of FWCI) plus study-design hierarchy so
 * very new papers are not buried solely because they have no citations yet.
 */

const EVIDENCE_RULES = [
  { score: 100, label: 'Meta-analysis', types: ['meta-analysis'], title: ['meta-analysis', 'meta analysis'] },
  { score: 95, label: 'Systematic review', types: ['systematic review'], title: ['systematic review'] },
  { score: 88, label: 'Randomized trial', types: ['randomized controlled trial', 'randomised controlled trial'], title: ['randomized controlled', 'randomised controlled'] },
  { score: 78, label: 'Clinical trial', types: ['clinical trial', 'controlled clinical trial', 'pragmatic clinical trial'], title: ['clinical trial', 'phase iii', 'phase 3'] },
  { score: 62, label: 'Observational study', types: ['observational study', 'comparative study', 'multicenter study'], title: ['cohort', 'case-control', 'case control', 'observational'] },
  { score: 50, label: 'Review', types: ['review'], title: ['narrative review'] },
  { score: 28, label: 'Case report', types: ['case reports', 'case report'], title: ['case report', 'case series'] },
  { score: 20, label: 'Commentary', types: ['letter', 'editorial', 'comment', 'news'], title: ['letter to the editor', 'commentary', 'editorial'] },
];

function includesAny(haystack, needles) {
  return needles.some((needle) => haystack.includes(needle));
}

export function evidenceFromPublication(pubTypes = [], title = '') {
  const types = (Array.isArray(pubTypes) ? pubTypes : []).map((item) => String(item).toLowerCase());
  const text = String(title || '').toLowerCase();

  for (const rule of EVIDENCE_RULES) {
    const typeHit = types.some((type) => includesAny(type, rule.types));
    const titleHit = includesAny(text, rule.title);
    if (typeHit || titleHit) {
      return { score: rule.score, label: rule.label };
    }
  }

  return { score: 42, label: 'Article' };
}

function clampScore(value) {
  if (value == null || Number.isNaN(Number(value))) return 0;
  return Math.max(0, Math.min(100, Number(value)));
}

export function computeQualityScore({
  rcr,
  nihPercentile,
  citationCount = 0,
  citationsPerYear,
  evidenceScore = 42,
}) {
  const citeScore = clampScore((Math.log10((citationCount || 0) + 1) / Math.log10(1001)) * 100);
  const cpyScore = citationsPerYear != null
    ? clampScore((Math.log10(Math.max(citationsPerYear, 0) + 1) / Math.log10(51)) * 100)
    : citeScore;
  const rcrScore = rcr != null && Number(rcr) > 0
    ? clampScore((Number(rcr) / 3.5) * 100)
    : null;
  const percentile = nihPercentile != null ? clampScore(nihPercentile) : null;

  if (rcrScore != null || percentile != null) {
    const impact = rcrScore != null ? rcrScore : percentile;
    return Math.round(
      0.46 * impact +
      0.16 * (percentile ?? impact) +
      0.16 * cpyScore +
      0.22 * evidenceScore
    );
  }

  return Math.round(0.48 * evidenceScore + 0.38 * cpyScore + 0.14 * citeScore);
}

export function qualityBand(score) {
  if (score >= 75) return 'High';
  if (score >= 55) return 'Solid';
  if (score >= 35) return 'Useful';
  return 'Emerging';
}
