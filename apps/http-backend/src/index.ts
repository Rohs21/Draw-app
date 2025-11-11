import express from 'express';
import jwt from 'jsonwebtoken';
import {JWT_SECRET} from './config';
import { middleware } from './middleware';

const app = express();

const port = 3003;

app.post("/signup",(req, res)=>{
    res.json({
        userId: "123"
    })
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
