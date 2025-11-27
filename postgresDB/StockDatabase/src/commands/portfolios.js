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
      console.log('Listing portfolios...');
    });

  portfolio
    .command('create <name>')
    .description('Create a portfolio')
    .action(async (name) => {
      console.log('Creating portfolio:', name);
    });
};