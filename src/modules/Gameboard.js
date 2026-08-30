import { createShip } from "./Ship"

const createGameboard = () => {
    const board = Array(10).fill(null).map(() => Array(10).fill(null));
    
    const placeShip = (row, col, ship, direction) => {
        if (!ship || ship.length <= 0) return; {
            for (let i = 0; i < ship.length; i++) {
                if (direction === 'horizontal') {
                    board[row][col+i] = ship
                } else if (direction === 'vertical') {
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