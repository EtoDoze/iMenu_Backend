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

  emailrouter.post('/reenviar-verificacao', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }

        if (user.EmailVer) {
            return res.status(400).json({ message: "E-mail já verificado" });
        }

        // Reenviar e-mail
        await sendVerificationEmail(user.email, user.EToken);
        
        res.status(200).json({ message: "E-mail de verificação reenviado com sucesso" });
    } catch (err) {
        res.status(500).json({ message: "Erro ao reenviar e-mail", error: err.message });
    }
});

  
  export default emailrouter

  import nodemailer from "nodemailer";

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
      <a class="button" href="https://imenu-backend-pd3a.onrender.com/verify-email?token=\${token}">
        Verificar minha conta
      </a>
    </div>
    <p class="text">Se você não solicitou este cadastro, pode simplesmente ignorar esta mensagem.</p>
    <div class="footer">© 2025 iMenu — Todos os direitos reservados</div>
  </div>
</body>
</html>
`;

  const transporter = nodemailer.createTransport({
    service: "gmail", // ou outro provedor (Ex: "hotmail", "outlook")
    auth: {
      user: "SEU_EMAIL@gmail.com",
      pass: "SENHA_DO_APP"
    }
  });

  await transporter.sendMail({
    from: '"iMenu" <SEU_EMAIL@gmail.com>',
    to: email,
    subject: "Verifique seu e-mail",
    html: html
  });
}
