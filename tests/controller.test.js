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

    // 1. By default first human player
    expect(gameController.activePlayer.playerName).toBe('TestName')
    gameController.player2Gameboard.placeShip(1, 1, ship1, 'horizontal')

    // 2. Play turn
    expect(gameController.playTurn(1, 1)).toBe(true)

    // 3. After turn test who is the player now
    expect(gameController.activePlayer.playerName).toBe('Computer')
})

test('Player 1 and Player 2 maintain separate defending boards', () => {
    const controller = createGameController();

    // 1. Place a ship ONLY on Player 1's board
    controller.player1Gameboard.placeShip(0, 0, createShip('Cruiser'), 'horizontal');

    // 2. Player 1 attacks Player 2 at (0, 0) -> Should MISS (Player 2 has no ship here)
    const p1Turn = controller.playTurn(0, 0); 
    expect(p1Turn).toBe('miss');

    // 3. Player 2 attacks Player 1 at (0, 0) -> Should HIT (Player 1 has a ship here)
    const p2Turn = controller.playTurn(0, 0); 
    expect(p2Turn.status).toBe('hit');
});