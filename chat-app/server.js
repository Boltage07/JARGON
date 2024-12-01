const WebSocket = require('ws');

const clients = new Map(); // Map to store clients and their usernames

const server = new WebSocket.Server({ port: 8080 });

server.on('connection', ws => {
    console.log('New client connected');

    ws.on('message', message => {
        const parsedMessage = JSON.parse(message);
        const { type, data } = parsedMessage;

        if (type === 'set_username') {
            clients.set(ws, data.username);
        } else if (type === 'message') {
            data.timestamp = new Date().toLocaleTimeString();
            console.log(`Received: ${data.text} from ${data.username} at ${data.timestamp}`);
            // Broadcast the message to all clients
            server.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'message', data }));
                }
            });
        } else if (type === 'private_message') {
            data.timestamp = new Date().toLocaleTimeString();
            console.log(`Private message from ${data.username} to ${data.to}: ${data.text} at ${data.timestamp}`);
            // Send the private message to the specified user
            for (const [client, username] of clients) {
                if (username === data.to && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'private_message', data }));
                }
            }
        } else if (type === 'typing') {
            // Broadcast typing notification to all clients except the sender
            server.clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'typing', data }));
                }
            });
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected');
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
