import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import sendVerificationEmail from "../API/email.js";


dotenv.config();

const emailrouter = express.Router();
const prisma = new PrismaClient();
emailrouter.use(express.json());

// Rota para verificar e-mail pelo token
emailrouter.get("/verify-email", async (req, res) => {
  const { token } = req.query;
  console.log("Token recebido:", token);

  if (!token) {
    return res.status(400).json({ error: "Token não fornecido" });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { EToken: token },
    });

    console.log("Usuário encontrado:", user);

    if (!user) {
      return res.status(400).json({ error: "Token inválido ou expirado" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        EmailVer: true,
        EToken: null,
      },
    });

    console.log("E-mail verificado com sucesso para o usuário:", user.id);
    res.send("E-mail verificado com sucesso!");
  } catch (err) {
    console.error("Erro ao verificar e-mail:", err);
    res.status(500).json({ error: "Erro ao verificar e-mail" });
  }
});

// Rota para gerar novo token e reenviar
emailrouter.post("/verifyagain", async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false,
                error: "Email é obrigatório" 
            });
        }

        console.log(`Solicitado reenvio de verificação para: ${email}`);

        // Buscar usuário
        const user = await prisma.user.findUnique({ 
            where: { email } 
        });

        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: "Usuário não encontrado" 
            });
        }

        if (user.EmailVer) {
            return res.status(400).json({ 
                success: false,
                error: "Email já verificado" 
            });
        }

        console.log(`Reenviando email para usuário: ${user.id}`);

        // Tentar enviar email
        const emailEnviado = await sendVerificationEmail(user.email, user.EToken);

        if (emailEnviado) {
            res.status(200).json({ 
                success: true,
                message: "E-mail de verificação reenviado com sucesso" 
            });
        } else {
            res.status(500).json({ 
                success: false,
                error: "Falha ao enviar e-mail. Tente novamente mais tarde." 
            });
        }

    } catch (err) {
        console.error("Erro ao reenviar verificação:", err);
        res.status(500).json({ 
            success: false,
            error: "Erro interno do servidor",
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});


// Rota para reenviar verificação (sem gerar novo token)
emailrouter.post("/reenviar-verificacao", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    if (user.EmailVer) {
      return res.status(400).json({ message: "E-mail já verificado" });
    }

    await sendVerificationEmail(user.email, user.EToken);
    res.status(200).json({ message: "E-mail de verificação reenviado com sucesso" });
  } catch (err) {
    console.error("Erro ao reenviar e-mail:", err);
    res.status(500).json({ message: "Erro ao reenviar e-mail", error: err.message });
  }
});

export default emailrouter;

// Função para enviar o e-mail de verificação
async function sendVerificationEmail(email, token) {
  const link = `https://imenu-backend-pd3a.onrender.com/verify-email?token=${token}`;

const html = `
<div style="max-width:600px;margin:auto;background-color:#1c1c1c;border-radius:10px;padding:30px;font-family:'Segoe UI',sans-serif;color:#ffffff;">
  <div style="text-align:center;padding-bottom:20px;border-bottom:1px solid #333;">
    <img src="https://i.imgur.com/fcnYkO0.png" alt="Logo iMenu" style="max-height:60px;margin-bottom:10px;" />
    <h1 style="font-size:22px;color:#4caf50;margin:20px 0 10px;">Verifique seu e-mail</h1>
  </div>
  <p style="font-size:16px;line-height:1.5;color:#ccc;">Olá! Obrigado por se cadastrar no <strong>iMenu</strong> — menus personalizados, dia a dia simplificado.</p>
  <p style="font-size:16px;line-height:1.5;color:#ccc;">Para garantir sua segurança e permitir que você aproveite todos os recursos, precisamos que você verifique seu endereço de e-mail.</p>
  <div style="text-align:center;margin:30px 0;">
    <a href="${link}" style="display:inline-block;background-color:#4caf50;color:#fff;padding:14px 28px;border-radius:5px;text-decoration:none;font-weight:bold;">Verificar minha conta</a>
  </div>
  <p style="font-size:16px;line-height:1.5;color:#ccc;">Se você não solicitou este cadastro, pode simplesmente ignorar esta mensagem.</p>
  <div style="font-size:12px;color:#888;text-align:center;margin-top:40px;">© 2025 iMenu — Todos os direitos reservados</div>
</div>
`;


  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"iMenu" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verifique seu e-mail",
      html: html,
    });
    console.log(`✅ E-mail enviado para ${email}`);
  } catch (err) {
    console.error("❌ Erro ao enviar e-mail:", err.message);
    throw new Error("Falha ao enviar e-mail de verificação.");
  }
}
