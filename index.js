const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN_PATH = path.join(__dirname, 'token.json');
const STATE_PATH = path.join(__dirname, 'state.json');

app.use(express.static('public'));
app.use(express.json());

// Read token from file
app.get('/token', (req, res) => {
    if (fs.existsSync(TOKEN_PATH)) {
        const token = fs.readFileSync(TOKEN_PATH, 'utf-8');
        res.json(JSON.parse(token));
    } else {
        res.json(null);
    }
});

// Write token to file
app.post('/token', (req, res) => {
    const token = req.body;
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
    res.json({ status: 'ok' });
});

// Get current game state
app.get('/state', (req, res) => {
    if (fs.existsSync(STATE_PATH)) {
        const state = fs.readFileSync(STATE_PATH, 'utf-8');
        res.json(JSON.parse(state));
    } else {
        res.json(null);
    }
});

// Update game state
app.post('/state', (req, res) => {
    fs.writeFileSync(STATE_PATH, JSON.stringify(req.body));
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Four-in-a-Row app running at http://localhost:${PORT}`);
});
