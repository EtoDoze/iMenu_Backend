import Express, { Router } from 'express';
import { PrismaClient } from "@prisma/client";
import jwt from 'jsonwebtoken';

const avaRoot = Router();
avaRoot.use(Express.json());
const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY;

function decodeToken(authHeader) {
    try {
        const token = authHeader && authHeader.split(' ')[1]; // Extrai o token do cabeçalho
        if (!token) return null;

        const decoded = jwt.verify(token, SECRET_KEY);
        return decoded.userId; // Supondo que o token contenha o ID do usuário
    } catch (err) {
        return null; // Token inválido
    }
}

avaRoot.get('/avaliacoes/media/:cardId', async (req, res) => {
  const cardId = Number(req.params.cardId);

  try {
    // Busca todas as avaliações do card usando a relação correta
    const avaliacoes = await prisma.avaliacao.findMany({
      where: { 
        postId: cardId // Forma direta também funciona quando o campo está no modelo
      },
      select: {
        nota: true
      }
    });

    // Calcula a média
    const totalAvaliacoes = avaliacoes.length;
    const somaNotas = avaliacoes.reduce((total, av) => total + av.nota, 0);
    const media = totalAvaliacoes > 0 ? (somaNotas / totalAvaliacoes) : 0;

    res.json({
      success: true,
      media: Number(media.toFixed(1)), // Converte para número após toFixed
      total: totalAvaliacoes
    });

  } catch (error) {
    console.error('Erro ao calcular média:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao calcular média',
      details: error.message 
    });
  }
});

// 2. Rota para salvar uma avaliação
avaRoot.post('/avaliar/:cardId', async (req, res) => {
  const cardId = Number(req.params.cardId);
  const { nota } = req.body;

  // Validações
  if (nota === undefined || nota === null || nota < 1 || nota > 5) {
    return res.status(400).json({
      success: false,
      error: 'Nota inválida (deve ser um número entre 1 e 5)'
    });
  }

  try {
    // Verifica se o card existe
    const cardExiste = await prisma.card.findUnique({
      where: { id: cardId },
      select: { id: true }
    });

    if (!cardExiste) {
      return res.status(404).json({
        success: false,
        error: 'Card não encontrado'
      });
    }

    // Cria a avaliação
    const avaliacaoCriada = await prisma.avaliacao.create({
      data: {
        postId: cardId, // Forma direta de associar
        nota: Number(nota)
      },
      select: {
        id: true,
        nota: true,
        createdAt: true
      }
    });

    // Calcula a nova média para retornar na resposta
    const todasAvaliacoes = await prisma.avaliacao.findMany({
      where: { postId:cardId },
      select: { nota: true }
    });

    const soma = todasAvaliacoes.reduce((acc, av) => acc + av.nota, 0);
    const novaMedia = soma / todasAvaliacoes.length;

    res.json({
      success: true,
      avaliacao: avaliacaoCriada,
      media: Number(novaMedia.toFixed(1)),
      totalAvaliacoes: todasAvaliacoes.length
    });

  } catch (error) {
    console.error('Erro ao salvar avaliação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao salvar avaliação',
      details: error.message
    });
  }
});


export default avaRoot;