import { createShip } from "./Ship"

const createGameboard = () => {
    const board = Array(10).fill(null).map(() => Array(10).fill(null));
    
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


    return {
        board,
        placeShip
    };
};

export { createGameboard } 