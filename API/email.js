// email.js - COM GMAIL API
import fetch from 'node-fetch';

export async function sendVerificationEmail(email, token) {
    console.log('🎯 ENVIANDO EMAIL VIA GMAIL API PARA:', email);
    
    const verificationUrl = `https://imenu-backend-pd3a.onrender.com/verify-email?token=${token}`;
    
    try {
        // Enviar email via API do seu próprio backend
        const response = await fetch('https://imenu-backend-pd3a.onrender.com/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: email,
                subject: 'Verifique seu email - iMenu',
                html: `
                    <div>Clique para verificar: <a href="${verificationUrl}">${verificationUrl}</a></div>
                `
            })
        });

        if (response.ok) {
            console.log('✅ Email enviado via API');
            return true;
        } else {
            console.log('❌ Falha no envio via API');
            return false;
        }

    } catch (error) {
        console.error('❌ ERRO NA API:', error.message);
        return false;
    }
}