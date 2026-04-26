const WebSocket = require('ws');
const http = require('http');
const url = require('url');

// Create HTTP server for WebSocket upgrade
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Map();

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  const pathname = url.parse(req.url).pathname;
  
  // Handle P2P signaling connections
  if (pathname === '/p2p-signaling') {
    let clientId = null;
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        const { type, from, to, payload } = message;
        
        // Store client ID when first message is received
        if (!clientId && from) {
          clientId = from;
          clients.set(clientId, {
            ws,
            buildingId: payload?.buildingId || 'default',
            lastSeen: Date.now()
          });
          
          console.log(`Client connected: ${clientId} in building: ${payload?.buildingId || 'default'}`);
          
          // Notify other clients in the same building about new peer
          broadcastToBuilding(clientId, {
            type: 'peer-joined',
            from: clientId,
            payload: { buildingId: payload?.buildingId || 'default' }
          }, clientId);
        }
        
        // Route message to target client
        if (to && clients.has(to)) {
          const targetClient = clients.get(to);
          if (targetClient.ws.readyState === WebSocket.OPEN) {
            targetClient.ws.send(data);
          }
        }
        
        // Handle discovery broadcasts
        if (type === 'discovery') {
          const buildingId = payload?.buildingId || 'default';
          
          // Send discovery to all clients in the same building (except sender)
          clients.forEach((client, id) => {
            if (id !== clientId && 
                client.buildingId === buildingId && 
                client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(data);
            }
          });
        }
        
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });
    
    ws.on('close', () => {
      if (clientId) {
        const client = clients.get(clientId);
        const buildingId = client?.buildingId || 'default';
        
        // Notify other clients in the same building about peer leaving
        broadcastToBuilding(clientId, {
          type: 'peer-left',
          from: clientId,
          payload: { buildingId }
        }, clientId);
        
        clients.delete(clientId);
        console.log(`Client disconnected: ${clientId}`);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }
});

// Broadcast message to all clients in a building
function broadcastToBuilding(senderId, message, excludeId = null) {
  const buildingId = message.payload?.buildingId || 'default';
  
  clients.forEach((client, clientId) => {
    if (clientId !== excludeId && 
        client.buildingId === buildingId && 
        client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

// Clean up inactive clients every 30 seconds
setInterval(() => {
  const now = Date.now();
  clients.forEach((client, clientId) => {
    if (now - client.lastSeen > 60000) { // 1 minute timeout
      client.ws.terminate();
      clients.delete(clientId);
      console.log(`Client timeout: ${clientId}`);
    }
  });
}, 30000);

const PORT = process.env.P2P_SIGNALING_PORT || 5001;
server.listen(PORT, () => {
  console.log(`P2P signaling server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/p2p-signaling`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('P2P signaling server shut down');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('P2P signaling server shut down');
    process.exit(0);
  });
});
