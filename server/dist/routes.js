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
// File: server/src/routes.ts
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const queries_1 = require("./queries");
const auth_middleware_1 = require("./auth.middleware");
require('./passport-config'); // Initialise la configuration Passport
const router = express_1.default.Router();
// Routes d'authentification
router.get('/auth/google', passport_1.default.authenticate('google', { session: false }));
router.get('/auth/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: '/login-error' }), (req, res) => {
    const user = req.user;
    const token = jsonwebtoken_1.default.sign({ id: user.user_id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});
// Routes API existantes
router.get('/', (request, response) => {
    response.json({ info: 'Node.js, Express, and Postgres API' });
});
// Protéger les routes API
router.get('/items', auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const items = yield (0, queries_1.getItems)(req.user.id);
    res.json(items);
}));
router.post('/items', auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const item = yield (0, queries_1.createItem)(req.body, req.user.id);
    res.status(201).json(item);
}));
router.put('/items/:id', auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const item = yield (0, queries_1.updateItem)(parseInt(req.params.id), req.body, req.user.id);
    res.json(item);
}));
router.delete('/items/:id', auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, queries_1.deleteItem)(parseInt(req.params.id), req.user.id);
    res.status(204).send();
}));
exports.default = router;
