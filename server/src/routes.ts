import express from 'express';
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
    DuplicateItemError
} from './queries';

const router = express.Router();

// ---- Main Routes ----
router.get('/', (req, res) => {
    res.send('Hello from the Garde-Robe Budget App backend!');
});

const asyncHandler = (fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<any>) =>
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
        return Promise.resolve(fn(req, res, next)).catch(next);
    };

// ---- Items API ----
router.get('/api/items', asyncHandler(async (req, res, next) => {
    const items = await getItems();
    res.json(items);
}));

router.post('/api/items', asyncHandler(async (req, res, next) => {
    const newItem = await createItem(req.body);
    res.status(201).json(newItem);
}));

router.delete('/api/items/:id', asyncHandler(async (req, res, next) => {
    await deleteItem(Number(req.params.id));
    res.status(204).send();
}));

router.put('/api/items/:id', asyncHandler(async (req, res, next) => {
    const updatedItem = await updateItem(Number(req.params.id), req.body);
    res.json(updatedItem);
}));

// ---- New Route for Browser Extension ----
router.post('/api/items/from-url', asyncHandler(async (req, res, next) => {
    const { url, name } = req.body;
    // Basic validation
    if (!url || !name) {
        return res.status(400).json({ error: 'URL and name are required' });
    }
    const newItem = await createItemFromUrl(url, name);
    res.status(201).json(newItem);
}));

// ---- Images API ----
router.post('/api/items/:id/images', asyncHandler(async (req, res, next) => {
    const { imageUrl } = req.body;
    const newImage = await addImageUrl(Number(req.params.id), imageUrl);
    res.status(201).json(newImage);
}));

router.delete('/api/items/:id/images', asyncHandler(async (req, res, next) => {
    // The image URL to delete should be passed in the body
    const { imageUrl } = req.body;
    await removeImageUrl(Number(req.params.id), imageUrl);
    res.status(204).send();
}));

// ---- Links API ----
router.post('/api/items/:id/links', asyncHandler(async (req, res, next) => {
    const newLink = await addLink(Number(req.params.id), req.body);
    res.status(201).json(newLink);
}));

router.delete('/api/items/:id/links/:linkId', asyncHandler(async (req, res, next) => {
    await removeLink(Number(req.params.linkId));
    res.status(204).send();
}));


// ---- Error Handling ----
router.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof DuplicateItemError) {
        return res.status(409).json({ error: err.message });
    }
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


export default router;
