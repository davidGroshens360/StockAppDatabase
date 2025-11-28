const express = require('express');
const router = express.Router();
const pool = require('../../DB/pool');

router.get('/:symbol/history', async (req, res) => {
    const { symbol } = req.params;
    try {
        const { rows } = await pool.query(
            'SELECT * FROM stock_history WHERE stock_symbol = $1 ORDER BY stock_date',
            [symbol.toUpperCase()]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:symbol/stats', async (req, res) => {
    const { symbol } = req.params;
    const { start, end } = req.query;
    try {
        const { rows } = await pool.query(
            'SELECT * FROM get_stock_stats($1, $2, $3)',
            [symbol.toUpperCase(), start, end]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:symbol/predict', async (req, res) => {
    const { symbol } = req.params;
    const days = parseInt(req.query.days) || 5;
    try {
        const { rows } = await pool.query(
            'SELECT close_price FROM stock_history WHERE stock_symbol = $1 ORDER BY stock_date',
            [symbol.toUpperCase()]
        );

        const y = rows.map(r => Number(r.close_price));
        const x = y.map((_, i) => i);
        const n = x.length;

        if (n === 0) return res.json([]);

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((s, xi, i) => s + xi * y[i], 0);
        const sumX2 = x.reduce((s, xi) => s + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const predictions = [];
        for (let i = 1; i <= days; i++) {
            predictions.push({
                day: i,
                price: intercept + slope * (n + i)
            });
        }
        res.json(predictions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
