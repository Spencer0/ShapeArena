document.addEventListener('DOMContentLoaded', function(){
    
    let userNames = ['Luda', 'Nicki', 'Snoop', 'JayZ', 'A$AP', 'Kanye', 'Doja', '21Pilots', 'Nickleback', 'Sion', 'Olaf', 'Bard', 'Elise', 'Ashe']
    let trimColors = ['red', 'black', 'white', 'orange', 'blue', 'yellow', 'aqua', 'navyblue', 'purple', 'pink']
    let user = userNames[Math.floor(Math.random() * userNames.length)];
    const socket = io({ query: "user="+user })
    let trimColor = trimColors[Math.floor(Math.random() * trimColors.length)];
    let userInput = document.getElementById("chat-input")
    let activityCounter = document.getElementById("active-number")
    let shapeGame = new squareGame(user, socket)
    pingCheck();
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
            console.log(latency);
            document.getElementById("ping-display").innerText = "Ping: " + latency; 
        });
    }
   

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
        this.newMouseInput = false;
        this.socket = socket;
        this.input = {
            mouse: false
        }
        let self = this;


        this.canvas.onmouseup = function(e){ 
            self.input.mouse = true;
            self.newMouseInput = true;
        };

        this.canvas.addEventListener("keydown", function(e){
            self.keysCurrentlyDown[e.key] = 1;
            self.newKeyInput = true;
        })

        this.canvas.addEventListener("keyup", function(e){
            delete self.keysCurrentlyDown[e.key]
            if(Object.keys(self.keysCurrentlyDown).length === 0){
                console.log("stopping inputs")
                self.newKeyInput = false;
            }
        })

        this.submitInput = function(){
            if(this.keysCurrentlyDown === {}){return;}
            this.socket.emit('user-input', this.keysCurrentlyDown)
            this.input = {
                mouse: false,
            }
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
                this.context.fillStyle = player.color;
                this.context.fillRect(player.x,player.y,player.width,player.height);
                this.context.stroke();
                this.context.font = "16px sans sherif";
                this.context.strokeStyle = "white";
                this.context.fillStyle = "white";
                this.context.fillText(player.user, player.x , player.y + player.height + 10 );
                //if its US we are drawing, move camera

                if(player.id == this.socket.id){
                    this.updateCamera(player.x, player.y);
                }
            }
            if(this.newMouseInput){
                this.submitInput();
                this.newMouseInput = false;
            }
            if(this.newKeyInput){
                this.submitInput();
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
            for(let i = 0; i < this.backgroundCanvas.width; i += 30){
                for(let j = 0; j < this.backgroundCanvas.height; j += 50){
                    this.backgroundContext.beginPath();
                    this.backgroundContext.strokeStyle = this.randomColor();
                    this.backgroundContext.rect(i,j,80,60);
                    this.backgroundContext.stroke();
                }
            }
        }

        this.drawBackground();
    }
    
});
