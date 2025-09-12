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
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Initialize the test database schema
        yield (0, test_database_1.initTestDb)();
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clear all tables before each test
        yield (0, test_database_1.clearTestDb)();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Close the test database pool
        yield (0, test_database_1.closeTestPool)();
    }));
    describe('createItem', () => {
        it('should create a new item and return it', () => __awaiter(void 0, void 0, void 0, function* () {
            const newItemData = {
                name: 'Test Item',
                category: 'Vêtement',
                estimatedCost: 100,
                priority: 'Moyenne',
                purchaseMonth: '2025-10'
            };
            const createdItem = yield (0, queries_1.createItem)(newItemData);
            expect(createdItem).toBeDefined();
            expect(createdItem.id).toBeDefined();
            expect(createdItem.name).toBe(newItemData.name);
            expect(createdItem.category).toBe(newItemData.category);
            expect(parseFloat(createdItem.estimatedCost)).toBe(newItemData.estimatedCost);
            expect(createdItem.isPurchased).toBe(false);
            // Verify it's in the database
            const { rows } = yield test_database_1.default.query('SELECT * FROM Items WHERE item_id = $1', [createdItem.id]);
            expect(rows).toHaveLength(1);
            expect(rows[0].name).toBe(newItemData.name);
        }));
    });
    describe('getItems', () => {
        it('should return all items from the database', () => __awaiter(void 0, void 0, void 0, function* () {
            // First, create some items
            yield (0, queries_1.createItem)({ name: 'Item 1', category: 'Vêtement', estimatedCost: 50, priority: 'Basse', purchaseMonth: '2025-11' });
            yield (0, queries_1.createItem)({ name: 'Item 2', category: 'Chaussures', estimatedCost: 120, priority: 'Haute', purchaseMonth: '2025-12' });
            const items = yield (0, queries_1.getItems)();
            expect(items).toHaveLength(2);
            expect(items[0].name).toBe('Item 1');
            expect(items[1].name).toBe('Item 2');
        }));
    });
    describe('updateItem', () => {
        it('should update an existing item with all fields', () => __awaiter(void 0, void 0, void 0, function* () {
            const initialItem = yield (0, queries_1.createItem)({ name: 'Original', category: 'Parfum', estimatedCost: 80, priority: 'Haute', purchaseMonth: '2025-09' });
            const updates = {
                name: 'Updated Name',
                category: 'Vêtement',
                estimatedCost: 95.50,
                priority: 'Basse',
                purchaseMonth: '2025-10',
                isPurchased: true,
                actualCost: 90.00,
                notes: 'This is an updated note.',
                rating: 5
            };
            const updatedItem = yield (0, queries_1.updateItem)(initialItem.id, updates);
            expect(updatedItem).toBeDefined();
            expect(updatedItem.name).toBe(updates.name);
            expect(updatedItem.category).toBe(updates.category);
            expect(parseFloat(updatedItem.estimated_cost)).toBe(updates.estimatedCost);
            expect(updatedItem.priority).toBe(updates.priority);
            expect(updatedItem.purchase_month).toBe(updates.purchaseMonth);
            expect(updatedItem.is_purchased).toBe(updates.isPurchased);
            expect(parseFloat(updatedItem.actual_cost)).toBe(updates.actualCost);
            expect(updatedItem.notes).toBe(updates.notes);
            expect(updatedItem.rating).toBe(updates.rating);
        }));
    });
    describe('deleteItem', () => {
        it('should delete an item from the database', () => __awaiter(void 0, void 0, void 0, function* () {
            const itemToDelete = yield (0, queries_1.createItem)({ name: 'To Be Deleted', category: 'Vêtement', estimatedCost: 10, priority: 'Basse', purchaseMonth: '2026-01' });
            yield (0, queries_1.deleteItem)(itemToDelete.id);
            const { rows } = yield test_database_1.default.query('SELECT * FROM Items WHERE item_id = $1', [itemToDelete.id]);
            expect(rows).toHaveLength(0);
        }));
    });
});
