-- This File will list out all the SQL Queries used to Create The Database
-- The following Commands were done in the google cloud VM.
-- These tables are all based off the ER diagram from task 1

-- initialize Database
CREATE DATABASE stocks;

-- Create Stock Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()    
);

-- Create Table for Friend Relation
CREATE TABLE userFriends (
    sender_id INT NOT NULL REFERENCES users(user_id),
    receiver_id INT NOT NULL REFERENCES users(user_id),
    friend_status VARCHAR(20) NOT NULL CHECK (friend_status IN ('pending', 'accepted', 'rejected')),
    last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (sender_id, receiver_id)
);



--Create Portfolio Table
CREATE TABLE portfolios (
    user_id INT NOT NULL REFERENCES users(user_id),
    portfolio_name VARCHAR(255) NOT NULL,
    cash_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, portfolio_name)
);

--Create Portfolio Holding Table
CREATE TABLE portfolio_holdings (
    holding_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    portfolio_name VARCHAR(255) NOT NULL,
    stock_symbol VARCHAR(20) NOT NULL,
    shares NUMERIC(18, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id, portfolio_name)
        REFERENCES portfolios (user_id, portfolio_name)
);

--Create portfolio Transaction Table
-- stock symbol is null if transaction is cash ans SHARES is 0
CREATE TABLE portfolio_transactions (
    transaction_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    portfolio_name VARCHAR(255) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deposit', 'withdraw', 'buy', 'sell')),
    stock_symbol VARCHAR(20),
    amount NUMERIC(18, 2) NOT NULL,
    shares NUMERIC(18, 2),
    transaction_date TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id, portfolio_name)
        REFERENCES portfolios (user_id, portfolio_name)
);

--CREATE STOCK TABLE
CREATE TABLE stock (
    stock_symbol VARCHAR(20) PRIMARY KEY,
    stock_name VARCHAR(255),
    sector VARCHAR (255)
);

--CREATE STOCK history table
CREATE TABLE stock_history (
    stock_symbol VARCHAR(20) NOT NULL REFERENCES stock(stock_symbol),
    stock_date DATE NOT NULL,
    open_price NUMERIC(18, 4),
    close_price NUMERIC(18, 4),
    high_price NUMERIC(18, 4),
    low_price NUMERIC(18, 4),
    volume INT,
    PRIMARY KEY (stock_symbol, stock_date)
);

--Create Stock Updates Table (for user-added data)
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

--Create Combined Stock History View
CREATE VIEW combined_stock_history AS
SELECT * FROM stock_history
UNION
SELECT * FROM stock_updates;

--Create Stock List Table
CREATE TABLE stock_list (
    user_id INT NOT NULL REFERENCES users(user_id),
    list_name VARCHAR(255) NOT NULL,
    visibility VARCHAR(20) NOT NULL CHECK (visibility IN ('public', 'private', 'shared')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, list_name)
);

--Create Stock List Shares Table
CREATE TABLE stock_list_shares (
    list_owner_id INT NOT NULL,
    list_name VARCHAR(255) NOT NULL,
    shared_with_user_id INT NOT NULL REFERENCES users(user_id),
    PRIMARY KEY (list_owner_id, list_name, shared_with_user_id),
    FOREIGN KEY (list_owner_id, list_name) REFERENCES stock_list(user_id, list_name) ON DELETE CASCADE
);

--Create Review Table
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    reviewer_id INT NOT NULL REFERENCES users(user_id),
    list_user_id INT NOT NULL,
    list_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (list_user_id, list_name) REFERENCES stock_list(user_id, list_name) ON DELETE CASCADE
);

--CREATE Stock List to stock Relationship
CREATE TABLE stock_list_items (
    user_id INT NOT NULL,
    list_name VARCHAR(255) NOT NULL,
    stock_symbol VARCHAR(20) NOT NULL REFERENCES stock(stock_symbol),
    PRIMARY KEY (user_id, list_name, stock_symbol),
    FOREIGN KEY (user_id, list_name)
        REFERENCES stock_list(user_id, list_name)
);


-- We inititialize the Stock Table with All the unique Stock Symbols (We do not have name or Sector)

-- We Initialize Stock_History with all the info from SP500History.csv

