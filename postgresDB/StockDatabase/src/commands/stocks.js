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
    .option('-m, --market <symbol>', 'Market symbol', 'SPY')
    .description('Calculate stock beta against the market')
    .action(async (symbol, opts) => {
      try {
        const stockSym = symbol.toUpperCase();
        const marketSym = opts.market.toUpperCase();

        // Fetch aligned price history
        const { rows } = await pool.query(
          `
          SELECT s.stock_date,
                 s.close_price AS stock_close,
                 m.close_price AS market_close
          FROM stock_history s
          JOIN stock_history m
            ON s.stock_date = m.stock_date
          WHERE s.stock_symbol = $1
            AND m.stock_symbol = $2
          ORDER BY s.stock_date
          `,
          [stockSym, marketSym]
        );

        if (rows.length < 2) {
          throw new Error('Not enough data to compute beta.');
        }

        // Compute daily returns
        const stockReturns = [];
        const marketReturns = [];

        for (let i = 1; i < rows.length; i++) {
          const rs =
            (rows[i].stock_close - rows[i - 1].stock_close) /
            rows[i - 1].stock_close;

          const rm =
            (rows[i].market_close - rows[i - 1].market_close) /
            rows[i - 1].market_close;

          stockReturns.push(rs);
          marketReturns.push(rm);
        }

        const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;

        const meanStock = mean(stockReturns);
        const meanMarket = mean(marketReturns);

        let covariance = 0;
        let variance = 0;

        for (let i = 0; i < stockReturns.length; i++) {
          covariance +=
            (stockReturns[i] - meanStock) *
            (marketReturns[i] - meanMarket);

          variance +=
            Math.pow(marketReturns[i] - meanMarket, 2);
        }

        covariance /= stockReturns.length;
        variance /= stockReturns.length;

        const beta = covariance / variance;

        console.log(
          `Beta of ${stockSym} vs ${marketSym}: ${beta.toFixed(4)}`
        );

        process.exit(0);
      } catch (err) {
        console.error(err.message);
      }
    });
};