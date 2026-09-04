import { createPlayer } from "../src/modules/Player.js"

test('return true for creating a player named John', () => {
    const playerOne = createPlayer('John');
    expect(playerOne.playerName).toBe('John')
})