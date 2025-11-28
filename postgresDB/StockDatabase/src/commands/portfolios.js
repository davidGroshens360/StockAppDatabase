const pool = require('../DB/pool');
const session = require('../auth/session');

// module.exports = program => {

//   program
//     .command('portfolio list')
//     .action(async () => {
//       const s = session.load();
//       if (!s) throw new Error('Not logged in');

//       const { rows } = await pool.query(
//         'SELECT portfolio_name, cash_amount FROM portfolios WHERE user_id=$1',
//         [s.user_id]
//       );
//       console.table(rows);
//       process.exit(0);
//     });

//   program
//     .command('portfolio create <name>')
//     .action(async name => {
//       const s = session.load();
//       await pool.query(
//         'INSERT INTO portfolios (user_id, portfolio_name) VALUES ($1,$2)',
//         [s.user_id, name]
//       );
//       console.log('Portfolio created');
//       process.exit(0);
//     });
// };

module.exports = (program) => {
  const portfolio = program
    .command('portfolio')
    .description('Manage portfolios');

  portfolio
    .command('list')
    .description('List portfolios')
    .action(async () => {
      const s = session.load();
      if (!s) return console.log('Not logged in');
      try {
        const { rows } = await pool.query('SELECT * FROM portfolios WHERE user_id=$1', [s.user_id]);
        console.table(rows);
      } catch (err) {
        console.error(err.message);
      }
      // process.exit(0); // Let the program handle exit
    });

  portfolio
    .command('create <name>')
    .description('Create a portfolio')
    .action(async (name) => {
      const s = session.load();
      if (!s) return console.log('Not logged in');
      try {
        await pool.query('INSERT INTO portfolios (user_id, portfolio_name) VALUES ($1, $2)', [s.user_id, name]);
        console.log(`Portfolio ${name} created.`);
      } catch (err) {
        console.error(err.message);
      }
    });

  portfolio
    .command('deposit <name> <amount>')
    .description('Deposit cash into portfolio')
    .action(async (name, amount) => {
      const s = session.load();
      if (!s) return console.log('Not logged in');
      try {
        await pool.query('CALL deposit_cash($1::INT, $2::VARCHAR, $3::NUMERIC)', [s.user_id, name, amount]);
        console.log(`Deposited ${amount} into ${name}.`);
      } catch (err) {
        console.error(err.message);
      }
    });

  portfolio
    .command('withdraw <name> <amount>')
    .description('Withdraw cash from portfolio')
    .action(async (name, amount) => {
      const s = session.load();
      if (!s) return console.log('Not logged in');
      try {
        await pool.query('CALL withdraw_cash($1::INT, $2::VARCHAR, $3::NUMERIC)', [s.user_id, name, amount]);
        console.log(`Withdrew ${amount} from ${name}.`);
      } catch (err) {
        console.error(err.message);
      }
    });

  portfolio
    .command('buy <name> <symbol> <shares>')
    .description('Buy stock')
    .action(async (name, symbol, shares) => {
      const s = session.load();
      if (!s) return console.log('Not logged in');
      try {
        // Fetch latest price
        const { rows } = await pool.query(
          'SELECT close_price FROM stock_history WHERE stock_symbol = $1 ORDER BY stock_date DESC LIMIT 1',
          [symbol]
        );
        if (rows.length === 0) throw new Error('Stock symbol not found or no data available.');
        const price = rows[0].close_price;

        await pool.query('CALL buy_stock($1::INT, $2::VARCHAR, $3::VARCHAR, $4::NUMERIC, $5::NUMERIC)', [s.user_id, name, symbol, shares, price]);
        console.log(`Bought ${shares} shares of ${symbol} at ${price} in ${name}.`);
      } catch (err) {
        console.error(err.message);
      }
    });

  portfolio
    .command('sell <name> <symbol> <shares>')
    .description('Sell stock')
    .action(async (name, symbol, shares) => {
      const s = session.load();
      if (!s) return console.log('Not logged in');
      try {
        // Fetch latest price
        const { rows } = await pool.query(
          'SELECT close_price FROM stock_history WHERE stock_symbol = $1 ORDER BY stock_date DESC LIMIT 1',
          [symbol]
        );
        if (rows.length === 0) throw new Error('Stock symbol not found or no data available.');
        const price = rows[0].close_price;

        await pool.query('CALL sell_stock($1::INT, $2::VARCHAR, $3::VARCHAR, $4::NUMERIC, $5::NUMERIC)', [s.user_id, name, symbol, shares, price]);
        console.log(`Sold ${shares} shares of ${symbol} at ${price} from ${name}.`);
      } catch (err) {
        console.error(err.message);
      }
    });

  portfolio
    .command('holdings <name>')
    .description('View portfolio holdings')
    .action(async (name) => {
      const s = session.load();
      if (!s) return console.log('Not logged in');
      try {
        const { rows } = await pool.query('SELECT * FROM portfolio_holdings WHERE user_id=$1 AND portfolio_name=$2', [s.user_id, name]);
        console.table(rows);
      } catch (err) {
        console.error(err.message);
      }
    });
};
