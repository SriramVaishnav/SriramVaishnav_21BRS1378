class Game {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'A'; // Player A starts
        this.gameOver = false;
    }

    initializeBoard() {
        const board = Array(5).fill(null).map(() => Array(5).fill(null));

        board[0] = ['A-P1', 'A-H1', 'A-H2', 'A-H1', 'A-P1']; // Player A's starting row
        board[4] = ['B-P1', 'B-H1', 'B-H2', 'B-H1', 'B-P1']; // Player B's starting row

        return board;
    }

    getGameState() {
        return {
            board: this.board,
            currentPlayer: this.currentPlayer,
            gameOver: this.gameOver,
        };
    }

    isValidMove(player, character, move) {
        const position = this.findCharacterPosition(player, character);

        if (!position) return false;

        const [i, j] = position;
        let [newI, newJ] = this.calculateNewPosition(i, j, move, character);

        if (newI < 0 || newI >= 5 || newJ < 0 || newJ >= 5) return false; // Out of bounds
        if (this.board[newI][newJ] && this.board[newI][newJ].startsWith(player)) return false; // Friendly fire

        return true;
    }

    makeMove(player, character, move) {
        const position = this.findCharacterPosition(player, character);
        const [i, j] = position;
        let [newI, newJ] = this.calculateNewPosition(i, j, move, character);

        // Clear the current position
        this.board[i][j] = null;

        // Capture opponent's character
        if (this.board[newI][newJ]) {
            this.board[newI][newJ] = null;
        }

        // Move to the new position
        this.board[newI][newJ] = `${player}-${character}`;

        // Check for game over
        this.checkGameOver();

        // Switch the turn to the other player
        this.currentPlayer = this.currentPlayer === 'A' ? 'B' : 'A';
    }

    findCharacterPosition(player, character) {
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                if (this.board[i][j] === `${player}-${character}`) {
                    return [i, j];
                }
            }
        }
        return null;
    }

    calculateNewPosition(i, j, move, character) {
        const directionMap = {
            'L': [0, -1],
            'R': [0, 1],
            'F': [-1, 0],
            'B': [1, 0],
            'FL': [-1, -1],
            'FR': [-1, 1],
            'BL': [1, -1],
            'BR': [1, 1],
        };

        let steps = character.startsWith('H1') ? 2 : 1; // Hero1 moves 2 steps, others move 1 step

        let [di, dj] = directionMap[move];
        return [i + di * steps, j + dj * steps];
    }

    checkGameOver() {
        const playerBChars = this.board.flat().filter(cell => cell && cell.startsWith('B'));
        const playerAChars = this.board.flat().filter(cell => cell && cell.startsWith('A'));

        if (playerAChars.length === 0) {
            this.gameOver = true;
            this.winner = 'B';
        } else if (playerBChars.length === 0) {
            this.gameOver = true;
            this.winner = 'A';
        }
    }
}

module.exports = Game;
