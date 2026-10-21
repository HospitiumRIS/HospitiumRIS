import sys, os, re
root = sys.argv[1]

def load(rel):
    p = os.path.join(root, rel)
    raw = open(p, encoding='utf-8', newline='').read()
    crlf = '\r\n' in raw
    return p, crlf, re.sub(r'[ \t]+\n', '\n', raw.replace('\r\n', '\n'))

def save(p, crlf, s):
    if crlf:
        s = s.replace('\n', '\r\n')
    open(p, 'w', encoding='utf-8', newline='').write(s)
    print('edited', p)

def rep(s, old, new, rel):
    assert s.count(old) == 1, f'{rel}: NOT UNIQUE/FOUND ({s.count(old)}): {old[:100]}'
    return s.replace(old, new)

# 1) analytics API: researcher list with lead + collaborative output
rel = 'src/app/api/institution/analytics/route.js'
p, crlf, s = load(rel)
s = rep(s, "import prisma, { ensurePrismaConnected } from '@/lib/prisma';\n",
        "import prisma, { ensurePrismaConnected } from '@/lib/prisma';\nimport { computeResearcherOutputs } from '@/lib/researcher-output';\n", rel)
start = s.index("    const researcherOutput = await prisma.user.findMany({")
end = s.index("      .slice(0, 10);\n", start) + len("      .slice(0, 10);\n")
s = s[:start] + """    const researcherOutput = await prisma.user.findMany({
      where: { AND: [memberWhere, { accountType: 'RESEARCHER' }] },
      select: {
        id: true,
        givenName: true,
        familyName: true,
        email: true,
        orcidId: true,
        avatarUrl: true,
        primaryInstitution: true,
        researchProfile: { select: { department: true, academicTitle: true, hIndex: true, citationCount: true } },
      },
    });

    // Lead + collaborative output (co-authorship, manuscript collaboration, co-investigation).
    const outputsByResearcher = await computeResearcherOutputs(researcherOutput);

    const topResearchers = researcherOutput
      .map((researcher) => {
        const fullName = `${researcher.givenName || ''} ${researcher.familyName || ''}`.trim() || researcher.email;
        const output = outputsByResearcher.get(researcher.id);
        return {
          id: researcher.id,
          email: researcher.email,
          givenName: researcher.givenName,
          familyName: researcher.familyName,
          orcidId: researcher.orcidId,
          avatarUrl: researcher.avatarUrl || null,
          name: fullName,
          displayName: [researcher.researchProfile?.academicTitle, researcher.givenName, researcher.familyName].filter(Boolean).join(' ') || fullName,
          department: researcher.researchProfile?.department || null,
          institution: researcher.primaryInstitution || institution.name,
          hIndex: researcher.researchProfile?.hIndex || 0,
          citations: researcher.researchProfile?.citationCount || 0,
          output,
          totalOutput: output.totals.all,
          leadOutput: output.totals.lead,
          collaborativeOutput: output.totals.collaborative,
          manuscriptCount: output.manuscripts.total,
          proposalCount: output.proposals.total,
          publicationCount: output.publications.total,
        };
      })
      .sort((a, b) => b.totalOutput - a.totalOutput || a.name.localeCompare(b.name));
""" + s[end:]
save(p, crlf, s)

# 2) dashboard: replace the researchers card with the interactive section
rel = 'src/app/institution/page.js'
p, crlf, s = load(rel)
start = s.index("          {/* Enhanced Top Researchers */}")
end_marker = "\n        {/* Enhanced Recent Activity Section */}"
end_idx = s.index(end_marker, start)
block = s[start:end_idx]
# block ends with: "          </Card>\n        </Box>\n" -> keep the closing </Box>
close = block.rindex("          </Card>")
s = s[:start] + "          {/* Researchers by output (lead + collaborative) */}\n          <InstitutionResearchersSection researchers={analyticsData?.topResearchers || []} />\n" + block[close + len("          </Card>\n"):] + s[end_idx:]
s = rep(s, "import PageHeader from '@/components/common/PageHeader';\n",
        "import PageHeader from '@/components/common/PageHeader';\nimport InstitutionResearchersSection from '@/components/Institution/InstitutionResearchersSection';\n", rel)
save(p, crlf, s)

# 3) ScholarMetrics: configurable co-author profile link
rel = 'src/components/Researcher/ScholarMetrics.jsx'
p, crlf, s = load(rel)
s = rep(s, """function coauthorHref(c) {
  if (c.hospitiumUserId) return { href: `/researcher/profile/${c.hospitiumUserId}`, external: false };""",
"""function coauthorHref(c, profileBasePath = '/researcher/profile') {
  if (c.hospitiumUserId) return { href: `${profileBasePath}/${c.hospitiumUserId}`, external: false };""", rel)
s = rep(s, "export function CoauthorsCard({ metrics, initialCount = 8 }) {",
        "export function CoauthorsCard({ metrics, initialCount = 8, profileBasePath = '/researcher/profile' }) {", rel)
s = rep(s, "const { href, external } = coauthorHref(c);", "const { href, external } = coauthorHref(c, profileBasePath);", rel)
save(p, crlf, s)
print('done')
