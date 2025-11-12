// routes/test-email.js
import Express from 'express';
import sendVerificationEmail from '../API/email.js';

const testRouter = Express.Router();

testRouter.get('/test-email', async (req, res) => {
    console.log('=== 🧪 TESTE DE EMAIL NO RENDER ===');
    console.log('EMAIL_USER:', process.env.EMAIL_USER || 'UNDEFINED');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'DEFINED' : 'UNDEFINED');
    
    try {
        const result = await sendVerificationEmail('test@example.com', 'test-token-123');
        
        res.json({
            success: true,
            emailConfig: {
                EMAIL_USER: process.env.EMAIL_USER ? '✅' : '❌',
                EMAIL_PASS: process.env.EMAIL_PASS ? '✅' : '❌'
            },
            emailSent: result,
            message: result ? 'Email enviado com sucesso' : 'Falha ao enviar email'
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Novo teste com email customizado
testRouter.post('/test-email-custom', async (req, res) => {
    console.log('=== 🧪 TESTE DE EMAIL CUSTOMIZADO ===');
    const { email, token } = req.body;
    
    if (!email) {
        return res.json({ 
            success: false, 
            error: 'Email não fornecido' 
        });
    }

    console.log('📧 Enviando para:', email);
    console.log('🔑 Token:', token || 'não fornecido');
    console.log('EMAIL_USER:', process.env.EMAIL_USER || '❌ NÃO CONFIGURADO');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ CONFIGURADO' : '❌ NÃO CONFIGURADO');
    
    try {
        const result = await sendVerificationEmail(email, token || 'test-token-' + Date.now());
        
        res.json({
            success: result,
            emailConfig: {
                EMAIL_USER: process.env.EMAIL_USER ? '✅ Configurado' : '❌ Não configurado',
                EMAIL_PASS: process.env.EMAIL_PASS ? '✅ Configurado' : '❌ Não configurado'
            },
            emailSent: result,
            message: result ? '✅ Email enviado com sucesso' : '❌ Falha ao enviar email'
        });
    } catch (error) {
        console.error('❌ Erro:', error);
        res.json({
            success: false,
            error: error.message,
            errorDetails: error.toString()
        });
    }
});

export default testRouter;