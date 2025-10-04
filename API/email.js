import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export async function sendVerificationEmail(email, token) {
    // Configuração mais robusta para Gmail
    const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS // Use App Password, não a senha normal
        },
        // Configurações de timeout
        connectionTimeout: 30000, // 30 segundos
        greetingTimeout: 30000,
        socketTimeout: 30000,
        // Tentar reconexão
        retries: 3,
        // Logger para debug
        logger: true,
        debug: true
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
        console.log('Tentando conectar ao servidor de email...');
        
        // Verificar conexão
        await transporter.verify();
        console.log('Servidor de email conectado com sucesso');
        
        // Enviar email
        console.log(`Enviando email para: ${email}`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email enviado com sucesso para ${email}:`, info.messageId);
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao enviar email:', error);
        console.error('Detalhes do erro:', {
            code: error.code,
            command: error.command,
            response: error.response,
            responseCode: error.responseCode
        });
        
        // Não lance o erro, apenas retorne false
        return false;
    }
}

export default sendVerificationEmail;