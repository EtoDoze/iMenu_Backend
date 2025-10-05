import dotenv from 'dotenv';
dotenv.config();

// SOLUÇÃO DEFINITIVA COM SENDGRID
export async function sendVerificationEmail(email, token) {
    console.log('📧 Iniciando envio de email via SendGrid para:', email);
    console.log('🔑 Token:', token);
    console.log('🔧 SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Configurado' : '❌ Não configurado');

    if (!process.env.SENDGRID_API_KEY) {
        console.error('❌ SENDGRID_API_KEY não configurada');
        return false;
    }

    const verificationUrl = `https://imenu-backend-pd3a.onrender.com/verify-email?token=${token}`;
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
                .header { text-align: center; background: #4CAF50; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
                .content { padding: 30px; background: #f9f9f9; }
                .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Bem-vindo ao iMenu!</h1>
                </div>
                <div class="content">
                    <h2>Verifique seu email</h2>
                    <p>Olá! Estamos felizes em tê-lo conosco. Para começar a usar o iMenu, precisamos verificar seu endereço de email.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" class="button">✅ Verificar Minha Conta</a>
                    </div>
                    
                    <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
                    <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">
                        ${verificationUrl}
                    </p>
                    
                    <p><strong>Dica:</strong> Este link expira em 24 horas por segurança.</p>
                </div>
                <div class="footer">
                    <p>Se você não criou esta conta, ignore este email.</p>
                    <p>© 2025 iMenu - Todos os direitos reservados</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const textContent = `Verifique seu email iMenu\n\nAcesse este link para verificar sua conta: ${verificationUrl}\n\nSe você não criou esta conta, ignore este email.`;

    try {
        // Usando fetch nativo para evitar dependências extras
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personalizations: [{
                    to: [{ email: email }],
                    subject: 'Verifique seu email - iMenu'
                }],
                from: {
                    email: 'imenucompany12@gmail.com', // Use um email válido
                    name: 'iMenu'
                },
                content: [
                    {
                        type: 'text/html',
                        value: htmlContent
                    },
                    {
                        type: 'text/plain',
                        value: textContent
                    }
                ]
            })
        });

        if (response.ok) {
            console.log(`✅ Email enviado com SUCESSO para ${email} via SendGrid`);
            return true;
        } else {
            const errorData = await response.text();
            console.error('❌ Erro SendGrid:', response.status, errorData);
            return false;
        }

    } catch (error) {
        console.error('❌ Erro ao enviar email via SendGrid:', error.message);
        return false;
    }
}

export default sendVerificationEmail;