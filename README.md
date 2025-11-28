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

---USER ACTIONS

Register user:
node index.js register -u <username> -e <email> -p <password>

Login:
node index.js login -u <username> -p <password>

Logout:
node index.js logout

---STOCK DATA

View historical stock price:
node index.js stock history <SYMBOL>

Get Simple Moving Average of Stock:
node index.js stock sma <SYMBOL> --window <days>

Predict future stock prices with Linear regression:
node index.js stock predict <SYMBOL> --days <n>

---PORTFOLIO ACTIONS

List portfolios:
node index.js portfolio list

Create portfolio:
node index.js portfolio create <portfolio_name>

Deposit Cash to Portfolio:
portfolio deposit <name> <amount>

Withdraw Cash From Portfolio:
portfolio withdraw <name> <amount>

Buy Stock to Portfolio:
portfolio buy <name> <symbol> <shares>

Sell Stock in Portfolio:
portfolio sell <name> <symbol> <shares>

View Portfolio Holdings:
portfolio holdings <name>

---STOCK LIST ACTIONS

Create stock list:
node index.js list create <list_name> [--public]

Add Stock to list:
node index.js list add <list_name> <SYMBOL>

View Your Stock Lists:
node index.js list view

Check Stocks in a Stock List:
node index.js list check <list_name>

Delete Your Stock List:
node index.js delete <list_name>

---FRIEND ACTIONS

List Friends:
node index.js friends list

Send Friend Request:
node index.js friends request <username>

Respond to a friend request:
node index.js friends respond <senderId> <accept|reject>

---REVIEW ACTION

Add a review:
node index.js review add <list_name> "<title>" "<body>"

View reviews:
node index.js review view


