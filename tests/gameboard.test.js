import { createGameboard } from "../src/modules/Gameboard.js";
import { createShip } from "../src/modules/Ship.js"

test('create a 10x10 board', () => {
    const gameboard = createGameboard()
    expect(gameboard.board.length).toBe(10)
    expect(gameboard.board[0].length).toBe(10)
})

test('create a ship and place horizontally on board with length 3', () => {
    // create empty board
    const gameboard = createGameboard()
    expect(gameboard.board[2][2] === null).toBe(true)
    // place ship
    const ship = createShip(3)
    gameboard.placeShip(2, 2, ship, 'horizontal')
    expect(gameboard.board[2][2] === ship).toBe(true)
    // check it is spanning horizontal with a length of 3
    expect(gameboard.board[2][3] === ship).toBe(true)
    expect(gameboard.board[2][4] === ship).toBe(true)
})

// test('place ship on a board horizontally', () => {
//     const testBoard = new Gameboard(10, 10)
//     const destroyer = new Ship(4)
//     testBoard.placeShip(5, 5, destroyer, "horizontal")
//     expect(testBoard.board[5][5]).toBe(destroyer)
// })

