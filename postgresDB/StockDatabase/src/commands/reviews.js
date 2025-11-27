const pool = require('../DB/pool');
const session = require('../auth/session');

module.exports = (program) => {

  // Create parent command
  const review = program
    .command('review')
    .description('Manage reviews');

  // review add
  review
    .command('add <title> <body>')
    .description('Add a review')
    .action(async (title, body) => {
      const s = session.load();
      if (!s) throw new Error('Not logged in');

      await pool.query(
        `INSERT INTO reviews (user_id, title, body)
         VALUES ($1, $2, $3)`,
        [s.user_id, title, body]
      );

      console.log('Review added');
      process.exit(0);
    });

  // review view
  review
    .command('view')
    .description('View reviews')
    .action(async () => {
      const { rows } = await pool.query(`
        SELECT r.review_id, u.username, r.title, r.body, r.created_at
        FROM reviews r
        JOIN users u ON r.user_id = u.user_id
        ORDER BY r.created_at DESC
      `);

      console.table(rows);
      process.exit(0);
    });
};