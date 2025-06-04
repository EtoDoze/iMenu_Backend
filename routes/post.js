import Express, { Router } from 'express';
import { PrismaClient } from "@prisma/client";
import jwt from 'jsonwebtoken';

const postRoot = Router();
postRoot.use(Express.json());
const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY;

function decodeToken(authHeader) {
    try {
        const token = authHeader && authHeader.split(' ')[1]; // Extrai o token do cabeçalho
        if (!token) return null;

        const decoded = jwt.verify(token, SECRET_KEY);
        return decoded.id || decoded.userId; // Supondo que o token contenha o ID do usuário
    } catch (err) {
        return null; // Token inválido
    }
}

postRoot.post("/post", async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const userId = decodeToken(authHeader);

        if (!userId) {
            return res.status(401).json({ error: "Token inválido ou expirado." });
        }

        const { sociallink, title, content, publice, capa } = req.body;

        // Verificar se o usuário existe
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }

        // Criar o post relacionado ao usuário
        const post = await prisma.card.create({
            data: {
                title: title,
                content: content,
                public: publice,
                sociallink: sociallink,
                authorId: userId, // Relaciona o post ao usuário
                capa: capa
            },
        });

        res.status(201).json(post);
    } catch (err) {
        console.error("Erro ao criar post:", err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

postRoot.get("/recent", async (req, res) => {
    try {
        const latestPosts = await prisma.card.findMany({
            take: 20,
            orderBy: { id: 'desc' },
            where:{
                public: true
            },
            include: {
                author: {
                    select: { name: true, email: true}
                }
            }
        });
        
        console.log("Posts no backend:", latestPosts); // Adicione este log
        
        // Garanta que os IDs estão sendo incluídos
        const postsComIds = latestPosts.map(post => ({
            id: post.id,  // Garanta que está usando 'id' ou '_id' consistentemente
            ...post
        }));
        
        res.status(200).json(postsComIds);
    } catch (err) {
        console.error("Erro ao buscar posts:", err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// Rota para buscar um post específico
postRoot.get('/posts/:id', async (req, res) => {
    try {
        // Verifica se o ID é válido
        const postId = parseInt(req.params.id);
        if (isNaN(postId)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const post = await prisma.card.findUnique({
            where: { id: postId },
            include: {
                author: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (!post) {
            return res.status(404).json({ error: 'Post não encontrado' });
        }

        res.json(post);
    } catch (err) {
        console.error('Erro ao buscar post:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

postRoot.delete("/post/:id", async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: "Token não fornecido." });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.id;

        if (!userId) {
            return res.status(401).json({ error: "Token inválido." });
        }

        const postId = parseInt(req.params.id);
        if (isNaN(postId)) {
            return res.status(400).json({ error: "ID inválido." });
        }

        // Verifica se o post existe e pertence ao usuário
        const post = await prisma.card.findUnique({
            where: { id: postId }
        });

        if (!post) {
            return res.status(404).json({ error: "Post não encontrado." });
        }

        if (post.authorId !== userId) {
            return res.status(403).json({ error: "Você não tem permissão para excluir este post." });
        }        
        // Primeiro exclui todas as avaliações relacionadas
        await prisma.avaliacao.deleteMany({
            where: { postId: postId}
        });

        // Depois exclui o post
        await prisma.card.delete({
            where: { id: postId }
        });
        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Erro ao excluir post:", err);
        
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: "Token inválido." });
        }
        
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// Adicione esta rota ao seu postRoot.js
postRoot.put('/posts/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const userId = decodeToken(authHeader);

        if (!userId) {
            return res.status(401).json({ error: "Token inválido ou expirado." });
        }

        const postId = parseInt(req.params.id);
        if (isNaN(postId)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const { sociallink, title, content, public: isPublic, capa } = req.body;

        // Verificar se o post existe e pertence ao usuário
        const existingPost = await prisma.card.findUnique({
            where: { id: postId }
        });

        if (!existingPost) {
            return res.status(404).json({ error: 'Post não encontrado' });
        }

        if (existingPost.authorId !== userId) {
            return res.status(403).json({ error: 'Você não tem permissão para editar este post' });
        }

        // Atualizar o post
        const updatedPost = await prisma.card.update({
            where: { id: postId },
            data: {
                title: title || existingPost.title,
                content: content || existingPost.content,
                public: isPublic !== undefined ? isPublic : existingPost.public,
                sociallink: sociallink || existingPost.sociallink,
                capa: capa || existingPost.capa
            }
        });

        res.status(200).json(updatedPost);
    } catch (err) {
        console.error('Erro ao atualizar post:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default postRoot;