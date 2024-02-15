import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import { Server } from "socket.io";
import http from "http";
/* CONFIGURATIONS */

dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(cors());

// schema
const messageSchema = new mongoose.Schema({
  id: Number,
  content: String,
  username: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

//socket
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("New client connected");

  // Emit all messages when a client connects
  Message.find()
    .sort({ createdAt: 1 })
    .then((messages) => {
      console.log("message :##(#(#(#(", messages);
      socket.emit("allChats", messages);
    })
    .catch((err) => {
      return console.error(err);
    });

  // Listen for new messages from clients
  socket.on("newMessage", async (messageData) => {
    const message = new Message(messageData);
    try {
      const res = await message.save();
      io.emit("newMessage", message);
    } catch (err) {
      return console.error(err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

/* ROUTES */
app.get("/", (req, res) => {
  res.send("Hello World!");
});

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 6001;
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    server.listen("3001", () => {
      console.log("server started at 3001");
    });
  })
  .catch((error) => console.log(`${error} did not connect`));
