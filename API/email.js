// API/email.js - Implementação básica usando Nodemailer
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// No arquivo API/email.js, atualize o transporte:

export async function sendVerificationEmail(email, token) {
    const transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        // Configurações importantes para evitar timeout
        connectionTimeout: 10000, // 10 segundos
        greetingTimeout: 10000,
        socketTimeout: 10000,
        // Para Gmail específico
        service: 'gmail',
        tls: {
            rejectUnauthorized: false
        }
    });

    const verificationUrl = `https://imenu-backend-pd3a.onrender.com/verify-email?token=${token}`;
    
    const mailOptions = {
        from: `"iMenu" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verifique seu email - iMenu',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Bem-vindo ao iMenu!</h2>
                <p>Para ativar sua conta, clique no link abaixo:</p>
                <a href="${verificationUrl}" 
                   style="background-color: #4CAF50; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                    Verificar Email
                </a>
                <p>Ou copie e cole este link no seu navegador:</p>
                <p style="word-break: break-all;">${verificationUrl}</p>
                <p>Se você não criou esta conta, ignore este email.</p>
            </div>
        `
    };

    try {
        // Verificar conexão primeiro
        await transporter.verify();
        console.log('Servidor de email pronto');
        
        // Enviar email
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email enviado para ${email}:`, info.messageId);
        return true;
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        // Não lance o erro, apenas registre
        return false;
    }
}

export default sendVerificationEmail