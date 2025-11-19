import express from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@repo/backend-common/config';
import { middleware } from './middleware.js';
import { CreateUserSchema, CreatRoomSchema, SigninSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client"

const app = express();
const port = 3003;

app.use(express.json());

app.post("/signup", async(req, res)=>{

    const ParsedData = CreateUserSchema.safeParse(req.body);
    console.log(ParsedData);
    if(!ParsedData.success){
        return res.status(400).json({
            message: "Incorrect inputs",
        })
    }
    try{
        const user =  await prismaClient.user.create({
            data: {
                email : ParsedData.data?.username,
                password : ParsedData.data?.password,
                name: ParsedData.data.name
            }
        })
        res.json({
            userId: user.id
        })
} catch (e) {
    res.status(411).json({
        message: "User already exists"
    })    
}


    
})

app.post("/signin", async(req, res)=>{
    const parsedData = SigninSchema.safeParse(req.body);
    if(!parsedData.success){
        res.json({
            message: "Incorrect inputs"
        })
        return
    }
    const user = await prismaClient.user.findUnique({
        where: {
            email: parsedData.data.username,
            password : parsedData.data.password
        }
    })

    if(!user){
        res.status(403).json({
            message: "Not Authorised"
        })
        return;
    }

    const token = jwt.sign({
        userId : user?.id
    }, JWT_SECRET);

    res.json({
        token
   })        

})

app.post("/room", middleware, async(req, res)=>{
    const parsedData = CreatRoomSchema.safeParse(req.body);
    if(!parsedData.success){
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    try{
        const userId = req.userId;
        const room = await prismaClient.room.create({
        data: {
            slug : parsedData.data.name,
            adminId: userId
        }
    })
    res.json({
        roomId : room.id
    })
    }catch{
        res.status(411).json({
            message: "Room already exists"
        })
    }
})
app.listen(port);
