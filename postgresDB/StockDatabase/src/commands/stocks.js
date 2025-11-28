const pool = require('../DB/pool');
const session = require('../auth/session');

function sma(values, window) {
  if (values.length < window) return [];
  return values.map((_, i) =>
    i + 1 < window
      ? null
      : values.slice(i - window + 1, i + 1)
        .reduce((a, b) => a + b, 0) / window
  );
}

module.exports = (program) => {

  const stock = program
    .command('stock')
    .description('Stock data and analysis');

  stock
    .command('history <symbol>')
    .description('View historical prices')
    .action(async (symbol) => {
      try {
        const { rows } = await pool.query(
          `SELECT stock_date, close_price
           FROM stock_history
           WHERE stock_symbol = $1
           ORDER BY stock_date`,
          [symbol.toUpperCase()]
        );
        console.table(rows);
      } catch (err) {
        console.error(err.message);
      }
    });

  stock
    .command('add <symbol> <date> <open> <close> <high> <low> <volume>')
    .description('Add stock data')
    .action(async (symbol, date, open, close, high, low, volume) => {
      try {
        await pool.query(
          'CALL add_stock_update($1, $2, $3, $4, $5, $6, $7)',
          [symbol.toUpperCase(), date, open, close, high, low, volume]
        );
        console.log(`Added data for ${symbol} on ${date}`);
      } catch (err) {
        console.error(err.message);
      }
    });

  stock
    .command('stats <symbol> <start_date> <end_date>')
    .description('Get stock statistics (Mean, StdDev, CoV)')
    .action(async (symbol, start_date, end_date) => {
      try {
        const { rows } = await pool.query(
          'SELECT * FROM get_stock_stats($1, $2, $3)',
          [symbol.toUpperCase(), start_date, end_date]
        );
        console.table(rows);
      } catch (err) {
        console.error(err.message);
      }
    });

  stock
    .command('beta <symbol> <market_symbol> <start_date> <end_date>')
    .description('Get stock Beta relative to market')
    .action(async (symbol, market_symbol, start_date, end_date) => {
      try {
        const { rows } = await pool.query(
          'SELECT get_stock_beta($1, $2, $3, $4) as beta',
          [symbol.toUpperCase(), market_symbol.toUpperCase(), start_date, end_date]
        );
        console.table(rows);
      } catch (err) {
        console.error(err.message);
      }
    });

  stock
    .command('sma <symbol>')
    .option('-w, --window <n>', 'Window size', '20')
    .description('Simple moving average')
    .action(async (symbol, opts) => {
      try {
        const { rows } = await pool.query(
          `SELECT close_price
           FROM stock_history
           WHERE stock_symbol = $1
           ORDER BY stock_date`,
          [symbol.toUpperCase()]
        );

        const closes = rows.map(r => Number(r.close_price));
        const values = sma(closes, Number(opts.window));

        console.log(values.filter(v => v !== null));
      } catch (err) {
        console.error(err.message);
      }
    });

  stock
    .command('predict <symbol>')
    .option('-d, --days <n>', 'Days ahead', '5')
    .description('Linear regression prediction')
    .action(async (symbol, opts) => {
      try {
        const { rows } = await pool.query(
          `SELECT close_price
           FROM stock_history
           WHERE stock_symbol = $1
           ORDER BY stock_date`,
          [symbol.toUpperCase()]
        );

        const y = rows.map(r => Number(r.close_price));
        const x = y.map((_, i) => i);

        const n = x.length;
        if (n === 0) return console.log('No data');

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((s, xi, i) => s + xi * y[i], 0);
        const sumX2 = x.reduce((s, xi) => s + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        for (let i = 1; i <= Number(opts.days); i++) {
          const pred = intercept + slope * (n + i);
          console.log(`Day +${i}: ${pred.toFixed(2)}`);
        }
      } catch (err) {
        console.error(err.message);
      }
    });
};