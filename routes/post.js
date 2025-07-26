import Express, { Router } from 'express';
import { PrismaClient } from "@prisma/client";
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary'; // Linha corrigida
import authenticateToken from './auth.js';  // Adicione esta linha
const postRoot = Router();
postRoot.use(Express.json());
const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY;

import multer from 'multer';

// Configure o multer para processar multipart/form-data
const storage = multer.memoryStorage();
const upload = multer({ storage });

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_KEY, 
  api_secret: process.env.CLOUDINARY_SECRET 
});

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



// Rota para excluir post (admin)
postRoot.delete('/posts/:id', authenticateToken, async (req, res) => {
    try {
        // Verifica se é admin
        if (req.user.email !== "imenucompany12@gmail.com") {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const postId = parseInt(req.params.id);
        if (isNaN(postId)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        // Exclui o post e todos os relacionamentos
        await prisma.avaliacao.deleteMany({ where: { postId } });
        await prisma.comment.deleteMany({ where: { postId } });
        await prisma.card.delete({ where: { id: postId } });

        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Erro ao excluir post:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

// Rota para pegar todos os posts (admin)
postRoot.get('/posts/all', authenticateToken, async (req, res) => {
    try {
        // Verifica se é admin
        if (req.user.email !== "imenucompany12@gmail.com") {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const posts = await prisma.card.findMany({
            include: {
                author: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                creatAt: 'desc'
            }
        });

        res.status(200).json(posts);
    } catch (err) {
        console.error("Erro ao buscar posts:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});


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
        const { sociallink, title, content, publice, tags} = req.body;
        const tagNames = tags ? JSON.parse(tags) : [];

                // Validação de tags
        if (tagNames.length > 3) {
            return res.status(400).json({ error: "Máximo de 3 tags permitidas" });
        }
        
        const tagsData = await processTags(tagNames);

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
                arquivo: arquivoUrl,
                tags: tagsData
            },
            include: {
                tags: true
            }
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


async function processTags(tagNames) {
    if (!tagNames || tagNames.length === 0) return { connect: [] };
    
    const tags = await Promise.all(
        tagNames.map(name => 
            prisma.tag.upsert({
                where: { name },
                create: { name },
                update: {}
            })
        )
    );
    
    return { connect: tags.map(tag => ({ id: tag.id })) };
}

//posts recentes na tela de pesquisa

postRoot.get("/recentP", async (req, res) => {
    try {
        const includeTags = req.query.include === 'tags';
        
        const latestPosts = await prisma.card.findMany({
            take: 20,
            orderBy: { id: 'desc' },
            where: {
                public: true
            },
            include: {
                author: {
                    select: { name: true, email: true }
                },
                tags: includeTags,
                avaliacao: {
                    select: { nota: true }
                }
            }
        });
        
        // Calcular média de avaliações
        const postsWithRatings = latestPosts.map(post => {
            const ratings = post.avaliacao.map(a => a.nota);
            const avgRating = ratings.length > 0 ? 
                (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 
                null;
            
            return {
                ...post,
                avgRating
            };
        });
        
        res.status(200).json(postsWithRatings);
    } catch (err) {
        console.error("Erro ao buscar posts:", err);
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


// No seu arquivo de rotas (post.js ou similar)
postRoot.get('/tags', authenticateToken, async (req, res) => {
    try {
        const tags = await prisma.tag.findMany({
            orderBy: {
                name: 'asc'
            }
        });
        res.status(200).json(tags);
    } catch (err) {
        console.error('Erro ao buscar tags:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para buscar um post específico
postRoot.get('/posts/:id', async (req, res) => {
    try {
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
                },
                // Corrigido para incluir tags corretamente
                tags: {
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

        const { sociallink, title, content, public: isPublic, capa, arquivo, tags } = req.body;
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
                arquivo: arquivo || existingPost.arquivo,  // Novo campo
                tags: {
                    set: [], // Remove todas as tags atuais
                    connect: tags ? tags.map(id => ({ id })) : [] // Conecta as novas tags
                }
            },
            include: {
                tags: true
            }


        });

        res.status(200).json(updatedPost);
    } catch (err) {
        console.error('Erro ao atualizar post:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Nova rota específica para admin alterar visibilidade
postRoot.put('/admin/posts/:id/visibility', authenticateToken, async (req, res) => {
    try {
        // Verifica se é admin
        if (req.user.email !== "imenucompany12@gmail.com") {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const postId = parseInt(req.params.id);
        if (isNaN(postId)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        const { public: isPublic } = req.body;

        if (typeof isPublic !== 'boolean') {
            return res.status(400).json({ error: "O campo 'public' deve ser booleano" });
        }

        const updatedPost = await prisma.card.update({
            where: { id: postId },
            data: {
                public: isPublic
            }
        });

        res.status(200).json(updatedPost);
    } catch (err) {
        console.error('Erro ao alterar visibilidade do post:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

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



// Rota para obter cardapios populares (mais visualizações e melhores avaliações)
postRoot.get('/card/populares', async (req, res) => {
    try {
        const popularRestaurants = await prisma.card.findMany({
            where: {
                public: true,
            },
            include: {
                tags: true,
                author: {
                    select: {
                        name: true,
                        foto: true
                    }
                },
                avaliacao: { // Agora está no singular, conforme seu schema
                    select: {
                        nota: true
                    }
                }
            },
            orderBy: {
                views: 'desc'
            },
            take: 20
        });

        if (!popularRestaurants || popularRestaurants.length === 0) {
            return res.status(200).json([]);
        }

        const restaurantsWithAvgRating = popularRestaurants.map(restaurant => {
            const ratings = restaurant.avaliacao.map(a => a.nota); // Note o singular aqui
            const avgRating = ratings.length > 0 ? 
                (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 
                null;

            // Verifica se a URL da capa é válida
            let capaUrl = restaurant.capa;
            if (capaUrl && !capaUrl.startsWith('http')) {
                capaUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_NAME}/image/upload/${capaUrl}`;
            }

            return {
                id: restaurant.id,
                title: restaurant.title,
                capa: capaUrl,
                views: restaurant.views || 0,
                avgRating: avgRating ? avgRating.toFixed(1) : null,
                author: restaurant.author,
                tags: restaurant.tags
            };
        });

        // Ordena por avaliação (se existir) ou por visualizações
        restaurantsWithAvgRating.sort((a, b) => {
            if (a.avgRating && b.avgRating) {
                return parseFloat(b.avgRating) - parseFloat(a.avgRating);
            }
            return (b.views || 0) - (a.views || 0);
        });

        res.status(200).json(restaurantsWithAvgRating.slice(0, 3));
    } catch (err) {
        console.error('Erro ao buscar restaurantes populares:', err);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: err.message 
        });
    }
});

//procurar card por tags

postRoot.get('/card/tag/:tagName', async (req, res) => {
    try {
        const tagName = req.params.tagName;
        const cardapios = await prisma.card.findMany({
            where: {
                public: true,
                tags: {
                    some: {
                        name: tagName
                    }
                }
            },
            include: {
                author: { select: { name: true, foto: true } },
                avaliacao: { select: { nota: true } },
                tags: true
            },
            orderBy: { views: 'desc' }
        });

        res.status(200).json(cardapios);
    } catch (err) {
        console.error('Erro ao buscar cardápios por tag:', err);
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