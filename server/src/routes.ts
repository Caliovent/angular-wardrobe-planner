// File: server/src/routes.ts
import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';


require('./passport-config'); // Initialise la configuration Passport

import {
    getItems,
    createItem,
    deleteItem,
    updateItem,
    addImageUrl,
    removeImageUrl,
    addLink,
    removeLink,
    createItemFromUrl,
    DuplicateItemError,
    createUser,
    findUserByEmail,
    getPlanningSummary,
    updateItemWithScrapedData
} from './queries';
import { scrapeProductData } from './scraper';
import authMiddleware from './authMiddleware';
import bcrypt from 'bcryptjs/umd/types';


const router = express.Router();

// Routes d'authentification
router.get('/auth/google', passport.authenticate('google', { session: false }));

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login-error' }),
  (req, res) => {
    const user: any = req.user;
    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET!, {
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
    const items = await getItems((req as any).user.user_id);
    res.json(items);
});
router.post('/items', authMiddleware, async (req, res) => {
    const item = await createItem(req.body, (req as any).user.user_id);
    res.status(201).json(item);
});
router.put('/items/:id', authMiddleware, async (req, res) => {
    const item = await updateItem(parseInt(req.params.id), req.body, (req as any).user.user_id);
    res.json(item);
});
router.delete('/items/:id', authMiddleware, async (req, res) => {
    await deleteItem(parseInt(req.params.id), (req as any).user.user_id);
});

const asyncHandler = (fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<any>) =>
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
        return Promise.resolve(fn(req, res, next)).catch(next);
    };

// ---- Auth API ----
router.post('/api/auth/register', asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists.' });
    }

    const newUser = await createUser({ email, password });
    res.status(201).json({ userId: newUser.user_id, email: newUser.email });
}));

router.post('/api/auth/login', asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    res.json({ token });
}));


// ---- Items API ----
router.get('/api/items', authMiddleware, asyncHandler(async (req, res, next) => {
    const userId = (req.user as any).user_id;
    const status = req.query.status as string | undefined;
    const items = await getItems(userId, status);
    res.json(items);
}));

// ---- Planning API ----
router.get('/api/planning/summary', authMiddleware, asyncHandler(async (req, res, next) => {
    const userId = (req.user as any).user_id;
    const summary = await getPlanningSummary(userId);
    res.json(summary);
}));

router.post('/api/items', authMiddleware, asyncHandler(async (req, res, next) => {
    const userId = (req.user as any).user_id;
    const newItem = await createItem(req.body, userId);
    res.status(201).json(newItem);
}));

router.delete('/api/items/:id', authMiddleware, asyncHandler(async (req, res, next) => {
    const userId = (req.user as any).user_id;
    await deleteItem(Number(req.params.id), userId);
    res.status(204).send();
}));

router.put('/api/items/:id', authMiddleware, asyncHandler(async (req, res, next) => {
    const userId = (req.user as any).user_id;
    const updatedItem = await updateItem(Number(req.params.id), req.body, userId);
    res.json(updatedItem);
}));

// ---- New Route for Browser Extension ----
router.post('/api/items/from-url', authMiddleware, asyncHandler(async (req, res, next) => {
    const userId = (req.user as any).user_id;
    const { url, name } = req.body;
    // Basic validation
    if (!url || !name) {
        return res.status(400).json({ error: 'URL and name are required' });
    }
    const newItem = await createItemFromUrl(url, name, userId);

    // Respond immediately
    res.status(201).json(newItem);

    // Start scraping in the background
    scrapeProductData(url)
        .then(scrapedData => {
            if (scrapedData.imageUrl || scrapedData.price) {
                // If we got data, update the item
                updateItemWithScrapedData(newItem.id, scrapedData);
            }
        })
        .catch(error => {
            console.error(`Scraping failed for item ${newItem.id}:`, error);
        });
}));

// ---- Images API ----
router.post('/api/items/:id/images', authMiddleware, asyncHandler(async (req, res, next) => {
    const userId = (req.user as any).user_id;
    const { imageUrl } = req.body;
    const newImage = await addImageUrl(Number(req.params.id), imageUrl, userId);
    res.status(201).json(newImage);
}));

router.delete('/api/items/:id/images', authMiddleware, asyncHandler(async (req, res, next) => {
    const userId = (req.user as any).user_id;
    // The image URL to delete should be passed in the body
    const { imageUrl } = req.body;
    await removeImageUrl(Number(req.params.id), imageUrl, userId);
    res.status(204).send();
}));

// ---- Links API ----
router.post('/api/items/:id/links', authMiddleware, asyncHandler(async (req, res, next) => {
    const userId = (req.user as any).user_id;
    const newLink = await addLink(Number(req.params.id), req.body, userId);
    res.status(201).json(newLink);
}));

router.delete('/api/items/:id/links/:linkId', authMiddleware, asyncHandler(async (req, res, next) => {
    const userId = (req.user as any).user_id;
    await removeLink(Number(req.params.linkId), userId);
    res.status(204).send();
});

export default router;
