import { Gameboard } from "../src/gameboard.js";

test('create a 10x10 board', () => {
    const testBoard = new Gameboard(10, 10)
    expect(testBoard.board.length).toBe(10)
    expect(testBoard.board[0].length).toBe(10)
})

test('place ship on a board horizontally', () => {
    const testBoard = new Gameboard(10, 10)
    const destroyer = new Ship(4)
    testBoard.placeShip(5, 5, destroyer, "horizontal")
    expect(testBoard.board[5][5]).toBe(destroyer)
})