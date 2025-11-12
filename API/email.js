// email.js (VERSÃO SIMPLIFICADA)
import nodemailer from 'nodemailer';

// ❌ REMOVA todo o código de carregar .env daqui
// As variáveis JÁ devem estar carregadas por quem importa este módulo

// email.js - CONFIGURAÇÃO CORRIGIDA
export async function sendVerificationEmail(email, token) {
    console.log('🎯 TENTANDO ENVIAR EMAIL PARA:', email);
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('❌ CONFIGURAÇÃO DE EMAIL NÃO ENCONTRADA');
        return false;
    }

    const verificationUrl = `https://imenu-backend-pd3a.onrender.com/verify-email?token=${token}`;
    
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            // 🔥 CONFIGURAÇÕES IMPORTANTES:
            tls: {
                rejectUnauthorized: false
            },
            secure: false,
            requireTLS: true
        });

        // Verificar configuração
        await transporter.verify();
        console.log('✅ Servidor de email configurado corretamente');

        const mailOptions = {
            from: `"iMenu" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verifique seu email - iMenu',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4CAF50; text-align: center;">Bem-vindo ao iMenu!</h2>
                    <p>Clique no link abaixo para verificar sua conta:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${verificationUrl}" 
                           style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            ✅ Verificar Email
                        </a>
                    </div>
                    <p>Se você não criou esta conta, ignore este email.</p>
                </div>
            `,
            // 🔥 ADICIONE TEXTO SIMPLES COMO FALLBACK
            text: `Verifique sua conta iMenu: ${verificationUrl}`
        };

        console.log('🔄 Enviando email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ EMAIL ENVIADO COM SUCESSO!');
        console.log('📨 Message ID:', info.messageId);
        console.log('📧 Resposta:', info.response);
        return true;

    } catch (error) {
        console.error('❌ ERRO AO ENVIAR EMAIL:', error);
        console.error('🔧 Detalhes técnicos:', error.message);
        return false;
    }
}

export default sendVerificationEmail;