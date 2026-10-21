import sys, os, re
root = sys.argv[1]

def edit(rel, pairs):
    p = os.path.join(root, rel)
    raw = open(p, encoding='utf-8', newline='').read()
    crlf = '\r\n' in raw
    s = re.sub(r'[ \t]+\n', '\n', raw.replace('\r\n', '\n'))
    for old, new in pairs:
        assert s.count(old) == 1, f'{rel}: NOT UNIQUE/FOUND ({s.count(old)}): {old[:110]}'
        s = s.replace(old, new)
    if crlf:
        s = s.replace('\n', '\r\n')
    open(p, 'w', encoding='utf-8', newline='').write(s)
    print('edited', rel)

IMPORT_OLD = "import prisma from '@/lib/prisma';\n"

edit('src/app/api/foundation/campaigns/route.js', [
(IMPORT_OLD, IMPORT_OLD + "import { maskDonor } from '@/lib/donor-privacy';\n"),
("""      return {
        ...campaign,
        raisedAmount: actualRaisedAmount, // Use calculated amount""", """      return {
        ...campaign,
        donations: campaign.donations.map(maskDonor),
        raisedAmount: actualRaisedAmount, // Use calculated amount"""),
("""        recentDonations: campaign.donations.slice(0, 5)
      };""", """        recentDonations: campaign.donations.slice(0, 5).map(maskDonor)
      };"""),
])

edit('src/app/api/foundation/campaigns/[id]/route.js', [
(IMPORT_OLD, IMPORT_OLD + "import { maskDonor, maskName, maskEmail } from '@/lib/donor-privacy';\n"),
("""          name: donation.donorName,
          email: donation.donorEmail,
          donationCount: 1,""", """          name: donation.isAnonymous ? 'Anonymous Donor' : maskName(donation.donorName, donation.donorType),
          email: donation.isAnonymous ? null : maskEmail(donation.donorEmail),
          donationCount: 1,"""),
("""    const processedCampaign = {
      ...campaign,
      raisedAmount: actualRaisedAmount,""", """    const processedCampaign = {
      ...campaign,
      donations: campaign.donations.map(maskDonor),
      raisedAmount: actualRaisedAmount,"""),
])

edit('src/app/api/foundation/analytics/route.js', [
(IMPORT_OLD, IMPORT_OLD + "import { maskName, maskEmail } from '@/lib/donor-privacy';\n"),
("""          name: d.donorName,
          email: d.donorEmail,
          type: d.donorType || 'Individual',""", """          name: d.isAnonymous ? 'Anonymous Donor' : maskName(d.donorName, d.donorType),
          email: d.isAnonymous ? null : maskEmail(d.donorEmail),
          type: d.donorType || 'Individual',"""),
("""        id: d.id,
        donorName: d.donorName,
        amount: parseFloat(d.amount),""", """        id: d.id,
        donorName: d.isAnonymous ? 'Anonymous Donor' : maskName(d.donorName, d.donorType),
        amount: parseFloat(d.amount),"""),
])

edit('src/app/api/foundation/financial/central-fund-pool/route.js', [
(IMPORT_OLD, IMPORT_OLD + "import { maskName } from '@/lib/donor-privacy';\n"),
("""      donorName: donation.donorName,
      donorType: donation.donorType,""", """      donorName: donation.isAnonymous ? 'Anonymous Donor' : maskName(donation.donorName, donation.donorType),
      donorType: donation.donorType,"""),
])
print('done')
