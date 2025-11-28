const API_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user'));
let currentPortfolio = null;

// Init
if (token) {
    showDashboard();
}

// Auth Functions
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            token = data.token;
            currentUser = data.user;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(currentUser));
            showDashboard();
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error(err);
    }
}

async function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value;

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (res.ok) {
            alert('Registered! Please login.');
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error(err);
    }
}

function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('dashboard-section').style.display = 'none';
}

function showDashboard() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    document.getElementById('user-display').innerText = currentUser.username;
    loadPortfolios();
}

// Portfolio Functions
async function loadPortfolios() {
    const res = await fetch(`${API_URL}/portfolios`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const portfolios = await res.json();
    const list = document.getElementById('portfolio-list');
    list.innerHTML = '';
    portfolios.forEach(p => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" onclick="selectPortfolio('${p.portfolio_name}', ${p.cash_amount})">${p.portfolio_name}</a> ($${p.cash_amount})`;
        list.appendChild(li);
    });
}

async function createPortfolio() {
    const name = document.getElementById('new-portfolio-name').value;
    await fetch(`${API_URL}/portfolios`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
    });
    loadPortfolios();
}

function selectPortfolio(name, cash) {
    currentPortfolio = { name, cash };
    document.getElementById('portfolio-view').style.display = 'block';
    document.getElementById('active-portfolio-name').innerText = name;
    document.getElementById('portfolio-cash').innerText = cash;
    loadHoldings(name);
}

async function loadHoldings(name) {
    const res = await fetch(`${API_URL}/portfolios/${name}/holdings`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const holdings = await res.json();
    const tbody = document.querySelector('#holdings-table tbody');
    tbody.innerHTML = '';
    holdings.forEach(h => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${h.stock_symbol}</td><td>${h.shares}</td><td>-</td>`;
        tbody.appendChild(tr);
    });
}

async function deposit() {
    const amount = document.getElementById('cash-amount').value;
    await fetch(`${API_URL}/portfolios/${currentPortfolio.name}/deposit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
    });
    // Refresh
    loadPortfolios(); // to update cash in list
    // Update local view
    currentPortfolio.cash = Number(currentPortfolio.cash) + Number(amount);
    document.getElementById('portfolio-cash').innerText = currentPortfolio.cash;
}

async function withdraw() {
    const amount = document.getElementById('cash-amount').value;
    await fetch(`${API_URL}/portfolios/${currentPortfolio.name}/withdraw`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
    });
    loadPortfolios();
    currentPortfolio.cash = Number(currentPortfolio.cash) - Number(amount);
    document.getElementById('portfolio-cash').innerText = currentPortfolio.cash;
}

async function buyStock() {
    const symbol = document.getElementById('trade-symbol').value;
    const shares = document.getElementById('trade-shares').value;
    const res = await fetch(`${API_URL}/portfolios/${currentPortfolio.name}/buy`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ symbol, shares })
    });
    const data = await res.json();
    if (res.ok) {
        alert(`Bought at ${data.price}`);
        loadHoldings(currentPortfolio.name);
        loadPortfolios(); // update cash
    } else {
        alert(data.error);
    }
}

async function sellStock() {
    const symbol = document.getElementById('trade-symbol').value;
    const shares = document.getElementById('trade-shares').value;
    const res = await fetch(`${API_URL}/portfolios/${currentPortfolio.name}/sell`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ symbol, shares })
    });
    const data = await res.json();
    if (res.ok) {
        alert(`Sold at ${data.price}`);
        loadHoldings(currentPortfolio.name);
        loadPortfolios();
    } else {
        alert(data.error);
    }
}

// Analysis
async function analyzeStock() {
    const symbol = document.getElementById('analysis-symbol').value;
    const res = await fetch(`${API_URL}/stocks/${symbol}/predict?days=5`);
    const predictions = await res.json();

    const div = document.getElementById('analysis-results');
    div.innerHTML = '<h4>Predictions (Next 5 Days)</h4>';
    predictions.forEach(p => {
        div.innerHTML += `<p>Day +${p.day}: $${p.price.toFixed(2)}</p>`;
    });
}
