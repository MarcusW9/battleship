import { createShip } from "./Ship"

const createGameboard = () => {
    const board = Array(10).fill(null).map(() => Array(10).fill(null));

    const trackedHits = new Set()
    
    const placeShip = (row, col, ship, direction) => {

        // 1. Guard against invalid ship objects
        if (!ship || ship.length <= 0) return false;

        // 2. Guard against negative starting coordinates
        if (row < 0 || col < 0) return false;
        
        // 3. Direction-specific bounds checking
        if (col + ship.length > board[0].length && direction === 'horizontal') return false
        if (row + ship.length > board.length && direction === 'vertical') return false

        // 4. Direction-specific ship overlap checking
        for (let i = 0; i < ship.length; i++) {
            if (direction === 'horizontal' && board[row][col+i] != null) return false 
            if (direction === 'vertical' && board[row+i][col] != null) return false
        }
    
        // 5. Place the ship onto the board
        for (let i = 0; i < ship.length; i++) {
            if (direction === 'horizontal') {
                board[row][col+i] = ship
            } else if (direction === 'vertical') {
                board[row+i][col] = ship
            }
        }
        return true
    }

    const receiveAttack = (row, col) => {
        // 1. Guard against out of bounds hit
        if (row < 0 || col < 0 || row >= board.length || col >= board[0].length) return false

        // 2. Guard for if hit already placed on the cell
        if (trackedHits.has(`${row},${col}`)) return 'We have already targetted this area'

        // 3. Is there a ship?
        if (board[row][col] === null) {
            trackedHits.add(`${row},${col}`)
            return 'miss'
        }
        // 4. Trigger a hit on a coordinate
        board[row][col].hit()
        trackedHits.add(`${row},${col}`)

        // 5. Is the boat now sunk?
        if (board[row][col].isSunk()) {
            return 'sunk'
        }

        // Reaching the end of this function means a hit has triggered
        return 'hit'
    }


    return {
        board,
        placeShip,
        receiveAttack
    };
};

export { createGameboard } 