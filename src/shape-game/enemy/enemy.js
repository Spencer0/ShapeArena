


function Enemy(color, life) {
    this.x = 100 + Math.random() * 300;
    this.y = 100 + Math.random() * 300;
    this.width = 10;
    this.height = 10;
    this.color = color;
    this.user = "mammoth";
    this.bullets = {};
    this.bulletCount = 0;
    this.life = life;
    this.movingForward = true;
}

module.exports = Enemy;