const { createClient } = require('redis');

const client = createClient({
    socket: {
        host: 'redis-server',
        port: 6379,
    },
});

client.on("error", (err) => {
    console.log("Redis Client Error -", err);
});

const connectRedis = async () => {
    try {
        if (!client.isOpen) {
            await client.connect();
            console.log("Redis client connected");
        }
    } catch (err) {
        console.log("Error connecting Redis client -", err);
    }
};

connectRedis();

module.exports = client;
