// teste.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// ✅ CARREGAR .env PRIMEIRO
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const possibleEnvPaths = [
    join(__dirname, '.env'),
    join(__dirname, '..', '.env'),
    join(process.cwd(), '.env'),
];

let envLoaded = false;

for (const envPath of possibleEnvPaths) {
    if (existsSync(envPath)) {
        console.log('📁 Carregando .env de:', envPath);
        dotenv.config({ path: envPath }); // ✅ AGORA CARREGA!
        envLoaded = true;
        break;
    }
}

if (!envLoaded) {
    console.log('❌ Nenhum .env encontrado!');
    process.exit(1);
}

console.log('🔍 Variáveis carregadas:');
console.log('EMAIL_USER:', process.env.EMAIL_USER || '❌ Não configurado');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Configurado' : '❌ Não configurado');

// ✅ AGORA importe o email
import sendVerificationEmail from './email.js';

// Execute o teste
await sendVerificationEmail("mihim13626@bllibl.com", "1234567890abcdef");