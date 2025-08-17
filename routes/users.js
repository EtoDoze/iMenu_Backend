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

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;


// Criar usuário
userRouter.post('/create', async (req, res) => {
    try {
        const { name, email, password, dono, foto, restaurante, telefone, estadoId, estadoNome, cidadeId, cidadeNome } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ 
                error: "Todos os campos são obrigatórios",
                details: { name, email, password }
            });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "E-mail já está em uso" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const Etoken = crypto.randomBytes(32).toString("hex");

        const user = await prisma.user.create({
            data: { 
                name, 
                email, 
                password: hashedPassword, 
                dono, 
                restaurante: dono ? restaurante : null,
                telefone,
                estadoId,
                estadoNome,
                cidadeId,
                cidadeNome,
                EToken: Etoken,
                EmailVer: false,
                foto: foto || 'images/perfil.png'
            },
        });

        await sendVerificationEmail(email, Etoken);

        res.status(201).json({ 
            message: "Usuário criado com sucesso. Por favor verifique seu e-mail.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                dono: user.dono,
                restaurante: user.restaurante,
                telefone: user.telefone,
                estadoNome: user.estadoNome,
                cidadeNome: user.cidadeNome
            }
        });

    } catch (err) {
        console.error("Erro ao criar usuário:", err);
        res.status(500).json({ 
            message: "Erro ao criar usuário", 
            error: err.message 
        });
    }
});


// Atualizar usuário
userRouter.put('/user/update', authenticateToken, async (req, res) => {
    try {
        const { name, password, restaurante, telefone, estadoId, estadoNome, cidadeId, cidadeNome } = req.body;
        const userEmail = req.user.email;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: "Nome é obrigatório e deve ser um texto válido" });
        }

        const updateData = { 
            name: name.trim(),
            updateAt: new Date(),
            telefone,
            estadoId,
            estadoNome,
            cidadeId,
            cidadeNome
        };

        if (req.user.dono && restaurante !== undefined) {
            updateData.restaurante = restaurante;
        }
        
        if (password && typeof password === 'string' && password.trim() !== '') {
            if (password.length < 6) {
                return res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres" });
            }
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { email: userEmail },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                foto: true,
                dono: true,
                restaurante: true,
                telefone: true,
                estadoId: true,
                estadoNome: true,
                cidadeId: true,
                cidadeNome: true,
                updateAt: true
            }
        });

        res.status(200).json({ 
            success: true,
            message: "Dados atualizados com sucesso",
            user: updatedUser
        });

    } catch (err) {
        console.error("Erro ao atualizar usuário:", err);
        res.status(500).json({ success: false, error: "Erro interno do servidor" });
    }
});


// Restaurantes populares
userRouter.get('/restaurantes/populares', async (req, res) => {
    try {
        const restaurantes = await prisma.user.findMany({
            where: {
                dono: true,
                EmailVer: true
            },
            include: {
                cards: {
                    where: { public: true },
                    select: {
                        views: true,
                        avaliacao: { select: { nota: true } },
                        creatAt: true
                    }
                }
            }
        });

        const restaurantesComPopularidade = restaurantes.map(restaurante => {
            const umMesAtras = new Date();
            umMesAtras.setMonth(umMesAtras.getMonth() - 1);

            const cardapiosRecentes = restaurante.cards.filter(card => 
                new Date(card.creatAt) > umMesAtras
            );

            const totalViews = restaurante.cards.reduce((sum, card) => sum + (card.views || 0), 0);
            const viewsRecentes = cardapiosRecentes.reduce((sum, card) => sum + (card.views || 0), 0);
            
            const ratings = restaurante.cards.flatMap(card => card.avaliacao.map(av => av.nota));
            const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;

            const popularidadeScore = (totalViews * 0.4) + (viewsRecentes * 0.5) + (avgRating * 10 * 0.1);

            return {
                ...restaurante,
                metrics: {
                    totalViews,
                    viewsRecentes,
                    avgRating,
                    totalCardapios: restaurante.cards.length,
                    cardapiosRecentes: cardapiosRecentes.length,
                    popularidadeScore
                }
            };
        });

        const restaurantesOrdenados = restaurantesComPopularidade.sort((a, b) => 
            b.metrics.popularidadeScore - a.metrics.popularidadeScore
        ).slice(0, 10);

        const resultado = restaurantesOrdenados.map(restaurante => ({
            id: restaurante.id,
            name: restaurante.name,
            foto: restaurante.foto || 'https://img.freepik.com/vetores-premium/ilustracao-em-vetor-de-foto-de-perfil-minimalista_276184-161.jpg',
            totalViews: restaurante.metrics.totalViews,
            viewsRecentes: restaurante.metrics.viewsRecentes,
            avgRating: restaurante.metrics.avgRating.toFixed(1),
            totalCardapios: restaurante.metrics.totalCardapios,
            cardapiosRecentes: restaurante.metrics.cardapiosRecentes,
            cidadeNome: restaurante.cidadeNome,
            estadoNome: restaurante.estadoNome
        }));

        res.status(200).json(resultado);
    } catch (err) {
        console.error('Erro ao buscar restaurantes populares:', err);
        res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
    }
});


// Excluir usuário (admin)
userRouter.delete('/users/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.email !== "imenucompany12@gmail.com") {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        const posts = await prisma.card.findMany({
            where: { authorId: userId },
            select: { id: true }
        });

        for (const post of posts) {
            await prisma.avaliacao.deleteMany({ where: { postId: post.id } });
            await prisma.comment.deleteMany({ where: { postId: post.id } });
            await prisma.card.delete({ where: { id: post.id } });
        }

        await prisma.user.delete({ where: { id: userId } });

        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Erro ao excluir usuário:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});


// Listar todos usuários (admin)
userRouter.get('/users/all', authenticateToken, async (req, res) => {
    try {
        if (req.user.email !== "imenucompany12@gmail.com") {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                dono: true,
                EmailVer: true,
                telefone: true,
                estadoId: true,
                estadoNome: true,
                cidadeId: true,
                cidadeNome: true,
                creatAt: true
            },
            orderBy: { creatAt: 'desc' }
        });

        res.status(200).json(users);
    } catch (err) {
        console.error("Erro ao buscar usuários:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});


// Buscar usuário específico
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
                EmailVer: true,
                foto: true,
                telefone: true,
                estadoNome: true,
                cidadeNome: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        if (!user.EmailVer) {
            return res.status(403).json({ error: 'Email não verificado' });
        }

        res.status(200).json(user);
    } catch (err) {
        console.error('Erro ao buscar usuário:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});


// Posts públicos de um usuário
userRouter.get('/user/:userId/posts', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'ID de usuário inválido' });
        }

        const posts = await prisma.card.findMany({
            where: { authorId: userId, public: true },
            orderBy: { creatAt: 'desc' }
        });

        res.status(200).json(posts);
    } catch (err) {
        console.error('Erro ao buscar posts:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});


// Posts privados de um usuário
userRouter.get('/user/:userId/posts/private', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const requestingUserId = req.user.id;

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'ID de usuário inválido' });
        }

        if (userId !== requestingUserId) {
            return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        const posts = await prisma.card.findMany({
            where: { authorId: userId, public: false },
            orderBy: { creatAt: 'desc' }
        });

        res.status(200).json(posts);
    } catch (err) {
        console.error('Erro ao buscar posts:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});


// Login
userRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const finduser = await prisma.user.findUnique({ where: { email } });
        if (!finduser) {
            return res.status(401).json({ message: "Usuário não encontrado" });
        }

        if (!finduser.EmailVer) {
            return res.status(403).json({ message: "Email não verificado!" });
        }

        const isPasswordValid = await bcrypt.compare(password, finduser.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { id: finduser.id, email: finduser.email, name: finduser.name, dono: finduser.dono },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        return res.status(200).json({ message: 'Login realizado com sucesso!', token });
    } catch (error) {
        console.error('Erro ao logar com o usuário:', error);
        return res.status(500).json({ message: 'Erro interno ao tentar logar', error: error.message });
    }
});


// Dados do usuário logado
userRouter.get('/dados', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const finduser = await prisma.user.findUnique({ where: { email: userEmail } });

        if (!finduser) {
            return res.status(404).json({ error: "Usuário não encontrado!" });
        }
        if (finduser.EmailVer === false) {
            return res.status(403).json({ error: "Email não verificado!" });
        }

        return res.status(200).json({ 
            name: finduser.name, 
            email: finduser.email, 
            dono: finduser.dono,
            foto: finduser.foto,
            restaurante: finduser.restaurante,
            telefone: finduser.telefone,
            estadoId: finduser.estadoId,
            estadoNome: finduser.estadoNome,
            cidadeId: finduser.cidadeId,
            cidadeNome: finduser.cidadeNome
        });
    } catch (err) {
        console.error("Erro ao buscar usuário:", err);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
});


// Posts do próprio usuário (públicos)
userRouter.get('/userposts', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id;
        if (isNaN(user_id)) {
            return res.status(400).json({ error: 'ID de usuário inválido' });
        }

        const user_cards = await prisma.card.findMany({
            where: { authorId: user_id, public: true },
            orderBy: { creatAt: 'desc' }
        });

        if (!user_cards) {
            return res.status(404).json({ error: 'Nenhum post encontrado' });
        }

        res.status(200).json(user_cards);
    } catch (err) {
        console.error('Erro ao buscar posts:', err);
        res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
    }
});


// Posts do próprio usuário (privados)
userRouter.get('/userposts_p', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id;
        if (isNaN(user_id)) {
            return res.status(400).json({ error: 'ID de usuário inválido' });
        }

        const user_cards = await prisma.card.findMany({
            where: { authorId: user_id, public: false },
            orderBy: { creatAt: 'desc' }
        });

        if (!user_cards) {
            return res.status(404).json({ error: 'Nenhum post encontrado' });
        }

        res.status(200).json(user_cards);
    } catch (err) {
        console.error('Erro ao buscar posts:', err);
        res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
    }
});


// Atualizar foto do usuário
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

        res.status(200).json({ message: "Foto atualizada com sucesso", foto: updatedUser.foto });
    } catch (err) {
        console.error("Erro ao atualizar foto:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

export default userRouter;
