import sys, os
root = sys.argv[1]

def edit(rel, pairs):
    p = os.path.join(root, rel)
    raw = open(p, encoding='utf-8', newline='').read()
    crlf = '\r\n' in raw
    s = raw.replace('\r\n', '\n')
    for old, new in pairs:
        assert s.count(old) == 1, f'{rel}: NOT UNIQUE/FOUND: {old[:90]}'
        s = s.replace(old, new)
    if crlf:
        s = s.replace('\n', '\r\n')
    open(p, 'w', encoding='utf-8', newline='').write(s)
    print('edited', rel)

# Proposals are owned via the PI's ORCID; include proposals led by institution members.
edit('src/lib/institution-scope.js', [
("""  const [tracking, byDepartment, byMemberActivity] = await Promise.all([""",
"""  const memberOrcids = ids.length
    ? (await prisma.user.findMany({
        where: { id: { in: ids }, orcidId: { not: null } },
        select: { orcidId: true },
      }))
        .map((entry) => String(entry.orcidId).replace(/^https?:\\/\\/orcid\\.org\\//i, '').trim())
        .filter(Boolean)
    : [];
  const orcidVariants = memberOrcids.flatMap((orcid) => [orcid, `https://orcid.org/${orcid}`]);

  const [tracking, byDepartment, byMemberActivity, byMemberPi] = await Promise.all(["""),
("""          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  return [
    ...new Set([
      ...tracking.map((entry) => entry.proposalId),
      ...byDepartment.map((entry) => entry.id),
      ...byMemberActivity.map((entry) => entry.id),
    ]),
  ];""",
"""          select: { id: true },
        })
      : Promise.resolve([]),
    orcidVariants.length
      ? prisma.proposal.findMany({
          where: { principalInvestigatorOrcid: { in: orcidVariants } },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  return [
    ...new Set([
      ...tracking.map((entry) => entry.proposalId),
      ...byDepartment.map((entry) => entry.id),
      ...byMemberActivity.map((entry) => entry.id),
      ...byMemberPi.map((entry) => entry.id),
    ]),
  ];"""),
])

# Researcher headcount and the top-researcher list are not "created in period" metrics.
edit('src/app/api/institution/analytics/route.js', [
("""      prisma.user.count({ where: withDateFilter(researcherWhere, dateFilter) }),""",
"""      prisma.user.count({ where: researcherWhere }),"""),
("""    const researcherOutput = await prisma.user.findMany({
      where: withDateFilter(
        { AND: [memberWhere, { accountType: 'RESEARCHER' }] },
        dateFilter
      ),""",
"""    const researcherOutput = await prisma.user.findMany({
      where: { AND: [memberWhere, { accountType: 'RESEARCHER' }] },"""),
("""      prisma.user.groupBy({
        by: ['primaryInstitution'],
        where: withDateFilter(
          {
            AND: [
              memberWhere,
              { accountType: 'RESEARCHER' },
              { primaryInstitution: { not: null } },
            ],
          },
          dateFilter
        ),""",
"""      prisma.user.groupBy({
        by: ['primaryInstitution'],
        where: {
          AND: [
            memberWhere,
            { accountType: 'RESEARCHER' },
            { primaryInstitution: { not: null } },
          ],
        },"""),
("""        lte: new Date(endDate),
      };""",
"""        lte: new Date(`${endDate}T23:59:59.999`),
      };"""),
])
print('done')
