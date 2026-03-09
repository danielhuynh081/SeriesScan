import express from 'express';
import http from 'http';
import {matchRouter} from '../src/route';

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

// Start server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
