import prisma from './prisma.js';
import { canAccessProposal } from './proposals/visibility.js';

export async function canAccessProposalStoredFile(user, row) {
  // Proposal files and project expense receipts (#179) are stored against the proposal.
  if (!row?.module?.startsWith('PROPOSAL_') && row?.module !== 'PROJECT_EXPENSE_RECEIPT') return true;

  const proposal = await prisma.proposal.findUnique({
    where: { id: row.entityId },
  });

  return proposal ? canAccessProposal(user, proposal) : false;
}
