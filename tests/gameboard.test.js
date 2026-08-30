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

test('create a ship and place vertically on board with length 3', () => {
    // create empty board
    const gameboard = createGameboard()
    expect(gameboard.board[4][4] === null).toBe(true)
    // place ship
    const ship = createShip(3)
    gameboard.placeShip(4, 4, ship, 'vertical')
    expect(gameboard.board[4][4] === ship).toBe(true)
    // check it is spanning horizontal with a length of 3
    expect(gameboard.board[5][4] === ship).toBe(true)
    expect(gameboard.board[6][4] === ship).toBe(true)
})

test('return false for placing ship out of bounds', () => {
    const gameboard = createGameboard()
    const ship = createShip(3)
    expect(gameboard.placeShip(0, 8, ship,'horizontal')).toBe(false)
    // Make sure index 8 and 9 were not written to
    expect(gameboard.board[0][8]).toBeNull();
    expect(gameboard.board[0][9]).toBeNull();
})

test('return false if ship being placed overlaps with another', () => {
    const gameboard = createGameboard()
    const ship1 = createShip(3) 
    const ship2 = createShip(3) 
    expect(gameboard.placeShip(1, 1, ship1,'horizontal')).toBe(true)
    expect(gameboard.placeShip(1, 1, ship2,'horizontal')).toBe(false)
})

// test('place ship on a board horizontally', () => {
//     const testBoard = new Gameboard(10, 10)
//     const destroyer = new Ship(4)
//     testBoard.placeShip(5, 5, destroyer, "horizontal")
//     expect(testBoard.board[5][5]).toBe(destroyer)
// })

