import { createGameController } from "../src/modules/Controller.js"
import { createShip } from "../src/modules/Ship.js"



test('gameController succesfully creates default one human player and computer', () => {
    const gameController = createGameController('TestName')
    expect(gameController.player1.playerName).toEqual('TestName')
    expect(gameController.player2.playerName).toEqual('Computer')
})


// Integration test to triggger succesful attack on the boar 
// and logic for switch turns
test('gameController defaults to player1 TestName first then switches turns after attack to computer', () => {
    const gameController = createGameController('TestName')
    const ship1 = createShip(3)

    // By default first human player
    expect(gameController.activePlayer.playerName).toEqual('TestName')
    gameController.player2Gameboard.placeShip(1, 1, ship1, 'horizontal')
    // Play turn
    expect(gameController.playTurn(1, 1)).toBe(true)
    // After turn test who is the player now
    expect(gameController.activePlayer.playerName).toEqual('Computer')
})

test('player is associated with the correct board', () => {
    const gameController = createGameController('TestName')
    //expect(gameController.)
})