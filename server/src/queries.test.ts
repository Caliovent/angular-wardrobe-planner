import {
    createItem,
    getItems,
    updateItem,
    deleteItem,
} from './queries';

import pool from './database';
import testPool, { initTestDb, clearTestDb, closeTestPool } from './test-database';

// Mock the original pool to use the test pool
jest.mock('./database', () => ({
    __esModule: true,
    default: {
        query: (...args: [string, any[]]) => testPool.query(...args),
        connect: () => testPool.connect(),
    },
}));


describe('Database Queries', () => {

    beforeAll(async () => {
        // Initialize the test database schema
        await initTestDb();
    });

    beforeEach(async () => {
        // Clear all tables before each test
        await clearTestDb();
    });

    afterAll(async () => {
        // Close the test database pool
        await closeTestPool();
    });

    describe('createItem', () => {
        it('should create a new item and return it', async () => {
            const newItemData = {
                name: 'Test Item',
                category: 'Vêtement',
                estimatedCost: 100,
                priority: 'Moyenne',
                purchaseMonth: '2025-10'
            };

            const createdItem = await createItem(newItemData);

            expect(createdItem).toBeDefined();
            expect(createdItem.id).toBeDefined();
            expect(createdItem.name).toBe(newItemData.name);
            expect(createdItem.category).toBe(newItemData.category);
            expect(createdItem.estimatedCost).toBe(newItemData.estimatedCost);
            expect(createdItem.isPurchased).toBe(false);

            // Verify it's in the database
            const { rows } = await testPool.query('SELECT * FROM Items WHERE item_id = $1', [createdItem.id]);
            expect(rows).toHaveLength(1);
            expect(rows[0].name).toBe(newItemData.name);
        });
    });

    describe('getItems', () => {
        it('should return all items from the database', async () => {
            // First, create some items
            await createItem({ name: 'Item 1', category: 'Vêtement', estimatedCost: 50, priority: 'Basse', purchaseMonth: '2025-11' });
            await createItem({ name: 'Item 2', category: 'Chaussures', estimatedCost: 120, priority: 'Haute', purchaseMonth: '2025-12' });

            const items = await getItems();

            expect(items).toHaveLength(2);
            expect(items[0].name).toBe('Item 1');
            expect(items[1].name).toBe('Item 2');
        });
    });

    describe('updateItem', () => {
        it('should update an existing item with all fields', async () => {
            const initialItem = await createItem({ name: 'Original', category: 'Parfum', estimatedCost: 80, priority: 'Haute', purchaseMonth: '2025-09' });

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

            const updatedItem = await updateItem(initialItem.id, updates);

            expect(updatedItem).toBeDefined();
            expect(updatedItem.name).toBe(updates.name);
            expect(updatedItem.category).toBe(updates.category);
            expect(updatedItem.estimated_cost).toBe(String(updates.estimatedCost));
            expect(updatedItem.priority).toBe(updates.priority);
            expect(updatedItem.purchase_month).toBe(updates.purchaseMonth);
            expect(updatedItem.is_purchased).toBe(updates.isPurchased);
            expect(updatedItem.actual_cost).toBe(String(updates.actualCost));
            expect(updatedItem.notes).toBe(updates.notes);
            expect(updatedItem.rating).toBe(updates.rating);
        });
    });

    describe('deleteItem', () => {
        it('should delete an item from the database', async () => {
            const itemToDelete = await createItem({ name: 'To Be Deleted', category: 'Vêtement', estimatedCost: 10, priority: 'Basse', purchaseMonth: '2026-01' });

            await deleteItem(itemToDelete.id);

            const { rows } = await testPool.query('SELECT * FROM Items WHERE item_id = $1', [itemToDelete.id]);
            expect(rows).toHaveLength(0);
        });
    });
});
