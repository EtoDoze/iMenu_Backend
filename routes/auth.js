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
          //  return res.status(403).json({ message: "Token inválido" });
          console.log("Token invalido")
        }
        
        console.log("Usuário decodificado do token:", user); // Adicione este log
        req.user = user; // Adiciona as informações do usuário ao request
        next();
    });
}


export default authenticateToken;
