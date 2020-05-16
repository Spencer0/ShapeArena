document.addEventListener('DOMContentLoaded', function(){
    const socket = io()
    const gridsize = {x: 25, y: 25}
    console.log("dom loaded")
    let userNames = ['Luda', 'Nicki', 'Snoop', 'JayZ', 'A$AP', 'Kanye', 'Doja', '21Pilots', 'Nickleback', 'Sion', 'Olaf', 'Bard', 'Elise', 'Ashe']
    let user = userNames[Math.floor(Math.random() * userNames.length)];
    let userInput = document.getElementById("chat-input")
    let activityCounter = document.getElementById("active-number")
    let userNameField = document.getElementById("user-menu").innerText = user;
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


    function garden(){

        //Initalize The Canvas
        this.canvas = document.getElementById("garden-canvas")
        this.ctx = canvas.context
        

        //Create data structure to hold values on cavas [[char]]
        this.cells = []

        for(let i = 0; i < gridsize.X; i++){
            for(let i = 0; i < gridsize.Y; i++){

            }
        }
    }
});
