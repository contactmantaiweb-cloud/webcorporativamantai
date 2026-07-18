import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // 1. API - Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 2. API - Gemini AI financial advice/chat
  let aiClient: GoogleGenAI | null = null;

  function getAIClient() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('La clave API de Gemini no está configurada. Por favor, agrégala en Configuración > Secretos (Settings > Secrets).');
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  app.post('/api/ai/analyze', async (req, res) => {
    try {
      const { prompt, context } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'El campo "prompt" es obligatorio.' });
      }

      const ai = getAIClient();
      
      const systemInstruction = `Eres un asesor financiero experto y amigable para "Mantai Agencia Digital". 
Tu objetivo es ayudar a los miembros del equipo y administradores a comprender sus finanzas, presupuestos, cobros y facturación.
Responde de forma clara, profesional, concisa y en español de Costa Rica/América Latina si es apropiado (usa la moneda Colón costarricense ₡ si no se especifica otra).
Usa formato Markdown elegante en tu respuesta.`;

      const contents = context 
        ? `Contexto financiero actual:\n${JSON.stringify(context, null, 2)}\n\nPregunta/Instrucción del usuario:\n${prompt}`
        : prompt;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ text: response.text || 'No se obtuvo respuesta del modelo.' });
    } catch (error: any) {
      console.error('Error in /api/ai/analyze:', error);
      res.status(500).json({ 
        error: error.message || 'Error interno del servidor al procesar la solicitud de IA.' 
      });
    }
  });

  // 3. Mount Vite Middleware for Development / Serve Static Files for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
