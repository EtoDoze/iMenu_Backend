import nodemailer from 'nodemailer';

// email.js - COM GMAIL API
// email.js - COM RESEND
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationEmail(email, token) {
    console.log('🎯 ENVIANDO EMAIL VIA RESEND PARA:', email);
    
    const verificationUrl = `https://imenu-backend-pd3a.onrender.com/verify-email?token=${token}`;
    
    try {
        const { data, error } = await resend.emails.send({
            from: 'iMenu <noreply@imenucorp.shop>',
            to: [email],
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
            `
        });

        if (error) {
            console.error('❌ ERRO RESEND:', error);
            return false;
        }

        console.log('✅ EMAIL ENVIADO VIA RESEND! ID:', data.id);
        return true;

    } catch (error) {
        console.error('❌ ERRO NO RESEND:', error);
        return false;
    }
}

export default sendVerificationEmail;