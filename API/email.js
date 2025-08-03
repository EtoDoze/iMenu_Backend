// API/email.js - Envio de e-mail de verificação com layout HTML
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export async function sendVerificationEmail(email, token) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // ex: smtp-relay.brevo.com
    port: Number(process.env.EMAIL_PORT), // ex: 587
    secure: false, // STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false // evita erros com SSL em servidores compartilhados
    }
  });

  const webservice = "https://imenu-backend-pd3a.onrender.com";
  const verificationUrl = `${webservice}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"iMenu" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verifique seu e-mail',
    html: `
<div style="max-width:600px;margin:auto;background-color:#1c1c1c;border-radius:10px;padding:30px;font-family:'Segoe UI',sans-serif;color:#ffffff;">
  <div style="text-align:center;padding-bottom:20px;border-bottom:1px solid #333;">
    <img src="https://i.imgur.com/fcnYkO0.png" alt="Logo iMenu" style="max-height:60px;margin-bottom:10px;" />
    <h1 style="font-size:22px;color:#4caf50;margin:20px 0 10px;">Verifique seu e-mail</h1>
  </div>
  <p style="font-size:16px;line-height:1.5;color:#ccc;">Olá! Obrigado por se cadastrar no <strong>iMenu</strong> — menus personalizados, dia a dia simplificado.</p>
  <p style="font-size:16px;line-height:1.5;color:#ccc;">Para garantir sua segurança e permitir que você aproveite todos os recursos, precisamos que você verifique seu endereço de e-mail.</p>
  <div style="text-align:center;margin:30px 0;">
    <a href="${verificationUrl}" style="display:inline-block;background-color:#4caf50;color:#fff;padding:14px 28px;border-radius:5px;text-decoration:none;font-weight:bold;">Verificar minha conta</a>
  </div>
  <p style="font-size:16px;line-height:1.5;color:#ccc;">Se você não solicitou este cadastro, pode simplesmente ignorar esta mensagem.</p>
  <div style="font-size:12px;color:#888;text-align:center;margin-top:40px;">© 2025 iMenu — Todos os direitos reservados</div>
</div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ E-mail de verificação enviado para ${email}`);
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error);
    throw error;
  }
}

export default sendVerificationEmail;
