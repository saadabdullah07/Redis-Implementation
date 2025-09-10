import { createClient } from "redis";
import express from "express"

const app = express();

app.use(express.json())

const client = createClient();
client.on('error', (err) => console.log('Redis client error',err))

app.post('/submit',async function(req,res) {
    const problemId = req.body.problemId
    const code = req.body.code
    const language = req.body.language

    try{
        await client.lPush("problems", JSON.stringify({problemId,code,language}))
        res.status(200).send('submission received')
    }catch(err){
        console.error(err)
        res.status(500).send("Failed to store submission")
    }
})

async function startServer() {
    try{
        await client.connect();
        console.log('Connected to redis server')
        app.listen(3000, ()=> {
            console.log('Redis running on port 3000')
        })
    }catch(err){
        console.error("Failed to connect to redis", err)
    }
}

startServer();