import { VerEmail, VerEmailDigitado } from "../API/emailVer.js";

import Express, { Router } from 'express';
import { PrismaClient } from "@prisma/client"
import cors from "cors";

const EmailRoter = Router()
const prisma = new PrismaClient()
EmailRoter.use(cors())

EmailRoter.post("emailsen", async (req,res) =>{
  const {email} = req.body;
  VerEmail(email)
})

EmailRoter.post("emailver", async (req,res) =>{
  try{
    const {email, codeemaildigited} = req.body;
    VerEmailDigitado(email, codeemaildigited)
    if(VerEmailDigitado){
      usuario = await prisma.user.update({
        where:{code: codeemaildigited},
        data:{email:email}
      })
    }

  }
  catch{}
})

export default EmailRoter