#!/usr/bin/env node
/**
 * Simple WebSocket relay for Chrome Extension
 * Receives reports from OpenClaw cron and forwards to connected extensions
 */

const WebSocket = require('ws');
const http = require('http');

const PORT = 18795;
const clients = new Set();

// HTTP server for health check
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      clients: clients.size,
      port: PORT 
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

// WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  console.log('Client connected from:', req.socket.remoteAddress);
  
  // Determine client type from URL path or first message
  const isExtension = req.url === '/extension' || req.url === '/';
  
  const client = { 
    ws, 
    connectedAt: Date.now(), 
    isExtension,
    type: 'unknown' // Will be set by client
  };
  clients.add(client);
  
  // Send welcome
  ws.send(JSON.stringify({
    type: 'connected',
    timestamp: Date.now()
  }));
  
  // Handle incoming messages (from cron script or query requests)
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message type:', message.type, 'from client type:', client.type);
      
      // Client identifies itself
      if (message.type === 'identify') {
        client.type = message.clientType || 'unknown';
        console.log('Client identified as:', client.type);
        return;
      }
      
      // Handle ping (keepalive from extension)
      if (message.type === 'ping') {
        // Respond with pong to confirm connection is alive
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: Date.now()
        }));
        return;
      }
      
      // If it's a report, broadcast to all extension clients
      if (message.type === 'report') {
        console.log('Broadcasting report to', clients.size, 'client(s)');
        broadcastToExtensions(message);
      }
      
      // Handle history query requests (from cron)
      if (message.type === 'getHistory') {
        console.log('History query requested with requestId:', message.requestId);
        client.type = 'query'; // Mark this as a query client
        client.pendingRequestId = message.requestId;
        
        try {
          // Forward request to extension
          const sent = await forwardHistoryQueryToExtension(message.params || {}, message.requestId);
          if (!sent) {
            ws.send(JSON.stringify({
              type: 'error',
              error: 'No extension connected',
              timestamp: Date.now()
            }));
          }
        } catch (err) {
          ws.send(JSON.stringify({
            type: 'error',
            error: err.message,
            timestamp: Date.now()
          }));
        }
      }
      
      // Handle history response from extension
      if (message.type === 'historyResponse' && client.type === 'extension') {
        console.log('Received history response from extension, forwarding to query client...');
        // Forward to the query client waiting for this requestId
        for (const queryClient of clients) {
          if (queryClient.type === 'query' && queryClient.pendingRequestId === message.requestId) {
            queryClient.ws.send(JSON.stringify({
              type: 'historyResponse',
              data: message.data,
              error: message.error,
              timestamp: Date.now()
            }));
            break;
          }
        }
      }
    } catch (err) {
      console.error('Failed to parse message:', err);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(client);
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    clients.delete(client);
  });
});

// Forward history query to connected extension
async function forwardHistoryQueryToExtension(params = {}, requestId) {
  // Find the extension client
  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN && client.type === 'extension') {
      console.log('Forwarding history query to extension');
      client.ws.send(JSON.stringify({
        type: 'queryHistory',
        requestId,
        params: {
          text: params.text || '',
          startTime: params.startTime || (Date.now() - 24*60*60*1000),
          maxResults: params.maxResults || 1000
        }
      }));
      return true;
    }
  }
  return false;
}

function broadcastToExtensions(message) {
  const payload = JSON.stringify(message);
  let sent = 0;
  
  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(payload);
        sent++;
      } catch (err) {
        console.error('Send error:', err);
      }
    }
  }
  
  console.log(`Sent to ${sent} extension(s)`);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Extension relay server running on port ${PORT}`);
  console.log(`Listening for reports from cron`);
  console.log(`Broadcasting to Chrome extensions`);
  console.log(`Health: http://0.0.0.0:${PORT}/health`);
});

// Keep alive
setInterval(() => {
  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.ping();
    }
  }
}, 30000);
