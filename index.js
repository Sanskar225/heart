// Game state management
let gameState = {
    completedGames: 0,
    games: {
        memory: false,
        guess: false,
        color: false,
        reaction: false
    }
};

// Memory Game Variables
let memoryCards = [];
let flippedCards = [];
let matchedPairs = 0;
let memoryGameActive = false;

// Guess Game Variables
let targetNumber = 0;
let guessAttempts = 0;
let maxAttempts = 5;

// Color Game Variables
let colorGameActive = false;
let colorScore = 0;
let colorTarget = 10;
let colorInterval;

// Reaction Game Variables
let reactionGameActive = false;
let reactionStartTime = 0;
let reactionTimeout;
let bestReactionTime = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    updateProgress();
});

// Update progress bar and completion status
function updateProgress() {
    const progress = (gameState.completedGames / 4) * 100;
    document.getElementById('progress').style.width = progress + '%';
    document.getElementById('completed').textContent = gameState.completedGames;
    
    if (gameState.completedGames === 4) {
        setTimeout(() => {
            document.getElementById('victory-modal').style.display = 'block';
        }, 1000);
    }
}

// Mark game as completed
function completeGame(gameName) {
    if (!gameState.games[gameName]) {
        gameState.games[gameName] = true;
        gameState.completedGames++;
        
        const gameCard = document.getElementById(gameName + '-game');
        gameCard.classList.add('completed');
        
        const statusEl = document.getElementById(gameName + '-status');
        statusEl.textContent = 'Completed ✅';
        statusEl.className = 'game-status completed';
        
        updateProgress();
    }
}

// MEMORY GAME
function startMemoryGame() {
    if (memoryGameActive) return;
    
    memoryGameActive = true;
    matchedPairs = 0;
    flippedCards = [];
    
    document.getElementById('memory-status').textContent = 'Playing...';
    document.getElementById('memory-status').className = 'game-status playing';
    
    const symbols = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎸', '🎺'];
    const cards = [...symbols, ...symbols];
    
    // Shuffle cards
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    
    cards.forEach((symbol, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.symbol = symbol;
        card.dataset.index = index;
        card.textContent = '?';
        card.addEventListener('click', flipCard);
        grid.appendChild(card);
    });
}

function flipCard(e) {
    if (!memoryGameActive || flippedCards.length >= 2) return;
    
    const card = e.target;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    
    card.classList.add('flipped');
    card.textContent = card.dataset.symbol;
    flippedCards.push(card);
    
    if (flippedCards.length === 2) {
        setTimeout(checkMatch, 1000);
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    
    if (card1.dataset.symbol === card2.dataset.symbol) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        
        if (matchedPairs === 8) {
            memoryGameActive = false;
            completeGame('memory');
        }
    } else {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        card1.textContent = '?';
        card2.textContent = '?';
    }
    
    flippedCards = [];
}

// GUESS GAME
function startGuessGame() {
    targetNumber = Math.floor(Math.random() * 20) + 1;
    guessAttempts = 0;
    
    document.getElementById('guess-status').textContent = 'Playing...';
    document.getElementById('guess-status').className = 'game-status playing';
    document.getElementById('guess-input').value = '';
    document.getElementById('guess-feedback').textContent = '';
    document.getElementById('guess-attempts').textContent = 'Attempts: 0';
    
    const input = document.getElementById('guess-input');
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            makeGuess();
        }
    });
    
    // Add guess button if not exists
    let guessBtn = document.querySelector('#guess-game .guess-btn');
    if (!guessBtn) {
        guessBtn = document.createElement('button');
        guessBtn.textContent = 'Make Guess';
        guessBtn.className = 'game-btn guess-btn';
        guessBtn.onclick = makeGuess;
        document.querySelector('#guess-game .guess-content').appendChild(guessBtn);
    }
}

function makeGuess() {
    const input = document.getElementById('guess-input');
    const guess = parseInt(input.value);
    const feedback = document.getElementById('guess-feedback');
    
    if (isNaN(guess) || guess < 1 || guess > 20) {
        feedback.textContent = 'Please enter a number between 1 and 20!';
        feedback.style.color = '#ff4444';
        return;
    }
    
    guessAttempts++;
    document.getElementById('guess-attempts').textContent = `Attempts: ${guessAttempts}`;
    
    if (guess === targetNumber) {
        feedback.textContent = `🎉 Correct! You got it in ${guessAttempts} attempts!`;
        feedback.style.color = '#4CAF50';
        completeGame('guess');
    } else if (guessAttempts >= maxAttempts) {
        feedback.textContent = `😞 Game over! The number was ${targetNumber}`;
        feedback.style.color = '#ff4444';
    } else if (guess < targetNumber) {
        feedback.textContent = '📈 Too low! Try higher.';
        feedback.style.color = '#ff8800';
    } else {
        feedback.textContent = '📉 Too high! Try lower.';
        feedback.style.color = '#ff8800';
    }
    
    input.value = '';
}

// COLOR GAME
function startColorGame() {
    if (colorGameActive) return;
    
    colorGameActive = true;
    colorScore = 0;
    
    document.getElementById('color-status').textContent = 'Playing...';
    document.getElementById('color-status').className = 'game-status playing';
    document.getElementById('color-score').textContent = 'Score: 0';
    
    const box1 = document.getElementById('color-box1');
    const box2 = document.getElementById('color-box2');
    
    box1.addEventListener('click', colorBoxClick);
    box2.addEventListener('click', colorBoxClick);
    
    generateColors();
    
    colorInterval = setInterval(generateColors, 2000);
}

function generateColors() {
    const colors = ['#ff4444', '#4444ff', '#44ff44', '#ffff44', '#ff44ff', '#44ffff'];
    const box1 = document.getElementById('color-box1');
    const box2 = document.getElementById('color-box2');
    
    const color1 = colors[Math.floor(Math.random() * colors.length)];
    let color2 = colors[Math.floor(Math.random() * colors.length)];
    
    // 30% chance of matching colors
    if (Math.random() < 0.3) {
        color2 = color1;
    }
    
    box1.style.backgroundColor = color1;
    box2.style.backgroundColor = color2;
    
    box1.dataset.color = color1;
    box2.dataset.color = color2;
}

function colorBoxClick() {
    if (!colorGameActive) return;
    
    const box1 = document.getElementById('color-box1');
    const box2 = document.getElementById('color-box2');
    
    if (box1.dataset.color === box2.dataset.color) {
        colorScore++;
        document.getElementById('color-score').textContent = `Score: ${colorScore}`;
        
        if (colorScore >= colorTarget) {
            colorGameActive = false;
            clearInterval(colorInterval);
            completeGame('color');
        }
    } else {
        // Wrong click - small penalty
        colorScore = Math.max(0, colorScore - 1);
        document.getElementById('color-score').textContent = `Score: ${colorScore}`;
    }
}

// REACTION GAME
function startReactionGame() {
    if (reactionGameActive) return;
    
    reactionGameActive = true;
    
    document.getElementById('reaction-status').textContent = 'Playing...';
    document.getElementById('reaction-status').className = 'game-status playing';
    
    const circle = document.getElementById('reaction-circle');
    const area = document.getElementById('reaction-area');
    
    circle.classList.remove('green');
    
    area.addEventListener('click', reactionClick);
    
    // Random delay between 2-5 seconds
    const delay = Math.random() * 3000 + 2000;
    
    reactionTimeout = setTimeout(() => {
        circle.classList.add('green');
        reactionStartTime = Date.now();
    }, delay);
}

function reactionClick() {
    if (!reactionGameActive) return;
    
    const circle = document.getElementById('reaction-circle');
    
    if (circle.classList.contains('green')) {
        const reactionTime = Date.now() - reactionStartTime;
        
        if (!bestReactionTime || reactionTime < bestReactionTime) {
            bestReactionTime = reactionTime;
        }
        
        document.getElementById('reaction-time').textContent = `Best Time: ${bestReactionTime}ms`;
        
        if (reactionTime < 500) {
            reactionGameActive = false;
            completeGame('reaction');
        } else {
            // Try again
            circle.classList.remove('green');
            const delay = Math.random() * 3000 + 2000;
            reactionTimeout = setTimeout(() => {
                circle.classList.add('green');
                reactionStartTime = Date.now();
            }, delay);
        }
    } else {
        // Clicked too early
        clearTimeout(reactionTimeout);
        circle.classList.remove('green');
        
        setTimeout(() => {
            if (reactionGameActive) {
                const delay = Math.random() * 3000 + 2000;
                reactionTimeout = setTimeout(() => {
                    circle.classList.add('green');
                    reactionStartTime = Date.now();
                }, delay);
            }
        }, 1000);
    }
}

// Modal functions
function closeModal() {
    document.getElementById('victory-modal').style.display = 'none';
}