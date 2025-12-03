import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import express from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
import { middleware } from "./middleware";
import { CreateUserSchema, SigninSchema, CreatRoomSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors())

app.post("/signup", async (req, res) => {

    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
        console.log(parsedData.error);
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    try {
        const user = await prismaClient.user.create({
            data: {
                email: parsedData.data?.username,
                password: parsedData.data.password,
                name: parsedData.data.name
            }
        })
        res.json({
            userId: user.id
        })
    } catch(e) {
        res.status(411).json({
            message: "User already exists with this username"
        })
    }
})

app.post("/signin", async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }

    // TODO: Compare the hashed pws here
    const user = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.username,
            password: parsedData.data.password
        }
    })

    if (!user) {
        res.status(403).json({
            message: "Not authorized"
        })
        return;
    }

    const token = jwt.sign({
        userId: user?.id
    }, JWT_SECRET);

    res.json({
        token
    })
})

app.post("/room", middleware, async (req, res) => {

    const parsedData = CreatRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }

    const userId = req.userId;

    try {
        const room = await prismaClient.room.create({
            data: {
                slug: parsedData.data.name,
                adminId: userId
            }
        })

        res.json({
            roomId: room.id
        })
    } catch(e) {
        res.status(411).json({
            message: "Room already exists with this name"
        })
    }
})

app.get("/chats/:roomId", async (req, res) => {
    try {
        const roomId = Number(req.params.roomId);
        console.log(req.params.roomId);
        const messages = await prismaClient.chat.findMany({
            where: {
                roomId: roomId
            },
            orderBy: {
                id: "desc"
            },
            take: 1000
        });

        res.json({
            messages
        })
    } catch(e) {
        console.log(e);
        res.json({
            messages: []
        })
    }
    
})


app.get('/rooms', middleware, async (req, res) => {
    console.log("Getting room");
    const userId = req.userId;

    try {
        const rooms = await prismaClient.room.findMany({
            where: {
            adminId: userId
        }
    });

    res.json({ rooms });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Something went wrong" });
  }
});


app.get("/room/:slug", async (req, res) => {
    const slug = req.params.slug;
    const room = await prismaClient.room.findFirst({
        where: {
            slug
        }
    });

    res.json({
        room
    })
})


app.delete("/room/:id", middleware, async (req, res) => {
  // Rename for clarity: The URL parameter is the slug now
  const roomSlug = req.params.id; 
  const userId = req.userId;

  try {
    // 1. Find the room using the SLUG
    const room = await prismaClient.room.findUnique({
      where: { slug: roomSlug }, // <-- **Key Change: Find by slug**
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // 2. Authorization check (remains the same)
    if (room.adminId !== userId) {
      return res.status(403).json({ message: "You are not allowed to delete this room" });
    }

    // 3. Delete the room using the SLUG
    await prismaClient.room.delete({
      where: { slug: roomSlug }, // <-- **Key Change: Delete by slug**
    });

    res.status(200).json({ message: "Room deleted successfully", slug: roomSlug });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete room" });
  }
});


app.listen(4000);