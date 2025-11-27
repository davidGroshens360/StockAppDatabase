const pool = require('../DB/pool');
const session = require('../auth/session');

module.exports = (program) => {

  // Create 'list' command
  const list = program
    .command('list')
    .description('Manage stock lists');

  // list create
  list
    .command('create <name>')
    .option('--public', 'Make list public')
    .description('Create a stock list')
    .action(async (name, opts) => {
      const s = session.load();
      const visibility = opts.public ? 'public' : 'private';

      await pool.query(
        `INSERT INTO stock_list (user_id, list_name, visibility)
         VALUES ($1, $2, $3)`,
        [s.user_id, name, visibility]
      );

      console.log('Stock list created');
      process.exit(0);
    });

  //  list add
  list
    .command('add <listName> <symbol>')
    .description('Add stock to list')
    .action(async (listName, symbol) => {
      const s = session.load();

      await pool.query(
        `INSERT INTO stock_list_items (user_id, list_name, stock_symbol)
         VALUES ($1, $2, $3)`,
        [s.user_id, listName, symbol.toUpperCase()]
      );

      console.log('Stock added');
      process.exit(0);
    });

  //list view
  list
    .command('view')
    .description('View your stock lists')
    .action(async () => {
      const s = session.load();

      const { rows } = await pool.query(
        `SELECT list_name, visibility
         FROM stock_list
         WHERE user_id = $1`,
        [s.user_id]
      );

      console.table(rows);
      process.exit(0);
    });
};