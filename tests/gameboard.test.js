import { createGameboard } from "../src/modules/Gameboard.js";

test('create a 10x10 board', () => {
    const gameboard = createGameboard()
    expect(gameboard.board.length).toBe(10)
    expect(gameboard.board[0].length).toBe(10)
})

// test('place ship on a board horizontally', () => {
//     const testBoard = new Gameboard(10, 10)
//     const destroyer = new Ship(4)
//     testBoard.placeShip(5, 5, destroyer, "horizontal")
//     expect(testBoard.board[5][5]).toBe(destroyer)
// })

