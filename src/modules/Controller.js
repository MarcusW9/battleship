import { createGameboard } from "./Gameboard.js"
import { createPlayer } from "./Player.js"
import { SHIP_PRESETS, createShip } from "./Ship.js"

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

    const fleetQueue = Object.entries(SHIP_PRESETS).map(([shipType, length]) => ({
        shipType,
        length
    }))

    let currentShipIndex = 0;
    let currentShipDirection = "horizontal";
    let gameOver = false
    let winner = null

    const rotateShip = () => {
        return currentShipDirection = currentShipDirection === "horizontal" ? "vertical" : "horizontal"
    }

    const placeCurrentShip = (
        row, col
    ) => {
        // Guard
        if (isPlacementComplete()) return { success: false } 

        const { shipType, length } = fleetQueue[currentShipIndex]
        const result = player1Gameboard.placeShip (
            row, 
            col, 
            createShip(shipType, length), 
            currentShipDirection 
        )
        if (result.success) {
            currentShipIndex++
        }
        return result
    }

    const getCurrentShip = () => {
        return fleetQueue[currentShipIndex] ?? null
    }
    
    const isPlacementComplete = () => currentShipIndex >= fleetQueue.length

    const getDefendingBoard = () => {
        return activePlayer === player1 ? player2Gameboard : player1Gameboard 
    }

    const switchTurn = () => {
        activePlayer = activePlayer === player1 ? player2 : player1;
    }

    const playTurn = (row, col) => {

        if (gameOver) {
            return {
                success: false,
                status: 'gameOver',
                message: 'The game is already over.'
            }
        }

        // 1. Pick target board based on active player
        const defendingBoard = getDefendingBoard()
        
        // 2. trigger an attack on the defending board target
        const activeTurn = defendingBoard.receiveAttack(row, col);
        
        // 3. If attack returned false (e.g., cell [row, col] was already shot),
        // stop here so player can try a different cell
        if (!activeTurn.success) return {
            success: false,
            status: 'invalid', // Options: 'miss' | 'hit' | 'sunk' | 'placed' | 'invalid'
            message: 'You have already fired at this coordinate!'
        }

        // 4. If all ships sunk as a result of this hit trigger win 
        if (defendingBoard.allShipsSunk()) {
            gameOver = true
            winner = activePlayer
            return {
                success: true,
                status: 'win',
                message: `${activePlayer.playerName} has sunk all opposing ships!`,
                data: { winner: activePlayer }
            }
        }

        // 5. Valid move and game continues
        const turnSummary = {
            success: true,
            status: 'played',
            message: `${activePlayer.playerName}'s shot completed.`,
            data: { activePlayer, attackResult: activeTurn }
        }; // Need to capture activePlayer now before triggering switchTurn

        switchTurn();
        return turnSummary;
    }

    const automaticComputerMove = () => {
        if (activePlayer.isHuman) return null;

        // 1. Get AI coordinates
        const move = activePlayer.computerMove();
        if (!move) return null;

        const [row, col] = move;

        // 2. Simply delegate to playTurn!
        return playTurn(row, col);
    };

    const isGameOver = () => gameOver

    return {
        get player1() { return player1 },
        get player2() { return player2 } ,
        get player1Gameboard() { return player1Gameboard },
        get player2Gameboard() { return player2Gameboard },
        get activePlayer() { return activePlayer },
        get shipDirection() { return currentShipDirection },
        isGameOver,
        getCurrentShip,
        isPlacementComplete,
        placeCurrentShip,
        rotateShip,
        playTurn,
        automaticComputerMove
    }
}

