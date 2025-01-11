const client = require('./Redis')

const execute = async(data)=>{
    try{
        data = JSON.parse(data);
        await client.set(data.jobId, JSON.stringify(data));
    }
    catch(err){
        console.log("ERROR IN CODE EXECUTION- ",err)
    }
}

module.exports = execute