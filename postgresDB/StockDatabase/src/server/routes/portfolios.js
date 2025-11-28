const express = require('express');
const router = express.Router();
const pool = require('../../DB/pool');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Middleware to verify token
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

router.use(authenticate);

router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM portfolios WHERE user_id = $1', [req.user.user_id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { name } = req.body;
    try {
        await pool.query('INSERT INTO portfolios (user_id, portfolio_name) VALUES ($1, $2)', [req.user.user_id, name]);
        res.status(201).json({ message: 'Portfolio created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:name/deposit', async (req, res) => {
    const { name } = req.params;
    const { amount } = req.body;
    try {
        await pool.query('CALL deposit_cash($1::INT, $2::VARCHAR, $3::NUMERIC)', [req.user.user_id, name, amount]);
        res.json({ message: 'Deposit successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:name/withdraw', async (req, res) => {
    const { name } = req.params;
    const { amount } = req.body;
    try {
        await pool.query('CALL withdraw_cash($1::INT, $2::VARCHAR, $3::NUMERIC)', [req.user.user_id, name, amount]);
        res.json({ message: 'Withdraw successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:name/holdings', async (req, res) => {
    const { name } = req.params;
    try {
        const { rows } = await pool.query('SELECT * FROM portfolio_holdings WHERE user_id = $1 AND portfolio_name = $2', [req.user.user_id, name]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:name/buy', async (req, res) => {
    const { name } = req.params;
    const { symbol, shares } = req.body;
    try {
        // Get latest price
        const { rows } = await pool.query(
            'SELECT close_price FROM stock_history WHERE stock_symbol = $1 ORDER BY stock_date DESC LIMIT 1',
            [symbol.toUpperCase()]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Stock not found' });
        const price = rows[0].close_price;

        await pool.query('CALL buy_stock($1::INT, $2::VARCHAR, $3::VARCHAR, $4::NUMERIC, $5::NUMERIC)', [req.user.user_id, name, symbol.toUpperCase(), shares, price]);
        res.json({ message: 'Buy successful', price });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:name/sell', async (req, res) => {
    const { name } = req.params;
    const { symbol, shares } = req.body;
    try {
        // Get latest price
        const { rows } = await pool.query(
            'SELECT close_price FROM stock_history WHERE stock_symbol = $1 ORDER BY stock_date DESC LIMIT 1',
            [symbol.toUpperCase()]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Stock not found' });
        const price = rows[0].close_price;

        await pool.query('CALL sell_stock($1::INT, $2::VARCHAR, $3::VARCHAR, $4::NUMERIC, $5::NUMERIC)', [req.user.user_id, name, symbol.toUpperCase(), shares, price]);
        res.json({ message: 'Sell successful', price });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
