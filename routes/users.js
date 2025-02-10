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


userRouter.post('/login', async (req, res) => {
    try {
        const { senha, email } = req.body;

        // Buscar o usuário no banco de dados
        const finduser = await prisma.user.findUnique({
            where: {
                email: email // Use diretamente o email que foi enviado no body
            }
        });

        // Verificar se o usuário foi encontrado
        if (!finduser) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }

        // Verificar se a senha está correta
        const passwordMatch = await bcrypt.compare(senha, finduser.password); // Usando finduser ao invés de user

        if (!passwordMatch) {
            return res.status(401).json({ error: "Credenciais inválidas" });
        }

        // Gerar o token JWT
        const token = jwt.sign({ userId: finduser.id }, SECRET_KEY, { expiresIn: "1h" });

        // Responder com o token
        return res.status(200).json({
            message: "Usuário logado com sucesso",
            user: { id: finduser.id, email: finduser.email }, // Retornar informações relevantes do usuário
            token: token
        });

    } catch (err) {
        console.log("Erro ao logar com o usuário:", err);
        return res.status(500).json({ message: "Erro interno ao tentar logar", error: err.message });
    }
});



export default userRouter