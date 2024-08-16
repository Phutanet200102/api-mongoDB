import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://ll270861:270861ll@cluster0.id5yi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function connectDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error(err);
    }
}

export { client, connectDB };
