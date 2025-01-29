const amqp = require('amqplib');

const queue = "code_exec"
const sendMessage = async(message)=>{
    try{
        const connection = await amqp.connect('amqp://rabbitmq:5672');
        const channel = await connection.createChannel();

        await channel.assertQueue(queue, {durable: false})
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));

        setTimeout(()=> connection.close(), 500);
    }
    catch(error){
        console.log("ERROR IN Send Message- ", error);
    }
}

module.exports = {sendMessage}