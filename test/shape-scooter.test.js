const enemyFactory = require('../src/shape-game/enemy/enemy-factory.js');
const ShapeScooter = require('../src/shape-game/shape-scooter.js');
const bulletCollideFunction = new ShapeScooter().collides


test('Try to kill a player in the wild', () => {
    let testPlayer = enemyFactory("white", 1);
    testPlayer['x'] = 275;
    testPlayer['y'] = 275;
    let bulletMock = {x: 275, y: 275 }
    expect(bulletCollideFunction(testPlayer, bulletMock)).toBe(true)
});

test('Try to spawn kill a player in the starting zone', () => {
    let testPlayer = enemyFactory("white", 1);
    testPlayer['x'] = 50;
    testPlayer['y'] = 50;
    let bulletMock = {x: 50, y: 50 }
    expect(bulletCollideFunction(testPlayer, bulletMock)).toBe(false)
});

test('Try to  kill a player in the shop', () => {
    let testPlayer = enemyFactory("white", 1);
    testPlayer['x'] = 550;
    testPlayer['y'] = 550;
    let bulletMock = {x: 551, y: 551}
    expect(bulletCollideFunction(testPlayer, bulletMock)).toBe(false)
});