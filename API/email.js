// API/email.js - Implementação básica usando Nodemailer
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export async function sendVerificationEmail(email, token) {
    const transporter = nodemailer.createTransport({
        service: 'Gmail', // Ou outro serviço
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
const webservice = "https://imenu-backend-pd3a.onrender.com"

    const verificationUrl = `${webservice}/verify-email?token=${token}`;
    
    const mailOptions = {
        from: '"iMenu" <no-reply@imenucorp.shop>',
        to: email,
        subject: 'Verifique seu e-mail',
        html: `
            <h2>Por favor, verifique seu e-mail</h2>
            <p>Clique no link abaixo para verificar sua conta:</p>
            <a href="${verificationUrl}">${verificationUrl}</a>
            <p>Se você não solicitou isso, por favor ignore este e-mail.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`E-mail de verificação enviado para ${email}`);
    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        throw error;
    }
}

export default sendVerificationEmail