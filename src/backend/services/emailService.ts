import * as nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 465;

    if (!user || !pass) {
      console.warn('⚠️ SMTP_USER ou SMTP_PASS não configurados. O envio de e-mail falhará.');
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: user || 'seu-email@gmail.com',
        pass: pass || 'sua-senha-de-app'
      }
    });
  }
  return transporter;
};

export const sendWelcomeEmail = async (name: string, email: string, password: string) => {
  const mailOptions = {
    from: `"Insanus Educacional" <${process.env.SMTP_USER || 'seu-email@gmail.com'}>`,
    to: email,
    subject: 'Seus acessos chegaram! Bem-vindo(a) à Insanus',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #111; color: #fff; padding: 20px; border-radius: 8px;">
        <h2 style="color: #e53e3e;">Olá, ${name}!</h2>
        <p>Seu pagamento foi aprovado e seus acessos foram liberados com sucesso.</p>
        <p>Acesse a plataforma através do link abaixo:</p>
        <p><strong>URL:</strong> <a href="https://www.portal-insanus.com/login" style="color: #60a5fa;">Acessar Plataforma</a></p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p><strong>Senha Provisória:</strong> ${password}</p>
        <hr style="border-color: #333; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">Por segurança, recomendamos que você altere esta senha imediatamente após o seu primeiro login, acessando a aba "Editar Perfil" na tela inicial.</p>
      </div>
    `
  };
  
  try {
    const client = getTransporter();
    await client.sendMail(mailOptions);
    console.log(`[E-MAIL] Boas-vindas enviadas com sucesso para ${email}`);
  } catch (error) {
    console.error("❌ ERRO CRÍTICO NO SMTP (FALHA AO ENVIAR E-MAIL):", error);
  }
};

export const sendAccessNotificationEmail = async (name: string, email: string, productName: string) => {
  const mailOptions = {
    from: `"Insanus Educacional" <${process.env.SMTP_USER || 'seu-email@gmail.com'}>`,
    to: email,
    subject: 'Novo Acesso Liberado! - Insanus',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #111; color: #fff; padding: 20px; border-radius: 8px;">
        <h2 style="color: #e53e3e;">Olá, ${name}!</h2>
        <p>Identificamos uma nova compra e seu acesso ao produto <strong>${productName}</strong> já está disponível na sua conta.</p>
        <p>Como você já possui cadastro, basta fazer login com seu e-mail e senha habituais.</p>
        <p>Acesse a plataforma através do link abaixo:</p>
        <p><strong>URL:</strong> <a href="https://www.portal-insanus.com/login" style="color: #60a5fa;">Acessar Plataforma</a></p>
        <hr style="border-color: #333; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">Bons estudos!</p>
      </div>
    `
  };
  
  try {
    const client = getTransporter();
    await client.sendMail(mailOptions);
    console.log(`[E-MAIL] Notificação de novo acesso enviada para ${email}`);
  } catch (error) {
    console.error("❌ ERRO CRÍTICO NO SMTP (FALHA AO ENVIAR NOTIFICAÇÃO):", error);
  }
};
