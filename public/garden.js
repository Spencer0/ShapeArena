(global => {

    let userNames = ['Luda', 'Nicki', 'Snoop', 'JayZ', 'A$AP', 'Kanye', 'Doja', '21Pilots', 'Nickleback', 'Sion', 'Olaf', 'Bard', 'Elise', 'Ashe'];
    let trimColors = ['red', 'white', 'orange', 'blue', 'yellow', 'navyblue', 'purple', 'pink'];
    let user = userNames[Math.floor(Math.random() * userNames.length)];
    let socket;
    let trimColor = trimColors[Math.floor(Math.random() * trimColors.length)];
    let shapeGame;
    let activityCounter = undefined;
    console.log(activityCounter);


        
    document.addEventListener('DOMContentLoaded', function(){
        

        let userInput = document.getElementById("chat-input");
        activityCounter = document.getElementById("active-number");

        //Set login to display itself 
        document.getElementById("media-pane").style.display = "none";

        //Wait for the dom to load before loading game
        randomTrimColor();

        
        document.getElementById("new-trim-button").addEventListener("click", function(e){
            e.preventDefault();
            randomTrimColor();
        });

        document.getElementById("chat-input-form").addEventListener("submit", function(e){
            e.preventDefault();
            socket.emit('message-event', JSON.stringify({"user": user, "value":userInput.value}));
            userInput.value = "";
        });
    
        document.getElementById("chat-input") .addEventListener("click", function(event) { 
            event.preventDefault() ;
        });
    
        document.getElementById("user-menu").innerText = user;
        document.getElementById("guest-btn").onclick = guestLogin;
        document.getElementById("login-btn").onclick = showLoginDiv;
        document.getElementById("create-btn").onclick = showRegistrationDiv;
        document.getElementById("login-submit-btn").onclick = standardLogin;
        document.getElementById("create-submit-btn").onclick = createAccount;
        document.getElementById("login-reset").onclick = showLoginOptions;

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

    });

    function pingCheck(){
        let ping = Date.now()
        socket.emit('latency', function () {
            latency = Date.now() - ping;
            document.getElementById("ping-display").innerText = "Ping: " + latency; 
        });
    }

    function scrollChatDiv(){
        var div = document.getElementById("chat-display");
        if(div) div.scrollTop = div.scrollHeight - div.clientHeight;
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
        this.canvas.height = 1200;
        this.canvas.width = 1600;
        this.backgroundCanvas.height = 1200;
        this.backgroundCanvas.width = 1600;
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

            console.log('rendering')
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            for(key of Object.keys(state.player)){
                let player = state.player[key]
                if(!player) {continue;}
                this.context.beginPath();
                this.context.fillStyle = player.color ? player.color : "red";
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
            
    function beginGame(){
        document.getElementById("media-pane").style.display = "block";
        document.getElementById("auth-div").style.display = "none";
        if(!shapeGame) shapeGame= new squareGame(user, socket);
    }
    
    function guestLogin(){
        fetch('/', { 
            method: 'post', 
            headers: new Headers({
            'Authorization': 'Basic '+btoa('guest:'), 
            'Content-Type': 'application/x-www-form-urlencoded'
            }), 
            body: 'A=1&B=2'
        }).then(response => response.json())
        .then(data => processLoginResponse(data));
    }

    function processLoginResponse(data){
        console.log(data)
        socket = io({ query: "user="+user });
                
        socket.on("connection-event", function(msg){
            console.log("Friends appearing! Active users: ", msg);
            if(activityCounter) activityCounter.innerText = msg;
        });

        socket.on("message-event", function(msg){
            newChatMessageEvent(JSON.parse(msg));
            scrollChatDiv();
        });

        socket.on('state', function (state) {
            if(!shapeGame) { return }
            shapeGame.drawState(state);
        });
        
        setInterval(pingCheck, 1000);
        beginGame();
    }
    
    function showLoginOptions(){
        document.getElementById("login-div").style.display = "none";
        document.getElementById("login-options").style.display = "block";
        document.getElementById("registration-div").style.display = "none";
        document.getElementById("login-reset").style.display = "none";
    }

    function showLoginDiv(){
        document.getElementById("login-div").style.display = "block";
        document.getElementById("login-options").style.display = "none";
        document.getElementById("registration-div").style.display = "none";
        document.getElementById("login-reset").style.display = "block";
    }

    function showRegistrationDiv(){
        document.getElementById("registration-div").style.display = "block";
        document.getElementById("login-div").style.display = "none";
        document.getElementById("login-options").style.display = "none";
        document.getElementById("login-reset").style.display = "block";
    }

    function standardLogin(){
        console.log(document.getElementById("shape-user").value, 
                    document.getElementById("shape-pass").value);
    
        let tryPass = document.getElementById("shape-pass").value;
        let tryUser = document.getElementById("shape-user").value;
        fetch('/', { 
            method: 'post', 
            headers: new Headers({
              'Authorization': 'Basic '+btoa(tryUser + ":" + tryPass), 
              'Content-Type': 'application/x-www-form-urlencoded'
            }), 
            body: 'A=1&B=2'
        }).then(response => response.json())
        .then(data => user = tryUser)
        .then( x => document.getElementById("user-menu").innerText = user)
        .then(data => processLoginResponse(data));
    }

    function createAccount(){
        let tryPass = document.getElementById("shape-create-pass").value;
        let tryUser = document.getElementById("shape-create-user").value;
        console.log(tryPass,tryUser)
        fetch('/users', { 
            method: 'post', 
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            username: tryUser,
            password: tryPass,
            body: JSON.stringify({username: tryUser,
                password: tryPass})
        }).then(response => console.log(response))
        .then(data =>finishCreateAccount(data))
        
        function finishCreateAccount(data){
            user = tryUser;
            document.getElementById("user-menu").innerText = user;
            document.getElementById("shape-user").value = tryUser;
            document.getElementById("shape-pass").value = tryPass;
            showLoginDiv();
        }
    }

    

})(window)
