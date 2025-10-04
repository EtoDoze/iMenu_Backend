import express from "express";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const emailrouter = express.Router();
const prisma = new PrismaClient();
emailrouter.use(express.json());

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

    // CONFIGURAÇÃO OTIMIZADA PARA RENDER.COM
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true para 465, false para outros ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        // Configurações específicas para evitar timeout
        connectionTimeout: 10000, // 10 segundos
        greetingTimeout: 10000,
        socketTimeout: 10000,
        // Tentativas de reconexão
        retryDelay: 1000,
        // Pooling para conexões reutilizáveis
        pool: true,
        maxConnections: 1,
        maxMessages: 5
    });

    try {
        console.log('🔄 Tentando conectar ao SMTP do Gmail...');
        
        // Verificação mais rápida da conexão
        await transporter.verify();
        console.log('✅ Conexão SMTP verificada com sucesso');
        
        console.log(`📤 Enviando email para: ${email}`);
        const info = await transporter.sendMail({
            from: `"iMenu" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Verifique seu e-mail - iMenu",
            html: html,
            // Prioridade alta
            priority: 'high'
        });
        
        console.log(`✅ Email enviado com sucesso para ${email}:`, info.messageId);
        return true;
        
    } catch (error) {
        console.error('❌ Erro detalhado ao enviar email:', {
            name: error.name,
            code: error.code,
            command: error.command,
            message: error.message
        });
        
        return false;
    }
}

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
        res.send(`
            <html>
                <head>
                    <title>Email Verificado - iMenu</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                        .success { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        h1 { color: #4CAF50; }
                        a { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <div class="success">
                        <h1>✅ Email Verificado com Sucesso!</h1>
                        <p>Seu email foi verificado com sucesso. Agora você pode fazer login no iMenu.</p>
                        <a href="https://www.imenucorp.shop/login.html">Fazer Login</a>
                    </div>
                </body>
            </html>
        `);
    } catch (err) {
        console.error("Erro ao verificar e-mail:", err);
        res.status(500).json({ error: "Erro ao verificar e-mail" });
    }
});

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