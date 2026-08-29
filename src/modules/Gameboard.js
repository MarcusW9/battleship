import { createShip } from "./Ship"

const createGameboard = () => {
    const board = Array(10).fill(null).map(() => Array(10).fill(null));
    
    const placeShip = (x, y, ship, direction) => {
        if (ship.length > 0) {
            for (let i = 0; i < ship.length; i++) {
                if (direction === 'horizontal') {
                    board[x+i][y] = ship
                } else {
                    board[x][y+i] = ship
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