"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const queries_1 = require("./queries");
const test_database_1 = __importStar(require("./test-database"));
// Mock the original pool to use the test pool
jest.mock('./database', () => ({
    __esModule: true,
    default: {
        query: (...args) => test_database_1.default.query(...args),
        connect: () => test_database_1.default.connect(),
    },
}));
describe('Database Queries', () => {
    let testUser;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Initialize the test database schema
        yield (0, test_database_1.initTestDb)();
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clear all tables before each test
        yield (0, test_database_1.clearTestDb)();
        // Create a dummy user for each test
        const userResult = yield test_database_1.default.query(`
            INSERT INTO Users (email, password_hash)
            VALUES ($1, $2)
            RETURNING user_id, email;
        `, ['test@example.com', 'password']);
        testUser = userResult.rows[0];
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Close the test database pool
        yield (0, test_database_1.closeTestPool)();
    }));
    describe('Users', () => {
        it('should create a new user with a hashed password', () => __awaiter(void 0, void 0, void 0, function* () {
            const newUser = { email: 'newuser@example.com', password: 'password123' };
            const createdUser = yield (0, queries_1.createUser)(newUser);
            expect(createdUser).toBeDefined();
            expect(createdUser.email).toBe(newUser.email);
            const { rows } = yield test_database_1.default.query('SELECT * FROM Users WHERE email = $1', [newUser.email]);
            expect(rows).toHaveLength(1);
            expect(rows[0].password_hash).not.toBe(newUser.password);
        }));
        it('should find a user by email', () => __awaiter(void 0, void 0, void 0, function* () {
            const foundUser = yield (0, queries_1.findUserByEmail)(testUser.email);
            expect(foundUser).toBeDefined();
            expect(foundUser.user_id).toBe(testUser.user_id);
            expect(foundUser.email).toBe(testUser.email);
        }));
    });
    describe('createItem', () => {
        it('should create a new item for a specific user', () => __awaiter(void 0, void 0, void 0, function* () {
            const newItemData = {
                name: 'Test Item',
                category: 'Vêtement',
                estimatedCost: 100,
                priority: 'Moyenne',
                purchaseMonth: '2025-10'
            };
            const createdItem = yield (0, queries_1.createItem)(newItemData, testUser.user_id);
            expect(createdItem).toBeDefined();
            expect(createdItem.id).toBeDefined();
            const { rows } = yield test_database_1.default.query('SELECT * FROM Items WHERE item_id = $1', [createdItem.id]);
            expect(rows).toHaveLength(1);
            expect(rows[0].user_id).toBe(testUser.user_id);
        }));
    });
    describe('getItems', () => {
        it('should only return items for the specified user', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create another user
            const otherUserResult = yield test_database_1.default.query(`
                INSERT INTO Users (email, password_hash)
                VALUES ($1, $2)
                RETURNING user_id, email;
            `, ['otheruser@example.com', 'password']);
            const otherUser = otherUserResult.rows[0];
            yield (0, queries_1.createItem)({ name: 'My Item', category: 'Vêtement', estimatedCost: 50, priority: 'Basse', purchaseMonth: '2025-11' }, testUser.user_id);
            yield (0, queries_1.createItem)({ name: 'Other User Item', category: 'Chaussures', estimatedCost: 120, priority: 'Haute', purchaseMonth: '2025-12' }, otherUser.user_id);
            const items = yield (0, queries_1.getItems)(testUser.user_id);
            expect(items).toHaveLength(1);
            expect(items[0].name).toBe('My Item');
        }));
    });
    describe('updateItem', () => {
        it('should update an item belonging to the user', () => __awaiter(void 0, void 0, void 0, function* () {
            const initialItem = yield (0, queries_1.createItem)({ name: 'Original', category: 'Parfum', estimatedCost: 80, priority: 'Haute', purchaseMonth: '2025-09' }, testUser.user_id);
            const updates = { name: 'Updated Name' };
            const updatedItem = yield (0, queries_1.updateItem)(initialItem.id, updates, testUser.user_id);
            expect(updatedItem.name).toBe('Updated Name');
        }));
        it('should not update an item belonging to another user', () => __awaiter(void 0, void 0, void 0, function* () {
            const otherUserResult = yield test_database_1.default.query(`INSERT INTO Users (email, password_hash) VALUES ('other@test.com', 'hash') RETURNING user_id`);
            const otherUserId = otherUserResult.rows[0].user_id;
            const itemOfOtherUser = yield (0, queries_1.createItem)({ name: 'Other User Item', category: 'Vêtement', estimatedCost: 10, priority: 'Basse', purchaseMonth: '2026-01' }, otherUserId);
            const updates = { name: 'Attempted Update' };
            yield expect((0, queries_1.updateItem)(itemOfOtherUser.id, updates, testUser.user_id)).rejects.toThrow('Item not found or user not authorized');
        }));
    });
    describe('deleteItem', () => {
        it('should delete an item belonging to the user', () => __awaiter(void 0, void 0, void 0, function* () {
            const itemToDelete = yield (0, queries_1.createItem)({ name: 'To Be Deleted', category: 'Vêtement', estimatedCost: 10, priority: 'Basse', purchaseMonth: '2026-01' }, testUser.user_id);
            yield (0, queries_1.deleteItem)(itemToDelete.id, testUser.user_id);
            const { rows } = yield test_database_1.default.query('SELECT * FROM Items WHERE item_id = $1', [itemToDelete.id]);
            expect(rows).toHaveLength(0);
        }));
        it('should not delete an item belonging to another user', () => __awaiter(void 0, void 0, void 0, function* () {
            const otherUserResult = yield test_database_1.default.query(`INSERT INTO Users (email, password_hash) VALUES ('other@test.com', 'hash') RETURNING user_id`);
            const otherUserId = otherUserResult.rows[0].user_id;
            const itemOfOtherUser = yield (0, queries_1.createItem)({ name: 'Other User Item', category: 'Vêtement', estimatedCost: 10, priority: 'Basse', purchaseMonth: '2026-01' }, otherUserId);
            yield expect((0, queries_1.deleteItem)(itemOfOtherUser.id, testUser.user_id)).rejects.toThrow('Item not found or user not authorized');
        }));
    });
    describe('createItemFromUrl', () => {
        it('should create an item from a URL for the specified user', () => __awaiter(void 0, void 0, void 0, function* () {
            const url = 'http://example.com/item';
            const name = 'Test Item from URL';
            const newItem = yield (0, queries_1.createItemFromUrl)(url, name, testUser.user_id);
            expect(newItem).toBeDefined();
            const { rows } = yield test_database_1.default.query('SELECT * FROM Items WHERE item_id = $1', [newItem.id]);
            expect(rows[0].user_id).toBe(testUser.user_id);
        }));
        it('should throw a DuplicateItemError if the URL already exists', () => __awaiter(void 0, void 0, void 0, function* () {
            const url = 'http://example.com/item2';
            const name = 'Test Item';
            // Create the item for the first time
            yield (0, queries_1.createItemFromUrl)(url, name, testUser.user_id);
            // Try to create it again and expect an error
            yield expect((0, queries_1.createItemFromUrl)(url, name, testUser.user_id)).rejects.toThrow(queries_1.DuplicateItemError);
        }));
    });
});
