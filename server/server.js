import mongoose from "mongoose"
import { Server } from "socket.io"
import Document from "./models/Document.js"
import dotenv from "dotenv"

dotenv.config()

const mongooseUri = process.env.MONGODB_URI || "mongodb://localhost:27017/google-docs-clone"

mongoose.connect(mongooseUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err))

const io = new Server(3001, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
})

console.log("Server running on 3001")

const defaultValue = ""

io.on("connection", socket => {
  socket.on("get-document", async documentId => {
    const document = await findOrCreateDocument(documentId)
    socket.join(documentId)
    socket.emit("load-document", document.data)

    socket.on("send-changes", delta => {
      socket.broadcast.to(documentId).emit("receive-changes", delta)
    })

    socket.on("save-document", async data => {
      await Document.findByIdAndUpdate(documentId, { data })
    })
  })
})

async function findOrCreateDocument(id) {
  if (id == null) return

  const document = await Document.findById(id)
  if (document) return document

  return await Document.create({ _id: id, data: defaultValue })
}