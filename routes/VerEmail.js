import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

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
    const Etoken = crypto.randomBytes(32).toString("hex");

    const user = await prisma.user.update({
      where: { email },
      data: { EToken: Etoken },
    });

    await sendVerificationEmail(email, Etoken);
    res.status(200).json({ message: "Novo e-mail de verificação enviado" });
  } catch (err) {
    console.error("Erro ao reenviar verificação:", err);
    res.status(500).json({ error: "Erro ao reenviar verificação" });
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
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      background-color: #0f0f0f;
      font-family: 'Segoe UI', sans-serif;
      color: #ffffff;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background-color: #1c1c1c;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 0 10px rgba(0,0,0,0.4);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #333;
    }
    .header img {
      max-height: 60px;
      margin-bottom: 10px;
    }
    .title {
      font-size: 22px;
      color: #4caf50;
      margin: 20px 0 10px;
    }
    .text {
      font-size: 16px;
      line-height: 1.5;
      color: #ccc;
    }
    .button {
      display: inline-block;
      margin: 30px auto;
      background-color: #4caf50;
      color: #fff;
      padding: 14px 28px;
      border-radius: 5px;
      text-decoration: none;
      font-weight: bold;
    }
    .footer {
      font-size: 12px;
      color: #888;
      text-align: center;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://i.imgur.com/fcnYkO0.png" alt="Logo iMenu"/>
      <h1 class="title">Verifique seu e-mail</h1>
    </div>
    <p class="text">Olá! Obrigado por se cadastrar no <strong>iMenu</strong> — menus personalizados, dia a dia simplificado.</p>
    <p class="text">Para garantir sua segurança e permitir que você aproveite todos os recursos, precisamos que você verifique seu endereço de e-mail.</p>
    <div style="text-align:center;">
      <a class="button" href="${link}">Verificar minha conta</a>
    </div>
    <p class="text">Se você não solicitou este cadastro, pode simplesmente ignorar esta mensagem.</p>
    <div class="footer">© 2025 iMenu — Todos os direitos reservados</div>
  </div>
</body>
</html>
`;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
  from: `"iMenu" <${process.env.EMAIL_USER}>`, // ✅ Remetente igual ao autenticado
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
