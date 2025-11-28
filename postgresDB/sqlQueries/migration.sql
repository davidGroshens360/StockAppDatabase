-- Migration Script to update existing database

-- 1. Update userFriends table
ALTER TABLE userFriends ADD COLUMN last_updated TIMESTAMP DEFAULT NOW();

-- 2. Update stock_list visibility check
ALTER TABLE stock_list DROP CONSTRAINT stock_list_visibility_check;
ALTER TABLE stock_list ADD CONSTRAINT stock_list_visibility_check CHECK (visibility IN ('public', 'private', 'shared'));

-- 3. Create stock_list_shares table
CREATE TABLE stock_list_shares (
    list_owner_id INT NOT NULL,
    list_name VARCHAR(255) NOT NULL,
    shared_with_user_id INT NOT NULL REFERENCES users(user_id),
    PRIMARY KEY (list_owner_id, list_name, shared_with_user_id),
    FOREIGN KEY (list_owner_id, list_name) REFERENCES stock_list(user_id, list_name) ON DELETE CASCADE
);

-- 4. Update reviews table
-- Assuming reviews table exists with user_id. We rename it to reviewer_id and add link to stock_list.
-- If you want to keep data, we need to handle the new NOT NULL columns.
-- For now, we will add columns as nullable, then update if needed, or just recreate.
-- Since this is a dev project, we might just drop and recreate if data isn't critical.
-- But let's try to ALTER.

ALTER TABLE reviews RENAME COLUMN user_id TO reviewer_id;
ALTER TABLE reviews ADD COLUMN list_user_id INT;
ALTER TABLE reviews ADD COLUMN list_name VARCHAR(255);

-- We can't make them NOT NULL immediately if there is existing data without defaults.
-- If table is empty:
-- ALTER TABLE reviews ALTER COLUMN list_user_id SET NOT NULL;
-- ALTER TABLE reviews ALTER COLUMN list_name SET NOT NULL;

ALTER TABLE reviews ADD FOREIGN KEY (list_user_id, list_name) REFERENCES stock_list(user_id, list_name) ON DELETE CASCADE;

-- 5. Create stock_updates table
CREATE TABLE stock_updates (
    stock_symbol VARCHAR(20) NOT NULL REFERENCES stock(stock_symbol),
    stock_date DATE NOT NULL,
    open_price NUMERIC(18, 4),
    close_price NUMERIC(18, 4),
    high_price NUMERIC(18, 4),
    low_price NUMERIC(18, 4),
    volume INT,
    PRIMARY KEY (stock_symbol, stock_date)
);

-- 6. Create combined_stock_history view
CREATE VIEW combined_stock_history AS
SELECT * FROM stock_history
UNION
SELECT * FROM stock_updates;
