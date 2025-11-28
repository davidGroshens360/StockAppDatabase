-- Stored Procedures for Portfolio Operations

-- Deposit Cash
CREATE OR REPLACE PROCEDURE deposit_cash(
    p_user_id INT,
    p_portfolio_name VARCHAR,
    p_amount NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update portfolio cash
    UPDATE portfolios
    SET cash_amount = cash_amount + p_amount
    WHERE user_id = p_user_id AND portfolio_name = p_portfolio_name;

    -- Record transaction
    INSERT INTO portfolio_transactions (user_id, portfolio_name, transaction_type, amount, transaction_date)
    VALUES (p_user_id, p_portfolio_name, 'deposit', p_amount, NOW());
END;
$$;

-- Withdraw Cash
CREATE OR REPLACE PROCEDURE withdraw_cash(
    p_user_id INT,
    p_portfolio_name VARCHAR,
    p_amount NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    current_cash NUMERIC;
BEGIN
    -- Check current cash
    SELECT cash_amount INTO current_cash
    FROM portfolios
    WHERE user_id = p_user_id AND portfolio_name = p_portfolio_name;

    IF current_cash < p_amount THEN
        RAISE EXCEPTION 'Insufficient funds';
    END IF;

    -- Update portfolio cash
    UPDATE portfolios
    SET cash_amount = cash_amount - p_amount
    WHERE user_id = p_user_id AND portfolio_name = p_portfolio_name;

    -- Record transaction
    INSERT INTO portfolio_transactions (user_id, portfolio_name, transaction_type, amount, transaction_date)
    VALUES (p_user_id, p_portfolio_name, 'withdraw', p_amount, NOW());
END;
$$;

-- Buy Stock
CREATE OR REPLACE PROCEDURE buy_stock(
    p_user_id INT,
    p_portfolio_name VARCHAR,
    p_symbol VARCHAR,
    p_shares NUMERIC,
    p_price NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    total_cost NUMERIC;
    current_cash NUMERIC;
BEGIN
    total_cost := p_shares * p_price;

    -- Check current cash
    SELECT cash_amount INTO current_cash
    FROM portfolios
    WHERE user_id = p_user_id AND portfolio_name = p_portfolio_name;

    IF current_cash < total_cost THEN
        RAISE EXCEPTION 'Insufficient funds';
    END IF;

    -- Deduct cash
    UPDATE portfolios
    SET cash_amount = cash_amount - total_cost
    WHERE user_id = p_user_id AND portfolio_name = p_portfolio_name;

    -- Update or Insert Holding
    IF EXISTS (SELECT 1 FROM portfolio_holdings WHERE user_id = p_user_id AND portfolio_name = p_portfolio_name AND stock_symbol = p_symbol) THEN
        UPDATE portfolio_holdings
        SET shares = shares + p_shares, updated_at = NOW()
        WHERE user_id = p_user_id AND portfolio_name = p_portfolio_name AND stock_symbol = p_symbol;
    ELSE
        INSERT INTO portfolio_holdings (user_id, portfolio_name, stock_symbol, shares, updated_at)
        VALUES (p_user_id, p_portfolio_name, p_symbol, p_shares, NOW());
    END IF;

    -- Record transaction
    INSERT INTO portfolio_transactions (user_id, portfolio_name, transaction_type, stock_symbol, amount, shares, transaction_date)
    VALUES (p_user_id, p_portfolio_name, 'buy', p_symbol, total_cost, p_shares, NOW());
END;
$$;

-- Sell Stock
CREATE OR REPLACE PROCEDURE sell_stock(
    p_user_id INT,
    p_portfolio_name VARCHAR,
    p_symbol VARCHAR,
    p_shares NUMERIC,
    p_price NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    current_shares NUMERIC;
    total_revenue NUMERIC;
BEGIN
    total_revenue := p_shares * p_price;

    -- Check current shares
    SELECT shares INTO current_shares
    FROM portfolio_holdings
    WHERE user_id = p_user_id AND portfolio_name = p_portfolio_name AND stock_symbol = p_symbol;

    IF current_shares IS NULL OR current_shares < p_shares THEN
        RAISE EXCEPTION 'Insufficient shares';
    END IF;

    -- Add cash
    UPDATE portfolios
    SET cash_amount = cash_amount + total_revenue
    WHERE user_id = p_user_id AND portfolio_name = p_portfolio_name;

    -- Deduct shares
    UPDATE portfolio_holdings
    SET shares = shares - p_shares, updated_at = NOW()
    WHERE user_id = p_user_id AND portfolio_name = p_portfolio_name AND stock_symbol = p_symbol;

    -- Record transaction
    INSERT INTO portfolio_transactions (user_id, portfolio_name, transaction_type, stock_symbol, amount, shares, transaction_date)
    VALUES (p_user_id, p_portfolio_name, 'sell', p_symbol, total_revenue, p_shares, NOW());
END;
$$;

-- Add Stock Update
CREATE OR REPLACE PROCEDURE add_stock_update(
    p_symbol VARCHAR,
    p_date DATE,
    p_open NUMERIC,
    p_close NUMERIC,
    p_high NUMERIC,
    p_low NUMERIC,
    p_volume INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO stock_updates (stock_symbol, stock_date, open_price, close_price, high_price, low_price, volume)
    VALUES (p_symbol, p_date, p_open, p_close, p_high, p_low, p_volume)
    ON CONFLICT (stock_symbol, stock_date)
    DO UPDATE SET
        open_price = EXCLUDED.open_price,
        close_price = EXCLUDED.close_price,
        high_price = EXCLUDED.high_price,
        low_price = EXCLUDED.low_price,
        volume = EXCLUDED.volume;
END;
$$;
