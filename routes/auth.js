import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY;

// Middleware para verificar o token JWT e encontrar o usuário no banco de dados
function authenticateToken(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ message: "Token não fornecido" });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            console.error("Erro na verificação do token:", err);
            
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Token expirado" });
            }
            return res.status(403).json({ message: "Token inválido" });
        }
        
        console.log("Token válido para usuário:", user);
        req.user = user;
        next();
    });
}

export default authenticateToken;
