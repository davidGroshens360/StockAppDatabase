# Stock App Database & CLI

This application allows you to manage stock portfolios, analyze stock data, and interact with a social network of traders. You can use it via the Command Line Interface (CLI) or a Web GUI.

## Setup

1.  Ensure dependencies are installed:
    ```bash
    npm install
    ```
2.  Ensure your PostgreSQL database is running and configured in `.env`.

## Web GUI

The easiest way to use the app is via the Web Interface.

1.  Start the server:
    ```bash
    node src/server/app.js
    ```
2.  Open your browser to: [http://localhost:3000](http://localhost:3000)

## CLI Commands

You can also use the application directly from the terminal.

### Authentication

*   **Register**: Create a new account.
    ```bash
    node index.js register -u <username> -e <email> -p <password>
    ```
*   **Login**: Log in to your account (session is saved locally).
    ```bash
    node index.js login -u <username> -p <password>
    ```
*   **Logout**: Clear local session.
    ```bash
    node index.js logout
    ```

### Portfolio Management

*   **List Portfolios**: View all your portfolios.
    ```bash
    node index.js portfolio list
    ```
*   **Create Portfolio**: Create a new empty portfolio.
    ```bash
    node index.js portfolio create <name>
    ```
*   **View Holdings**: See stocks and cash in a portfolio.
    ```bash
    node index.js portfolio holdings <name>
    ```
*   **Deposit Cash**: Add money to a portfolio.
    ```bash
    node index.js portfolio deposit <name> <amount>
    ```
*   **Withdraw Cash**: Remove money from a portfolio.
    ```bash
    node index.js portfolio withdraw <name> <amount>
    ```
*   **Buy Stock**: Buy shares of a stock (uses latest available price).
    ```bash
    node index.js portfolio buy <name> <symbol> <shares>
    ```
*   **Sell Stock**: Sell shares of a stock.
    ```bash
    node index.js portfolio sell <name> <symbol> <shares>
    ```

### Stock Analysis

*   **View History**: See historical price data.
    ```bash
    node index.js stock history <symbol>
    ```
*   **Add Data**: Manually add new daily stock data.
    ```bash
    node index.js stock add <symbol> <date> <open> <close> <high> <low> <volume>
    ```
    *   *Date format*: YYYY-MM-DD
*   **Statistics**: View Mean, Standard Deviation, and Coefficient of Variation.
    ```bash
    node index.js stock stats <symbol> <start_date> <end_date>
    ```
*   **Beta**: Calculate Beta relative to a market index (e.g., SPY).
    ```bash
    node index.js stock beta <symbol> <market_symbol> <start_date> <end_date>
    ```
*   **Moving Average**: Calculate Simple Moving Average (SMA).
    ```bash
    node index.js stock sma <symbol> -w <window_size>
    ```
*   **Prediction**: Predict future prices using Linear Regression.
    ```bash
    node index.js stock predict <symbol> -d <days_ahead>
    ```

### Social & Friends (CLI)

*   **List Friends**:
    ```bash
    node index.js friend list
    ```
*   **Send Request**:
    ```bash
    node index.js friend request <username>
    ```
*   **Accept Request**:
    ```bash
    node index.js friend accept <username>
    ```
