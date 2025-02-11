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


authRouter.post('/login', async (req, res) => {

    const email = req.body.email;
    const password = req.body.password;
  
    const user = await prisma.user.findUnique({
      where: {
        email
      }
    })
  
    if (!user) {
      console.log('email não cadastrado: ', email)
      res.status(400).send('User or password invalid')
    }
  
  
    const passwordIsValid = bcrypt.compareSync(password, user.password)
  
    if (passwordIsValid) {
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' })
      delete user.password
      res.send({
        user,
        token
      })
    } else {
      res.status(400).send('User or password invalid')
    }
  
  })




export default userRouter