import { Router } from 'express';
import prisma from '../prisma/prisma-client';

const router = Router();

// DB sanity: which DB are we connected to, and how many rows?
router.get('/__debug/db', async (_req, res) => {
  const url = process.env.DATABASE_URL ?? '';
  let hostAndDb = '(no DATABASE_URL set)';
  try {
    const u = new URL(url);
    hostAndDb = `${u.host}${u.pathname}`;
  } catch {}

  const [users, articles, comments, tags] = await Promise.all([
    prisma.user.count(),
    prisma.article.count(),
    prisma.comment.count(),
    prisma.tag.count(),
  ]);

  res.json({ db: hostAndDb, counts: { users, articles, comments, tags } });
});

// who am I? (useful if auth middleware attaches req.user)
router.get('/__debug/whoami', (req: any, res) => {
  res.json({ user: req.user ?? null });
});

export default router;
