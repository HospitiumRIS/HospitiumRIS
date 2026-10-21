import sys, os, re
root = sys.argv[1]

def edit(rel, pairs, regex_pairs=()):
    p = os.path.join(root, rel)
    raw = open(p, encoding='utf-8', newline='').read()
    crlf = '\r\n' in raw
    s = re.sub(r'[ \t]+\n', '\n', raw.replace('\r\n', '\n'))
    for old, new in pairs:
        assert s.count(old) == 1, f'{rel}: NOT UNIQUE/FOUND ({s.count(old)}): {old[:110]}'
        s = s.replace(old, new)
    for pattern, new in regex_pairs:
        s, n = re.subn(pattern, new, s, count=1, flags=re.S)
        assert n == 1, f'{rel}: REGEX NOT FOUND: {pattern[:110]}'
    if crlf:
        s = s.replace('\n', '\r\n')
    open(p, 'w', encoding='utf-8', newline='').write(s)
    print('edited', rel)

# ---------------- funders API: auth + masking + non-identifying ids ----------------
edit('src/app/api/foundation/funders/route.js', [
("""import prisma from '@/lib/prisma';

export async function GET() {
  try {
""", """import prisma from '@/lib/prisma';
import { requireFoundationAdmin } from '@/lib/foundation-auth';
import { maskDonor, donorKey } from '@/lib/donor-privacy';

export async function GET() {
  try {
    const auth = await requireFoundationAdmin();
    if (auth.error) return auth.error;

"""),
("""        donorMap.set(key, {
          id: key,""", """        donorMap.set(key, {
          id: donorKey(donation),
          revealDonationId: null,"""),
("""      const donor = donorMap.get(key);
""", """      const donor = donorMap.get(key);
      // Most recent non-anonymous donation is used to fetch full contact details on request.
      if (!donation.isAnonymous && !donor.revealDonationId) donor.revealDonationId = donation.id;
"""),
("""      return {
        id: d.id,
        donorName: d.donorName,
        donorEmail: d.donorEmail,
        donorPhone: d.donorPhone,
        donorType: d.donorType,
        isAnonymous: d.isAnonymous,""", """      return maskDonor({
        id: d.id,
        revealDonationId: d.revealDonationId,
        donorName: d.donorName,
        donorEmail: d.donorEmail,
        donorPhone: d.donorPhone,
        donorType: d.donorType,
        isAnonymous: d.isAnonymous,"""),
("""        status,
        tier,
      };
    });""", """        status,
        tier,
      });
    });"""),
])

# ---------------- donations API: mask list + create response ----------------
edit('src/app/api/foundation/donations/route.js', [
("""import prisma from '@/lib/prisma';
""", """import prisma from '@/lib/prisma';
import { maskDonor } from '@/lib/donor-privacy';
"""),
("""    const processedDonations = donations.map(donation => ({
      ...donation,""", """    const processedDonations = donations.map(donation => maskDonor({
      ...donation,"""),
("""      displayName: donation.isAnonymous ? 'Anonymous Donor' : donation.donorName
    }));""", """      displayName: donation.isAnonymous ? 'Anonymous Donor' : donation.donorName
    }));
    // Note: donor name/email/phone above are masked by maskDonor; full details via /api/foundation/donors/reveal."""),
("""      data: {
        ...result,""", """      data: maskDonor({
        ...result,"""),
("""        displayName: result.isAnonymous ? 'Anonymous Donor' : result.donorName
      },
      message: 'Donation created successfully'""", """        displayName: result.isAnonymous ? 'Anonymous Donor' : result.donorName
      }),
      message: 'Donation created successfully'"""),
])

# ---------------- analytics API: mask top donors ----------------
edit('src/app/api/foundation/donations/analytics/route.js', [
("""import prisma from '@/lib/prisma';
""", """import prisma from '@/lib/prisma';
import { maskName, maskEmail } from '@/lib/donor-privacy';
"""),
("""        name: donor.isAnonymous ? 'Anonymous Donor' : donor.donorName,
        email: donor.donorEmail,""", """        name: donor.isAnonymous ? 'Anonymous Donor' : maskName(donor.donorName, donor.donorType),
        email: donor.isAnonymous ? null : maskEmail(donor.donorEmail),"""),
])

# ---------------- bulk import response ----------------
edit('src/app/api/foundation/donations/bulk/route.js', [
("""import prisma from '@/lib/prisma';
""", """import prisma from '@/lib/prisma';
import { maskName } from '@/lib/donor-privacy';
"""),
("""succeeded.push({ rowIndex, id: newDonation.id, donorName: newDonation.donorName });""",
 """succeeded.push({ rowIndex, id: newDonation.id, donorName: newDonation.isAnonymous ? 'Anonymous Donor' : maskName(newDonation.donorName, newDonation.donorType) });"""),
])

# ---------------- funders page ----------------
edit('src/app/foundation/funders/page.js', [
("""import PageHeader from '@/components/common/PageHeader';
""", """import PageHeader from '@/components/common/PageHeader';
import RevealDonorContact, { useDonorReveal } from '@/components/Foundation/RevealDonorContact';
"""),
("""  const [funders, setFunders]     = useState([]);""", """  const donorReveal = useDonorReveal();
  const [funders, setFunders]     = useState([]);"""),
("""                              <Stack spacing={0.4}>
                                {funder.donorEmail && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                    <EmailIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.74rem' }}>
                                      {funder.donorEmail}
                                    </Typography>
                                  </Box>
                                )}
                                {funder.donorPhone && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                    <PhoneIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.74rem' }}>
                                      {funder.donorPhone}
                                    </Typography>
                                  </Box>
                                )}
                                {!funder.donorEmail && !funder.donorPhone && (
                                  <Typography variant="caption" color="text.disabled">—</Typography>
                                )}
                              </Stack>""", """                              <RevealDonorContact
                                donationId={funder.revealDonationId}
                                email={funder.donorEmail}
                                phone={funder.donorPhone}
                                name={funder.donorName}
                                showName={Boolean(donorReveal.revealed[funder.revealDonationId])}
                                revealed={donorReveal.revealed[funder.revealDonationId] || null}
                                loading={donorReveal.loadingId === funder.revealDonationId}
                                onReveal={donorReveal.reveal}
                                onHide={donorReveal.hide}
                              />"""),
])

# ---------------- donations page ----------------
edit('src/app/foundation/donations/page.js', [
("""import PageHeader from '@/components/common/PageHeader';
""", """import PageHeader from '@/components/common/PageHeader';
import RevealDonorContact, { useDonorReveal } from '@/components/Foundation/RevealDonorContact';
"""),
("""  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });""",
 """  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const donorReveal = useDonorReveal();"""),
("""      if (!donation.isAnonymous && donation.donorEmail) {
        uniqueDonors.add(donation.donorEmail);
      } else if (!donation.isAnonymous && donation.donorName) {
        uniqueDonors.add(donation.donorName);""", """      if (!donation.isAnonymous && donation.donorKey) {
        uniqueDonors.add(donation.donorKey);
      } else if (!donation.isAnonymous && donation.donorName) {
        uniqueDonors.add(donation.donorName);"""),
("""                    if (!donation.isAnonymous && donation.donorEmail) {
                      uniqueDonorsForCampaign.add(donation.donorEmail);
                    } else if (!donation.isAnonymous && donation.donorName) {""", """                    if (!donation.isAnonymous && donation.donorKey) {
                      uniqueDonorsForCampaign.add(donation.donorKey);
                    } else if (!donation.isAnonymous && donation.donorName) {"""),
("""                                              {donation.isAnonymous ? 'Anonymous Donor' : (donation.donorName || 'Unknown Donor')}
                                            </Typography>
                                            <Typography variant="body2" sx={{
                                              color: 'text.secondary',
                                              fontSize: '0.85rem'
                                            }}>
                                              {donation.donorEmail || 'No email'}
                                            </Typography>""", """                                              {donation.isAnonymous ? 'Anonymous Donor' : (donorReveal.revealed[donation.id]?.donorName || donation.donorName || 'Unknown Donor')}
                                            </Typography>
                                            {donation.isAnonymous ? (
                                              <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                                Contact hidden
                                              </Typography>
                                            ) : (
                                              <RevealDonorContact
                                                donationId={donation.id}
                                                email={donation.donorEmail}
                                                phone={donation.donorPhone}
                                                revealed={donorReveal.revealed[donation.id] || null}
                                                loading={donorReveal.loadingId === donation.id}
                                                onReveal={donorReveal.reveal}
                                                onHide={donorReveal.hide}
                                                dense={false}
                                                emptyLabel="No contact details"
                                              />
                                            )}"""),
])

# ---------------- dialogs: masked-field hints + reveal in donor details ----------------
edit('src/app/foundation/donations/components/DonationDialogs.jsx', [
("""import dayjs from 'dayjs';
""", """import dayjs from 'dayjs';
import RevealDonorContact, { useDonorReveal } from '@/components/Foundation/RevealDonorContact';

const MASKED_HINT = 'Hidden for privacy. Leave as is to keep the saved value, or replace it entirely to change it.';
const isMaskedValue = (v) => typeof v === 'string' && v.includes('*');
"""),
("""                    value={donationForm.donorName || ''}
                    onChange={(e) => setDonationForm(prev => ({ ...prev, donorName: e.target.value }))}
                    required
                    disabled={donationForm.isAnonymous}""", """                    value={donationForm.donorName || ''}
                    onChange={(e) => setDonationForm(prev => ({ ...prev, donorName: e.target.value }))}
                    onFocus={(e) => { if (isMaskedValue(donationForm.donorName)) e.target.select(); }}
                    helperText={isMaskedValue(donationForm.donorName) ? MASKED_HINT : undefined}
                    required
                    disabled={donationForm.isAnonymous}"""),
("""                    value={donationForm.donorEmail || ''}
                    onChange={(e) => setDonationForm(prev => ({ ...prev, donorEmail: e.target.value }))}
                    disabled={donationForm.isAnonymous}""", """                    value={donationForm.donorEmail || ''}
                    onChange={(e) => setDonationForm(prev => ({ ...prev, donorEmail: e.target.value }))}
                    onFocus={(e) => { if (isMaskedValue(donationForm.donorEmail)) e.target.select(); }}
                    helperText={isMaskedValue(donationForm.donorEmail) ? MASKED_HINT : undefined}
                    disabled={donationForm.isAnonymous}"""),
("""              <Typography variant="h6" gutterBottom>
                {selectedDonation.isAnonymous ? 'Anonymous Donor' : selectedDonation.donorName}
              </Typography>""", """              <Typography variant="h6" gutterBottom>
                {selectedDonation.isAnonymous ? 'Anonymous Donor' : (donorReveal.revealed[selectedDonation.id]?.donorName || selectedDonation.donorName)}
              </Typography>
              {!selectedDonation.isAnonymous ? (
                <Box sx={{ mb: 1.5 }}>
                  <RevealDonorContact
                    donationId={selectedDonation.id}
                    email={selectedDonation.donorEmail}
                    phone={selectedDonation.donorPhone}
                    revealed={donorReveal.revealed[selectedDonation.id] || null}
                    loading={donorReveal.loadingId === selectedDonation.id}
                    onReveal={donorReveal.reveal}
                    onHide={donorReveal.hide}
                    dense={false}
                    emptyLabel="No contact details on record"
                  />
                  {donorReveal.error ? <Typography variant="caption" color="error">{donorReveal.error}</Typography> : null}
                </Box>
              ) : null}"""),
], regex_pairs=[
    # add the hook as the first line inside the DonationDialogs component body
    (r"(const DonationDialogs = \(\{.*?\}\) => \{\n)", r"\1  const donorReveal = useDonorReveal();\n"),
])
print('all done')
