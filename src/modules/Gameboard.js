import { createShip } from "./Ship"

const createGameboard = () => {
    const board = Array(10).fill(null).map(() => Array(10).fill(null));
    
    const placeShip = (row, col, ship, direction) => {
        if (ship.length > 0) {
            for (let i = 0; i < ship.length; i++) {
                if (direction === 'horizontal') {
                    board[row][col+i] = ship
                } else {
                    board[row+i][col] = ship
                }
            }
        }
    }

    return {
        board,
        placeShip
    };
};

export { createGameboard } 