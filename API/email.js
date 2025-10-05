import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// FUNÇÃO SIMPLES E DIRETA
export async function sendVerificationEmail(email, token) {
    console.log('🎯 TENTANDO ENVIAR EMAIL PARA:', email);
    
    // VERIFICAÇÃO DETALHADA
    const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;
    
    if (!hasEmailConfig) {
        console.log('❌ CONFIGURAÇÃO DE EMAIL NÃO ENCONTRADA');
        console.log('🔗 Link de verificação para teste:');
        console.log(`   https://imenu-backend-pd3a.onrender.com/verify-email?token=${token}`);
        
        // ✅ RETORNE FALSE PARA INDICAR QUE NÃO FOI ENVIADO
        return false;
    }

    const verificationUrl = `https://imenu-backend-pd3a.onrender.com/verify-email?token=${token}`;
    
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

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
                    <p>Ou copie este link: ${verificationUrl}</p>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">
                        Se você não criou esta conta, ignore este email.
                    </p>
                </div>
            `
        };

        console.log('🔄 Enviando email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ EMAIL ENVIADO COM SUCESSO!');
        console.log('📨 Message ID:', info.messageId);
        
        return true;

    } catch (error) {
        console.error('❌ ERRO AO ENVIAR EMAIL:', error.message);
        console.log('🔗 Link para verificação manual:', verificationUrl);
        return false;
    }
}
export default sendVerificationEmail;