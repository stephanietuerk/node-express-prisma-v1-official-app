import { Router } from 'express';
import articlesController from '../controllers/article.controller';
import authController from '../controllers/auth.controller';
import debugController from '../controllers/debug.controller';
import profileController from '../controllers/profile.controller';
import tagsController from '../controllers/tag.controller';

const api = Router()
  .use(debugController)
  .use(tagsController)
  .use(articlesController)
  .use(profileController)
  .use(authController);

export default Router().use('/api', api);
