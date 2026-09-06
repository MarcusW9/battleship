import { createShip } from "./Ship.js"

const createGameboard = () => {
    const board = Array(10).fill(null).map(() => Array(10).fill(null));
    const trackedHits = new Set()
    const ships = []
    
    const placeShip = (row, col, ship, direction) => {

        // 1. Guard against invalid ship objects
        if (!ship || ship.length <= 0) return 'negative ship length';

        // 2. Guard against negative starting coordinates
        if (row < 0 || col < 0) return 'out of bounds';
        
        // 3. Direction-specific bounds checking
        if (col + ship.length > board[0].length && direction === 'horizontal') return 'out of bounds'
        if (row + ship.length > board.length && direction === 'vertical') return 'out of bounds'

        // 4. Direction-specific ship overlap checking
        for (let i = 0; i < ship.length; i++) {
            if (direction === 'horizontal' && board[row][col+i] != null) return 'overlapping' 
            if (direction === 'vertical' && board[row+i][col] != null) return 'overlapping'
        }
    
        // 5. Place the ship onto the board
        for (let i = 0; i < ship.length; i++) {
            if (direction === 'horizontal') {
                board[row][col+i] = ship
            } else if (direction === 'vertical') {
                board[row+i][col] = ship
            }
        }

        // 6. Log succesful ship placement and add to total ships
        ships.push(ship)
        return true
    }

    const receiveAttack = (row, col) => {
        // 1. Guard against out of bounds hit
        if (row < 0 || col < 0 || row >= board.length || col >= board[0].length) return { 
            success: true,
            status: 'hit', 
            message: 'This hit is out of bounds',
            data : { row, col }
          }

        // 2. Guard for if hit already placed on the cell
        if (trackedHits.has(`${row},${col}`)) return 'We have already targetted this area'

        // 3. Check for no ship trigger hit and return miss
        if (board[row][col] === null) {
            trackedHits.add(`${row},${col}`)
            return 'miss'
        }
        // 4. Trigger a hit on the coordinate if there is a ship
        board[row][col].hit()
        trackedHits.add(`${row},${col}`)

        // 5. Return sunk if the boat hit is now sunk
        if (board[row][col].isSunk()) {
            return 'sunk'
        }
        // Return his if boat is hit but not sunk
        return 'hit'
    }


    const allShipsSunk = () => {
        // 1. Guard if no ships no need to check sunk
        if (ships.length === 0) return false;

        // 2. Guard to prevent an empty board with no ships winning the game
        for (let i = 0; i < ships.length; i++) {

        // 3. isSunk() returns false if the ship is alive and returns false
            if (!ships[i].isSunk()) return false;
        }

        // 4. if all ships are sunk the loop finishes and returns true
        return true
    }
    
    return {
        board,
        placeShip,
        receiveAttack,
        allShipsSunk
    };
};

export { createGameboard } 