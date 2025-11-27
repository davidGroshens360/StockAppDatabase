const pool = require('../DB/pool');
const session = require('../auth/session');

module.exports = (program) => {

  // Create parent command
  const friends = program
    .command('friends')
    .description('Manage friends');

  // friends list
  friends
    .command('list')
    .description('List your friends')
    .action(async () => {
      const s = session.load();
      if (!s) throw new Error('Not logged in');

      const { rows } = await pool.query(`
        SELECT u.user_id, u.username
        FROM users u
        JOIN userFriends f
          ON (
            (f.sender_id = $1 AND f.receiver_id = u.user_id)
            OR
            (f.receiver_id = $1 AND f.sender_id = u.user_id)
          )
        WHERE f.friend_status = 'accepted'
      `, [s.user_id]);

      console.table(rows);
      process.exit(0);
    });

  // friends request
  friends
    .command('request <username>')
    .description('Send a friend request')
    .action(async (username) => {
      const s = session.load();
      if (!s) throw new Error('Not logged in');

      const r = await pool.query(
        'SELECT user_id FROM users WHERE username = $1',
        [username]
      );
      if (!r.rows[0]) throw new Error('User not found');

      await pool.query(
        `INSERT INTO userFriends (sender_id, receiver_id, friend_status)
         VALUES ($1, $2, 'pending')`,
        [s.user_id, r.rows[0].user_id]
      );

      console.log('Friend request sent');
      process.exit(0);
    });

  //friends respond
  friends
    .command('respond <senderId> <accept|reject>')
    .description('Respond to a friend request')
    .action(async (senderId, action) => {
      const s = session.load();
      if (!s) throw new Error('Not logged in');

      const status = action === 'accept' ? 'accepted' : 'rejected';

      await pool.query(
        `UPDATE userFriends
         SET friend_status = $1
         WHERE sender_id = $2 AND receiver_id = $3`,
        [status, senderId, s.user_id]
      );

      console.log(`Request ${status}`);
      process.exit(0);
    });
};