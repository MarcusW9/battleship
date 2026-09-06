import { createGameboard } from "./Gameboard"
import { createPlayer } from "./Player"

export const createGameController = (
    player1Name = 'You', 
    player2Name = 'Computer', 
    isPlayer2Human = false
) => {
    const player1 = createPlayer(player1Name, true)
    const player2 = createPlayer(player2Name, isPlayer2Human)
    let activePlayer = player1

    const player1Gameboard = createGameboard()
    const player2Gameboard = createGameboard()

    const playTurn = (row, col) => {

        // 1. Pick target board based on active player
        const defendingPlayer = activePlayer === player1 ? player2 : player1;
        const defendingBoard = defendingPlayer === player2 ? player2Gameboard : player1Gameboard;
        const switchTurn = () => {
            activePlayer = activePlayer === player1 ? player2 : player1
        }
        
        // 2. trigger an attack on the defending board target
        const activeTurn = defendingBoard.receiveAttack(row, col);
        
        // 3. If attack returned false (e.g., cell [row, col] was already shot),
        // stop here so player can try a different cell
        if (!activeTurn) return 

        // 4. If all ships sunk as a result of this hit trigger win 
        if (defendingBoard.allShipsSunk()) return 'win'

        // 5. Valid move and game continues
        switchTurn()
        return true
    }

    return {
        get player1() { return player1 },
        get player2() { return player2 } ,
        get player1Gameboard() { return player1Gameboard },
        get player2Gameboard() { return player2Gameboard },
        get activePlayer() { return activePlayer },
        playTurn
    }
}

