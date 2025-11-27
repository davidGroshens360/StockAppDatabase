const pool = require('../DB/pool');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('../auth/session');

module.exports = program => {

  program
    .command('register')
    .requiredOption('-u, --username <name>')
    .requiredOption('-e, --email <email>')
    .requiredOption('-p, --password <password>')
    .action(async opts => {
      const hash = await bcrypt.hash(opts.password, 10);
      await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3)',
        [opts.username, opts.email, hash]
      );
      console.log('✅ Account created');
      process.exit(0);
    });

  program
    .command('login')
    .requiredOption('-u, --username <name>')
    .requiredOption('-p, --password <password>')
    .action(async opts => {
      const { rows } = await pool.query(
        'SELECT user_id, password_hash FROM users WHERE username=$1',
        [opts.username]
      );
      if (!rows[0]) throw new Error('Invalid login');
      const ok = await bcrypt.compare(opts.password, rows[0].password_hash);
      if (!ok) throw new Error('Invalid login');

      const token = jwt.sign(
        { user_id: rows[0].user_id },
        process.env.JWT_SECRET
      );
      session.save(token, rows[0].user_id);
      console.log('Logged in');
      process.exit(0);
    });

  program
    .command('logout')
    .action(() => {
      session.clear();
      console.log('Logged out');
    });
};