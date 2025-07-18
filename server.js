import Express from 'express';
import { PrismaClient } from "@prisma/client"
import userRouter from './routes/users.js';
import admRouter from './routes/admin.js';
import emailrouter from './routes/VerEmail.js';
import postRoot from './routes/post.js';
import avaRoot from './routes/avaliacoes.js';
import commentRouter from './routes/commentsRouter.js';
import cors from 'cors';
import authenticateToken from './routes/auth.js';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const prisma = new PrismaClient;
const app = Express();
import dotenv from 'dotenv';
dotenv.config();

app.use(userRouter)
app.use(commentRouter)
app.use(admRouter)
app.use(emailrouter)
app.use(postRoot)
app.use(avaRoot)
app.use(Express.json())
// No arquivo do backend de arquivos
app.use(cors({
  origin: [
    'http://127.0.0.1:5503',
    'https://ifpi-picos.github.io',
    'https://www.imenucorp.shop',
    'https://imenucorp.shop'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// No seu servidor (server.js), adicione uma nova rota:
app.get('/api/geocode', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter localização' });
  }
});

import { exec } from 'child_process';


// Executa as migrações no início do servidor
import { execSync } from "child_process";
if (process.env.NODE_ENV !== "production") {
    execSync("npx prisma migrate dev", { stdio: "inherit" });
}



try {
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    console.log("Migrações aplicadas com sucesso.");
} catch (error) {
    console.error("Erro ao aplicar migrações:", error);
}

app.get('/', (req,res) => {
    res.send("Servidor rodando!")
})

const PORTA = 3006
app.listen(PORTA,() =>{
    console.log("Servidor vivo na porta: "+PORTA)
})