import pool from './database';

interface ItemRow {
    item_id: number;
    user_id: number;
    name: string;
    category: 'Vêtement' | 'Chaussures' | 'Parfum';
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

// ---- Items ----
export const getItems = async () => {
    // We also need to fetch associated images and links
    const itemsResult = await pool.query('SELECT * FROM Items ORDER BY purchase_month ASC, priority ASC');
    const imagesResult = await pool.query('SELECT * FROM Images');
    const linksResult = await pool.query('SELECT * FROM Links');

    const items = itemsResult.rows.map((item: ItemRow) => {
        const images = imagesResult.rows.filter((img: ImageRow) => img.item_id === item.item_id);
        const links = linksResult.rows.filter((link: LinkRow) => link.item_id === item.item_id);
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
            imageUrls: images.map((img: ImageRow) => img.image_url),
            links: links.map((l: LinkRow) => ({ id: l.link_id, url: l.url, annotation: l.annotation })),
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
    const fieldMapping: { [key: string]: string } = {
        name: 'name',
        category: 'category',
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
export const createItemFromUrl = async (itemUrl: string, itemName: string) => {
  // Begin a transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create a new item with default values
    const user_id = 1; // Placeholder for user authentication
    const defaultItem = {
      name: itemName,
      category: 'Vêtement', // Default category, user can change it later
      estimatedCost: 0,    // Default cost
      priority: 'Moyenne', // Default priority
      purchaseMonth: new Date().toISOString().slice(0, 7) // Default to current month
    };

    const itemQuery = `
      INSERT INTO Items (user_id, name, category, estimated_cost, priority, purchase_month)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const itemValues = [user_id, defaultItem.name, defaultItem.category, defaultItem.estimatedCost, defaultItem.priority, defaultItem.purchaseMonth];
    const itemResult = await client.query(itemQuery, itemValues);
    const newItemRow = itemResult.rows[0];

    // 2. Add the provided URL as a link to this new item
    const linkQuery = 'INSERT INTO Links (item_id, url, annotation) VALUES ($1, $2, $3) RETURNING *;';
    const linkValues = [newItemRow.item_id, itemUrl, 'Lien principal'];
    const linkResult = await client.query(linkQuery, linkValues);
    const newLink = linkResult.rows[0];

    // Commit the transaction
    await client.query('COMMIT');

    // 3. Return the newly created item in the expected format
    return {
      id: newItemRow.item_id,
      name: newItemRow.name,
      category: newItemRow.category,
      estimatedCost: newItemRow.estimated_cost,
      actualCost: newItemRow.actual_cost,
      priority: newItemRow.priority,
      purchaseMonth: newItemRow.purchase_month,
      isPurchased: newItemRow.is_purchased,
      notes: newItemRow.notes,
      rating: newItemRow.rating,
      imageUrls: [],
      links: [{ id: newLink.link_id, url: newLink.url, annotation: newLink.annotation }],
    };

  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

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
