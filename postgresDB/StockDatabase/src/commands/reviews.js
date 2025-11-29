const pool = require('../DB/pool');
const session = require('../auth/session');

module.exports = (program) => {

  const review = program
    .command('review')
    .description('Manage reviews');

  // Review Stock List

  review
    .command('add <stock_list> <title> <body>')
    .description('Add a review for a stock list')
    .action(async (stock_list, title, body) => {
      const s = session.load();
      if (!s) throw new Error('Not logged in');

      await pool.query(
        `
        INSERT INTO reviews (user_id, stock_list, title, body)
        VALUES ($1, $2, $3, $4)
        `,
        [s.user_id, stock_list, title, body]
      );

      console.log('Review added');
      process.exit(0);
    });

  //View Reviews

  review
    .command('view')
    .description('View reviews')
    .action(async () => {
      const { rows } = await pool.query(
        `
        SELECT
          r.review_id,
          u.username,
          r.stock_list,
          r.title,
          r.body,
          r.created_at
        FROM reviews r
        JOIN users u ON r.user_id = u.user_id
        ORDER BY r.created_at DESC
        `
      );

      console.table(rows);
      process.exit(0);
    });
};