import Express, { Router } from 'express';
import { PrismaClient } from "@prisma/client"

const admRouter = Router()
admRouter.use(Express.json())
const prisma = new PrismaClient()

admRouter.get('/users',async (req,res) => {
  const users = await prisma.user.findMany({});
    res.json(users)
})

admRouter.delete('/delete', async (req,res) => {
try{
  const {name, email} = req.body
    const deleteuser = await prisma.user.delete({
        where:{
            name: req.body.name,
            email: req.body.email
        }
    })
    if(deleteuser){
        res.status(200).json({message:"usuario apagado", user:deleteuser})
    }
}
catch(err){
    res.status(500).json({message: "usuario não apagado", err})
}
})

export default admRouter