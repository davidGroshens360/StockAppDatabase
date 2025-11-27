const fs = require('fs');
const path = require('path');

const SESSION_FILE = path.resolve(__dirname, '../../.session.json');

exports.save = (token, user_id) => {
  fs.writeFileSync(SESSION_FILE, JSON.stringify({ token, user_id }));
};

exports.load = () => {
  if (!fs.existsSync(SESSION_FILE)) return null;
  return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
};

exports.clear = () => {
  if (fs.existsSync(SESSION_FILE)) fs.unlinkSync(SESSION_FILE);
};