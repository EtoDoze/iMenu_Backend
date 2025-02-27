const emailnode = require("nodemailer");

const transporter = emailnode.createTransport({
    service: "gmail",
    auth:{
        user: "imenucompany12@gmail.com", // Seu e-mail
        pass: "jrpr mzsa pnyh nrff", // Sua senha ou senha de app (recomendado)
      },
})

async function VerEmail(email) {
    try {
      const info = await transporter.sendMail({
        from: '"iMenu" <imenucompany12@gmail.com>', // Remetente
        to: email, // Destinatário
        subject: "mensagem pra voce", // Assunto
        text: "Este é um teste de e-mail enviado pelo Nodemailer!", // Corpo do e-mail em texto
        html: "<h1>a mensagem é:</h1><p>vai tomar no seu cu</p>", // Corpo do e-mail em HTML
      });
      
      sendEmail();
      console.log("E-mail enviado com sucesso:", info.messageId);
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
    }
  }
  
  
  // Chamando a função
  module.exports = VerEmail;