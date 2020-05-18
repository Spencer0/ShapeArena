document.addEventListener('DOMContentLoaded', function(){
    const socket = io()
    const gridsize = {x: 25, y: 25}
    console.log("dom loaded")
    let userNames = ['Luda', 'Nicki', 'Snoop', 'JayZ', 'A$AP', 'Kanye', 'Doja', '21Pilots', 'Nickleback', 'Sion', 'Olaf', 'Bard', 'Elise', 'Ashe']
    let colors = ['red', 'black', 'white', 'orange', 'blue', 'yellow', 'aqua', 'navyblue', 'purple', 'pink']
    let user = userNames[Math.floor(Math.random() * userNames.length)];
    let color = colors[Math.floor(Math.random() * colors.length)];
    let userInput = document.getElementById("chat-input")
    let activityCounter = document.getElementById("active-number")
    let userNameField = document.getElementById("user-menu").innerText = user;
    let shapeGame = new squareGame(user, color)
    document.getElementById("chat-input") .addEventListener("click", function(event) { 
        event.preventDefault() 
    });

    socket.on("connection-event", function(msg){
        console.log("Friends appearing! Active users: ", msg)
        activityCounter.innerText = msg;
    })

    socket.on("message-event", function(msg){
        newChatMessageEvent(JSON.parse(msg));
    })

    socket.on('user-input', function (data) {
        shapeGame.updatePlayer(data)
    })

    document.getElementById("chat-input-form").addEventListener("submit", function(e){
        e.preventDefault()
        socket.emit('message-event', JSON.stringify({"user": user, "value":userInput.value}))
        userInput.value = ""
    })

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

    function squareGame(user, color){
        this.canvas  = document.getElementById('shape-arena-canvas');
        this.canvas.height = window.innerHeight;
        this.canvas.width = window.innerWidth;
        this.context = this.canvas.getContext('2d');
        this.context.strokeStyle = color
        var self = this;

        this.player = {
            user: user,
            click: false,
            move: false,
            pos: {x:0, y:0},
            color: "black",
            direction: "",
            previousPos: {},

        }

        this.canvas.onmouseup = function(e){ 
            self.player.click = true;
        };

        this.canvas.addEventListener("keydown", function(e){
            self.player.move = true;
            self.player.direction = e.key;
        })

        this.updatePlayer = function(data){
            if(data.player.user == user){
                this.player.pos = data.player.pos;
            }
            this.context.clearRect(data.player.previousPos.x-10, data.player.previousPos.y-10, 180, 130)
            this.context.beginPath();
            this.context.rect(data.player.pos.x, data.player.pos.y, 150, 100);
            this.context.stroke();
        }

        const mainLoop = () => {
            if (this.player.click || this.player.move) {
                // send input and name to to the server
                this.player.previousPos = this.player.pos;
                this.player.move = false;
                this.player.click = false;
                socket.emit('user-input', { player: this.player } );
                this.player.direction = ""
            }
            setTimeout(mainLoop, 25);
        }
        this.context.beginPath();
        this.context.rect(this.player.pos.x, this.player.pos.y, 150, 100);
        this.context.stroke();
        mainLoop();
    }
    
    
});
