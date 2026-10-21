import sys, os, re
p = os.path.join(sys.argv[1], 'src/lib/projectsMetrics.js')
raw = open(p, encoding='utf-8', newline='').read()
crlf = '\r\n' in raw
s = re.sub(r'[ \t]+\n', '\n', raw.replace('\r\n', '\n'))

def rep(old, new):
    global s
    assert s.count(old) == 1, f'NOT UNIQUE/FOUND ({s.count(old)}): {old[:100]}'
    s = s.replace(old, new)

rep("import prisma from './prisma';\n", "import prisma from './prisma';\nimport { computeResearcherOutputs } from './researcher-output';\n")
rep("""    select: { id: true, orcidId: true },
  });

  const proposalIds = user ? await resolveProposalIds(user) : [];""", """    select: { id: true, orcidId: true, email: true },
  });

  const linkedIds = user ? await resolveProposalIds(user) : [];
  // Include proposals where the researcher is PI or co-investigator (matched on account, ORCID or email).
  const roleById = new Map();
  if (user) {
    const outputs = await computeResearcherOutputs([user], { withItems: true });
    (outputs.get(user.id)?.items?.proposals || []).forEach((item) => roleById.set(item.id, item.role));
  }
  const proposalIds = [...new Set([...linkedIds, ...roleById.keys()])];""")
rep("""    return {
      id: proposal.id,
      title: proposal.title,
      status: proposal.status,
      statusLabel: labelStatus(proposal.status),""", """    const role = roleById.get(proposal.id);
    return {
      id: proposal.id,
      title: proposal.title,
      role: role === 'pi' ? 'Principal investigator' : role === 'coInvestigator' ? 'Co-investigator' : 'Linked',
      roleKey: role || 'linked',
      status: proposal.status,
      statusLabel: labelStatus(proposal.status),""")
rep("""      nextDue: next?.dueDate || proposal.endDate,""", """      nextDue: next?.dueDate || proposal.endDate,
      startDate: proposal.startDate,
      endDate: proposal.endDate,
      overdueMilestones: milestones.filter((item) => !isComplete(item.status) && parseDate(item.dueDate) && parseDate(item.dueDate) < now).length,""")
rep("""    overview: {
      totalProposals,""", """    overview: {
      totalProposals,
      asPrincipalInvestigator: [...roleById.values()].filter((r) => r === 'pi').length,
      asCoInvestigator: [...roleById.values()].filter((r) => r === 'coInvestigator').length,""")
if crlf:
    s = s.replace('\n', '\r\n')
open(p, 'w', encoding='utf-8', newline='').write(s)
print('edited', p)
