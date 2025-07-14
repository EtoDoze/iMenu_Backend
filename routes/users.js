import Express, { Router } from 'express';
import { PrismaClient } from "@prisma/client"
import cors from "cors";

const userRouter = Router()
userRouter.use(Express.json())
const prisma = new PrismaClient()
userRouter.use(cors())

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import authenticateToken from './auth.js';  // ES Module
import sendVerificationEmail from "../API/email.js"

const testPassword = 'minhaSenha';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;
userRouter.use(cors());  // CommonJS




bcrypt.hash(testPassword, 10, function(err, hash) {
  if (err) console.error(err);
  console.log(hash); // Verifique se o hash está sendo gerado corretamente
});



userRouter.post('/create', async (req, res) => {
    try {
        const { name, email, password, dono} = req.body;

        // Verificar se todos os campos necessários foram enviados
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Todos os campos são obrigatórios!" });
        }

        // Criar a senha hash
        const hashedPassword = await bcrypt.hash(password, 10);
        const Etoken = crypto.randomBytes(32).toString("hex");
        // Criar usuário no banco
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword , dono, EToken: Etoken},
        });

        res.status(201).json({ message: "Usuário criado com sucesso", user });
        sendVerificationEmail(user.email, Etoken)
        //email ver
    } catch (err) {
        // Logar o erro completo para depuração
        console.error("Erro ao criar usuário:", err);

        // Responder com um erro genérico e a mensagem do erro
        res.status(500).json({ message: "Erro ao criar usuário", error: err.message });
    }
});

// Obter dados de um usuário específico
userRouter.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'ID de usuário inválido' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                dono: true,
                EmailVer: true
                // Removido o campo location que não existe
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Verificar se o email está verificado
        if (!user.EmailVer) {
            return res.status(403).json({ error: 'Email não verificado' });
        }

        res.status(200).json(user);
    } catch (err) {
        console.error('Erro ao buscar usuário:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Obter posts públicos de um usuário
userRouter.get('/user/:userId/posts', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'ID de usuário inválido' });
        }

        const posts = await prisma.card.findMany({
            where: { 
                authorId: userId,
                public: true
            },
            orderBy: {
                creatAt: 'desc'
            }
        });

        res.status(200).json(posts);
    } catch (err) {
        console.error('Erro ao buscar posts:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Obter posts privados de um usuário (somente para o próprio usuário)
userRouter.get('/user/:userId/posts/private', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const requestingUserId = req.user.id;

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'ID de usuário inválido' });
        }

        // Verificar se o usuário está tentando acessar seus próprios posts
        if (userId !== requestingUserId) {
            return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        const posts = await prisma.card.findMany({
            where: { 
                authorId: userId,
                public: false
            },
            orderBy: {
                creatAt: 'desc'
            }
        });

        res.status(200).json(posts);
    } catch (err) {
        console.error('Erro ao buscar posts:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

userRouter.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      // Verificar se todos os campos necessários foram enviado
        console.log(email, password)
      const finduser = await prisma.user.findUnique({
        where: { email: email }
      });
  
      if (!finduser) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }
  
  
      const isPasswordValid = await bcrypt.compare(password, finduser.password);
  
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
  
      // Gerar o token JWT
      const token = jwt.sign({ id: finduser.id, email: finduser.email, name: finduser.name, dono: finduser.dono }, SECRET_KEY, {
        expiresIn: '24h',
      });
  
      // Retornar o token para o cliente
      return res.status(200).json({
        message: 'Login realizado com sucesso!',
        token,
      });
  
    } catch (error) {
      console.error('Erro ao logar com o usuário:', error);
      return res.status(500).json({
        message: 'Erro interno ao tentar logar',
        error: error.message,
      });
    }
  });
  

  userRouter.get('/dados', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email; // Pegando o e-mail do token JWT
        const finduser = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (!finduser) {
            return res.status(404).json({ error: "Usuário não encontrado!" });
        }

        // ✅ Corrigindo a verificação do email verificado
        if (finduser.EmailVer === false) {
            return res.status(403).json({ error: "Email não verificado!" });
        }

        return res.status(200).json({ 
            name: finduser.name, 
            email: finduser.email, 
            dono: finduser.dono 
        });

    } catch (err) {
        console.error("Erro ao buscar usuário:", err);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
});


userRouter.get('/userposts', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id
        
        if (isNaN(user_id)) {
            return res.status(400).json({ error: 'ID de usuário inválido' });
        }

        const user_cards = await prisma.card.findMany({
            where: { 
                authorId: user_id,
                public: true
            },

        orderBy: {
                  // Primeiro ordena pelos que têm data (mais recente primeiro)
                    creatAt: 'desc'
                }
            
        });

        if (!user_cards) {
            return res.status(404).json({ error: 'Nenhum post encontrado' });
        }

        res.status(200).json(user_cards);
        console.log("cardápios achado: " +user_cards)
    } catch (err) {
        console.error('Erro ao buscar posts:', err);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: err.message 
        });
    }
});

userRouter.get('/userposts_p', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id
        
        if (isNaN(user_id)) {
            return res.status(400).json({ error: 'ID de usuário inválido' });
        }

        const user_cards = await prisma.card.findMany({
            where: { 
                authorId: user_id,
                public: false
            },

        orderBy: {
                  // Primeiro ordena pelos que têm data (mais recente primeiro)
                    creatAt: 'desc'
                }
            
        });

        if (!user_cards) {
            return res.status(404).json({ error: 'Nenhum post encontrado' });
        }

        res.status(200).json(user_cards);
        console.log("cardápios achado: " +user_cards)
    } catch (err) {
        console.error('Erro ao buscar posts:', err);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: err.message 
        });
    }
});


// Rota para atualizar a foto do usuário
userRouter.post('/user/photo', authenticateToken, async (req, res) => {
  try {
    const { foto } = req.body;
    const userEmail = req.user.email;

    if (!foto) {
      return res.status(400).json({ error: "URL da foto não fornecida" });
    }

    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: { foto }
    });

    res.status(200).json({ 
      message: "Foto atualizada com sucesso",
      foto: updatedUser.foto
    });
  } catch (err) {
    console.error("Erro ao atualizar foto:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default userRouter