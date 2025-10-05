import express from "express";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { sendVerificationEmail } from "../API/email.js";

dotenv.config();

const emailrouter = express.Router();
const prisma = new PrismaClient();
emailrouter.use(express.json());

// Função para enviar o e-mail de verificação

// Rota para verificar e-mail pelo token

// Rota para reenviar verificação
emailrouter.post("/verifyagain", async (req, res) => {
    try {
        console.log("📧 Recebida solicitação para /verifyagain");
        console.log("Corpo da requisição:", req.body);
        
        const { email } = req.body;
        
        if (!email) {
            console.log("❌ Email não fornecido");
            return res.status(400).json({ 
                success: false,
                error: "Email é obrigatório" 
            });
        }

        console.log(`🔍 Buscando usuário: ${email}`);

        // Buscar usuário
        const user = await prisma.user.findUnique({ 
            where: { email } 
        });

        if (!user) {
            console.log("❌ Usuário não encontrado");
            return res.status(404).json({ 
                success: false,
                error: "Usuário não encontrado" 
            });
        }

        if (user.EmailVer) {
            console.log("ℹ️ Email já verificado");
            return res.status(400).json({ 
                success: false,
                error: "Email já verificado" 
            });
        }

        console.log(`🔄 Reenviando email para usuário: ${user.id}`);
        console.log(`Token do usuário: ${user.EToken}`);

        // Tentar enviar email
        const emailEnviado = await sendVerificationEmail(user.email, user.EToken);

        if (emailEnviado) {
            console.log("✅ Email enviado com sucesso");
            res.status(200).json({ 
                success: true,
                message: "E-mail de verificação reenviado com sucesso!" 
            });
        } else {
            console.log("❌ Falha no envio do email");
            res.status(500).json({ 
                success: false,
                error: "Falha ao enviar e-mail. Tente novamente mais tarde." 
            });
        }

    } catch (err) {
        console.error("💥 Erro completo em /verifyagain:", err);
        res.status(500).json({ 
            success: false,
            error: "Erro interno do servidor",
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

export default emailrouter;