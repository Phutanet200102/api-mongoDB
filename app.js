import bcrypt from 'bcrypt';
import crypto from 'crypto';
import express from 'express';
import { ObjectId } from 'mongodb';
import multer from 'multer';
import path from 'path';
import { client } from './db.js';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const extension = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    }
});

const upload = multer({ storage: storage });

export const app = express();
app.use(express.json());

app.get('/user', async (req, res) => {
    try {
        const collection = client.db("User").collection("account");
        const users = await collection.find({}).toArray();
        res.status(200).json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving data");
    }
});

app.get('/user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const collection = client.db("User").collection("account");

        if (!ObjectId.isValid(id)) {
            return res.status(400).send("Invalid ID format");
        }

        const user = await collection.findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } });
        if (!user) {
            return res.status(404).send("User not found");
        }

        res.status(200).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving user data");
    }
});

app.post('/add_user', async (req, res) => {
    try {
        const { email, password, ...otherData } = req.body;
        const collection = client.db("User").collection("account");

        // Check if email already exists
        const existingUser = await collection.findOne({ email });
        if (existingUser) {
            return res.status(400).send("Email already exists");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = { email, password: hashedPassword, ...otherData };
        await collection.insertOne(newUser);

        res.status(200).send("Data added successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error adding data");
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const collection = client.db("User").collection("account");

        const user = await collection.findOne({ email });
        if (!user) {
            return res.status(401).send("Invalid email or password");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send("Invalid email or password");
        }

        res.status(200).json({ message: "Login successful", userId: user._id });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error logging in");
    }
});

app.put('/user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const collection = client.db("User").collection("account");

        if (!ObjectId.isValid(id)) {
            return res.status(400).send("Invalid ID format");
        }

        if (updates.password) {
            delete updates.password;
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send("User not found");
        }

        res.status(200).send("User updated successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating user data");
    }
});

app.post('/upload_image/:userId', upload.single('image'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, description } = req.body;
        const file = req.file;
        const collection = client.db("User").collection("images");

        let objectId;
        try {
            objectId = new ObjectId(userId);
        } catch (err) {
            return res.status(400).send("Invalid ID format");
        }

        if (!file) {
            return res.status(400).send("No file uploaded");
        }

        const imagePath = `uploads/${file.filename}`;
        const imageData = {
            user_id: objectId,
            name: name || 'Untitled',
            description: description || 'No description provided',
            image: imagePath,
            date: new Date(),
        };

        await collection.insertOne(imageData);

        res.status(200).json({ message: "Image uploaded successfully", imagePath });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error uploading image");
    }
});

app.use('/uploads', express.static('uploads'));