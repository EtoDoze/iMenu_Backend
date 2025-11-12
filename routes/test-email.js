// test-email.js
import sendVerificationEmail from '../API/email.js';

async function testEmail() {
    console.log('🧪 TESTANDO CONFIGURAÇÃO DE EMAIL...');
    
    const testEmail = 'seu-email@gmail.com'; // Use um email real para teste
    const testToken = 'test-token-123';
    
    const result = await sendVerificationEmail(testEmail, testToken);
    
    if (result) {
        console.log('✅ Teste de email: SUCESSO');
    } else {
        console.log('❌ Teste de email: FALHOU');
        console.log('💡 Verifique:');
        console.log('1. Variáveis EMAIL_USER e EMAIL_PASS no .env');
        console.log('2. Senha de app do Gmail (não use a senha normal)');
        console.log('3. Verificação em 2 etapas ativada');
    }
}

testEmail();