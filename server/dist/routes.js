"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const queries_1 = require("./queries");
const router = express_1.default.Router();
// ---- Main Routes ----
router.get('/', (req, res) => {
    res.send('Hello from the Garde-Robe Budget App backend!');
});
const asyncHandler = (fn) => (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
};
// ---- Items API ----
router.get('/api/items', asyncHandler((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const items = yield (0, queries_1.getItems)();
    res.json(items);
})));
router.post('/api/items', asyncHandler((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const newItem = yield (0, queries_1.createItem)(req.body);
    res.status(201).json(newItem);
})));
router.delete('/api/items/:id', asyncHandler((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, queries_1.deleteItem)(Number(req.params.id));
    res.status(204).send();
})));
router.put('/api/items/:id', asyncHandler((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedItem = yield (0, queries_1.updateItem)(Number(req.params.id), req.body);
    res.json(updatedItem);
})));
// ---- New Route for Browser Extension ----
router.post('/api/items/from-url', asyncHandler((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { url, name } = req.body;
    // Basic validation
    if (!url || !name) {
        return res.status(400).json({ error: 'URL and name are required' });
    }
    const newItem = yield (0, queries_1.createItemFromUrl)(url, name);
    res.status(201).json(newItem);
})));
// ---- Images API ----
router.post('/api/items/:id/images', asyncHandler((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { imageUrl } = req.body;
    const newImage = yield (0, queries_1.addImageUrl)(Number(req.params.id), imageUrl);
    res.status(201).json(newImage);
})));
router.delete('/api/items/:id/images', asyncHandler((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // The image URL to delete should be passed in the body
    const { imageUrl } = req.body;
    yield (0, queries_1.removeImageUrl)(Number(req.params.id), imageUrl);
    res.status(204).send();
})));
// ---- Links API ----
router.post('/api/items/:id/links', asyncHandler((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const newLink = yield (0, queries_1.addLink)(Number(req.params.id), req.body);
    res.status(201).json(newLink);
})));
router.delete('/api/items/:id/links/:linkId', asyncHandler((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, queries_1.removeLink)(Number(req.params.linkId));
    res.status(204).send();
})));
// ---- Error Handling ----
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
exports.default = router;
