import express from "express";
import { PrismaClient } from "@prisma/client";
import sendVerificationEmail from "./email.js"; // ✅ IMPORTE CORRETO

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

        // ✅ USANDO A FUNÇÃO CORRETA
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