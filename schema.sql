-- Define ENUM types first
CREATE TYPE item_category AS ENUM ('Vêtement', 'Chaussures', 'Parfum');
CREATE TYPE item_priority AS ENUM ('Haute', 'Moyenne', 'Basse');

-- Table: Users
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    total_budget DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    monthly_budget DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Items
CREATE TABLE Items (
    item_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    category item_category NOT NULL,
    estimated_cost DECIMAL(10, 2) NOT NULL,
    actual_cost DECIMAL(10, 2),
    priority item_priority NOT NULL,
    purchase_month VARCHAR(7) NOT NULL,
    is_purchased BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    rating INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- Table: Images
CREATE TABLE Images (
    image_id SERIAL PRIMARY KEY,
    item_id INT NOT NULL,
    image_url TEXT NOT NULL,
    FOREIGN KEY (item_id) REFERENCES Items(item_id)
);

-- Table: Links
CREATE TABLE Links (
    link_id SERIAL PRIMARY KEY,
    item_id INT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    annotation VARCHAR(255) NOT NULL,
    FOREIGN KEY (item_id) REFERENCES Items(item_id)
);
