const createShip = (length)  => {
    return {
        length : length,
        hits : 0,
        sunk : false
    };
}

export { createShip } 