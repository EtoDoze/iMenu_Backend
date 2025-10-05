import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export async function sendVerificationEmail(email, token) {
    console.log('📧 INICIANDO ENVIO DE EMAIL PARA:', email);
    console.log('🔧 Variáveis de ambiente:');
    console.log('   EMAIL_USER:', process.env.EMAIL_USER || '❌ NÃO CONFIGURADO');
    console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Configurado' : '❌ NÃO CONFIGURADO');

    // Verificação CRÍTICA das variáveis
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ ERRO: Variáveis de email não configuradas no Render.com');
        console.error('   Configure EMAIL_USER e EMAIL_PASS nas variáveis de ambiente');
        return false;
    }

    const verificationUrl = `https://imenu-backend-pd3a.onrender.com/verify-email?token=${token}`;
    
    console.log('🔗 Link de verificação:', verificationUrl);

    // CONFIGURAÇÃO SIMPLES DO NODEMAILER
    const transporter = nodemailer.createTransport({
        service: 'gmail', // Use 'service' em vez de host/port
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        // Timeouts reduzidos para evitar travamento
        connectionTimeout: 10000, // 10 segundos
        greetingTimeout: 10000,
        socketTimeout: 10000
    });

    const mailOptions = {
        from: `"iMenu" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verifique seu email - iMenu',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <div style="text-align: center; background: #4CAF50; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0;">🎉 iMenu</h1>
                    <p style="margin: 5px 0 0 0;">Bem-vindo!</p>
                </div>
                
                <div style="padding: 30px; background: #f9f9f9;">
                    <h2 style="color: #333;">Verifique seu email</h2>
                    <p>Olá! Para ativar sua conta no iMenu, clique no botão abaixo:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;
                                  font-size: 16px; font-weight: bold;">
                            ✅ Verificar Minha Conta
                        </a>
                    </div>
                    
                    <p>Ou copie e cole este link no seu navegador:</p>
                    <div style="background: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all;">
                        ${verificationUrl}
                    </div>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 20px;">
                        Se você não criou esta conta, ignore este email.
                    </p>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                    <p>© 2025 iMenu - Todos os direitos reservados</p>
                </div>
            </div>
        `,
        text: `Verifique seu email iMenu\n\nAcesse: ${verificationUrl}\n\nSe não criou esta conta, ignore.`
    };

    try {
        console.log('🔄 Verificando conexão com Gmail...');
        
        // Verificar conexão
        await transporter.verify();
        console.log('✅ Conexão com Gmail estabelecida!');
        
        console.log('📤 Enviando email...');
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ EMAIL ENVIADO COM SUCESSO!');
        console.log('📨 Message ID:', info.messageId);
        console.log('✅ Resposta:', info.response);
        
        return true;
        
    } catch (error) {
        console.error('❌ ERRO AO ENVIAR EMAIL:');
        console.error('🔴 Tipo:', error.name);
        console.error('🔴 Código:', error.code);
        console.error('🔴 Mensagem:', error.message);
        
        if (error.code === 'EAUTH') {
            console.error('❌ ERRO DE AUTENTICAÇÃO:');
            console.error('   - Verifique se o EMAIL_USER está correto');
            console.error('   - Verifique se o EMAIL_PASS é uma SENHA DE APP do Gmail');
            console.error('   - A senha normal do Gmail NÃO funciona');
        } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
            console.error('❌ ERRO DE CONEXÃO:');
            console.error('   - Problema de rede/firewall');
            console.error('   - Gmail bloqueando conexão do Render.com');
        }
        
        return false;
    }
}

export default sendVerificationEmail;