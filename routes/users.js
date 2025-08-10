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




bcrypt.hash(testPassword, 10, function(err, hash) {
  if (err) console.error(err);
  console.log(hash); // Verifique se o hash está sendo gerado corretamente
});



userRouter.post('/create', async (req, res) => {
    try {
        const { name, email, password, dono, foto, restaurante } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ 
                error: "Todos os campos são obrigatórios",
                details: { name, email, password }
            });
        }

        // Verificar se o e-mail já existe
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
                restaurante: dono ? restaurante : null, // Armazena apenas se for dono
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
                restaurante: user.restaurante
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



// Rota para atualizar dados do usuário
userRouter.put('/user/update', authenticateToken, async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const userEmail = req.user.email;

        console.log('Recebendo solicitação de atualização:', { name, email, password: !!password });

        // Validações básicas
        if (!name || !email) {
            return res.status(400).json({ error: "Nome e email são obrigatórios" });
        }

        // Verificar se o novo email já está em uso por outro usuário
        if (email !== userEmail) {
            const emailExists = await prisma.user.findUnique({ 
                where: { email },
                select: { id: true }
            });
            
            if (emailExists) {
                return res.status(400).json({ error: "Este email já está em uso" });
            }
        }

        const updateData = { 
            name, 
            email,
            updateAt: new Date() // Adiciona timestamp de atualização
        };
        
        // Atualizar senha apenas se for fornecida e não estiver vazia
        if (password && password.trim() !== '') {
            console.log('Atualizando senha...');
            if (password.length < 6) {
                return res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres" });
            }
            
            // Gerar novo hash da senha
            const saltRounds = 10;
            updateData.password = await bcrypt.hash(password, saltRounds);
            console.log('Novo hash de senha gerado');
        }

        console.log('Dados para atualização:', updateData);

        // Atualizar usuário no banco de dados
        const updatedUser = await prisma.user.update({
            where: { email: userEmail },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                foto: true,
                dono: true,
                updateAt: true
            }
        });

        console.log('Usuário atualizado com sucesso:', updatedUser);

        // Gerar novo token JWT se o email foi alterado
        let newToken = null;
        if (email !== userEmail) {
            newToken = jwt.sign(
                { 
                    id: updatedUser.id, 
                    email: updatedUser.email, 
                    name: updatedUser.name, 
                    dono: updatedUser.dono 
                }, 
                SECRET_KEY, 
                { expiresIn: '24h' }
            );
            console.log('Novo token gerado devido à mudança de email');
        }

        res.status(200).json({ 
            message: "Dados atualizados com sucesso",
            user: updatedUser,
            token: newToken // Inclui novo token se email foi alterado
        });

    } catch (err) {
        console.error("Erro detalhado ao atualizar usuário:", err);
        res.status(500).json({ 
            error: "Erro interno do servidor",
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Rota para buscar restaurantes populares (usuários donos) - Versão corrigida
userRouter.get('/restaurantes/populares', async (req, res) => {
    try {
        // 1. Busca todos os restaurantes (usuários donos verificados)
        const restaurantes = await prisma.user.findMany({
            where: {
                dono: true,
                EmailVer: true
            },
            include: {
                cards: {
                    where: {
                        public: true // FILTRO IMPORTANTE: Somente cardápios públicos
                    },
                    select: {
                        views: true,
                        avaliacao: {
                            select: {
                                nota: true
                            }
                        },
                        creatAt: true
                    }
                }
            }
        });

        // 2. Calcula métricas de popularidade apenas com posts públicos
        const restaurantesComPopularidade = restaurantes.map(restaurante => {
            const agora = new Date();
            const umMesAtras = new Date();
            umMesAtras.setMonth(umMesAtras.getMonth() - 1);

            // Filtra cardápios públicos dos últimos 30 dias
            const cardapiosRecentes = restaurante.cards.filter(card => 
                new Date(card.creatAt) > umMesAtras
            );

            // Cálculos de métricas (apenas com dados públicos)
            const totalViews = restaurante.cards.reduce((sum, card) => sum + (card.views || 0), 0);
            const viewsRecentes = cardapiosRecentes.reduce((sum, card) => sum + (card.views || 0), 0);
            
            const ratings = restaurante.cards.flatMap(card => 
                card.avaliacao.map(av => av.nota)
            );
            const avgRating = ratings.length > 0 ? 
                (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;

            // Pontuação de popularidade (apenas com dados públicos)
            const popularidadeScore = 
                (totalViews * 0.4) +        // Visualizações totais
                (viewsRecentes * 0.5) +     // Visualizações recentes
                (avgRating * 10 * 0.1);     // Avaliação média

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

        // 3. Ordena por pontuação de popularidade
        const restaurantesOrdenados = restaurantesComPopularidade.sort((a, b) => 
            b.metrics.popularidadeScore - a.metrics.popularidadeScore
        ).slice(0, 10); // Top 10

        // 4. Formata a resposta
        const resultado = restaurantesOrdenados.map(restaurante => ({
            id: restaurante.id,
            name: restaurante.name,
            foto: restaurante.foto || 'https://img.freepik.com/vetores-premium/ilustracao-em-vetor-de-foto-de-perfil-minimalista_276184-161.jpg',
            totalViews: restaurante.metrics.totalViews,
            viewsRecentes: restaurante.metrics.viewsRecentes,
            avgRating: restaurante.metrics.avgRating.toFixed(1),
            totalCardapios: restaurante.metrics.totalCardapios,
            cardapiosRecentes: restaurante.metrics.cardapiosRecentes
        }));

        res.status(200).json(resultado);
    } catch (err) {
        console.error('Erro ao buscar restaurantes populares:', err);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: err.message 
        });
    }
});

// Rota para excluir usuário (admin)
userRouter.delete('/users/:id', authenticateToken, async (req, res) => {
    try {
        // Verifica se é admin
        if (req.user.email !== "imenucompany12@gmail.com") {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        // Primeiro exclui todos os posts do usuário
        const posts = await prisma.card.findMany({
            where: { authorId: userId },
            select: { id: true }
        });

        for (const post of posts) {
            await prisma.avaliacao.deleteMany({ where: { postId: post.id } });
            await prisma.comment.deleteMany({ where: { postId: post.id } });
            await prisma.card.delete({ where: { id: post.id } });
        }

        // Depois exclui o usuário
        await prisma.user.delete({ where: { id: userId } });

        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Erro ao excluir usuário:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

// Rota para pegar todos os usuários (admin)
userRouter.get('/users/all', authenticateToken, async (req, res) => {
    try {
        // Verifica se é admin
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
                creatAt: true
            },
            orderBy: {
                creatAt: 'desc'
            }
        });

        res.status(200).json(users);
    } catch (err) {
        console.error("Erro ao buscar usuários:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
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
                EmailVer: true,
                foto: true
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
            dono: finduser.dono,
            foto: finduser.foto
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