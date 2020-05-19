document.addEventListener('DOMContentLoaded', function(){
    
    let userNames = ['Luda', 'Nicki', 'Snoop', 'JayZ', 'A$AP', 'Kanye', 'Doja', '21Pilots', 'Nickleback', 'Sion', 'Olaf', 'Bard', 'Elise', 'Ashe']
    let trimColors = ['red', 'white', 'orange', 'blue', 'yellow', 'navyblue', 'purple', 'pink']
    let user = userNames[Math.floor(Math.random() * userNames.length)];
    const socket = io({ query: "user="+user })
    let trimColor = trimColors[Math.floor(Math.random() * trimColors.length)];
    let userInput = document.getElementById("chat-input")
    let activityCounter = document.getElementById("active-number")
    let shapeGame = new squareGame(user, socket)
    pingCheck();
    randomTrimColor();
    setInterval(pingCheck, 2000)


    socket.on("connection-event", function(msg){
        console.log("Friends appearing! Active users: ", msg)
        activityCounter.innerText = msg;
    })

    socket.on("message-event", function(msg){
        newChatMessageEvent(JSON.parse(msg));
        scrollChatDiv()
    })

    socket.on('state', function (state) {
        shapeGame.drawState(state)
    })

    function pingCheck(){
        let ping = Date.now()
        socket.emit('latency', function () {
            latency = Date.now() - ping;
            document.getElementById("ping-display").innerText = "Ping: " + latency; 
        });
    }
   
    document.getElementById("new-trim-button").addEventListener("click", function(e){
        e.preventDefault();
        randomTrimColor();
    })
    document.getElementById("chat-input-form").addEventListener("submit", function(e){
        e.preventDefault()
        socket.emit('message-event', JSON.stringify({"user": user, "value":userInput.value}))
        userInput.value = ""
    })

    document.getElementById("chat-input") .addEventListener("click", function(event) { 
        event.preventDefault() 
    });

    document.getElementById("user-menu").innerText = user;
    function scrollChatDiv(){
        var div = document.getElementById("chat-display");
        div.scrollTop = div.scrollHeight - div.clientHeight;
    }
    function newChatMessageEvent(msg){
        let li = document.createElement('li');
        li.classList.add("user-chat-item");
        let userMessageContentSpan = document.createElement('span'); 
        userMessageContentSpan.classList.add("user-chat-span");
        let userNameContentSpan = document.createElement('span');
        userNameContentSpan.classList.add("user-name-chat-span");
        userNameContentSpan.innerText = msg.user;
        let userValueContentSpan = document.createElement('span');
        userValueContentSpan.classList.add("user-value-chat-span");
        userValueContentSpan.innerText = msg.value;
        userMessageContentSpan.appendChild(userNameContentSpan);
        userMessageContentSpan.appendChild(userValueContentSpan);
        li.appendChild(userMessageContentSpan);
        document.getElementById('message-list').appendChild(li);
        return li;
    }

    function randomTrimColor(){
            let letters = '6789ABCDEF';
            let color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * letters.length)];
            }
            console.log("color, ", color)
            document.getElementById("top-bar").style.backgroundColor = color;
            document.getElementById("chat").style.backgroundColor = color;
            document.getElementById("bottom-bar").style.backgroundColor = color;
            document.getElementById("tint-btn-icon").style.color = color;

            return color;
    }

    function squareGame(user, socket){
        this.canvas  = document.getElementById('shape-arena-canvas');
        this.backgroundCanvas = document.getElementById('shape-arena-background-canvas')
        this.backgroundContext = this.backgroundCanvas.getContext('2d');
        this.canvas.height = 6000;
        this.canvas.width = 8000;
        this.backgroundCanvas.height = 6000;
        this.backgroundCanvas.width = 8000;
        this.context = this.canvas.getContext('2d');
        this.keysCurrentlyDown = {};
        this.newKeyInput = false;
        this.socket = socket;
        this.clicked = false;
        this.mouse = {x:0, y:0};
        let self = this;

        
        this.canvas.onmouseup = function(e){ 
            self.mouse.x = e.offsetX;
            self.mouse.y = e.offsetY;
            self.clicked = true;
        };

        this.canvas.addEventListener("keydown", function(e){
            self.keysCurrentlyDown[e.key] = 1;
            self.newKeyInput = true;
        })

        this.canvas.addEventListener("keyup", function(e){
            delete self.keysCurrentlyDown[e.key]
            if(Object.keys(self.keysCurrentlyDown).length === 0){
                self.newKeyInput = false;
            }
        })

        this.submitKeyboardInput = function(){
            if(this.keysCurrentlyDown === {}){return;}
            this.socket.emit('keyboard-input', this.keysCurrentlyDown)
            
        }

        this.submitMouseInput = function(){
            if(!this.clicked){return;}
            this.socket.emit('mouse-input', this.mouse)
            this.clicked = false
        }

        this.updateCamera = function(x,y){
            let canvasContainer = document.getElementById("shape-arena");
            canvasContainer.scroll(x - (canvasContainer.offsetWidth / 2) + 50, y - (canvasContainer.offsetHeight / 2)  + 50);
        }

        this.drawState = function(state){
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            for(key of Object.keys(state.player)){
                let player = state.player[key]
                this.context.beginPath();
                this.context.fillStyle = player.color ? player.color : "black";
                this.context.fillRect(player.x,player.y,player.width,player.height);
                this.context.stroke();
                this.context.font = "16px sans sherif";
                this.context.strokeStyle = "white";
                this.context.fillStyle = "white";
                this.context.fillText(player.user + "("+ player.level + ")", player.x , player.y + player.height + 15 );
                if(player.id == this.socket.id){
                    this.updateCamera(player.x, player.y);
                }
                for(bulletId of Object.keys(player.bullets)){
                    let bullet = player.bullets[bulletId]
                    this.context.beginPath();
                    this.context.arc(bullet.x, bullet.y, bullet.width, 0, 2 * Math.PI, false);
                    this.context.fill();
                    this.context.lineWidth = 5;
                    this.context.strokeStyle = player.color;
                    this.context.stroke();
                }
            }
            for(key of Object.keys(state.enemies)){
                let enemy = state.enemies[key]
                this.context.beginPath();
                this.context.fillStyle = enemy.color;
                this.context.fillRect(enemy.x,enemy.y,enemy.width,enemy.height);
                this.context.stroke();
                this.context.font = "16px sans sherif";
                this.context.strokeStyle = "white";
                this.context.fillStyle = "white";
                this.context.fillText(enemy.user, enemy.x , enemy.y + enemy.height + 10 );
                for(bulletId of Object.keys(enemy.bullets)){
                    let bullet = player.bullets[bulletId]
                    this.context.beginPath();
                    this.context.arc(bullet.x, bullet.y, bullet.width, 0, 2 * Math.PI, false);
                    this.context.fill();
                    this.context.lineWidth = 5;
                    this.context.strokeStyle = player.color;
                    this.context.stroke();
                }
            }
            if(this.clicked){
                this.submitMouseInput();
                this.newMouseInput = false;
            }
            if(this.newKeyInput){
                this.submitKeyboardInput();
            }
        }

        this.randomColor = function(e){
            let letters = '0123456789ABCDEF';
            let color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }

        this.drawBackground = function(){
            //Draw weird lines
            for(let i = 0; i < this.backgroundCanvas.width; i += 30){
                for(let j = 0; j < this.backgroundCanvas.height; j += 50){
                    this.backgroundContext.beginPath();
                    this.backgroundContext.lineWidth = Math.random();
                    this.backgroundContext.strokeStyle = this.randomColor();
                    this.backgroundContext.rect(i,j,80,60);
                    this.backgroundContext.stroke();
                }
            }

            //Draw safe zone 
            this.backgroundContext.beginPath();
            this.backgroundContext.lineWidth = 5;
            this.backgroundContext.strokeStyle =  "white";
            this.backgroundContext.rect(0, 0, 100, 100);
            this.backgroundContext.stroke();
        }

        this.drawBackground();
    }
    
});
