import http from 'http';
import { app } from './app.js';
import { connectDB } from './db.js';

const port = process.env.PORT || 3000;
const server = http.createServer(app);

connectDB().then(() => {
    server.listen(port, () => {
        console.log(`Server is started on port ${port}`);
    });
}).catch(err => {
    console.error("Failed to connect to MongoDB", err);
});
