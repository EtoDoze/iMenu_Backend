import Express, { Router } from 'express';
import { PrismaClient } from "@prisma/client"
import cors from "cors";

const userRouter = Router()
userRouter.use(Express.json())
const prisma = new PrismaClient()
userRouter.use(cors())

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const SECRET_KEY = "imenu123"; // Melhor armazenar em .env

userRouter.post('/create', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Verificar se todos os campos necessários foram enviados
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Todos os campos são obrigatórios!" });
        }

        // Criar a senha hash
        const hashedPassword = await bcrypt.hash(password, 10);

        // Criar usuário no banco
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword },
        });

        res.status(201).json({ message: "Usuário criado com sucesso", user });
    } catch (err) {
        // Logar o erro completo para depuração
        console.error("Erro ao criar usuário:", err);

        // Responder com um erro genérico e a mensagem do erro
        res.status(500).json({ message: "Erro ao criar usuário", error: err.message });
    }
});


userRouter.post('/login', async (req,res) => {
try{
    const {senha, email} = req.body
        const finduser = await prisma.user.findUnique({
            where: {
                email: req.body.email
            }
        })
        if(!finduser){
            res.status(404).json({message: "Usuario não encontrado"})
            return;
        }    
        if(finduser == null){
            res.status(404).json({message: "Usuario não encontrado"})
            return;

        }

        const passwordMatch = await bcrypt.compare(senha, user.password);

        if (!passwordMatch) return res.status(401).json({ error: "Credenciais inválidas" });

    // Gerar token JWT
    res.status(200).json({message: "Usuario encontrado", user: finduser})
    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: "1h" });

    res.json({ token });

    }
    catch{console.log("deu erro"); return res.status(500).json({message: "usuario não achado"})}
})


export default userRouter