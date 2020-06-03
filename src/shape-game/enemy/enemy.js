function Enemy(color, life) {
    this.x = 100 + Math.random() * 300;
    this.y = 100 + Math.random() * 300;
    this.width = 50;
    this.height = 50;
    this.color = color;
    this.user = "mammoth";
    this.bullets = {};
    this.bulletCount = 0;
    this.life = life;
}

module.exports = Enemy;