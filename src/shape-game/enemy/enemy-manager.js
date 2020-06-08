const Enemy = require('./enemy');
const enemyFactory = require('./enemy-factory');

const update = function(state) {
    for(enemyId of Object.keys(state.enemies)){
        let enemy = state.enemies[enemyId];
        enemy.x += 1;
        enemy.y += 1;
        if(enemy.x >= state.gameWorldWidth || enemy.y >= state.gameWorldHeight ){
            state.enemyCount--;
            delete state.enemies[enemyId]
        }
    }
}

const enemySpawner = (state) => {
        state.enemies[state.enemyIncId] = enemyFactory('Brown', 1);
        state.enemyCount++;
        state.enemyIncId++;
        console.log("Spawning new enemy", "current count :" + state.enemyCount)
}


module.exports.enemySpawner = enemySpawner;
module.exports.update = update;