const client = require('./Redis')
const {exec} = require('child_process')
const Docker = require('dockerode')
const fs = require('fs')
const path = require('path')

const docker = new Docker()

const execute = async(data)=>{
    console.log(data+"Executing")
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
        const fileExtension = getFileExtension(language);
        const executionCommand = getExecutionCommand(language);

        const containerName = `code-runner-${Date.now()}`
        const tempDir = path.join(__dirname, "temp", containerName);

        fs.mkdirSync(tempDir, { recursive: true });
        fs.writeFileSync(path.join(tempDir, `Main.${fileExtension}`), code);
        fs.writeFileSync(path.join(tempDir, "input.txt"), input || "");
        try{
            const container = await docker.createContainer({
                Image: baseImage,
                name: containerName,
                AttachStdin: false,
                AttachStdout: true,
                HostConfig: {
                    Memory: 128 * 1024 * 1024, //128MB
                    CpuQuota: 50000,
                    Binds: [`${tempDir}:/app`]
                },
                Cmd: ["sh", "-c", `cd /app && ${executionCommand}`]
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
            fs.rmSync(tempDir, {recursive: true, force: true})
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
            fs.rmSync(tempDir, {recursive: true, force: true})
            return { status: "error", output:error.message}
        }
    }
    catch(error){
        console.log(error)
        fs.rmSync(tempDir, {recursive: true, force: true})
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

function getFileExtension(language) {
    const extensions = {
      python: "py",
      javascript: "js",
      java: "java",
      cpp: "cpp",
    };
    return extensions[language] || "txt";
}

function getExecutionCommand(language) {
    const commands = {
      python: "python3 Main.py < input.txt",
      javascript: "node Main.js < input.txt",
      java: "javac Main.java && java Main < input.txt",
      cpp: "g++ Main.cpp -o Main && ./Main < input.txt",
    };
    return commands[language] || "node Main.js";
}

module.exports = execute