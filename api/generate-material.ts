import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import { fetchPandaVideoTranscription } from '../src/backend/services/pandaVideoService.js';
import { generateStudyMaterial } from '../src/backend/services/geminiService.js';

// Estende o timeout para 60 segundos (limite para planos Pro na Vercel, ou máximo permitido no Hobby)
export const maxDuration = 60;

// Inicialização do Firebase Admin com tratamento de quebras de linha na Private Key
if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log('Firebase Admin inicializado na Serverless Function.');
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin:', error);
  }
}

const dbAdmin = admin.firestore();

/**
 * Função auxiliar para extrair o ID do Panda Video de uma URL
 */
function extractPandaId(url: string): string | null {
  try {
    if (!url) return null;
    if (!url.includes('http')) return url;
    
    const urlObj = new URL(url);
    const v = urlObj.searchParams.get('v');
    if (v) return v;

    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    return pathParts[pathParts.length - 1] || url;
  } catch (_e) {
    return url;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apenas aceita requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { lessonIds, folderTitle } = req.body;

    // Validações básicas
    if (!lessonIds || !Array.isArray(lessonIds) || lessonIds.length === 0) {
      return res.status(400).json({ success: false, error: 'IDs das aulas (lessonIds) são obrigatórios.' });
    }

    if (!folderTitle) {
      return res.status(400).json({ success: false, error: 'folderTitle é obrigatório.' });
    }

    const pandaVideoIds: string[] = [];
    
    // 1. Buscar os conteúdos das aulas no Firestore
    for (const lessonId of lessonIds) {
      try {
        const snapshot = await dbAdmin.collection('course_contents')
          .where('lessonId', '==', lessonId)
          .get();
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.type === 'video' && data.videoPlatform === 'panda' && data.videoUrl) {
            const pandaId = extractPandaId(data.videoUrl);
            if (pandaId && !pandaVideoIds.includes(pandaId)) {
              pandaVideoIds.push(pandaId);
            }
          }
        });
      } catch (err) {
        console.error(`Erro ao buscar conteúdos da aula ${lessonId}:`, err);
      }
    }

    if (pandaVideoIds.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Nenhum vídeo do Panda Video encontrado nas aulas selecionadas.' 
      });
    }

    // 2. Extrair transcrições de todos os vídeos encontrados
    let fullTranscription = '';
    for (const videoId of pandaVideoIds) {
      try {
        const transcription = await fetchPandaVideoTranscription(videoId);
        fullTranscription += transcription + '\n\n';
      } catch (error) {
        console.error(`Erro ao extrair transcrição do vídeo ${videoId}:`, error);
      }
    }

    if (!fullTranscription.trim()) {
      return res.status(404).json({ 
        success: false, 
        error: 'Não foi possível extrair nenhuma transcrição dos vídeos selecionados.' 
      });
    }

    // 3. Gerar material didático usando o Gemini
    const generatedText = await generateStudyMaterial(fullTranscription, folderTitle);

    // 4. Retornar o material gerado
    return res.status(200).json({ 
      success: true, 
      markdown: generatedText 
    });

  } catch (error) {
    console.error("Erro crítico na geração de material didático:", error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Erro interno no servidor ao processar IA." 
    });
  }
}
