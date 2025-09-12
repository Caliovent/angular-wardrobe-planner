import {
    createItem,
    getItems,
    updateItem,
    deleteItem,
    createItemFromUrl,
    DuplicateItemError,
    createUser,
    findUserByEmail,
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

    let testUser: { user_id: number, email: string };

    beforeAll(async () => {
        // Initialize the test database schema
        await initTestDb();
    });

    beforeEach(async () => {
        // Clear all tables before each test
        await clearTestDb();
        // Create a dummy user for each test
        const userResult = await testPool.query(`
            INSERT INTO Users (email, password_hash)
            VALUES ($1, $2)
            RETURNING user_id, email;
        `, ['test@example.com', 'password']);
        testUser = userResult.rows[0];
    });

    afterAll(async () => {
        // Close the test database pool
        await closeTestPool();
    });

    describe('Users', () => {
        it('should create a new user with a hashed password', async () => {
            const newUser = { email: 'newuser@example.com', password: 'password123' };
            const createdUser = await createUser(newUser);

            expect(createdUser).toBeDefined();
            expect(createdUser.email).toBe(newUser.email);

            const { rows } = await testPool.query('SELECT * FROM Users WHERE email = $1', [newUser.email]);
            expect(rows).toHaveLength(1);
            expect(rows[0].password_hash).not.toBe(newUser.password);
        });

        it('should find a user by email', async () => {
            const foundUser = await findUserByEmail(testUser.email);
            expect(foundUser).toBeDefined();
            expect(foundUser!.user_id).toBe(testUser.user_id);
            expect(foundUser!.email).toBe(testUser.email);
        });
    });

    describe('createItem', () => {
        it('should create a new item for a specific user', async () => {
            const newItemData = {
                name: 'Test Item',
                category: 'Vêtement',
                estimatedCost: 100,
                priority: 'Moyenne',
                purchaseMonth: '2025-10'
            };

            const createdItem = await createItem(newItemData, testUser.user_id);

            expect(createdItem).toBeDefined();
            expect(createdItem.id).toBeDefined();

            const { rows } = await testPool.query('SELECT * FROM Items WHERE item_id = $1', [createdItem.id]);
            expect(rows).toHaveLength(1);
            expect(rows[0].user_id).toBe(testUser.user_id);
        });
    });

    describe('getItems', () => {
        it('should only return items for the specified user', async () => {
            // Create another user
            const otherUserResult = await testPool.query(`
                INSERT INTO Users (email, password_hash)
                VALUES ($1, $2)
                RETURNING user_id, email;
            `, ['otheruser@example.com', 'password']);
            const otherUser = otherUserResult.rows[0];

            await createItem({ name: 'My Item', category: 'Vêtement', estimatedCost: 50, priority: 'Basse', purchaseMonth: '2025-11' }, testUser.user_id);
            await createItem({ name: 'Other User Item', category: 'Chaussures', estimatedCost: 120, priority: 'Haute', purchaseMonth: '2025-12' }, otherUser.user_id);

            const items = await getItems(testUser.user_id);

            expect(items).toHaveLength(1);
            expect(items[0].name).toBe('My Item');
        });
    });

    describe('updateItem', () => {
        it('should update an item belonging to the user', async () => {
            const initialItem = await createItem({ name: 'Original', category: 'Parfum', estimatedCost: 80, priority: 'Haute', purchaseMonth: '2025-09' }, testUser.user_id);
            const updates = { name: 'Updated Name' };
            const updatedItem = await updateItem(initialItem.id, updates, testUser.user_id);
            expect(updatedItem.name).toBe('Updated Name');
        });

        it('should not update an item belonging to another user', async () => {
            const otherUserResult = await testPool.query(`INSERT INTO Users (email, password_hash) VALUES ('other@test.com', 'hash') RETURNING user_id`);
            const otherUserId = otherUserResult.rows[0].user_id;
            const itemOfOtherUser = await createItem({ name: 'Other User Item', category: 'Vêtement', estimatedCost: 10, priority: 'Basse', purchaseMonth: '2026-01' }, otherUserId);

            const updates = { name: 'Attempted Update' };
            await expect(updateItem(itemOfOtherUser.id, updates, testUser.user_id)).rejects.toThrow('Item not found or user not authorized');
        });
    });

    describe('deleteItem', () => {
        it('should delete an item belonging to the user', async () => {
            const itemToDelete = await createItem({ name: 'To Be Deleted', category: 'Vêtement', estimatedCost: 10, priority: 'Basse', purchaseMonth: '2026-01' }, testUser.user_id);
            await deleteItem(itemToDelete.id, testUser.user_id);
            const { rows } = await testPool.query('SELECT * FROM Items WHERE item_id = $1', [itemToDelete.id]);
            expect(rows).toHaveLength(0);
        });

        it('should not delete an item belonging to another user', async () => {
            const otherUserResult = await testPool.query(`INSERT INTO Users (email, password_hash) VALUES ('other@test.com', 'hash') RETURNING user_id`);
            const otherUserId = otherUserResult.rows[0].user_id;
            const itemOfOtherUser = await createItem({ name: 'Other User Item', category: 'Vêtement', estimatedCost: 10, priority: 'Basse', purchaseMonth: '2026-01' }, otherUserId);

            await expect(deleteItem(itemOfOtherUser.id, testUser.user_id)).rejects.toThrow('Item not found or user not authorized');
        });
    });

    describe('createItemFromUrl', () => {
        it('should create an item from a URL for the specified user', async () => {
            const url = 'http://example.com/item';
            const name = 'Test Item from URL';
            const newItem = await createItemFromUrl(url, name, testUser.user_id);

            expect(newItem).toBeDefined();
            const { rows } = await testPool.query('SELECT * FROM Items WHERE item_id = $1', [newItem.id]);
            expect(rows[0].user_id).toBe(testUser.user_id);
        });

        it('should throw a DuplicateItemError if the URL already exists', async () => {
            const url = 'http://example.com/item2';
            const name = 'Test Item';

            // Create the item for the first time
            await createItemFromUrl(url, name, testUser.user_id);

            // Try to create it again and expect an error
            await expect(createItemFromUrl(url, name, testUser.user_id)).rejects.toThrow(DuplicateItemError);
        });
    });
});
