/*
 * Four-in-a-Row client
 * Author: OpenAI Assistant
 * Date: 2025-07-28
 */

/**
 * Check the board for a winning stripe.
 * @param {string[]} board - Array of 16 cells containing 'O', 'X' or ''
 * @returns {{winner:string,stripe:number[]}|null} Winning info or null.
 */
function checkWin(board) {
    const s = [
        [0,1,2,3],[4,5,6,7],[8,9,10,11],[12,13,14,15],
        [0,4,8,12],[1,5,9,13],[2,6,10,14],[3,7,11,15],
        [0,5,10,15],[3,6,9,12]
    ];
    for (const line of s) {
        const [a,b,c,d] = line;
        if (board[a] && board[a]===board[b] && board[a]===board[c] && board[a]===board[d]) {
            return {winner: board[a], stripe: line};
        }
    }
    return null;
}

/**
 * Choose the next move for a player.
 * @param {string[]} board - current board
 * @returns {number|null} index to play or null if no moves
 */
function nextMove(board) {
    for (let i=0; i<board.length; i++) if (!board[i]) return i;
    return null;
}

// ====== GUI Logic ======
const boardEl = document.getElementById('board');
const controlBtn = document.getElementById('controlBtn');
let state = null;

function createBoard() {
    boardEl.innerHTML = '';
    for (let r=0; r<4; r++) {
        const row = document.createElement('tr');
        for (let c=0; c<4; c++) {
            const cell = document.createElement('td');
            cell.dataset.idx = r*4 + c;
            cell.addEventListener('click', onCellClick);
            row.appendChild(cell);
        }
        boardEl.appendChild(row);
    }
}

function render() {
    state.board.forEach((val, i) => {
        const td = boardEl.querySelector(`td[data-idx="${i}"]`);
        td.textContent = val || '';
        td.style.color = '#000';
        td.style.backgroundColor = '';
    });
    if (state.winner) {
        state.stripe.forEach(i => {
            const td = boardEl.querySelector(`td[data-idx="${i}"]`);
            td.style.color = '#f00';
        });
    }
    if (state.status === 'needFlip') controlBtn.textContent = 'Flip';
    else if (state.status === 'playing') controlBtn.textContent = 'Clear';
    else controlBtn.textContent = 'Start';
}

async function loadState() {
    const res = await fetch('/state');
    const s = await res.json();
    if (s) state = s; else state = {
        board: Array(16).fill(''),
        start: 'O',
        next: 'O',
        status: 'needFlip',
        winner: null,
        stripe: [],
        timestamp: Date.now()
    };
}

async function saveState() {
    state.timestamp = Date.now();
    await fetch('/state', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(state)
    });
}

function onCellClick(e) {
    if (state.status !== 'playing') return;
    const idx = parseInt(e.target.dataset.idx, 10);
    if (state.board[idx]) return;
    state.board[idx] = state.next;
    const win = checkWin(state.board);
    if (win) {
        state.status = 'over';
        state.winner = win.winner;
        state.stripe = win.stripe;
        state.start = win.winner;
    } else if (nextMove(state.board) === null) {
        state.status = 'over';
        state.winner = null;
        state.stripe = [];
    } else {
        state.next = state.next === 'O' ? 'X' : 'O';
    }
    saveState().then(render);
}

controlBtn.addEventListener('click', () => {
    if (state.status === 'needFlip') {
        state.start = Math.random() < 0.5 ? 'O' : 'X';
        state.next = state.start;
        state.board = Array(16).fill('');
        state.status = 'ready';
    } else if (state.status === 'playing') {
        state.board = Array(16).fill('');
        state.status = 'ready';
        state.winner = null;
        state.stripe = [];
    } else { // ready or over
        state.board = Array(16).fill('');
        state.next = state.start;
        state.winner = null;
        state.stripe = [];
        state.status = 'playing';
    }
    saveState().then(render);
});

function poll() {
    setInterval(async () => {
        const res = await fetch('/state');
        const newState = await res.json();
        if (newState && (!state || newState.timestamp !== state.timestamp)) {
            state = newState;
            render();
        }
    }, 1000);
}

(async function init() {
    createBoard();
    await loadState();
    render();
    poll();
})();

