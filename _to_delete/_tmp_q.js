const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async()=>{const r=await p.proposal.findUnique({where:{id:'cmvh2srvy0000ql014wvikl7y'},select:{milestones:true,deliverables:true,coInvestigators:true,budgetDocuments:true,ethicsApprovalStatus:true,principalInvestigatorOrcid:true,dataManagementPlan:true,otherRelatedFiles:true,ethicsDocuments:true,userId:true}});console.log(JSON.stringify(r,null,1).slice(0,6000));await p.$disconnect();})().catch(e=>{console.error(e.message);process.exit(1)});
