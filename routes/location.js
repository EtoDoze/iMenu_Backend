import Express, { Router } from 'express';
import axios from 'axios';

const locrouter = Router()
locrouter.use(Express.json())


locrouter.get('/reverse-geocode', async (req, res) => {
    const { lat, lon } = req.query;
    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar localização" });
    }
});

export default locrouter