document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const typingIndicator = document.getElementById('typing-indicator');
    const username = prompt('Enter your username');
    
    const socket = new WebSocket('ws://localhost:8080');
    
    socket.addEventListener('open', () => {
        console.log('Connected to WebSocket server');
        socket.send(JSON.stringify({ type: 'set_username', data: { username } }));
    });
    
    socket.addEventListener('message', event => {
        const parsedMessage = JSON.parse(event.data);
        if (parsedMessage.type === 'message' || parsedMessage.type === 'private_message') {
            addMessage(parsedMessage.data.text, parsedMessage.data.username, parsedMessage.data.timestamp, parsedMessage.type === 'private_message');
        } else if (parsedMessage.type === 'typing') {
            showTypingIndicator(parsedMessage.data.username);
        }
    });

    const addMessage = (message, fromUsername, timestamp, isPrivate = false) => {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        if (fromUsername === username) {
            messageElement.classList.add('sent');
        } else {
            messageElement.classList.add('received');
        }
        if (isPrivate) {
            messageElement.classList.add('private');
        }
        messageElement.innerHTML = `<strong>${fromUsername}</strong>: ${message} <small>${timestamp}</small>`;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;  // Auto-scroll to the bottom
        typingIndicator.style.display = 'none'; // Hide typing indicator when a message is received
    };

    const handleSend = () => {
        const message = chatInput.value.trim();
        if (message) {
            const isPrivate = message.startsWith('@');
            let messageData;
            if (isPrivate) {
                const [to, ...text] = message.split(' ');
                messageData = { text: text.join(' '), username, to: to.substring(1) };
                socket.send(JSON.stringify({ type: 'private_message', data: messageData }));  // Send the private message to the WebSocket server
            } else {
                messageData = { text: message, username };
                socket.send(JSON.stringify({ type: 'message', data: messageData }));  // Send the message to the WebSocket server
            }
            chatInput.value = '';
        }
    };

    const showTypingIndicator = (fromUsername) => {
        typingIndicator.innerHTML = `${fromUsername} is typing...`;
        typingIndicator.style.display = 'block';
        clearTimeout(typingIndicator.timeout);
        typingIndicator.timeout = setTimeout(() => {
            typingIndicator.style.display = 'none';
        }, 1000);
    };

    sendButton.addEventListener('click', handleSend);

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        } else {
            socket.send(JSON.stringify({ type: 'typing', data: { username } }));
        }
    });
});
