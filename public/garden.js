document.addEventListener('DOMContentLoaded', function(){
    const socket = io()
    const gridsize = {x: 25, y: 25}
    let userNames = ['Luda', 'Nicki', 'Snoop', 'JayZ', 'A$AP', 'Kanye', 'Doja', '21Pilots', 'Nickleback', 'Sion', 'Olaf', 'Bard', 'Elise', 'Ashe']
    let colors = ['red', 'black', 'white', 'orange', 'blue', 'yellow', 'aqua', 'navyblue', 'purple', 'pink']
    let user = userNames[Math.floor(Math.random() * userNames.length)];
    let color = colors[Math.floor(Math.random() * colors.length)];
    let userInput = document.getElementById("chat-input")
    let activityCounter = document.getElementById("active-number")
    let userNameField = document.getElementById("user-menu").innerText = user;
    let shapeGame = new squareGame(user, color, socket)
    let ping = Date.now()

    socket.on("connection-event", function(msg){
        console.log("Friends appearing! Active users: ", msg)
        activityCounter.innerText = msg;
    })

    socket.on("message-event", function(msg){
        newChatMessageEvent(JSON.parse(msg));
    })

    socket.on('state', function (state) {
        shapeGame.drawState(state)
    })


    socket.emit('latency', function () {
        latency = Date.now() - ping;
        console.log(latency);
        document.getElementById("ping-display").innerText = "Ping: " + latency; 
    });

    document.getElementById("chat-input-form").addEventListener("submit", function(e){
        e.preventDefault()
        socket.emit('message-event', JSON.stringify({"user": user, "value":userInput.value}))
        userInput.value = ""
    })

    document.getElementById("chat-input") .addEventListener("click", function(event) { 
        event.preventDefault() 
    });

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

    function squareGame(user, color, socket){
        this.canvas  = document.getElementById('shape-arena-canvas');
        this.canvas.height = window.innerHeight;
        this.canvas.width = window.innerWidth;
        this.context = this.canvas.getContext('2d');
        this.currentlyDown = {}
        this.context.strokeStyle = color;
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
            self.currentlyDown[e.key] = 1;
            self.newKeyInput = true;
        })

        this.canvas.addEventListener("keyup", function(e){
            console.log(self.currentlyDown)
            delete self.currentlyDown[e.key]
            console.log(self.currentlyDown)
            if(Object.keys(self.currentlyDown).length === 0){
                console.log("stopping inputs")
                self.newKeyInput = false;
            }
        })

        this.submitInput = function(){
            if(this.currentlyDown === {}){return;}
            this.socket.emit('user-input', this.currentlyDown)
            this.input = {
                mouse: false,
            }
        }

        this.drawState = function(state){
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            for(key of Object.keys(state.player)){
                let player = state.player[key]
                this.context.beginPath();
                this.context.rect(player.x,player.y,player.width,player.height);
                this.context.stroke();
            }
            if(this.newMouseInput){
                this.submitInput();
                this.newMouseInput = false;
            }
            if(this.newKeyInput){
                this.submitInput();
            }
        }
    }
    
    
});
