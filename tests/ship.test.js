import { createShip } from "../src/modules/Ship.js";

test('create ship from factory function', () => {
    const testShip = createShip('Cruiser')
    expect(testShip.length).toBe(3)
})

test('create a ship and hit it once', () => {
    const testShip =  createShip('Cruiser');
    expect(testShip.length).toBe(3)
    expect(testShip.getHits()).toBe(0)

    testShip.hit() 
    expect(testShip.getHits()).toBe(1)
    expect(testShip.isSunk()).toBe(false)
})
