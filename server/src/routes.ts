// File: server/src/routes.ts
import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { getItems, createItem, updateItem, deleteItem } from './queries';
import { authMiddleware } from './auth.middleware';

require('./passport-config'); // Initialise la configuration Passport

const router = express.Router();

// Routes d'authentification
router.get('/auth/google', passport.authenticate('google', { session: false }));

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login-error' }),
  (req, res) => {
    const user: any = req.user;
    const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// Routes API existantes
router.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' });
});

// Protéger les routes API
router.get('/items', authMiddleware, async (req, res) => {
    const items = await getItems((req as any).user.id);
    res.json(items);
});
router.post('/items', authMiddleware, async (req, res) => {
    const item = await createItem(req.body, (req as any).user.id);
    res.status(201).json(item);
});
router.put('/items/:id', authMiddleware, async (req, res) => {
    const item = await updateItem(parseInt(req.params.id), req.body, (req as any).user.id);
    res.json(item);
});
router.delete('/items/:id', authMiddleware, async (req, res) => {
    await deleteItem(parseInt(req.params.id), (req as any).user.id);
    res.status(204).send();
});

export default router;
