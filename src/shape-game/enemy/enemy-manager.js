const Enemy = require('./enemy');
const enemyFactory = require('./enemy-factory');

const update = function(state) {
    for(enemyId of Object.keys(state.enemies)){



        let enemy = state.enemies[enemyId];





        if(enemy.x > 500 && enemy.y > 600){
            enemy.movingForward = false;
        }
        if(enemy.x < 150 && enemy.y < 300){
            enemy.movingForward = true;
        }
        if(enemy.movingForward){
            enemy.x += 1;
            enemy.y += 1;
        }else{
            enemy.x -= 1;
            enemy.y -= 1; 
        }



        if(enemy.x >= state.gameWorldWidth || enemy.y >= state.gameWorldHeight ){
            state.enemyCount--;
            delete state.enemies[enemyId]
        }
    }
}


const enemySpawner = (state) => {
    if(state.enemyCount > 10) { return };
    state.enemies[state.enemyIncId] = enemyFactory('Brown', 1);
    state.enemyCount++;
    state.enemyIncId++;
}


module.exports.enemySpawner = enemySpawner;
module.exports.update = update;