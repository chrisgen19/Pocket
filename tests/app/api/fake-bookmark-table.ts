import { vi } from 'vitest';

// In-memory stand-in for the `prisma.bookmark` calls the bookmark routes make. Rows are
// matched on the same keys as the real queries (id + userId, or the unique userId_url),
// so a request for another user's row really finds nothing. Like Prisma, an undefined
// filter value matches every row, so a route that stops scoping by userId is caught.

export type FakeBookmark = {
  id: string;
  userId: string;
  url: string;
  title: string;
  domain: string;
  excerpt: string;
  imageUrl: string;
  tags: string[];
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type UserUrl = { userId_url: { userId: string; url: string } };

export const rows: FakeBookmark[] = [];

let nextId = 1;

/** Adds a row; unspecified fields get defaults like the Prisma schema's. */
export const seed = (row: Partial<FakeBookmark> & Pick<FakeBookmark, 'id' | 'userId'>) => {
  const now = new Date('2026-10-01T00:00:00.000Z');
  rows.push({
    url: `https://example.com/${row.id}`,
    title: 'Seeded',
    domain: 'example.com',
    excerpt: '',
    imageUrl: '',
    tags: [],
    isFavorite: false,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
    ...row,
  });
};

const byUserUrl = ({ userId_url }: UserUrl) =>
  rows.find((row) => row.userId === userId_url.userId && row.url === userId_url.url);

export const bookmarkTable = {
  findUnique: vi.fn(async ({ where }: { where: UserUrl }) => {
    const row = byUserUrl(where);
    return row ? { ...row } : null;
  }),

  upsert: vi.fn(
    async (args: {
      where: UserUrl;
      create: Omit<FakeBookmark, 'id' | 'isFavorite' | 'isArchived' | 'createdAt' | 'updatedAt'>;
      update: Partial<FakeBookmark>;
    }) => {
      const existing = byUserUrl(args.where);
      if (existing) {
        Object.assign(existing, args.update, { updatedAt: new Date() });
        return { ...existing };
      }
      const now = new Date();
      const created: FakeBookmark = {
        id: `new-${nextId++}`,
        isFavorite: false,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
        ...args.create,
      };
      rows.push(created);
      return { ...created };
    },
  ),

  updateManyAndReturn: vi.fn(
    async (args: { where: { id: string; userId?: string }; data: Partial<FakeBookmark> }) => {
      const { id, userId } = args.where;
      const matched = rows.filter(
        (row) => row.id === id && (userId === undefined || row.userId === userId),
      );
      for (const row of matched) Object.assign(row, args.data, { updatedAt: new Date() });
      return matched.map((row) => ({ ...row }));
    },
  ),
};
