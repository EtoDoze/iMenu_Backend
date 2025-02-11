import Express, { Router } from 'express';
import { PrismaClient } from "@prisma/client"
import cors from "cors";

const userRouter = Router()
userRouter.use(Express.json())
const prisma = new PrismaClient()
userRouter.use(cors())

import bcrypt from 'bcryptjs';

const testPassword = 'minhaSenha';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

bcrypt.hash(testPassword, 10, function(err, hash) {
  if (err) console.error(err);
  console.log(hash); // Verifique se o hash está sendo gerado corretamente
});



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

    try{
        const {email, password} = req.body;

                // Verificar se todos os campos necessários foram enviados
                if (!email || !password) {
                    return res.status(400).json({ message: "Todos os campos são obrigatórios!" });
                }
        
        const finduser = await prisma.user.findUnique({
            data:{
                email: email
            }
        })
            if(!finduser){
                return res.status(401).json({message: "usuario nn encontrado"})
            }
            
            const isPasswordValid = await bcrypt.compare(password, finduser.password);

            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Credenciais inválidas' });
              }
              const token = jwt.sign({ userId: user.id, email: user.email }, SECRET_KEY, {
                expiresIn: '1h',
              });
          

        res.status(201).json({ message: "Usuário achado com sucesso", finduser });
        res.status(200).json({
            message: 'Login realizado com sucesso!',
            token,
          });
    }
    catch(err){
        res.status(401).json({message: "erro ao logar", err})
    }
})
export default userRouter