import { scrapeProductData } from './scraper';
import pool from './database';
import bcrypt from 'bcryptjs';

interface ItemRow {
    item_id: number;
    user_id: number;
    name: string;
    category: 'Vêtement' | 'Chaussures' | 'Parfum';
    status: 'inbox' | 'planned';
    estimated_cost: string;
    actual_cost: string | null;
    priority: 'Haute' | 'Moyenne' | 'Basse';
    purchase_month: string;
    is_purchased: boolean;
    notes: string | null;
    rating: number | null;
    created_at: Date;
}

interface ImageRow {
    image_id: number;
    item_id: number;
    image_url: string;
}

interface LinkRow {
    link_id: number;
    item_id: number;
    url: string;
    annotation: string;
}

interface UserRow {
    user_id: number;
    email: string;
    password_hash: string;
}

// ---- Users ----

// Récupère les informations du profil utilisateur, y compris les budgets
export const getUserProfile = async (userId: number) => {
    const result = await pool.query(
        'SELECT user_id, email, display_name, avatar_url, total_budget, monthly_budget FROM "users" WHERE user_id = $1',
        [userId]
    );
    return result.rows[0];
};

// Met à jour les budgets de l'utilisateur
export const updateUserBudgets = async (userId: number, budgets: { totalBudget?: number; monthlyBudget?: number }) => {
    const { totalBudget, monthlyBudget } = budgets;
    const result = await pool.query(
        `UPDATE "users" SET total_budget = $1, monthly_budget = $2
         WHERE user_id = $3
         RETURNING user_id, total_budget, monthly_budget`,
        [totalBudget, monthlyBudget, userId]
    );
    return result.rows[0];
};

export const findUserByEmail = async (email: string): Promise<UserRow | undefined> => {
    const result = await pool.query<UserRow>('SELECT * FROM Users WHERE email = $1', [email]);
    return result.rows[0];
};

export const createUser = async (user: any) => {
    const { email, password } = user;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const query = `
        INSERT INTO Users (email, password_hash)
        VALUES ($1, $2)
        RETURNING user_id, email;
    `;
    const values = [email, passwordHash];
    const result = await pool.query(query, values);
    return result.rows[0];
};


// ---- Items ----
export const getItems = async (userId: number, status?: string) => {
    // We also need to fetch associated images and links for items belonging to the user
    let query = 'SELECT * FROM Items WHERE user_id = $1';
    const values: (number | string)[] = [userId];

    if (status) {
        query += ' AND status = $2';
        values.push(status);
    }

    query += ' ORDER BY purchase_month ASC, priority ASC';

    const itemsResult = await pool.query(query, values);

    if (itemsResult.rows.length === 0) {
        return [];
    }
    const itemIds = itemsResult.rows.map((item: ItemRow) => item.item_id);

    const imagesResult = await pool.query('SELECT * FROM Images WHERE item_id = ANY($1::int[])', [itemIds]);
    const linksResult = await pool.query('SELECT * FROM Links WHERE item_id = ANY($1::int[])', [itemIds]);

    const items = itemsResult.rows.map((item: ItemRow) => {
        const images = imagesResult.rows.filter((img: ImageRow) => img.item_id === item.item_id);
        const links = linksResult.rows.filter((link: LinkRow) => link.item_id === item.item_id);
        return {
            id: item.item_id,
            name: item.name,
            category: item.category,
            status: item.status,
            estimatedCost: item.estimated_cost,
            actualCost: item.actual_cost,
            priority: item.priority,
            purchaseMonth: item.purchase_month,
            isPurchased: item.is_purchased,
            notes: item.notes,
            rating: item.rating,
            imageUrls: images.map((img: ImageRow) => img.image_url),
            links: links.map((l: LinkRow) => ({ id: l.link_id, url: l.url, annotation: l.annotation })),
        };
    });
    return items;
};

export const createItem = async (item: any, userId: number) => {
    const { name, category, estimatedCost, priority, purchaseMonth } = item;
    const query = `
        INSERT INTO Items (user_id, name, category, estimated_cost, priority, purchase_month, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'planned')
        RETURNING *;
    `;
    const values = [userId, name, category, estimatedCost, priority, purchaseMonth];
    const result = await pool.query(query, values);
    const newItem = result.rows[0];
    // Return the item in the same format as getItems
    return {
        id: newItem.item_id,
        name: newItem.name,
        category: newItem.category,
        status: newItem.status,
        estimatedCost: newItem.estimated_cost,
        actualCost: newItem.actual_cost,
        priority: newItem.priority,
        purchaseMonth: newItem.purchase_month,
        isPurchased: newItem.is_purchased,
        notes: newItem.notes,
        rating: newItem.rating,
        imageUrls: [],
        links: [],
    };
};

export const createItemFromImage = async (item: { user_id: number; name: string; status: 'inbox'; image_url: string }) => {
    const { user_id, name, status, image_url } = item;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const itemQuery = `
            INSERT INTO Items (user_id, name, status, category, estimated_cost, priority, purchase_month)
            VALUES ($1, $2, $3, 'Vêtement', 0, 'Moyenne', to_char(CURRENT_DATE, 'YYYY-MM'))
            RETURNING *;
        `;
        const itemValues = [user_id, name, status];
        const itemResult = await client.query(itemQuery, itemValues);
        const newItem = itemResult.rows[0];

        const imageQuery = `
            INSERT INTO Images (item_id, image_url)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const imageValues = [newItem.item_id, image_url];
        await client.query(imageQuery, imageValues);

        await client.query('COMMIT');

        return {
            id: newItem.item_id,
            name: newItem.name,
            category: newItem.category,
            status: newItem.status,
            estimatedCost: newItem.estimated_cost,
            actualCost: newItem.actual_cost,
            priority: newItem.priority,
            purchaseMonth: newItem.purchase_month,
            isPurchased: newItem.is_purchased,
            notes: newItem.notes,
            rating: newItem.rating,
            imageUrls: [image_url],
            links: [],
        };
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

const verifyItemOwner = async (itemId: number, userId: number) => {
    const result = await pool.query('SELECT user_id FROM Items WHERE item_id = $1', [itemId]);
    if (result.rows.length === 0 || result.rows[0].user_id !== userId) {
        throw new Error('Item not found or user not authorized');
    }
};

export const deleteItem = async (id: number, userId: number) => {
    await verifyItemOwner(id, userId);
    // We need to delete associated links and images first due to foreign key constraints
    await pool.query('DELETE FROM Images WHERE item_id = $1', [id]);
    await pool.query('DELETE FROM Links WHERE item_id = $1', [id]);
    await pool.query('DELETE FROM Items WHERE item_id = $1 AND user_id = $2', [id, userId]);
};

export const updateItem = async (id: number, updates: any, userId: number) => {
    await verifyItemOwner(id, userId);

    const fieldMapping: { [key: string]: string } = {
        name: 'name',
        category: 'category',
        status: 'status',
        estimatedCost: 'estimated_cost',
        priority: 'priority',
        purchaseMonth: 'purchase_month',
        isPurchased: 'is_purchased',
        actualCost: 'actual_cost',
        notes: 'notes',
        rating: 'rating',
    };

    const setClauses: string[] = [];
    const values: any[] = [];
    let valueCount = 1;

    for (const key in updates) {
        if (Object.prototype.hasOwnProperty.call(updates, key) && fieldMapping[key]) {
            setClauses.push(`${fieldMapping[key]} = $${valueCount++}`);
            values.push(updates[key]);
        }
    }

    if (setClauses.length === 0) {
        // Nothing to update
        const result = await pool.query('SELECT * FROM Items WHERE item_id = $1', [id]);
        return result.rows[0];
    }

    values.push(id);
    const query = `
        UPDATE Items
        SET ${setClauses.join(', ')}
        WHERE item_id = $${valueCount}
        RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
};

export const updateItemWithScrapedData = async (itemId: number, scrapedData: { imageUrl?: string; price?: number }) => {
    const { imageUrl, price } = scrapedData;

    if (imageUrl) {
        const query = 'INSERT INTO Images (item_id, image_url) VALUES ($1, $2) RETURNING *;';
        await pool.query(query, [itemId, imageUrl]);
    }

    if (price) {
        const query = 'UPDATE Items SET estimated_cost = $1 WHERE item_id = $2;';
        await pool.query(query, [price, itemId]);
    }
};

// ---- Planning Summary ----
export const getPlanningSummary = async (userId: number) => {
    const plannedItemsWhere = 'WHERE user_id = $1 AND status = \'planned\'';

    // 1. Total cost
    const totalCostResult = await pool.query(`SELECT SUM(estimated_cost) as "totalCost" FROM Items ${plannedItemsWhere}`, [userId]);
    const totalCost = parseFloat(totalCostResult.rows[0].totalCost) || 0;

    // 2. Cost by month
    const costByMonthResult = await pool.query(`
        SELECT purchase_month as name, SUM(estimated_cost) as value
        FROM Items
        ${plannedItemsWhere}
        GROUP BY purchase_month
        ORDER BY purchase_month
    `, [userId]);
    const costByMonth = costByMonthResult.rows.map(row => ({...row, name: row.name, value: parseFloat(row.value)}));

    // 3. Count by category
    const countByCategoryResult = await pool.query(`
        SELECT category as name, COUNT(*) as value
        FROM Items
        ${plannedItemsWhere}
        GROUP BY category
    `, [userId]);
    const countByCategory = countByCategoryResult.rows.map(row => ({...row, name: row.name, value: parseInt(row.value, 10)}));

    return {
        totalCost,
        costByMonth,
        countByCategory
    };
};

// ---- Images ----
export const addImageUrl = async (itemId: number, imageUrl: string, userId: number) => {
    await verifyItemOwner(itemId, userId);
    const query = 'INSERT INTO Images (item_id, image_url) VALUES ($1, $2) RETURNING *;';
    const result = await pool.query(query, [itemId, imageUrl]);
    return result.rows[0];
}

export const removeImageUrl = async (itemId: number, imageUrl: string, userId: number) => {
    await verifyItemOwner(itemId, userId);
    // This is tricky without a unique ID for the image url itself.
    // We'll delete the first match. A better schema would have a unique ID on the image row.
    const query = 'DELETE FROM Images WHERE image_id = (SELECT image_id FROM Images WHERE item_id = $1 AND image_url = $2 LIMIT 1)';
    await pool.query(query, [itemId, imageUrl]);
}

// ---- Links ----
export class DuplicateItemError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DuplicateItemError';
    }
}

export const createItemFromUrl = async (itemUrl: string, itemName: string, userId: number) => {
    // First, check if the URL already exists for this user to avoid duplicates.
    const existingLinkResult = await pool.query(
        'SELECT l.link_id FROM Links l JOIN Items i ON l.item_id = i.item_id WHERE l.url = $1 AND i.user_id = $2',
        [itemUrl, userId]
    );

    if (existingLinkResult.rows.length > 0) {
        throw new DuplicateItemError(`An item with this URL already exists.`);
    }

    // 1. Scrape data from the URL
    const scrapedData = await scrapeProductData(itemUrl);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 2. Create a new item with scraped data or defaults
        const defaultItem = {
            name: itemName,
            category: 'Vêtement',
            estimatedCost: scrapedData.price || 0, // Use scraped price or default to 0
            priority: 'Moyenne',
            purchaseMonth: new Date().toISOString().slice(0, 7)
        };

        const itemQuery = `
            INSERT INTO Items (user_id, name, category, estimated_cost, priority, purchase_month, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'inbox')
            RETURNING *;
        `;
        const itemValues = [userId, defaultItem.name, defaultItem.category, defaultItem.estimatedCost, defaultItem.priority, defaultItem.purchaseMonth];
        const itemResult = await client.query(itemQuery, itemValues);
        const newItemRow = itemResult.rows[0];

        // 3. Add the provided URL as a link to this new item
        const linkQuery = 'INSERT INTO Links (item_id, url, annotation) VALUES ($1, $2, $3) RETURNING *;';
        const linkValues = [newItemRow.item_id, itemUrl, 'Lien principal'];
        const linkResult = await client.query(linkQuery, linkValues);
        const newLink = linkResult.rows[0];

        // 4. If an image was scraped, add it to the Images table
        const imageUrls = [];
        if (scrapedData.imageUrl) {
            const imageQuery = 'INSERT INTO Images (item_id, image_url) VALUES ($1, $2) RETURNING image_url;';
            const imageResult = await client.query(imageQuery, [newItemRow.item_id, scrapedData.imageUrl]);
            imageUrls.push(imageResult.rows[0].image_url);
        }

        await client.query('COMMIT');

        // 5. Return the newly created item in the expected format
        return {
            id: newItemRow.item_id,
            name: newItemRow.name,
            category: newItemRow.category,
            status: newItemRow.status,
            estimatedCost: newItemRow.estimated_cost,
            actualCost: newItemRow.actual_cost,
            priority: newItemRow.priority,
            purchaseMonth: newItemRow.purchase_month,
            isPurchased: newItemRow.is_purchased,
            notes: newItemRow.notes,
            rating: newItemRow.rating,
            imageUrls: imageUrls,
            links: [{ id: newLink.link_id, url: newLink.url, annotation: newLink.annotation }],
        };

    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

export const addLink = async (itemId: number, link: any, userId: number) => {
    await verifyItemOwner(itemId, userId);
    const { url, annotation } = link;
    const query = 'INSERT INTO Links (item_id, url, annotation) VALUES ($1, $2, $3) RETURNING *;';
    const result = await pool.query(query, [itemId, url, annotation]);
    const newLink = result.rows[0];
    return { id: newLink.link_id, url: newLink.url, annotation: newLink.annotation };
}

export const removeLink = async (linkId: number, userId: number) => {
    const linkResult = await pool.query('SELECT t.user_id FROM Links l JOIN Items t ON l.item_id = t.item_id WHERE l.link_id = $1', [linkId]);
    if (linkResult.rows.length === 0 || linkResult.rows[0].user_id !== userId) {
        throw new Error('Link not found or user not authorized');
    }
    await pool.query('DELETE FROM Links WHERE link_id = $1', [linkId]);
}
