import { NextFunction, Request, Response, Router } from 'express';
import { assertUserExists, getTags } from '../services/tag.service';
import auth from '../utils/auth';

const router = Router();

/**
 * @auth optional
 * @route {GET} /api/tags
 * @returns tags list of tag names
 */
router.get('/tags', auth.optional, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (typeof req.query.username === 'string' && req.query.username.trim()) {
      const ok = await assertUserExists(req.query.username.trim());
      if (!ok) return res.status(404).json({});
    }
    const tags = await getTags(req.query);
    res.json({ tags });
  } catch (error) {
    next(error);
  }
});

export default router;
