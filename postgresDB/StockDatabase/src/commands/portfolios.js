const pool = require('../DB/pool');
const session = require('../auth/session');

module.exports = (program) => {
  const portfolio = program
    .command('portfolio')
    .description('Manage portfolios');

 //List Portfolio

  portfolio
    .command('list')
    .description('List portfolios')
    .action(async () => {
      const s = session.load();
      if (!s) return console.log('Not logged in');

      try {
        const { rows } = await pool.query(
          'SELECT * FROM portfolios WHERE user_id=$1',
          [s.user_id]
        );
        console.table(rows);
      } catch (err) {
        console.error(err.message);
      }
    });

  //Create Portfolio

  portfolio
    .command('create <name>')
    .description('Create a portfolio')
    .action(async (name) => {
      const s = session.load();
      if (!s) return console.log('Not logged in');

      try {
        await pool.query(
          'INSERT INTO portfolios (user_id, portfolio_name, cash_amount) VALUES ($1, $2, 0)',
          [s.user_id, name]
        );
        console.log(`Portfolio ${name} created.`);
      } catch (err) {
        console.error(err.message);
      }
    });

  //Deposit Into Portfolio

  portfolio
    .command('deposit <name> <amount>')
    .description('Deposit cash into portfolio')
    .action(async (name, amount) => {
      const s = session.load();
      if (!s) return console.log('Not logged in');

      try {
        await pool.query(
          `
          UPDATE portfolios
          SET cash_amount = cash_amount + $3
          WHERE user_id=$1 AND portfolio_name=$2
          `,
          [s.user_id, name, amount]
        );
        console.log(`Deposited ${amount} into ${name}.`);
      } catch (err) {
        console.error(err.message);
      }
    });

  //Withdraw From Portfolio

  portfolio
    .command('withdraw <name> <amount>')
    .description('Withdraw cash from portfolio')
    .action(async (name, amount) => {
      const s = session.load();
      if (!s) return console.log('Not logged in');

      try {
        const { rowCount } = await pool.query(
          `
          UPDATE portfolios
          SET cash_amount = cash_amount - $3
          WHERE user_id=$1 AND portfolio_name=$2
            AND cash_amount >= $3
          `,
          [s.user_id, name, amount]
        );

        if (rowCount === 0) {
          throw new Error('Insufficient funds.');
        }

        console.log(`Withdrew ${amount} from ${name}.`);
      } catch (err) {
        console.error(err.message);
      }
    });

  //Buy Stocks

  portfolio
    .command('buy <name> <symbol> <shares>')
    .description('Buy stock')
    .action(async (name, symbol, shares) => {
      const s = session.load();
      if (!s) return console.log('Not logged in');

      try {
        const { rows } = await pool.query(
          `
          SELECT close_price
          FROM stock_history
          WHERE stock_symbol=$1
          ORDER BY stock_date DESC
          LIMIT 1
          `,
          [symbol]
        );

        if (!rows.length) throw new Error('Stock not found.');

        const price = rows[0].close_price;
        const totalCost = price * shares;

        await pool.query('BEGIN');

        // Deduct cash
        const { rowCount } = await pool.query(
          `
          UPDATE portfolios
          SET cash_amount = cash_amount - $3
          WHERE user_id = $1
            AND portfolio_name = $2
            AND cash_amount >= $3
          `,
          [s.user_id, name, totalCost]
        );

        if (rowCount === 0) throw new Error('Insufficient funds.');

        // Insert to holdings
        await pool.query(
          `
          INSERT INTO portfolio_holdings (user_id, portfolio_name, stock_symbol, shares)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (user_id, portfolio_name, stock_symbol)
          DO UPDATE SET shares = portfolio_holdings.shares + EXCLUDED.shares
          `,
          [s.user_id, name, symbol, shares]
        );

        await pool.query('COMMIT');
        console.log(`Bought ${shares} shares of ${symbol} at ${price}.`);
      } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err.message);
      }
    });

  // Sell Stock From Portfolio

  portfolio
    .command('sell <name> <symbol> <shares>')
    .description('Sell stock')
    .action(async (name, symbol, shares) => {
      const s = session.load();
      if (!s) return console.log('Not logged in');

      try {
        const { rows } = await pool.query(
          `
          SELECT close_price
          FROM stock_history
          WHERE stock_symbol=$1
          ORDER BY stock_date DESC
          LIMIT 1
          `,
          [symbol]
        );

        if (!rows.length) throw new Error('Stock not found.');

        const price = rows[0].close_price;
        const totalValue = price * shares;

        await pool.query('BEGIN');

        // Update holdings
        const { rowCount } = await pool.query(
          `
          UPDATE portfolio_holdings
          SET shares = shares - $4
          WHERE user_id=$1 AND portfolio_name=$2 AND stock_symbol=$3
            AND shares >= $4
          `,
          [s.user_id, name, symbol, shares]
        );

        if (rowCount === 0) throw new Error('Not enough shares.');

        // Add cash
        await pool.query(
          `
          UPDATE portfolios
          SET cash_amount = cash_amount + $3
          WHERE user_id=$1 AND portfolio_name=$2
          `,
          [s.user_id, name, totalValue]
        );

        await pool.query('COMMIT');
        console.log(`Sold ${shares} shares of ${symbol} at ${price}.`);
      } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err.message);
      }
    });

  //View Portfolio Holdings

  portfolio
    .command('holdings <name>')
    .description('View portfolio holdings')
    .action(async (name) => {
      const s = session.load();
      if (!s) return console.log('Not logged in');

      try {
        const { rows } = await pool.query(
          `
          SELECT *
          FROM portfolio_holdings
          WHERE user_id=$1 AND portfolio_name=$2
          `,
          [s.user_id, name]
        );
        console.table(rows);
      } catch (err) {
        console.error(err.message);
      }
    });
};