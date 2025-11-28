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

  //list delete  
  list
    .command('delete <name>')
    .description('Delete a stock list')
    .action(async (name) => {
      const s = session.load();
      if (!s) return console.log('Not logged in');

      try {
        const { rowCount } = await pool.query(
          `
          DELETE FROM stock_list
          WHERE user_id = $1
            AND list_name = $2
          `,
          [s.user_id, name]
        );

        if (rowCount === 0) {
          throw new Error('Stock list not found or not owned by user.');
        }

        console.log(`Stock list "${name}" deleted.`);
        process.exit(0);
      } catch (err) {
        console.error(err.message);
      }
    });
  list
  .command('check <name>')
  .description('View stocks in a stock list')
  .action(async (name) => {
    const s = session.load();
    if (!s) return console.log('Not logged in');

    try {
      // Ensure list exists and belongs to user
      const { rowCount } = await pool.query(
        `
        SELECT 1
        FROM stock_list
        WHERE user_id = $1
          AND list_name = $2
        `,
        [s.user_id, name]
      );

      if (rowCount === 0) {
        throw new Error('Stock list not found or not owned by user.');
      }

      // Fetch stocks in the list
      const { rows } = await pool.query(
        `
        SELECT stock_symbol
        FROM stock_list_items
        WHERE user_id = $1
          AND list_name = $2
        ORDER BY stock_symbol
        `,
        [s.user_id, name]
      );

      if (rows.length === 0) {
        console.log(`Stock list "${name}" is empty.`);
      } else {
        console.log(`Stocks in "${name}":`);
        console.table(rows);
      }

      process.exit(0);
    } catch (err) {
      console.error(err.message);
    }
  });
  
};