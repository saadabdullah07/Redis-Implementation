import { createClient } from "redis";
const client = createClient();

client.on('error',(err)=> {console.error(err)})

async function processSumbission(submission : string){
    const{problemId,code,language} = JSON.parse(submission)

    console.log(`Processing submission for problemId ${problemId}...`);
    console.log(`Code: ${code}`);
    console.log(`Language: ${language}`);

    await new Promise((resolve)=> {setTimeout(resolve,1000)})
    console.log(`Finished processing ${problemId}`)
}

async function startWorker(){
    try{
        await client.connect();
        console.log("Worker connected to Redis")

        while(1){
            try{
                const submission = await client.brPop("problems",0);
                // @ts-ignore
                await processSumbission(submission?.element)
            }catch(err){
                console.error('Error in processing submission',err)
            }
        }
    }catch(err){
        console.error('Failed to connect to redis Server')
    }
}

startWorker();