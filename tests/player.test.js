import { createPlayer } from "../src/modules/Player.js"
import { createGameboard } from "../src/modules/Gameboard";

test('return true for creating a player named John', () => {
    const player1 = createPlayer('John');
    expect(player1.playerName).toBe('John')
})

// unit test
test('return miss for succesful attack trigger on mock gameboard', () => {
    const player1 = createPlayer('John');
    const mockGameboard = { receiveAttack :  jest.fn().mockReturnValue('miss') }
    expect(player1.attack(mockGameboard, 1, 1)).toBe('miss')
})

// integration test
test('return miss for succesful attack trigger on gameboard empty cell', () => {
    const player1 = createPlayer('John');
    const player2Gameboard = createGameboard()
    expect(player1.attack(player2Gameboard, 1, 1).status).toBe('miss')
})

test('hasWon to be false initially and then return true after setting to won', () => {
    const player1 = createPlayer('John'); 
    expect(player1.hasWon).toBe(false)
    player1.hasWon = true
    expect(player1.hasWon).toBe(true)
})

test('computer move generate move', () => {
    const player1 = createPlayer('Computer', false); 
    // temporarily change random to give a deterministic output to test against
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0.5)
    try { 
        expect(player1.computerMove()).toEqual([5,0]) 
    } finally {
        spy.mockRestore()
    }
})

test('computer moves are mutually exlusive and exhaustive', () => {
    const player1 = createPlayer('Computer', false); 
    // create a set to track the moves sets can only contain unique values
    const playedMovesSet = new Set()
    const mockGameboard = { cells : 100 }
    for (let i = 0; i < mockGameboard.cells; i++) {
        playedMovesSet.add(player1.computerMove().join("."))
    }
    expect(playedMovesSet.size).toEqual(100)
})