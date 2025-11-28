STOCK PORTFOLIO CLI APPLICATION

This is a Node.js command-line application for managing stock portfolios, stock lists, friends, and reviews, backed by a PostgreSQL database hosted on Google Cloud.

-------------------------------------------------------------
DEPENDENCIES:
npm install pg
npm install commander
npm install dotenv
npm install bcrypt
npm install jsonwebtoken

Also need a .env file with:
DB_HOST=YOUR_DB_IP
DB_PORT=5432
DB_USER=postgres
DB_PASS=your_password
DB_NAME=stocks
JWT_SECRET=supersecretkey
--------------------------------------------------------------
RUNNING THE PROGRAM:

Navigate to StockDatabase dir and run the following command:
node index.js <command>

example To create user:
node index.js register -u <username> -e <email> -p <password>
--------------------------------------------------------------
LIST OF COMMANDS:

Register user:
node index.js register -u <username> -e <email> -p <password>

Login:
node index.js login -u <username> -p <password>

Logout:
node index.js logout

View historical stock price:
node index.js stock history <SYMBOL>

Get Simple Moving Average of Stock:
node index.js stock sma <SYMBOL> --window <days>

Predict future stock prices with Linear regression:
node index.js stock predict <SYMBOL> --days <n>

List portfolios:
node index.js portfolio list

Create portfolio:
node index.js portfolio create <portfolio_name>

Create stock list:
node index.js list create <list_name> [--public]

Add Stock to list:
node index.js list add <list_name> <SYMBOL>

View Your Stock Lists:
node index.js list view

List Friends:
node index.js friends list

Send Friend Request:
node index.js friends request <username>

Respond to a friend request:
node index.js friends respond <senderId> <accept|reject>

Add a review:
node index.js review add "<title>" "<body>"

View reviews:
node index.js review view


