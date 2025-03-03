import express, { json } from "express"
import { PrismaClient } from '@prisma/client'
import bcrypt from "bcryptjs";
import crypto from "crypto";

const emailrouter = express.Router()
const prisma = new PrismaClient()
emailrouter.use(express.json());

emailrouter.get("/verify-email", async (req, res) => {
    const { token } = req.query;
    console.log("Token recebido:", token); // Log para depuração
  
    if (!token) {
      return res.status(400).json({ error: "Token não fornecido" });
    }
  
    try {
      // Busca o usuário pelo token
      const user = await prisma.user.findFirst({
        where: { EToken: token },
      });
      
      
      console.log("Usuário encontrado:", user); // Log para depuração
  
      if (!user) {
        return res.status(400).json({ error: "Token inválido ou expirado" });
      }
  
      // Marca o e-mail como verificado e remove o token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          EmailVer: true,
          EToken: null, // Remove o token após a verificação
        },
      });
  
      console.log("E-mail verificado com sucesso para o usuário:", user.id); // Log para depuração
      res.send("Email Verificado com sucesso!")
    } catch (err) {
      console.error("Erro ao verificar e-mail:", err);
      res.status(500).json({ error: "Erro ao verificar e-mail" });
    }
  });

  emailrouter.get("/verifyagain", async (req,res) =>{
    const Etoken = crypto.randomBytes(32).toString("hex");
    const {email} = req.body
    user = await prisma.user.update({
        where:{
            email: email
        },
        data:{
            EToken: Etoken
        }
    })
    sendVerificationEmail(email, Etoken)
    
  })

  export default emailrouter