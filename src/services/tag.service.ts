import prisma from '../prisma/prisma-client';

const getTags = async (username?: string): Promise<string[]> => {
  const where = username
    ? { articles: { some: { author: { username } } } }
    : { articles: { some: {} } };

  const tags = await prisma.tag.findMany({
    where,
    select: { name: true, _count: { select: { articles: true } } },
    orderBy: { articles: { _count: 'desc' } },
    take: 10,
  });

  return tags.map(t => t.name);
};

export default getTags;
