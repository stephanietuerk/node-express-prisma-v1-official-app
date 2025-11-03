import HttpException from '../models/http-exception.model';
import prisma from '../prisma/prisma-client';

export type TagQuery = {
  username?: string;
  limit?: number; // default 10, capped below
};

export function parseTagQuery(q: any): TagQuery {
  const username =
    typeof q?.username === 'string' && q.username.trim() ? q.username.trim() : undefined;

  const limitNum =
    typeof q?.limit === 'string' || typeof q?.limit === 'number' ? Number(q.limit) : NaN;
  const limit = Number.isFinite(limitNum) ? Math.min(50, Math.max(1, limitNum)) : 10;

  return { username, limit };
}

export async function getTags(query: any): Promise<string[]> {
  const { username, limit } = parseTagQuery(query);
  const where = username
    ? { articles: { some: { author: { username } } } }
    : { articles: { some: {} } };

  const tags = await prisma.tag.findMany({
    where,
    select: { name: true, _count: { select: { articles: true } } },
    orderBy: { articles: { _count: 'desc' } },
    take: limit,
  });

  return tags.map(t => t.name);
}

export async function assertUserExists(username: string) {
  const exists = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!exists) {
    throw new HttpException(404, {});
  }
  return true;
}
