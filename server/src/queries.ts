import pool from './database';

// ---- Items ----
export const getItems = async () => {
    // We also need to fetch associated images and links
    const itemsResult = await pool.query('SELECT * FROM Items ORDER BY purchase_month ASC, priority ASC');
    const imagesResult = await pool.query('SELECT * FROM Images');
    const linksResult = await pool.query('SELECT * FROM Links');

    const items = itemsResult.rows.map(item => {
        const images = imagesResult.rows.filter(img => img.item_id === item.item_id);
        const links = linksResult.rows.filter(link => link.item_id === item.item_id);
        return {
            id: item.item_id,
            name: item.name,
            category: item.category,
            estimatedCost: item.estimated_cost,
            actualCost: item.actual_cost,
            priority: item.priority,
            purchaseMonth: item.purchase_month,
            isPurchased: item.is_purchased,
            notes: item.notes,
            rating: item.rating,
            imageUrls: images.map(img => img.image_url),
            links: links.map(l => ({ id: l.link_id, url: l.url, annotation: l.annotation })),
        };
    });
    return items;
};

export const createItem = async (item: any) => {
    const { name, category, estimatedCost, priority, purchaseMonth } = item;
    // Assuming a default user_id for now. This should be handled with authentication later.
    const user_id = 1;
    const query = `
        INSERT INTO Items (user_id, name, category, estimated_cost, priority, purchase_month)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    const values = [user_id, name, category, estimatedCost, priority, purchaseMonth];
    const result = await pool.query(query, values);
    const newItem = result.rows[0];
    // Return the item in the same format as getItems
    return {
        id: newItem.item_id,
        name: newItem.name,
        category: newItem.category,
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

export const deleteItem = async (id: number) => {
    // We need to delete associated links and images first due to foreign key constraints
    await pool.query('DELETE FROM Images WHERE item_id = $1', [id]);
    await pool.query('DELETE FROM Links WHERE item_id = $1', [id]);
    await pool.query('DELETE FROM Items WHERE item_id = $1', [id]);
};

export const updateItem = async (id: number, updates: any) => {
    const { actualCost, isPurchased, notes, rating } = updates;
    // This is a simplified update. A more robust solution would handle different fields.
    const query = `
        UPDATE Items
        SET actual_cost = $1, is_purchased = $2, notes = $3, rating = $4
        WHERE item_id = $5
        RETURNING *;
    `;
    const values = [actualCost, isPurchased, notes, rating, id];
    const result = await pool.query(query, values);
    return result.rows[0];
};

// ---- Images ----
export const addImageUrl = async (itemId: number, imageUrl: string) => {
    const query = 'INSERT INTO Images (item_id, image_url) VALUES ($1, $2) RETURNING *;';
    const result = await pool.query(query, [itemId, imageUrl]);
    return result.rows[0];
}

export const removeImageUrl = async (itemId: number, imageUrl: string) => {
    // This is tricky without a unique ID for the image url itself.
    // We'll delete the first match. A better schema would have a unique ID on the image row.
    const query = 'DELETE FROM Images WHERE image_id = (SELECT image_id FROM Images WHERE item_id = $1 AND image_url = $2 LIMIT 1)';
    await pool.query(query, [itemId, imageUrl]);
}

// ---- Links ----
export const addLink = async (itemId: number, link: any) => {
    const { url, annotation } = link;
    const query = 'INSERT INTO Links (item_id, url, annotation) VALUES ($1, $2, $3) RETURNING *;';
    const result = await pool.query(query, [itemId, url, annotation]);
    const newLink = result.rows[0];
    return { id: newLink.link_id, url: newLink.url, annotation: newLink.annotation };
}

export const removeLink = async (linkId: number) => {
    await pool.query('DELETE FROM Links WHERE link_id = $1', [linkId]);
}
