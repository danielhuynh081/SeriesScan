import express from 'express';
import http from 'http';
import {matchRouter} from "./routes/matches.js";
import {commentaryRouter} from "./routes/commentary.js";
import {attachWebSocketServer} from "./ws/server.js";
import {securityMiddleware} from "./arcjet.js";

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app)

// Use JSON middleware
app.use(express.json());

// Root GET route
app.get('/', (req, res) => {
    res.json({ message: 'Hello from SeriesScanner server!' });
});

//Activcate middleare
app.use(securityMiddleware());

//Match router
app.use('/matches', matchRouter);
app.use('/matches/:id/commentary', commentaryRouter);

const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

// Start server
server.listen(PORT, HOST, () => {
    const baseurl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
    console.log(`server is running on ${baseurl}`);
    console.log(`Web socker server is running on ${baseurl.replace('http', 'ws')}/ws`);
});
