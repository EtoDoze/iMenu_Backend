import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export async function sendVerificationEmail(email, token) {
    // Configuração mais robusta para Gmail
    const link = `https://imenu-backend-pd3a.onrender.com/verify-email?token=${token}`;
    
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
        to: email,
        from: 'noreply@imenucorp.shop', // Use um domínio verificado no SendGrid
        subject: 'Verifique seu e-mail - iMenu',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Bem-vindo ao iMenu!</h2>
                <p>Para ativar sua conta, clique no link abaixo:</p>
                <a href="${link}" 
                   style="background-color: #4CAF50; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                    Verificar Email
                </a>
                <p>Se você não criou esta conta, ignore este email.</p>
            </div>
        `
    };

    try {
        await sgMail.send(msg);
        console.log(`✅ Email SendGrid enviado para ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Erro SendGrid:', error);
        return false;
    }
}

export default sendVerificationEmail;