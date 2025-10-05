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

export default testRouter;