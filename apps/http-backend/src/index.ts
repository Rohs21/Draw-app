import express from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@repo/backend-common/config';
import { middleware } from './middleware';
import { CreateUserSchema} from "@repo/common/types";
import { prismaClient } from "@repo/db/client"


const app = express();

const port = 3003;

app.post("/signup", async(req, res)=>{

    const ParsedData = CreateUserSchema.safeParse(req.body);
    console.log(ParsedData);
    if(!ParsedData.success){
        return res.status(400).json({
            message: "Incorrect inputs",
        })
        return;
    }
    try{
        await prismaClient.user.create({
            data: {
                email : ParsedData.data?.username,
                password : ParsedData.data?.password,
                name: ParsedData.data.name
            }
        })
        res.json({
            userId: "123",
        })
    }catch{
        res.status(500).json({
            message: "Something went wrong"
        })
    }
    
})

app.post("/signin",(req, res)=>{

        const userId=1;
        const token = jwt.sign({
            userId
        }, JWT_SECRET);

        res.json({
            token
        })
})

app.post("/room", middleware, (req, res)=>{
    res.json({
        roomId: 123
    })
})
app.listen(port);
