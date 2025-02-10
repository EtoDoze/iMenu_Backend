import Express from 'express';
import { PrismaClient } from "@prisma/client"
import userRouter from './routes/users.js';
import admRouter from './routes/admin.js';
import cors from 'cors';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const SECRET_KEY = "imenu123"; // Melhor armazenar em .env
const prisma = new PrismaClient;
const app = Express();

app.use(userRouter)
app.use(admRouter)
app.use(Express.json())
app.use(cors());



app.get('/', (req,res) => {
    res.send("Servidor rodando!")
})

const PORTA = 3005
app.listen(PORTA,() =>{
    console.log("Servidor vivo na porta: "+PORTA)
})