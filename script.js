// Game State Management
class GameState {
    constructor() {
        this.completedGames = 0;
        this.totalScore = 0;
        this.startTime = Date.now();
        this.games = {
            memory: { completed: false, score: 0, bestTime: null },
            guess: { completed: false, score: 0, bestAttempts: null },
            color: { completed: false, score: 0, bestAccuracy: null },
            reaction: { completed: false, score: 0, bestTime: null },
            puzzle: { completed: false, score: 0, bestTime: null }
        };
        this.loadFromStorage();
    }

    saveToStorage() {
        localStorage.setItem('gameHubPro', JSON.stringify({
            games: this.games,
            totalScore: this.totalScore
        }));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('gameHubPro');
        if (saved) {
            const data = JSON.parse(saved);
            this.games = { ...this.games, ...data.games };
            this.totalScore = data.totalScore || 0;
            this.completedGames = Object.values(this.games).filter(g => g.completed).length;
        }
    }

    completeGame(gameName, score) {
        if (!this.games[gameName].completed) {
            this.games[gameName].completed = true;
            this.games[gameName].score = score;
            this.completedGames++;
            this.totalScore += score;
            this.saveToStorage();
            this.updateUI();
            this.showToast(`🎉 ${this.getGameTitle(gameName)} completed! +${score} points`, 'success');
            
            if (this.completedGames === 5) {
                setTimeout(() => this.showVictoryModal(), 1000);
            }
        }
    }

    getGameTitle(gameName) {
        const titles = {
            memory: 'Memory Challenge',
            guess: 'Number Hunter',
            color: 'Color Sync',
            reaction: 'Lightning Reflexes',
            puzzle: 'Sliding Puzzle'
        };
        return titles[gameName];
    }

    updateUI() {
        // Update progress
        const progress = (this.completedGames / 5) * 100;
        document.getElementById('progress-fill').style.width = progress + '%';
        document.getElementById('progress-text').textContent = `${this.completedGames}/5 Games Completed`;
        
        // Update total score
        document.getElementById('total-score').textContent = this.totalScore;
        
        // Update time
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('total-time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update badges
        Object.keys(this.games).forEach(gameName => {
            const badge = document.querySelector(`[data-game="${gameName}"]`);
            if (badge) {
                badge.className = this.games[gameName].completed ? 'badge unlocked' : 'badge locked';
            }
        });
        
        // Update game cards
        Object.keys(this.games).forEach(gameName => {
            const card = document.getElementById(`${gameName}-game`);
            if (card && this.games[gameName].completed) {
                card.classList.add('completed');
            }
        });
        
        // Update leaderboard
        this.updateLeaderboard();
    }

    updateLeaderboard() {
        Object.keys(this.games).forEach(gameName => {
            const scoreEl = document.getElementById(`${gameName}-best-score`);
            if (scoreEl) {
                const game = this.games[gameName];
                if (game.completed) {
                    let scoreText = `${game.score} points`;
                    if (game.bestTime) scoreText += ` • ${game.bestTime}ms`;
                    if (game.bestAttempts) scoreText += ` • ${game.bestAttempts} attempts`;
                    if (game.bestAccuracy) scoreText += ` • ${game.bestAccuracy}% accuracy`;
                    scoreEl.textContent = scoreText;
                } else {
                    scoreEl.textContent = 'Not played';
                }
            }
        });
    }

    showVictoryModal() {
        const modal = document.getElementById('victory-modal');
        const finalScore = document.getElementById('final-score');
        const finalTime = document.getElementById('final-time');
        
        finalScore.textContent = this.totalScore;
        
        const totalTime = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        finalTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        modal.style.display = 'block';
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s reverse';
            setTimeout(() => container.removeChild(toast), 300);
        }, 3000);
    }
}

// Initialize game state
const gameState = new GameState();

// Memory Game
class MemoryGame {
    constructor() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.startTime = null;
        this.gameActive = false;
        this.timer = null;
    }

    start() {
        if (this.gameActive) return;
        
        this.gameActive = true;
        this.matchedPairs = 0;
        this.moves = 0;
        this.flippedCards = [];
        this.startTime = Date.now();
        
        this.updateStatus('Playing...', 'playing');
        this.createGrid();
        this.startTimer();
    }

    createGrid() {
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
            card.addEventListener('click', (e) => this.flipCard(e));
            grid.appendChild(card);
        });
    }

    flipCard(e) {
        if (!this.gameActive || this.flippedCards.length >= 2) return;
        
        const card = e.target;
        if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
        
        card.classList.add('flipped');
        card.textContent = card.dataset.symbol;
        this.flippedCards.push(card);
        this.moves++;
        this.updateMoves();
        
        if (this.flippedCards.length === 2) {
            setTimeout(() => this.checkMatch(), 1000);
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        
        if (card1.dataset.symbol === card2.dataset.symbol) {
            card1.classList.add('matched');
            card2.classList.add('matched');
            this.matchedPairs++;
            
            if (this.matchedPairs === 8) {
                this.complete();
            }
        } else {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            card1.textContent = '?';
            card2.textContent = '?';
        }
        
        this.flippedCards = [];
    }

    complete() {
        this.gameActive = false;
        clearInterval(this.timer);
        
        const endTime = Date.now();
        const totalTime = endTime - this.startTime;
        const score = Math.max(1000 - this.moves * 10 - Math.floor(totalTime / 1000) * 5, 100);
        
        this.updateStatus('Completed ✅', 'completed');
        gameState.games.memory.bestTime = totalTime;
        gameState.completeGame('memory', score);
    }

    updateStatus(text, className) {
        const status = document.getElementById('memory-status');
        status.textContent = text;
        status.className = `game-status ${className}`;
    }

    updateMoves() {
        document.getElementById('memory-moves').textContent = this.moves;
    }

    startTimer() {
        this.timer = setInterval(() => {
            if (!this.gameActive) return;
            
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('memory-time').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
}

// Number Guessing Game
class GuessGame {
    constructor() {
        this.targetNumber = 0;
        this.attempts = 0;
        this.maxAttempts = 7;
        this.gameActive = false;
        this.range = { min: 1, max: 100 };
    }

    start() {
        this.targetNumber = Math.floor(Math.random() * 100) + 1;
        this.attempts = 0;
        this.gameActive = true;
        this.range = { min: 1, max: 100 };
        
        this.updateStatus('Playing...', 'playing');
        this.clearInput();
        this.updateAttempts();
        this.updateRange();
        this.clearFeedback();
    }

    makeGuess() {
        if (!this.gameActive) return;
        
        const input = document.getElementById('guess-input');
        const guess = parseInt(input.value);
        
        if (isNaN(guess) || guess < 1 || guess > 100) {
            this.showFeedback('Please enter a number between 1 and 100!', 'error');
            return;
        }
        
        this.attempts++;
        this.updateAttempts();
        
        if (guess === this.targetNumber) {
            this.complete();
        } else if (this.attempts >= this.maxAttempts) {
            this.gameOver();
        } else {
            this.provideFeedback(guess);
        }
        
        input.value = '';
    }

    provideFeedback(guess) {
        if (guess < this.targetNumber) {
            this.range.min = Math.max(this.range.min, guess + 1);
            this.showFeedback('📈 Too low! Try higher.', 'warning');
        } else {
            this.range.max = Math.min(this.range.max, guess - 1);
            this.showFeedback('📉 Too high! Try lower.', 'warning');
        }
        this.updateRange();
    }

    complete() {
        this.gameActive = false;
        const score = Math.max(800 - (this.attempts - 1) * 100, 100);
        
        this.showFeedback(`🎉 Correct! You got it in ${this.attempts} attempts!`, 'success');
        this.updateStatus('Completed ✅', 'completed');
        
        gameState.games.guess.bestAttempts = this.attempts;
        gameState.completeGame('guess', score);
    }

    gameOver() {
        this.gameActive = false;
        this.showFeedback(`😞 Game over! The number was ${this.targetNumber}`, 'error');
        this.updateStatus('Game Over', 'error');
    }

    showFeedback(message, type) {
        const feedback = document.getElementById('guess-feedback');
        feedback.textContent = message;
        feedback.className = `guess-feedback ${type}`;
    }

    clearFeedback() {
        const feedback = document.getElementById('guess-feedback');
        feedback.textContent = '';
        feedback.className = 'guess-feedback';
    }

    updateAttempts() {
        document.getElementById('guess-attempts').textContent = `${this.attempts}/${this.maxAttempts}`;
    }

    updateRange() {
        document.getElementById('guess-range').textContent = `${this.range.min}-${this.range.max}`;
    }

    clearInput() {
        document.getElementById('guess-input').value = '';
    }

    updateStatus(text, className) {
        const status = document.getElementById('guess-status');
        status.textContent = text;
        status.className = `game-status ${className}`;
    }
}

// Color Match Game
class ColorGame {
    constructor() {
        this.gameActive = false;
        this.score = 0;
        this.target = 15;
        this.totalClicks = 0;
        this.correctClicks = 0;
        this.interval = null;
        this.currentColors = { box1: '', box2: '' };
    }

    start() {
        if (this.gameActive) return;
        
        this.gameActive = true;
        this.score = 0;
        this.totalClicks = 0;
        this.correctClicks = 0;
        
        this.updateStatus('Playing...', 'playing');
        this.updateScore();
        this.updateAccuracy();
        
        this.addClickListeners();
        this.generateColors();
        this.interval = setInterval(() => this.generateColors(), 2000);
    }

    generateColors() {
        const colors = ['#ff4444', '#4444ff', '#44ff44', '#ffff44', '#ff44ff', '#44ffff', '#ff8800', '#8800ff'];
        const box1 = document.getElementById('color-box1');
        const box2 = document.getElementById('color-box2');
        
        const color1 = colors[Math.floor(Math.random() * colors.length)];
        let color2 = colors[Math.floor(Math.random() * colors.length)];
        
        // 25% chance of matching colors
        if (Math.random() < 0.25) {
            color2 = color1;
        }
        
        box1.style.backgroundColor = color1;
        box2.style.backgroundColor = color2;
        
        this.currentColors = { box1: color1, box2: color2 };
    }

    addClickListeners() {
        const gameCard = document.getElementById('color-game');
        gameCard.addEventListener('click', (e) => this.handleClick(e));
    }

    handleClick(e) {
        if (!this.gameActive) return;
        
        // Don't count clicks on buttons or other UI elements
        if (e.target.classList.contains('game-btn') || e.target.closest('.game-btn')) return;
        
        this.totalClicks++;
        
        if (this.currentColors.box1 === this.currentColors.box2) {
            this.correctClicks++;
            this.score++;
            this.updateScore();
            gameState.showToast('Perfect match! 🎯', 'success');
            
            if (this.score >= this.target) {
                this.complete();
            }
        } else {
            // Small penalty for wrong clicks
            this.score = Math.max(0, this.score - 0.5);
            this.updateScore();
        }
        
        this.updateAccuracy();
    }

    complete() {
        this.gameActive = false;
        clearInterval(this.interval);
        
        const accuracy = Math.round((this.correctClicks / this.totalClicks) * 100);
        const score = Math.floor(this.score * 10 + accuracy * 2);
        
        this.updateStatus('Completed ✅', 'completed');
        gameState.games.color.bestAccuracy = accuracy;
        gameState.completeGame('color', score);
    }

    updateScore() {
        document.getElementById('color-score').textContent = `${Math.floor(this.score)}/${this.target}`;
    }

    updateAccuracy() {
        const accuracy = this.totalClicks > 0 ? Math.round((this.correctClicks / this.totalClicks) * 100) : 0;
        document.getElementById('color-accuracy').textContent = `${accuracy}%`;
    }

    updateStatus(text, className) {
        const status = document.getElementById('color-status');
        status.textContent = text;
        status.className = `game-status ${className}`;
    }
}

// Reaction Time Game
class ReactionGame {
    constructor() {
        this.gameActive = false;
        this.startTime = 0;
        this.timeout = null;
        this.attempts = [];
        this.maxAttempts = 5;
    }

    start() {
        if (this.gameActive) return;
        
        this.gameActive = true;
        this.attempts = [];
        
        this.updateStatus('Playing...', 'playing');
        this.addClickListener();
        this.resetCircle();
        this.scheduleGreen();
    }

    addClickListener() {
        const area = document.getElementById('reaction-area');
        area.addEventListener('click', (e) => this.handleClick(e));
    }

    scheduleGreen() {
        if (!this.gameActive) return;
        
        const delay = Math.random() * 3000 + 2000; // 2-5 seconds
        this.timeout = setTimeout(() => {
            if (this.gameActive) {
                this.showGreen();
            }
        }, delay);
    }

    showGreen() {
        const circle = document.getElementById('reaction-circle');
        circle.classList.add('green');
        this.startTime = Date.now();
    }

    handleClick() {
        if (!this.gameActive) return;
        
        const circle = document.getElementById('reaction-circle');
        
        if (circle.classList.contains('green')) {
            const reactionTime = Date.now() - this.startTime;
            this.attempts.push(reactionTime);
            
            this.updateBestTime();
            this.updateAverageTime();
            
            if (reactionTime < 300) {
                gameState.showToast(`Lightning fast! ${reactionTime}ms ⚡`, 'success');
            }
            
            if (this.attempts.length >= this.maxAttempts) {
                this.complete();
            } else {
                this.resetCircle();
                this.scheduleGreen();
            }
        } else {
            // Clicked too early
            clearTimeout(this.timeout);
            gameState.showToast('Too early! Wait for green 🔴', 'warning');
            this.resetCircle();
            this.scheduleGreen();
        }
    }

    resetCircle() {
        const circle = document.getElementById('reaction-circle');
        circle.classList.remove('green');
    }

    complete() {
        this.gameActive = false;
        clearTimeout(this.timeout);
        
        const avgTime = this.attempts.reduce((a, b) => a + b, 0) / this.attempts.length;
        const bestTime = Math.min(...this.attempts);
        const score = Math.max(1000 - Math.floor(avgTime), 100);
        
        this.updateStatus('Completed ✅', 'completed');
        gameState.games.reaction.bestTime = Math.floor(bestTime);
        gameState.completeGame('reaction', score);
    }

    updateBestTime() {
        const best = Math.min(...this.attempts);
        document.getElementById('reaction-best').textContent = `${Math.floor(best)}ms`;
    }

    updateAverageTime() {
        const avg = this.attempts.reduce((a, b) => a + b, 0) / this.attempts.length;
        document.getElementById('reaction-avg').textContent = `${Math.floor(avg)}ms`;
    }

    updateStatus(text, className) {
        const status = document.getElementById('reaction-status');
        status.textContent = text;
        status.className = `game-status ${className}`;
    }
}

// Sliding Puzzle Game
class PuzzleGame {
    constructor() {
        this.grid = [];
        this.size = 4;
        this.emptyPos = { row: 3, col: 3 };
        this.moves = 0;
        this.startTime = null;
        this.gameActive = false;
        this.timer = null;
    }

    start() {
        if (this.gameActive) return;
        
        this.gameActive = true;
        this.moves = 0;
        this.startTime = Date.now();
        
        this.updateStatus('Playing...', 'playing');
        this.initializeGrid();
        this.shuffle();
        this.render();
        this.startTimer();
    }

    initializeGrid() {
        this.grid = [];
        for (let i = 0; i < this.size; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.size; j++) {
                this.grid[i][j] = i * this.size + j + 1;
            }
        }
        this.grid[this.size - 1][this.size - 1] = 0; // Empty space
        this.emptyPos = { row: this.size - 1, col: this.size - 1 };
    }

    shuffle() {
        // Perform random valid moves to shuffle
        for (let i = 0; i < 1000; i++) {
            const neighbors = this.getNeighbors(this.emptyPos.row, this.emptyPos.col);
            const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
            this.swapWithEmpty(randomNeighbor.row, randomNeighbor.col);
        }
    }

    getNeighbors(row, col) {
        const neighbors = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < this.size && newCol >= 0 && newCol < this.size) {
                neighbors.push({ row: newRow, col: newCol });
            }
        }
        
        return neighbors;
    }

    swapWithEmpty(row, col) {
        this.grid[this.emptyPos.row][this.emptyPos.col] = this.grid[row][col];
        this.grid[row][col] = 0;
        this.emptyPos = { row, col };
    }

    render() {
        const container = document.getElementById('puzzle-grid');
        container.innerHTML = '';
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const tile = document.createElement('div');
                tile.className = 'puzzle-tile';
                
                if (this.grid[i][j] === 0) {
                    tile.classList.add('empty');
                } else {
                    tile.textContent = this.grid[i][j];
                    tile.addEventListener('click', () => this.handleTileClick(i, j));
                }
                
                container.appendChild(tile);
            }
        }
    }

    handleTileClick(row, col) {
        if (!this.gameActive) return;
        
        // Check if tile is adjacent to empty space
        const neighbors = this.getNeighbors(this.emptyPos.row, this.emptyPos.col);
        const isAdjacent = neighbors.some(n => n.row === row && n.col === col);
        
        if (isAdjacent) {
            this.swapWithEmpty(row, col);
            this.moves++;
            this.updateMoves();
            this.render();
            
            if (this.isSolved()) {
                this.complete();
            }
        }
    }

    isSolved() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const expectedValue = i * this.size + j + 1;
                if (i === this.size - 1 && j === this.size - 1) {
                    // Last position should be empty (0)
                    if (this.grid[i][j] !== 0) return false;
                } else {
                    if (this.grid[i][j] !== expectedValue) return false;
                }
            }
        }
        return true;
    }

    complete() {
        this.gameActive = false;
        clearInterval(this.timer);
        
        const endTime = Date.now();
        const totalTime = endTime - this.startTime;
        const score = Math.max(1200 - this.moves * 5 - Math.floor(totalTime / 1000) * 2, 200);
        
        this.updateStatus('Completed ✅', 'completed');
        gameState.games.puzzle.bestTime = totalTime;
        gameState.completeGame('puzzle', score);
    }

    updateMoves() {
        document.getElementById('puzzle-moves').textContent = this.moves;
    }

    startTimer() {
        this.timer = setInterval(() => {
            if (!this.gameActive) return;
            
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('puzzle-time').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    updateStatus(text, className) {
        const status = document.getElementById('puzzle-status');
        status.textContent = text;
        status.className = `game-status ${className}`;
    }
}

// Game instances
const memoryGame = new MemoryGame();
const guessGame = new GuessGame();
const colorGame = new ColorGame();
const reactionGame = new ReactionGame();
const puzzleGame = new PuzzleGame();

// Global functions for HTML onclick handlers
function startMemoryGame() {
    memoryGame.start();
}

function startGuessGame() {
    guessGame.start();
}

function makeGuess() {
    guessGame.makeGuess();
}

function startColorGame() {
    colorGame.start();
}

function startReactionGame() {
    reactionGame.start();
}

function startPuzzleGame() {
    puzzleGame.start();
}

function closeModal() {
    document.getElementById('victory-modal').style.display = 'none';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        gameState.showToast('Copied to clipboard! 📋', 'success');
    });
}

function shareResults() {
    const text = `I just completed all 5 mini-games on GameHub Pro! 🎮\nTotal Score: ${gameState.totalScore}\nTime: ${document.getElementById('total-time').textContent}\n\nTry it yourself!`;
    
    if (navigator.share) {
        navigator.share({
            title: 'GameHub Pro - Challenge Complete!',
            text: text,
            url: window.location.href
        });
    } else {
        copyToClipboard(text);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Update total time every second
    setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('total-time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
    
    // Add enter key support for guess game
    document.getElementById('guess-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            makeGuess();
        }
    });
    
    // Initialize UI
    gameState.updateUI();
    
    // Show welcome message
    setTimeout(() => {
        gameState.showToast('Welcome to GameHub Pro! Complete all games to unlock exclusive content 🎮', 'success');
    }, 1000);
});