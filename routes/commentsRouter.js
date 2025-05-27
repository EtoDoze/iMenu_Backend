import Express, { Router } from 'express';
import { PrismaClient } from "@prisma/client";
import authenticateToken from './auth.js';

const commentRouter = Router();
commentRouter.use(Express.json());
const prisma = new PrismaClient();

// Criar um novo comentário
commentRouter.post('/comentar/:postId', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        const postId = parseInt(req.params.postId);
        const userId = req.user.id;

        if (!content) {
            return res.status(400).json({ error: "O conteúdo do comentário é obrigatório" });
        }

        // Verificar se o post existe
        const post = await prisma.card.findUnique({
            where: { id: postId }
        });

        if (!post) {
            return res.status(404).json({ error: "Post não encontrado" });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                authorId: userId,
                postId: postId
            },
            include: {
                author: {
                    select: {
                        name: true
                    }
                }
            }
        });

        res.status(201).json(comment);
    } catch (err) {
        console.error("Erro ao criar comentário:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

// Obter comentários de um post
commentRouter.get('/comentarios/:postId', async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);

        const comments = await prisma.comment.findMany({
            where: { postId },
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        name: true
                    }
                }
            }
        });

        res.status(200).json(comments);
    } catch (err) {
        console.error("Erro ao buscar comentários:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

// Deletar um comentário (apenas autor ou admin)
commentRouter.delete('/comentario-del/:id', authenticateToken, async (req, res) => {
    try {
        const commentId = parseInt(req.params.id);
        const userId = req.user.id;
        const isAdmin = req.user.dono; // Assumindo que 'dono' indica admin

        // Buscar o comentário para verificar o autor
        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            return res.status(404).json({ error: "Comentário não encontrado" });
        }

        // Verificar se o usuário é o autor ou admin
        if (comment.authorId !== userId && !isAdmin) {
            return res.status(403).json({ error: "Não autorizado" });
        }

        await prisma.comment.delete({
            where: { id: commentId }
        });

        res.status(200).json({ message: "Comentário deletado com sucesso" });
    } catch (err) {
        console.error("Erro ao deletar comentário:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

export default commentRouter;