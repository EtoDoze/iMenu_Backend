import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// FUNÇÃO SIMPLES E DIRETA
export async function sendVerificationEmail(email, token) {
    console.log('🎯 INICIANDO ENVIO DE EMAIL PARA:', email);
    
    // VERIFICAÇÃO DAS VARIÁVEIS
    console.log('🔍 Verificando variáveis de ambiente:');
    console.log('   EMAIL_USER:', process.env.EMAIL_USER || '❌ NÃO CONFIGURADO');
    console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Configurado' : '❌ NÃO CONFIGURADO');

    // SE AS VARIÁVEIS NÃO ESTIVEREM CONFIGURADAS, RETORNE TRUE PARA O SISTEMA CONTINUAR
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('⚠️  Variáveis não configuradas - sistema continuará normalmente');
        console.log('🔗 Link de verificação que seria enviado:');
        console.log(`   https://imenu-backend-pd3a.onrender.com/verify-email?token=${token}`);
        return true; // ⚠️ IMPORTANTE: Retorne TRUE para o sistema continuar
    }

    const verificationUrl = `https://imenu-backend-pd3a.onrender.com/verify-email?token=${token}`;
    
    console.log('📧 Preparando email com link:', verificationUrl);

    try {
        // CONFIGURAÇÃO SIMPLES
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
        console.log('🔗 Link de verificação (para uso manual):', verificationUrl);
        
        // ⚠️ IMPORTANTE: SEMPRE RETORNE TRUE MESMO COM ERRO
        // Isso permite que o usuário seja criado e peça reenvio depois
        return true;
    }
}

export default sendVerificationEmail;