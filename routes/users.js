import Express, { Router } from 'express';
import { PrismaClient } from "@prisma/client"
import cors from "cors";

const userRouter = Router()
userRouter.use(Express.json())
const prisma = new PrismaClient()
userRouter.use(cors())

userRouter.post('/create', async (req,res) => {
    try{
    const {name, email, password} = req.body
    const newuser = await prisma.user.create({
        data:{
            name, email, password
        },
    })
    res.status(201).json({message: "usuario criado", user: newuser})}
    catch(err){
        res.status(500).json({message: "erro ao criar", err})
        return;
    }
})

userRouter.post('/login', async (req,res) => {
try{
    const {senha, email} = req.body
        const finduser = await prisma.user.findUnique({
            where: {
                email: req.body.email
            }
        })
        if(!finduser){
            res.status(404).json({message: "Usuario não encontrado"})
            return;
        }    
        if(finduser == null){
            res.status(404).json({message: "Usuario não encontrado"})
            return;

        }
        res.status(200).json({message: "Usuario encontrado", user: finduser})
    }
    catch{console.log("deu erro"); return res.status(500).json({message: "usuario não achado"})}
})


export default userRouter