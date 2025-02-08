const client = require('./Redis')
const Docker = require('dockerode')

const docker = new Docker()

const execute = async(data)=>{
    try{
        data = JSON.parse(data);
        const result = await processCode(data.code, data.language, data.input);
        console.log(result);
        await client.set(data.jobId, JSON.stringify(result));
    }
    catch(err){
        console.log("ERROR IN CODE EXECUTION- ",err)
    }
}

const processCode = async( code, language, input ) => {
    try{
        const baseImage = getBaseImage(language);

        const executionCommand = getExecutionCommand(language);

        const containerName = `code-runner-${Date.now()}`

        try{
            const container = await docker.createContainer({
                Image: baseImage,
                name: containerName,
                AttachStdout: true,
                AttachStderr: true,
                Env: [`CODE=${code}`, `INPUT=${input}`],
                HostConfig: {
                    Memory: 128 * 1024 * 1024, //128MB
                    CpuQuota: 50000,
                    PidsLimit: 50, //Handles Fork Bombs
                    CpuPeriod: 100000, //Time limit 
                    MemorySwap: 128 * 1024 * 1024, //Disable Swap
                },
                Cmd: ["sh", "-c", executionCommand]
            })

            await container.start();
            const stream = await container.logs({
                follow: true,
                stdout: true,
                stderr: true,
            })
            let output = ""
            stream.on("data", (chunk)=>{
                output += chunk.toString().replace(/[\x00-\x1F\x7F-\x9F]/g, "");
            })
            // Wait for container to finish the execution
            await container.wait()

            await container.remove()
            return { status: "success", output}
        }
        catch(error){
            console.log("ERROR While Running the code- ", error.message)

            // Cleanup
            try{
                const container = await docker.getContainer(containerName)
                await container.remove({force: true});
            }
            catch{
                console.log("Container does not exist")
            }
            return { status: "error", output:error.message}
        }
    }
    catch(error){
        console.log(error)
        return { status: "error", output:error.message}
    }
}

function getBaseImage(language) {
    const images = {
        python: "python:3.10-alpine",
        javascript: "node:18-alpine",
        java: "openjdk:17-alpine",
        cpp: "gcc",
    };
    return images[language] || "node:18-alpine";
}

function getExecutionCommand(language) {
    const commands = {
    python: `echo "$INPUT" | python3 -c "$CODE"`,
    javascript: `echo "$INPUT" | node -e "$CODE"`,
    java: `
        echo "$CODE" > Main.java &&
        javac Main.java &&
        echo "$INPUT" | java Main
        `,
    cpp: `
        echo "$CODE" > Main.cpp &&
        g++ Main.cpp -o Main &&
        echo "$INPUT" | ./Main
        `,
    };
    return commands[language] || `echo "$INPUT" | node -e "$CODE"`;
}

module.exports = execute