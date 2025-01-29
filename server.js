const express = require("express")
const bodyParser = require("body-parser")
const {v4:uuidv4} = require("uuid")
const {sendMessage} = require("./utils/RabbitMQ")
const client = require("./utils/Redis")
const cors = require("cors")

const app = express()

app.use(cors())

app.use(bodyParser.json())

app.post('/execute', async (req, res)=>{
    const body = req.body;
    if (!body.code || !body.language) {
        return res.status(400).json({ error: "Code and language are required." });
      }

    const jobId = uuidv4();

    const data = {
        'code': body.code,
        'language': body.language,
        'input': body?.input,
        'jobId': jobId
    }

    await sendMessage(data);

    res.send(`http://localhost:4000/result/${jobId}`)
})

app.get('/result/:id', async (req, res)=>{
    const jobId = req.params.id
    const result = await client.get(jobId);
    res.send(JSON.parse(result))
})

app.listen(4000, ()=>console.log('http://localhost:4000/'))