import WebSocket,  {WebSocketServer} from 'ws';

/**
 * Send a JSON-encoded payload to a WebSocket if the socket is open.
 * @param {WebSocket} socket - The WebSocket connection to send the payload to.
 * @param {*} payload - The value to JSON.stringify and transmit.
 */
function sendJson(socket, payload){
    if(socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

/**
 * Broadcasts a payload (serialized as JSON) to connected clients until a non-open client is encountered.
 *
 * Sends JSON.stringify(payload) to each client in wss.clients in iteration order; iteration stops immediately if a client with a readyState other than WebSocket.OPEN is encountered.
 *
 * @param {import('ws').WebSocketServer} wss - WebSocket server whose clients will receive the payload.
 * @param {*} payload - Value to serialize with JSON.stringify and send to clients.
 */
function broadcast(wss, payload){
    for (const client of wss.clients){
        if(client.readyState !== WebSocket.OPEN) return;

        client.send(JSON.stringify(payload));
    }
}

/**
 * Attach a WebSocket server at the "/ws" path to an existing HTTP server and expose a broadcaster for match-created events.
 *
 * The attached WebSocket server enforces a 1 MB max payload, sends a welcome message to each new connection, and logs socket errors.
 *
 * @param {import('http').Server} server - An existing Node HTTP(S) server to attach the WebSocket server to.
 * @returns {{ broadcastMatchCreated: (match: any) => void }} An object with a `broadcastMatchCreated` function that broadcasts a `match_created` message containing the provided match data to all connected clients.
 */
export function attachWebSocketServer(server){
    const wss = new WebSocketServer({server, path: '/ws', maxPayload: 1024 * 1024});

    server.on('connection', (socket) => {
        sendJson(socket, { type: 'welcome' });

        socket.on('error', console.error)

    })

    function broadcastMatchCreated(match){
        broadcast(wss, {type: 'match_created', data: match});
    }

    return { broadcastMatchCreated }
}