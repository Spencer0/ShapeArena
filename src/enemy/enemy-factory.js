const Enemy = require('./enemy');

let EnemyFactory = function(color, life) {
    return new Enemy(color, life);
}

module.exports = EnemyFactory;