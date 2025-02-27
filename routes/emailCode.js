/*import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY;*/
const emailnode = require("nodemailer");

const transporter = emailnode.createTransport({
    service: "gmail",
    auth:{
        user: "imenucompany12@gmail.com", // Seu e-mail
        pass: "jrpr mzsa pnyh nrff", // Sua senha ou senha de app (recomendado)
      },
})

async function VerEmail(email, senha) {
    try {
      const info = await transporter.sendMail({
        from: '"iMenu" <imenucompany12@gmail.com>', // Remetente
        to: email, // Destinatário
        subject: "Seu codigo de verificação", // Assunto
        text: "Veja o codigo para verificar sua conta", // Corpo do e-mail em texto
        html: `<h1>Seu codigo:</h1><p>${senha}</p>`, // Corpo do e-mail em HTML
      });
      
     emailnode.sendEmail;
      console.log("E-mail enviado com sucesso:", info.messageId);
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
    }
  }
  
 module.exports = VerEmail;