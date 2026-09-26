import prisma from './prisma.js';
import { canAccessProposal } from './proposal-files.js';

export async function canAccessProposalStoredFile(user, row) {
  if (!row?.module?.startsWith('PROPOSAL_')) return true;

  const proposal = await prisma.proposal.findUnique({
    where: { id: row.entityId },
  });

  return canAccessProposal(user, proposal);
}
