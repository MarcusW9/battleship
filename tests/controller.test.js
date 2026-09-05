import { createGameController } from "../src/modeules/Controller.js"

test('gameController succesfully creates default one human player and computer', () => {
    const gameController = createGameController('TestName')
    expect(gameController.player1.name)
})