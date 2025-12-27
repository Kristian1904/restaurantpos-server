const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;

// Creează server HTTP (necesar pentru Render)
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('RestaurantPOS Server is running!');
});

// Atașează WebSocket la serverul HTTP
const wss = new WebSocket.Server({ server });

let orderCounter = 0;
let connectedClients = { order: 0, kitchen: 0 };

console.log('═══════════════════════════════════════════');
console.log('   🍔 RestaurantPOS Server (CLOUD)');
console.log('═══════════════════════════════════════════');
console.log('   Port: ' + PORT);
console.log('   Status: STARTING...');
console.log('═══════════════════════════════════════════');

wss.on('connection', (socket, req) => {
    console.log('✅ Client conectat!');

    socket.send(JSON.stringify({
        type: 'welcome',
        message: 'Conectat la RestaurantPOS Server!',
        orderCounter: orderCounter
    }));

    socket.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            console.log('📨 Mesaj: ' + message.type);

            switch (message.type) {
                case 'register':
                    socket.clientType = message.clientType;
                    connectedClients[message.clientType]++;
                    console.log('   → ' + message.clientType.toUpperCase() + ' înregistrat');
                    broadcast({
                        type: 'status_update',
                        connectedClients: connectedClients
                    });
                    break;

                case 'new_order':
                    orderCounter++;
                    message.orderNumber = orderCounter;
                    message.time = new Date().toLocaleTimeString('ro-RO', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                    console.log('   → 🆕 COMANDA #' + orderCounter);
                    broadcast(message);
                    break;

                case 'order_complete':
                    console.log('   → ✅ Comanda #' + message.orderNumber + ' FINALIZATĂ');
                    broadcast(message);
                    break;

                default:
                    broadcast(message);
            }
        } catch (error) {
            console.log('❌ Eroare: ' + error.message);
        }
    });

    socket.on('close', () => {
        console.log('❌ Client deconectat');
        if (socket.clientType) {
            connectedClients[socket.clientType]--;
            broadcast({
                type: 'status_update',
                connectedClients: connectedClients
            });
        }
    });
});

function broadcast(message) {
    const data = JSON.stringify(message);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

// Pornește serverul HTTP
server.listen(PORT, () => {
    console.log('═══════════════════════════════════════════');
    console.log('   ✅ Server LIVE pe portul ' + PORT);
    console.log('   🌐 Gata pentru conexiuni!');
    console.log('═══════════════════════════════════════════');
});
