import { randomBytes } from 'node:crypto';
import { ensurePrismaConnected } from './prisma';
import { resolveInstitutionScope } from './image-integrity-institution';
import { getOwnedInstitution } from './institution-admin';

function createRecordId() {
  return `c${randomBytes(12).toString('hex')}`;
}

function sqlLabUnitDelegate(db) {
  return {
    async findMany({ where = {} } = {}) {
      const { institutionId } = where;
      const rows = where.isActive === true
        ? await db.$queryRaw`
            SELECT lu.*, (
              SELECT COUNT(*)::int FROM image_integrity_cases c WHERE c."labUnitId" = lu.id
            ) AS "submissionCount"
            FROM image_integrity_lab_units lu
            WHERE lu."institutionId" = ${institutionId} AND lu."isActive" = true
            ORDER BY lu."sortOrder" ASC, lu.name ASC
          `
        : await db.$queryRaw`
            SELECT lu.*, (
              SELECT COUNT(*)::int FROM image_integrity_cases c WHERE c."labUnitId" = lu.id
            ) AS "submissionCount"
            FROM image_integrity_lab_units lu
            WHERE lu."institutionId" = ${institutionId}
            ORDER BY lu."sortOrder" ASC, lu.name ASC
          `;
      return rows.map((row) => ({
        ...row,
        _count: { cases: Number(row.submissionCount || 0) },
      }));
    },
    async findFirst({ where = {} } = {}) {
      let rows = [];
      if (where.id && where.institutionId && where.isActive === true) {
        rows = await db.$queryRaw`
          SELECT * FROM image_integrity_lab_units
          WHERE id = ${where.id} AND "institutionId" = ${where.institutionId} AND "isActive" = true
          LIMIT 1
        `;
      } else if (where.id && where.institutionId) {
        rows = await db.$queryRaw`
          SELECT * FROM image_integrity_lab_units
          WHERE id = ${where.id} AND "institutionId" = ${where.institutionId}
          LIMIT 1
        `;
      } else if (where.NOT?.id) {
        rows = await db.$queryRaw`
          SELECT * FROM image_integrity_lab_units
          WHERE "institutionId" = ${where.institutionId}
            AND LOWER(name) = LOWER(${where.name.equals})
            AND id <> ${where.NOT.id}
          LIMIT 1
        `;
      } else if (where.name?.equals) {
        rows = await db.$queryRaw`
          SELECT * FROM image_integrity_lab_units
          WHERE "institutionId" = ${where.institutionId}
            AND LOWER(name) = LOWER(${where.name.equals})
          LIMIT 1
        `;
      }
      return rows[0] || null;
    },
    async create({ data }) {
      const id = createRecordId();
      const rows = await db.$queryRaw`
        INSERT INTO image_integrity_lab_units (
          id, "institutionId", name, description, "isActive", "sortOrder", "createdAt", "updatedAt"
        )
        VALUES (
          ${id}, ${data.institutionId}, ${data.name}, ${data.description},
          ${data.isActive}, ${data.sortOrder}, NOW(), NOW()
        )
        RETURNING *
      `;
      return rows[0];
    },
    async update({ where, data }) {
      const currentRows = await db.$queryRaw`
        SELECT * FROM image_integrity_lab_units WHERE id = ${where.id} LIMIT 1
      `;
      const current = currentRows[0];
      if (!current) return null;
      const name = data.name !== undefined ? data.name : current.name;
      const description = data.description !== undefined ? data.description : current.description;
      const isActive = data.isActive !== undefined ? data.isActive : current.isActive;
      const sortOrder = data.sortOrder !== undefined ? data.sortOrder : current.sortOrder;
      await db.$executeRaw`
        UPDATE image_integrity_lab_units
        SET
          name = ${name},
          description = ${description},
          "isActive" = ${isActive},
          "sortOrder" = ${sortOrder},
          "updatedAt" = NOW()
        WHERE id = ${where.id}
      `;
      const rows = await db.$queryRaw`
        SELECT * FROM image_integrity_lab_units WHERE id = ${where.id} LIMIT 1
      `;
      return rows[0];
    },
    async delete({ where }) {
      await db.$executeRaw`DELETE FROM image_integrity_lab_units WHERE id = ${where.id}`;
    },
  };
}

/**
 * PrismaClient cached inside a long-lived `next dev` process can miss
 * ImageIntegrityLabUnit until the server is restarted. Fall back to SQL.
 */
export async function getIntegrityDb() {
  const db = await ensurePrismaConnected();
  if (typeof db.imageIntegrityLabUnit?.findMany === 'function') {
    return db;
  }
  console.warn('Prisma client is missing ImageIntegrityLabUnit; using SQL fallback.');
  return {
    imageIntegrityLabUnit: sqlLabUnitDelegate(db),
    imageIntegrityCase: {
      async count({ where }) {
        const rows = await db.$queryRaw`
          SELECT COUNT(*)::int AS n FROM image_integrity_cases WHERE "labUnitId" = ${where.labUnitId}
        `;
        return rows[0]?.n ?? 0;
      },
    },
  };
}

function sqlCollectionDelegate(db) {
  return {
    async findMany({ where = {} } = {}) {
      const rows = await db.$queryRaw`
        SELECT c.*, (
          SELECT COUNT(*)::int FROM image_integrity_cases x WHERE x."collectionId" = c.id
        ) AS "submissionCount"
        FROM image_integrity_collections c
        WHERE c."userId" = ${where.userId}
        ORDER BY c.name ASC
      `;
      return rows.map((row) => ({
        ...row,
        _count: { cases: Number(row.submissionCount || 0) },
      }));
    },
    async findFirst({ where = {} } = {}) {
      let rows = [];
      if (where.id && where.userId) {
        rows = await db.$queryRaw`
          SELECT * FROM image_integrity_collections
          WHERE id = ${where.id} AND "userId" = ${where.userId}
          LIMIT 1
        `;
      } else if (where.NOT?.id && where.name?.equals) {
        rows = await db.$queryRaw`
          SELECT * FROM image_integrity_collections
          WHERE "userId" = ${where.userId}
            AND LOWER(name) = LOWER(${where.name.equals})
            AND id <> ${where.NOT.id}
          LIMIT 1
        `;
      } else if (where.name?.equals) {
        rows = await db.$queryRaw`
          SELECT * FROM image_integrity_collections
          WHERE "userId" = ${where.userId}
            AND LOWER(name) = LOWER(${where.name.equals})
          LIMIT 1
        `;
      }
      return rows[0] || null;
    },
    async create({ data }) {
      const id = createRecordId();
      const rows = await db.$queryRaw`
        INSERT INTO image_integrity_collections (
          id, "userId", name, description, color, "createdAt", "updatedAt"
        )
        VALUES (
          ${id}, ${data.userId}, ${data.name}, ${data.description}, ${data.color}, NOW(), NOW()
        )
        RETURNING *
      `;
      return rows[0];
    },
    async update({ where, data }) {
      const currentRows = await db.$queryRaw`
        SELECT * FROM image_integrity_collections WHERE id = ${where.id} LIMIT 1
      `;
      const current = currentRows[0];
      if (!current) return null;
      const name = data.name !== undefined ? data.name : current.name;
      const description = data.description !== undefined ? data.description : current.description;
      const color = data.color !== undefined ? data.color : current.color;
      await db.$executeRaw`
        UPDATE image_integrity_collections
        SET
          name = ${name},
          description = ${description},
          color = ${color},
          "updatedAt" = NOW()
        WHERE id = ${where.id}
      `;
      const rows = await db.$queryRaw`
        SELECT * FROM image_integrity_collections WHERE id = ${where.id} LIMIT 1
      `;
      return rows[0];
    },
    async delete({ where }) {
      await db.$executeRaw`
        UPDATE image_integrity_cases SET "collectionId" = NULL WHERE "collectionId" = ${where.id}
      `;
      await db.$executeRaw`DELETE FROM image_integrity_collections WHERE id = ${where.id}`;
    },
  };
}

export async function getCollectionDb() {
  const db = await ensurePrismaConnected();
  if (typeof db.imageIntegrityCollection?.findMany === 'function') {
    return db;
  }
  console.warn('Prisma client is missing ImageIntegrityCollection; using SQL fallback.');
  return {
    imageIntegrityCollection: sqlCollectionDelegate(db),
  };
}

/**
 * Resolve the institution id used for lab/unit catalog lookups.
 */
export async function institutionIdForLabUnits(user) {
  const scoped = resolveInstitutionScope(user);
  if (scoped?.id) return scoped.id;
  const owned = await getOwnedInstitution(user);
  return owned?.id || user?.secondaryInstitutionId || null;
}

export async function listActiveLabUnitsForInstitution(institutionId) {
  if (!institutionId) return [];
  const db = await getIntegrityDb();
  return db.imageIntegrityLabUnit.findMany({
    where: { institutionId, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, description: true },
  });
}

/**
 * Validate that a lab unit belongs to the researcher's verified institution.
 */
export async function validateLabUnitForResearcher(user, labUnitId) {
  if (!labUnitId) return { labUnitId: null };
  const institutionId = user.secondaryInstitutionId;
  if (!institutionId) {
    return { error: 'Link your account to an institution before assigning a lab/unit.' };
  }
  const db = await getIntegrityDb();
  const labUnit = await db.imageIntegrityLabUnit.findFirst({
    where: { id: labUnitId, institutionId, isActive: true },
  });
  if (!labUnit) {
    return { error: 'Selected lab/unit is not available for your institution.' };
  }
  return { labUnitId: labUnit.id };
}

export async function validateCollectionForResearcher(user, collectionId) {
  if (!collectionId) return { collectionId: null };
  const db = await getCollectionDb();
  const collection = await db.imageIntegrityCollection.findFirst({
    where: { id: collectionId, userId: user.id },
  });
  if (!collection) {
    return { error: 'Selected collection was not found.' };
  }
  return { collectionId: collection.id };
}

export function parseTagsInput(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((t) => String(t || '').trim()).filter(Boolean).slice(0, 20);
  }
  try {
    const parsed = JSON.parse(String(raw));
    if (Array.isArray(parsed)) {
      return parsed.map((t) => String(t || '').trim()).filter(Boolean).slice(0, 20);
    }
  } catch {
    // fall through
  }
  return String(raw)
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);
}
