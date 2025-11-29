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

  // Create stock command ONCE
  const stock = program
    .command('stock')
    .description('Stock data and analysis');

  // stock history
  stock
    .command('history <symbol>')
    .description('View historical prices')
    .action(async (symbol) => {
      const { rows } = await pool.query(
        `SELECT stock_date, close_price
         FROM stock_history
         WHERE stock_symbol = $1
         ORDER BY stock_date`,
        [symbol.toUpperCase()]
      );

      console.table(rows);
      process.exit(0);
    });

  // stock sma
  stock
    .command('sma <symbol>')
    .option('-w, --window <n>', 'Window size', '20')
    .description('Simple moving average')
    .action(async (symbol, opts) => {
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
      process.exit(0);
    });

  // stock predict
  stock
    .command('predict <symbol>')
    .option('-d, --days <n>', 'Days ahead', '5')
    .description('Linear regression prediction')
    .action(async (symbol, opts) => {
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
      const sumX = x.reduce((a,b)=>a+b,0);
      const sumY = y.reduce((a,b)=>a+b,0);
      const sumXY = x.reduce((s,xi,i)=>s+xi*y[i],0);
      const sumX2 = x.reduce((s,xi)=>s+xi*xi,0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      for (let i = 1; i <= Number(opts.days); i++) {
        const pred = intercept + slope * (n + i);
        console.log(`Day +${i}: ${pred.toFixed(2)}`);
      }

      process.exit(0);
    });
  // stock beta
 stock
  .command('beta <symbol>')
  .description('Calculate beta using average market returns')
  .action(async (symbol) => {
    try {
      const sym = symbol.toUpperCase();

      const { rows } = await pool.query(
        `
        WITH returns AS (
          SELECT
            stock_symbol,
            stock_date,
            (close_price - LAG(close_price)
              OVER (PARTITION BY stock_symbol ORDER BY stock_date))
            / LAG(close_price)
              OVER (PARTITION BY stock_symbol ORDER BY stock_date)
            AS daily_return
          FROM stock_history
        ),
        market AS (
          SELECT
            stock_date,
            AVG(daily_return) AS market_return
          FROM returns
          WHERE daily_return IS NOT NULL
          GROUP BY stock_date
        )
        SELECT
          r.stock_date,
          r.daily_return AS stock_return,
          m.market_return
        FROM returns r
        JOIN market m USING (stock_date)
        WHERE r.stock_symbol = $1
          AND r.daily_return IS NOT NULL
        ORDER BY r.stock_date
        `,
        [sym]
      );

      if (rows.length < 2) {
        return console.log('Not enough data to calculate beta');
      }

      const stockR = rows.map(r => Number(r.stock_return));
      const marketR = rows.map(r => Number(r.market_return));

      const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;

      const meanStock = mean(stockR);
      const meanMarket = mean(marketR);

      let cov = 0;
      let varM = 0;

      for (let i = 0; i < stockR.length; i++) {
        cov += (stockR[i] - meanStock) * (marketR[i] - meanMarket);
        varM += (marketR[i] - meanMarket) ** 2;
      }

      cov /= stockR.length;
      varM /= stockR.length;

      const beta = cov / varM;

      console.log(`Beta of ${sym} vs market average: ${beta.toFixed(4)}`);
    } catch (err) {
      console.error(err.message);
    }
  });
};