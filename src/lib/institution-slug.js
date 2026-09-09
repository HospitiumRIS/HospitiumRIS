export function slugify(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function uniqueInstitutionSlug(db, base, excludeId = null) {
  const root = slugify(base) || 'institution';
  let candidate = root;
  let n = 2;

  while (true) {
    const existing = await db.institution.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) {
      return candidate;
    }
    candidate = `${root}-${n++}`;
  }
}
