-- Statistical Analysis Functions

-- Get Stock Statistics (Mean, StdDev, CoV)
CREATE OR REPLACE FUNCTION get_stock_stats(
    p_symbol VARCHAR,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    avg_close NUMERIC,
    stddev_close NUMERIC,
    coef_variation NUMERIC
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        AVG(close_price),
        STDDEV(close_price),
        STDDEV(close_price) / NULLIF(AVG(close_price), 0)
    FROM stock_history
    WHERE stock_symbol = p_symbol AND stock_date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- Get Stock Beta
CREATE OR REPLACE FUNCTION get_stock_beta(
    p_symbol VARCHAR,
    p_market_symbol VARCHAR,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS NUMERIC
AS $$
DECLARE
    v_beta NUMERIC;
BEGIN
    SELECT
        COVAR_SAMP(s.close_price, m.close_price) / NULLIF(VAR_SAMP(m.close_price), 0) INTO v_beta
    FROM stock_history s
    JOIN stock_history m ON s.stock_date = m.stock_date
    WHERE s.stock_symbol = p_symbol
      AND m.stock_symbol = p_market_symbol
      AND s.stock_date BETWEEN p_start_date AND p_end_date;
    
    RETURN v_beta;
END;
$$ LANGUAGE plpgsql;

-- Get Portfolio Covariance/Correlation Matrix
CREATE OR REPLACE FUNCTION get_covariance_matrix(
    p_user_id INT,
    p_portfolio_name VARCHAR,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    stock1 VARCHAR,
    stock2 VARCHAR,
    covariance NUMERIC,
    correlation NUMERIC
)
AS $$
BEGIN
    RETURN QUERY
    WITH portfolio_stocks AS (
        SELECT stock_symbol FROM portfolio_holdings
        WHERE user_id = p_user_id AND portfolio_name = p_portfolio_name
    ),
    stock_data AS (
        SELECT s.stock_symbol, s.stock_date, s.close_price
        FROM stock_history s
        JOIN portfolio_stocks ps ON s.stock_symbol = ps.stock_symbol
        WHERE s.stock_date BETWEEN p_start_date AND p_end_date
    )
    SELECT
        s1.stock_symbol AS stock1,
        s2.stock_symbol AS stock2,
        COVAR_SAMP(s1.close_price, s2.close_price) AS covariance,
        CORR(s1.close_price, s2.close_price) AS correlation
    FROM stock_data s1
    JOIN stock_data s2 ON s1.stock_date = s2.stock_date
    GROUP BY s1.stock_symbol, s2.stock_symbol;
END;
$$ LANGUAGE plpgsql;

-- Simple Moving Average Prediction
CREATE OR REPLACE FUNCTION predict_next_price_ma(
    p_symbol VARCHAR,
    p_window_size INT
)
RETURNS NUMERIC
AS $$
DECLARE
    v_prediction NUMERIC;
BEGIN
    SELECT AVG(close_price) INTO v_prediction
    FROM (
        SELECT close_price
        FROM combined_stock_history
        WHERE stock_symbol = p_symbol
        ORDER BY stock_date DESC
        LIMIT p_window_size
    ) sub;
    
    RETURN v_prediction;
END;
$$ LANGUAGE plpgsql;
