import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export async function sendVerificationEmail(email, token) {
    console.log('📧 Iniciando envio de email para:', email);
    console.log('🔑 Token:', token);
    console.log('🔧 Configuração EMAIL_USER:', process.env.EMAIL_USER ? '✅ Configurado' : '❌ Não configurado');
    console.log('🔧 Configuração EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Configurado' : '❌ Não configurado');

    // VALIDAÇÃO DAS VARIÁVEIS DE AMBIENTE
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ Variáveis de ambiente não configuradas corretamente');
        return false;
    }

    // CONFIGURAÇÃO OTIMIZADA PARA RENDER.COM
    const transporter = nodemailer.createTransport({
        // Use host e port explícitos (mais confiável que 'service')
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // false para port 587
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        // Configurações otimizadas para Render.com
        connectionTimeout: 15000, // 15 segundos (reduzido)
        greetingTimeout: 10000,   // 10 segundos
        socketTimeout: 15000,     // 15 segundos
        // Configurações de TLS
        requireTLS: true,
        tls: {
            rejectUnauthorized: false // Importante para Render.com
        },
        // Debug
        logger: true,
        debug: true
    });

    const verificationUrl = `https://imenu-backend-pd3a.onrender.com/verify-email?token=${token}`;
    
    const mailOptions = {
        from: `"iMenu" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verifique seu email - iMenu',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4CAF50; margin: 0;">iMenu</h1>
                    <p style="color: #666; font-size: 16px;">Menus personalizados, dia a dia simplificado</p>
                </div>
                
                <h2 style="color: #333; text-align: center;">Bem-vindo ao iMenu!</h2>
                
                <p style="color: #555; line-height: 1.6; font-size: 16px;">
                    Para ativar sua conta e começar a usar todos os recursos do iMenu, 
                    clique no botão abaixo para verificar seu endereço de email:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" 
                       style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;
                              font-size: 16px; font-weight: bold;">
                        ✅ Verificar Meu Email
                    </a>
                </div>
                
                <p style="color: #777; font-size: 14px; text-align: center;">
                    Ou copie e cole este link no seu navegador:<br>
                    <span style="word-break: break-all; color: #4CAF50;">${verificationUrl}</span>
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        Se você não criou uma conta no iMenu, por favor ignore este email.<br>
                        Este é um email automático, por favor não responda.
                    </p>
                </div>
            </div>
        `,
        // Texto alternativo para clientes que não suportam HTML
        text: `Verifique seu email iMenu\n\nAcesse este link para verificar sua conta: ${verificationUrl}\n\nSe você não criou esta conta, ignore este email.`
    };

    try {
        console.log('🔄 Tentando verificar conexão com SMTP...');
        
        // Verificação de conexão com timeout próprio
        await Promise.race([
            transporter.verify(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout na verificação')), 10000)
            )
        ]);
        
        console.log('✅ Conexão SMTP verificada com sucesso');
        console.log(`📤 Enviando email para: ${email}`);
        
        // Envio do email com timeout
        const info = await Promise.race([
            transporter.sendMail(mailOptions),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout no envio do email')), 15000)
            )
        ]);
        
        console.log(`✅ Email enviado com sucesso para ${email}`);
        console.log('📨 Message ID:', info.messageId);
        console.log('✅ Resposta:', info.response);
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro detalhado no processo de email:');
        console.error('🔴 Tipo:', error.name);
        console.error('🔴 Código:', error.code);
        console.error('🔴 Mensagem:', error.message);
        console.error('🔴 Stack:', error.stack);
        
        if (error.code === 'EAUTH') {
            console.error('❌ Erro de autenticação - verifique EMAIL_USER e EMAIL_PASS');
        } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
            console.error('❌ Erro de conexão - problema de rede/firewall');
        } else if (error.command) {
            console.error('❌ Comando SMTP falhou:', error.command);
        }
        
        return false;
    } finally {
        // Fechar conexão explicitamente
        transporter.close();
    }
}

export default sendVerificationEmail;