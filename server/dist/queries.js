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
exports.removeLink = exports.addLink = exports.createItemFromUrl = exports.removeImageUrl = exports.addImageUrl = exports.updateItem = exports.deleteItem = exports.createItem = exports.getItems = void 0;
const database_1 = __importDefault(require("./database"));
// ---- Items ----
const getItems = () => __awaiter(void 0, void 0, void 0, function* () {
    // We also need to fetch associated images and links
    const itemsResult = yield database_1.default.query('SELECT * FROM Items ORDER BY purchase_month ASC, priority ASC');
    const imagesResult = yield database_1.default.query('SELECT * FROM Images');
    const linksResult = yield database_1.default.query('SELECT * FROM Links');
    const items = itemsResult.rows.map((item) => {
        const images = imagesResult.rows.filter((img) => img.item_id === item.item_id);
        const links = linksResult.rows.filter((link) => link.item_id === item.item_id);
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
            imageUrls: images.map((img) => img.image_url),
            links: links.map((l) => ({ id: l.link_id, url: l.url, annotation: l.annotation })),
        };
    });
    return items;
});
exports.getItems = getItems;
const createItem = (item) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, category, estimatedCost, priority, purchaseMonth } = item;
    // Assuming a default user_id for now. This should be handled with authentication later.
    const user_id = 1;
    const query = `
        INSERT INTO Items (user_id, name, category, estimated_cost, priority, purchase_month)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    const values = [user_id, name, category, estimatedCost, priority, purchaseMonth];
    const result = yield database_1.default.query(query, values);
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
});
exports.createItem = createItem;
const deleteItem = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // We need to delete associated links and images first due to foreign key constraints
    yield database_1.default.query('DELETE FROM Images WHERE item_id = $1', [id]);
    yield database_1.default.query('DELETE FROM Links WHERE item_id = $1', [id]);
    yield database_1.default.query('DELETE FROM Items WHERE item_id = $1', [id]);
});
exports.deleteItem = deleteItem;
const updateItem = (id, updates) => __awaiter(void 0, void 0, void 0, function* () {
    const fieldMapping = {
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
    const setClauses = [];
    const values = [];
    let valueCount = 1;
    for (const key in updates) {
        if (Object.prototype.hasOwnProperty.call(updates, key) && fieldMapping[key]) {
            setClauses.push(`${fieldMapping[key]} = $${valueCount++}`);
            values.push(updates[key]);
        }
    }
    if (setClauses.length === 0) {
        // Nothing to update
        const result = yield database_1.default.query('SELECT * FROM Items WHERE item_id = $1', [id]);
        return result.rows[0];
    }
    values.push(id);
    const query = `
        UPDATE Items
        SET ${setClauses.join(', ')}
        WHERE item_id = $${valueCount}
        RETURNING *;
    `;
    const result = yield database_1.default.query(query, values);
    return result.rows[0];
});
exports.updateItem = updateItem;
// ---- Images ----
const addImageUrl = (itemId, imageUrl) => __awaiter(void 0, void 0, void 0, function* () {
    const query = 'INSERT INTO Images (item_id, image_url) VALUES ($1, $2) RETURNING *;';
    const result = yield database_1.default.query(query, [itemId, imageUrl]);
    return result.rows[0];
});
exports.addImageUrl = addImageUrl;
const removeImageUrl = (itemId, imageUrl) => __awaiter(void 0, void 0, void 0, function* () {
    // This is tricky without a unique ID for the image url itself.
    // We'll delete the first match. A better schema would have a unique ID on the image row.
    const query = 'DELETE FROM Images WHERE image_id = (SELECT image_id FROM Images WHERE item_id = $1 AND image_url = $2 LIMIT 1)';
    yield database_1.default.query(query, [itemId, imageUrl]);
});
exports.removeImageUrl = removeImageUrl;
// ---- Links ----
const createItemFromUrl = (itemUrl, itemName) => __awaiter(void 0, void 0, void 0, function* () {
    // Begin a transaction
    const client = yield database_1.default.connect();
    try {
        yield client.query('BEGIN');
        // 1. Create a new item with default values
        const user_id = 1; // Placeholder for user authentication
        const defaultItem = {
            name: itemName,
            category: 'Vêtement', // Default category, user can change it later
            estimatedCost: 0, // Default cost
            priority: 'Moyenne', // Default priority
            purchaseMonth: new Date().toISOString().slice(0, 7) // Default to current month
        };
        const itemQuery = `
      INSERT INTO Items (user_id, name, category, estimated_cost, priority, purchase_month)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
        const itemValues = [user_id, defaultItem.name, defaultItem.category, defaultItem.estimatedCost, defaultItem.priority, defaultItem.purchaseMonth];
        const itemResult = yield client.query(itemQuery, itemValues);
        const newItemRow = itemResult.rows[0];
        // 2. Add the provided URL as a link to this new item
        const linkQuery = 'INSERT INTO Links (item_id, url, annotation) VALUES ($1, $2, $3) RETURNING *;';
        const linkValues = [newItemRow.item_id, itemUrl, 'Lien principal'];
        const linkResult = yield client.query(linkQuery, linkValues);
        const newLink = linkResult.rows[0];
        // Commit the transaction
        yield client.query('COMMIT');
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
    }
    catch (e) {
        yield client.query('ROLLBACK');
        throw e;
    }
    finally {
        client.release();
    }
});
exports.createItemFromUrl = createItemFromUrl;
const addLink = (itemId, link) => __awaiter(void 0, void 0, void 0, function* () {
    const { url, annotation } = link;
    const query = 'INSERT INTO Links (item_id, url, annotation) VALUES ($1, $2, $3) RETURNING *;';
    const result = yield database_1.default.query(query, [itemId, url, annotation]);
    const newLink = result.rows[0];
    return { id: newLink.link_id, url: newLink.url, annotation: newLink.annotation };
});
exports.addLink = addLink;
const removeLink = (linkId) => __awaiter(void 0, void 0, void 0, function* () {
    yield database_1.default.query('DELETE FROM Links WHERE link_id = $1', [linkId]);
});
exports.removeLink = removeLink;
