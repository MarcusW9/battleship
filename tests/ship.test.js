import { Ship } from "../src/ship";

test('create a ship from class', () => {
    const testShip = new Ship(2);
    expect(testShip.length).toBe(2)
    expect(testShip.hits).toBe(0)
})

test('create a ship and hit it once', () => {
    const testShip = new Ship(2);
    expect(testShip.length).toBe(2)
    expect(testShip.hits).toBe(0)

    testShip.hit() 
    expect(testShip.hits).toBe(1)
    expect(testShip.isSunk).toBe(false)
})


test('create a ship and hit it twice to sink it', () => {
    const testShip = new Ship(2);
    expect(testShip.length).toBe(2)
    expect(testShip.hits).toBe(0)

    testShip.hit() 
    expect(testShip.hits).toBe(1)
    expect(testShip.isSunk).toBe(false)
    
    testShip.hit() 
    expect(testShip.hits).toBe(2)
    expect(testShip.isSunk).toBe(true)
})
