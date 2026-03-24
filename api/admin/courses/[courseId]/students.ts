import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as firebaseAdmin from 'firebase-admin';

// Tratamento para o empacotador da Vercel
const admin = firebaseAdmin.default || firebaseAdmin;

// Inicialização segura com Cold Start
try {
  if (!admin.apps?.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
      : undefined;

    if (privateKey && process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    }
  }
} catch (error) {
  console.error("Crash no Firebase Init:", error);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Captura o ID do curso vindo da URL dinâmica [courseId]
    const { courseId } = req.query;

    if (!courseId || typeof courseId !== 'string') {
      return res.status(400).json({ success: false, error: 'ID do curso inválido' });
    }

    const db = admin.firestore();

    // 1. Buscar os enrollments (matrículas) baseadas no courseId
    const snapshot = await db.collection('course_enrollments')
      .where('courseId', '==', courseId)
      .get();

    const students = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Retornar a lista (Array) formatada para o frontend
    return res.status(200).json({ success: true, students });

  } catch (error) {
    console.error("Erro ao buscar alunos do curso:", error);
    return res.status(500).json({ success: false, error: 'Erro interno ao buscar alunos' });
  }
}
