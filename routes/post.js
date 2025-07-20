import Express, { Router } from 'express';
import { PrismaClient } from "@prisma/client";
import jwt from 'jsonwebtoken';
const postRoot = Router();
postRoot.use(Express.json());
const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY;

import multer from 'multer';

// Configure o multer para processar multipart/form-data
const storage = multer.memoryStorage();
const upload = multer({ storage });


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

postRoot.post("/post", 
  upload.fields([
    { name: 'capa', maxCount: 1 },
    { name: 'arquivo', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const userId = decodeToken(authHeader);

        if (!userId) {
            return res.status(401).json({ error: "Token inválido ou expirado." });
        }

        // Extrai os dados do FormData
        const { sociallink, title, content, publice } = req.body;
        
        // Validação básica
        if (!title) {
            return res.status(400).json({ error: "Título é obrigatório" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }

        // Processar uploads de arquivos
        let capaUrl = null;
        let arquivoUrl = null;

        if (req.files['capa']) {
            capaUrl = await uploadToCloudinary(req.files['capa'][0]);
        }

        if (req.files['arquivo']) {
            arquivoUrl = await uploadToCloudinary(req.files['arquivo'][0]);
        }

        const post = await prisma.card.create({
            data: {
                title,
                content: content || null,
                public: publice === 'true', // Converte string para boolean
                sociallink: sociallink || null,
                authorId: userId,
                capa: capaUrl,
                arquivo: arquivoUrl
            },
        });

        res.status(201).json(post);
    } catch (err) {
        console.error("Erro ao criar post:", err);
        res.status(500).json({ 
            error: "Erro interno do servidor",
            details: err.message 
        });
    }
});

async function uploadToCloudinary(file) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { 
                resource_type: file.mimetype.startsWith('image') ? 'image' : 'raw',
                folder: "cardapios"
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );
        
        stream.end(file.buffer);
    });
}

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
        await prisma.comment.deleteMany({
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

        const { sociallink, title, content, public: isPublic, capa, arquivo } = req.body;
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

        const updatedPost = await prisma.card.update({
            where: { id: postId },
            data: {
                title: title || existingPost.title,
                content: content || existingPost.content,
                public: isPublic !== undefined ? isPublic : existingPost.public,
                sociallink: sociallink || existingPost.sociallink,
                capa: capa || existingPost.capa,
                arquivo: arquivo || existingPost.arquivo  // Novo campo
            }
        });

        res.status(200).json(updatedPost);
    } catch (err) {
        console.error('Erro ao atualizar post:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});


//views


// Adicione estas rotas ao seu postRoot.js

// Rota para registrar uma visualização
postRoot.post('/posts/:id/view', async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        if (isNaN(postId)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        // Atualiza o contador de visualizações
        const updatedPost = await prisma.card.update({
            where: { id: postId },
            data: {
                views: {
                    increment: 1
                }
            },
            select: {
                views: true
            }
        });

        res.status(200).json({ views: updatedPost.views });
    } catch (err) {
        console.error('Erro ao registrar visualização:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para obter visualizações
postRoot.get('/posts/:id/views', async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        if (isNaN(postId)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const post = await prisma.card.findUnique({
            where: { id: postId },
            select: {
                views: true
            }
        });

        if (!post) {
            return res.status(404).json({ error: 'Post não encontrado' });
        }

        res.status(200).json({ views: post.views || 0 });
    } catch (err) {
        console.error('Erro ao obter visualizações:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});


//rota para o relatorio:

postRoot.get('/relatorio/views', async (req, res) => {
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

        // Buscar apenas os posts do usuário logado
        const posts = await prisma.card.findMany({
            where: {
                authorId: userId
            },
            select: {
                id: true,
                title: true,
                views: true
            },
            orderBy: {
                views: 'desc'
            }
        });

        res.status(200).json(posts);
    } catch (err) {
        console.error('Erro ao gerar relatório:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
export default postRoot;