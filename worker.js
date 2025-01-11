const amqp = require('amqplib');
const execute = require('./utils/CodeExecute')

// In this file, the RabbitMQ messages will be consumed automatically

const consumeMsg = (async() => {
    try{
        const queue = "code_exec"
        const connection = await amqp.connect('amqp://localhost:5672');
        const channel = await connection.createChannel();

        await channel.assertQueue(queue, {durable: false})

        channel.consume(queue, async(msg) => {
            if (msg !== null){
                await execute(msg.content.toString());
                channel.ack(msg);
            }
        })

    }
    catch(error){
        console.log("Error in consumeMessage- ", error);
    }
})()