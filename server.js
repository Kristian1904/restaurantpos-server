const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const server = new WebSocket.Server({ port: PORT });

let orderCounter = 0;
let connectedClients = { order: 0, kitchen: 0 };

console.log('═══════════════════════════════════════════');
console.log('   🍔 RestaurantPOS Server (CLOUD)');
console.log('═══════════════════════════════════════════');
console.log('   Port: ' + PORT);
console.log('   Status: RUNNING');
console.log('═══════════════════════════════════════════');

server.on('connection', (socket, req) => {
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
    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

console.log('🌐 Server gata pentru conexiuni!');
```

Click **"Commit changes"**

---

## Pasul 3: Conectează la Render

Acum în **Render.com**:

1. Click pe **"Deploy a Web Service"** (sau **+ New** → **Web Service**)

2. **Connect a repository:**
   - Click **"Connect GitHub"**
   - Autorizează Render să vadă repo-urile tale
   - Selectează **restaurantpos-server**

3. **Configurează:**
```
   Name: restaurantpos-server
   Region: Frankfurt (EU Central)
   Branch: main
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
```

4. Click **"Create Web Service"**

5. **Așteaptă 2-3 minute...**

---

## Pasul 4: Obține URL-ul

După deploy, vei primi un URL:
```
https://restaurantpos-server.onrender.com
```

**Pentru WebSocket:**
```
wss://restaurantpos-server.onrender.com
