# Remote Code Execution Engine Documentation

## Overview
The Remote Code Execution Engine provides a secure and efficient way to execute user-submitted code in an isolated environment. The system leverages **Docker containers** for process isolation, **Redis** for caching execution results, and **RabbitMQ** for efficient job scheduling.

## Architecture
### Components:
1. **API Server (Node.js)**
   - Handles user requests.
   - Sends code execution jobs to RabbitMQ.
   - Retrieves results from Redis or waits for execution completion.

2. **RabbitMQ (Message Queue)**
   - Acts as a queue for incoming execution requests.
   - Ensures jobs are processed asynchronously.

3. **Code Execution Worker**
   - Listens for jobs from RabbitMQ.
   - Spins up a child Docker container to execute the code.
   - Stores execution results in Redis.
   - Sends responses back to the API server.

4. **Docker (Isolated Execution)**
   - Runs code securely inside isolated environments.
   - Supports multiple programming languages (Java, C++, Python, JavaScript).

5. **Redis (Caching Layer)**
   - Caches execution results to prevent redundant computations.
   - Improves response time for frequently run code.

## Execution Flow
1. **User submits code via API**.
2. **API server pushes the request to RabbitMQ**.
3. **Worker fetches the job and spins up a Docker container**.
4. **Code runs inside the isolated container**.
5. **Worker stores results in Redis and sends them back to the API server**.
6. **User retrieves the execution result**.

## API Endpoints
### 1. Execute Code
**Endpoint:** `POST /execute`
**Request Body:**
```json
{
  "language": "python",
  "code": "print(\"Hello, World!\")"
}
```
**Response:**
```json
{
  "output": "Hello, World!",
  "executionTime": "20ms",
  "cached": false
}
```

### 2. Get Execution Result
**Endpoint:** `GET /result/:jobId`
**Response:**
```json
{
  "output": "Hello, World!",
  "executionTime": "20ms",
  "cached": true
}
```

## Security Considerations
- **Process Isolation**: Each code execution runs inside a separate Docker container.
- **Resource Limits**: Containers have CPU/memory constraints to prevent abuse.
- **Time Limits**: Code execution times out after a fixed duration.
- **Input Validation**: User input is sanitized before execution.

## Supported Languages
- Python
- JavaScript (Node.js)
- Java
- C++

## Deployment
### Prerequisites:
- Docker
- Node.js
- RabbitMQ
- Redis

### Steps:
1. Clone the repository:
   ```sh
   git clone <repo_url>
   cd remote-code-execution
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start Redis and RabbitMQ:
   ```sh
   docker-compose up -d
   ```
4. Start the execution service:
   ```sh
   node worker.js
   ```
5. Start the API server:
   ```sh
   node server.js
   ```

## Conclusion
This Remote Code Execution Engine provides a scalable and secure way to execute code across multiple languages, leveraging Docker, RabbitMQ, and Redis for efficiency and security. Future enhancements could include additional language support, sandboxing improvements, and real-time execution logs.

