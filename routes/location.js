import Express, { Router } from 'express';
import axios from 'axios';

const locrouter = Router();
locrouter.use(Express.json());

locrouter.get('/reverse-geocode', async (req, res) => {
    const { lat, lon } = req.query;

    // 1. Validação dos parâmetros
    if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude (lat) e Longitude (lon) são obrigatórios." });
    }

    try {
        // 2. Configuração do Axios com User-Agent e headers
        const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: { format: 'json', lat, lon },
            headers: {
                'User-Agent': 'iMenuApp/1.0 (contato@imenucorp.shop)', // ⚠️ Obrigatório!
                'Accept-Language': 'pt-BR', // Prioriza resultados em português
            },
        });

        // 3. Extrai os dados relevantes (cidade, país)
        const { address } = response.data;
        const cidade = address.city || address.town || address.village || "Local desconhecido";
        const pais = address.country || "Brasil";

        // 4. Retorna só os dados necessários (opcional)
        res.json({ cidade, pais });

    } catch (error) {
        // 5. Tratamento de erros detalhado
        console.error('Erro ao acessar Nominatim:', error.message);

        if (error.response) {
            // Erro vindo do Nominatim (ex: 403, 500)
            res.status(502).json({ 
                error: "Erro no servidor de geolocalização",
                details: error.response.data 
            });
        } else {
            // Erro de rede ou timeout
            res.status(500).json({ error: "Falha ao conectar com o serviço de localização" });
        }
    }
});

export default locrouter;