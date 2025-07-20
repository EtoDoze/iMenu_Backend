// admin.js
import Express, { Router } from 'express';
import { PrismaClient } from "@prisma/client";
import jwt from 'jsonwebtoken';
const adminRouter = Router();
adminRouter.use(Express.json());
const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY;

// Middleware para verificar se é o admin
async function verifyAdmin(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: "Token não fornecido." });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, SECRET_KEY);
        
        // Verificar se o email corresponde ao admin
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { email: true }
        });

        if (!user || user.email !== "imenucompany12@gmail.com") {
            return res.status(403).json({ error: "Acesso negado. Somente o administrador pode acessar esta página." });
        }

        req.user = decoded;
        next();
    } catch (err) {
        console.error("Erro na verificação do admin:", err);
        return res.status(401).json({ error: "Token inválido ou expirado." });
    }
}

// Rota para listar todos os posts (apenas admin)
adminRouter.get('/posts', verifyAdmin, async (req, res) => {
    try {
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

// Rota para listar todos os usuários (apenas admin)
adminRouter.get('/users', verifyAdmin, async (req, res) => {
    try {
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

// Rota para excluir um post (apenas admin)
adminRouter.delete('/posts/:id', verifyAdmin, async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        if (isNaN(postId)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        // Primeiro exclui todas as avaliações e comentários relacionados
        await prisma.avaliacao.deleteMany({
            where: { postId: postId }
        });
        
        await prisma.comment.deleteMany({
            where: { postId: postId }
        });

        // Depois exclui o post
        await prisma.card.delete({
            where: { id: postId }
        });

        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Erro ao excluir post:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

// Rota para excluir um usuário (apenas admin)
adminRouter.delete('/users/:id', verifyAdmin, async (req, res) => {
    try {
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
            await prisma.avaliacao.deleteMany({
                where: { postId: post.id }
            });
            
            await prisma.comment.deleteMany({
                where: { postId: post.id }
            });
            
            await prisma.card.delete({
                where: { id: post.id }
            });
        }

        // Depois exclui o usuário
        await prisma.user.delete({
            where: { id: userId }
        });

        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Erro ao excluir usuário:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

export default adminRouter;