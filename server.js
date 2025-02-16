import Express from 'express';
import { PrismaClient } from "@prisma/client"
import userRouter from './routes/users.js';
import admRouter from './routes/admin.js';
import cors from 'cors';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const prisma = new PrismaClient;
const app = Express();
import dotenv from 'dotenv';
dotenv.config();

app.use(userRouter)
app.use(admRouter)
import authenticateToken from './routes/auth.js';
app.use(Express.json())
app.use(cors());



app.get('/', (req,res) => {
    res.send("Servidor rodando!")
})

const PORTA = 3006
app.listen(PORTA,() =>{
    console.log("Servidor vivo na porta: "+PORTA)
})