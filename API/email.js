import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "imenucompany12@gmail.com", // Substitua pelo seu e-mail
    pass: "lily ualf fplp exyc", // Substitua pela sua senha ou senha de app
  },
});

export const sendVerificationEmail = async (email, token) => {
  const webservice = "https://imenu-backend-pd3a.onrender.com" //"http://localhost:3006"
  const verificationLink = `${webservice}/verify-email?token=${token}`;
  console.log("Link de verificação:", verificationLink); // Log para depuração

  const mailOptions = {
    from: '"Imenu" <imenucompany12@gmail.com>',
    to: email,
    subject: "Verifique seu e-mail",
    text: "Seu codigo de verificação do site",
    html: `<p>Clique no link para verificar seu e-mail: <a href="${verificationLink}">${verificationLink}</a></p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("E-mail enviado com sucesso para:", email);
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
  }
};

export default sendVerificationEmail