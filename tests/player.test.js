import { createPlayer } from "../src/modules/Player.js"
import { createGameboard } from "../src/modules/Gameboard";

test('return true for creating a player named John', () => {
    const playerOne = createPlayer('John');
    expect(playerOne.playerName).toBe('John')
})

// unit test
test('return miss for succesful attack trigger on mock gameboard', () => {
    const playerOne = createPlayer('John');
    const mockGameboard = { receiveAttack :  jest.fn().mockReturnValue('miss') }
    expect(playerOne.attack(mockGameboard, 1, 1)).toBe('miss')
})

// integration test
test('return miss for succesful attack trigger on gameboard empty cell', () => {
    const playerOne = createPlayer('John');
    const playerTwoGameboard = createGameboard()
    expect(playerOne.attack(playerTwoGameboard, 1, 1)).toBe('miss')
})

test('hasWon to be false initially and then return true after setting to won', () => {
    const playerOne = createPlayer('John'); 
    expect(playerOne.hasWon).toBe(false)
    playerOne.hasWon = true
    expect(playerOne.hasWon).toBe(true)
})

test('computer move generate move', () => {
    const playerOne = createPlayer('Computer', false); 
    // temporarily change random to give a deterministic output to test against
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0.5)
    try { 
        expect(playerOne.computerMove()).toEqual([5,0]) 
    } finally {
        spy.mockRestore()
    }
})

test('computer moves are mutually exlusive and exhaustive', () => {
    const playerOne = createPlayer('Computer', false); 
    // create a set to track the moves sets can only contain unique values
    const playedMovesSet = new Set()
    const mockGameboard = { cells : 100 }
    for (let i = 0; i < mockGameboard.cells; i++) {
        playedMovesSet.add(playerOne.computerMove().join("."))
    }
    expect(playedMovesSet.size).toEqual(100)
})