# StudyPal AI — Serverless Student Support Platform

## System Overview

StudyPal AI is an enterprise-grade, serverless artificial intelligence application built on Amazon Web Services (AWS) and powered by the Groq Large Language Model (LLM) inference engine. The platform is designed to automate student support operations by providing instant, accurate answers to academic, administrative, financial, and examination inquiries.

By leveraging cloud-native serverless architecture, StudyPal AI eliminates fixed server overhead, scales automatically with user traffic, and maintains a zero-trust security framework for user authentication and data persistence.

---

## End-to-End System Architecture

The StudyPal AI infrastructure operates on a fully decoupled, serverless model:

```text
[ User Browser Client ]
       │
       ▼
[ Amazon CloudFront (Global CDN) ] ──▶ [ Amazon S3 Bucket (Static Frontend Assets) ]
       │
       ▼ (HTTPS REST API Requests with JWT Authorization)
[ Amazon API Gateway (Prod Stage) ]
       │
       ├──▶ [ Amazon Cognito User Pool ] (JWT Token Verification)
       │
       ▼
[ AWS Lambda Functions ] ─── (Environment Variable: GROQ_API_KEY)
       │                                     │
       ├──▶ [ Groq AI Inference Engine ] ────┘ (Llama-based LLM Processing)
       │
       ▼
[ Amazon DynamoDB Table ] (Persistent Chat Records & Metadata)
```

---

## Core Platform Features

StudyPal AI includes a comprehensive set of features designed to enhance student engagement and automate inquiry handling:

### 1. Interactive AI Assistant & Natural Language Processing

- **Groq LLM Integration:** Processes natural language prompts and generates structured, context-aware responses in real time.
- **Topic Tagging & Categorization:** Supports specialized prompt categorization across predefined academic domains, including *General*, *Academics*, *Tuition & Fees*, and *Exams*.
- **Markdown & Code Formatting:** Renders structured output, technical code blocks, bullet points, and numbered lists cleanly in the user interface.

### 2. User Authentication & Access Control

- **Cognito Identity Federation:** Handles secure user registration, email address verification, password policy enforcement, and user session management.
- **JSON Web Token (JWT) Security:** Authenticates every backend API request using short-lived Bearer tokens to protect user-specific data.

### 3. Chat History & Data Persistence

- **Persistent Conversation Logs:** Automatically saves every user query and corresponding AI response to an Amazon DynamoDB table with exact timestamps and record identifiers.
- **Cross-Device History Sync:** Authenticated users can retrieve their full conversation history from any device upon sign-in, with sessions grouped by chat thread.
- **Message Management:** Allows users to explicitly delete specific conversation records or entire chat sessions from the database, synced remotely so deletions persist across devices.

### 4. Static Knowledge Base & FAQ Engine

- **Public FAQ Retrieval:** Offers a dedicated, unauthenticated endpoint for fetching static, pre-configured campus FAQs to reduce redundant AI queries for common questions.

### 5. Export & Collaboration Capabilities

- **Chat Export:** Provides client-side functionality to export active chat transcripts or FAQ content as plain text files for offline review and record-keeping.

---

## Complete Tech Stack Specifications

| Service / Technology | Component Classification | Purpose in Architecture |
|---|---|---|
| **AWS SAM (Serverless Application Model)** | Infrastructure as Code (IaC) | Declarative configuration and single-command deployment of AWS cloud infrastructure. |
| **Amazon CloudFront** | Content Delivery Network (CDN) | Delivers frontend web assets via global edge locations over HTTPS. |
| **Amazon S3** | Object Storage | Hosts static frontend build artifacts (index.html, JavaScript, CSS). |
| **Amazon API Gateway** | API Management | Exposes RESTful endpoints, handles CORS preflight requests, and manages routing. |
| **Amazon Cognito** | Identity & Access Management | Manages user pools, user credentials, and authentication token issuance. |
| **AWS Lambda** | Serverless Compute | Executes Python 3.12 request handlers on demand without persistent compute instances. |
| **Amazon DynamoDB** | NoSQL Database | Provides single-digit millisecond latency storage for questions, responses, and user IDs. |
| **Groq AI Engine** | LLM API Endpoint | Executes rapid inference using Llama-based models for prompt processing. |

---

## API & Lambda Microservices Logic

### 1. POST /ask — AskQuestionFunction

- **Role:** Primary inference and storage pipeline.
- **Authorization:** Required (Cognito JWT).
- **Process Flow:**
  1. Accepts JSON payload containing the prompt, optional category tag, optional file attachment, conversation history, and chat thread identifiers (`chatId`, `chatTitle`).
  2. Extracts the `GROQ_API_KEY` environment variable.
  3. Formulates and executes an HTTP POST request to the Groq API endpoint.
  4. Formats the response and executes a `PutItem` operation to the DynamoDB `QuestionsTable`.
  5. Returns a JSON payload containing the answer and database item ID.

### 2. GET /question — GetQuestionsFunction

- **Role:** Conversation history retrieval.
- **Authorization:** Required (Cognito JWT).
- **Process Flow:** Performs a lookup on `QuestionsTable` filtered by the authenticated user's ID, returning an array of historical query records including `chatId` and `chatTitle` for thread reconstruction.

### 3. DELETE /question/{id} — DeleteQuestionFunction

- **Role:** Individual record removal.
- **Authorization:** Required (Cognito JWT).
- **Process Flow:** Verifies record ownership against the authenticated user's ID, then issues a `DeleteItem` request targeting the unique record ID in `QuestionsTable`.

### 4. GET /faqs — GetFaqFunction

- **Role:** Static FAQ provider.
- **Authorization:** None (Public).
- **Process Flow:** Queries `QuestionsTable` to return standard campus informational records without requiring user sign-in.

---

## Deployment Guide

### Step 1: System Requirements

The deployment host must have the following tools installed and configured:

- **AWS CLI** (configured via `aws configure`)
- **AWS SAM CLI**
- **Python 3.12**
- **Groq API Key** (generated at [console.groq.com/keys](https://console.groq.com/keys))

> **Security note:** Never commit your Groq API key to version control. The `GroqApiKey` parameter uses `NoEcho: true` in CloudFormation, ensuring it is redacted from all logs and stack outputs.

### Step 2: Repository Setup

```bash
git clone <repository-url>
cd student-support-ai-api
```

Ensure `samconfig.toml` matches the following baseline configuration (no hardcoded secret overrides):

```toml
version = 0.1

[default.deploy.parameters]
stack_name = "student-support-ai-system"
resolve_s3 = true
s3_prefix = "student-support-ai-system"
capabilities = "CAPABILITY_IAM"
image_repositories = []
confirm_changeset = true

[default.global.parameters]
region = "us-east-1"
```

### Step 3: SAM Build & Guided Deployment

```bash
sam build && sam deploy --guided
git clone https://github.com/EAkatse/tomcat-student-support-ai-api
```

#### Terminal Interactive Prompts

| Prompt | Value |
|---|---|
| Stack Name | `student-support-ai-system` |
| AWS Region | `us-east-1` |
| Parameter GroqApiKey | Paste personal Groq API key (`gsk_...`) |
| Confirm changes before deploy | `Y` |
| Allow SAM CLI IAM role creation | `Y` |
| Save arguments to configuration file | `Y` |

### Step 4: Frontend Configuration & Synchronization

Upon stack creation, SAM outputs critical infrastructure variables. Open `frontend/index.html` and update the `CONFIG` object with the printed values:

```javascript
const CONFIG = {
    UserPoolId: "<YOUR_USER_POOL_ID>",
    ClientId: "<YOUR_USER_POOL_CLIENT_ID>",
    ApiUrl: "<YOUR_API_GATEWAY_URL>"
};
```

Synchronize the frontend asset to the deployed S3 bucket:

```bash
aws s3 cp frontend/index.html s3://<FRONTEND_S3_BUCKET_NAME>/
```

Access the web application using the generated `CloudFrontURL`. 

### Future Updates

For subsequent updates to application code or infrastructure:

```bash
sam build && sam deploy
```

SAM will read saved configuration from `samconfig.toml` automatically.

---

## Security Architecture

- **Bring Your Own Key (BYOK) Pattern:** API keys are injected per deployment stack, preventing shared credentials across environments or version control repositories.
- **CloudFormation Parameter Masking:** The `GroqApiKey` parameter uses `NoEcho: true`, ensuring secret values are redacted from CloudFormation logs and output descriptions.
- **IAM Role Scoping:** Lambda functions execute under custom IAM roles restricted strictly to necessary DynamoDB actions (`PutItem`, `GetItem`, `DeleteItem`, etc.) targeting specific resource ARNs.
- **Ownership Enforcement:** The `DELETE /question/{id}` endpoint verifies the requesting user's Cognito `sub` matches the `userId` stored on the record before executing deletion.

---

## Operational Management

### Live Function Monitoring

To stream live runtime logs from the terminal:

```bash
sam logs -n AskQuestionFunction --stack-name student-support-ai-system --tail
```

### Stack Redeployment

```bash
sam build && sam deploy
```
> **EduAssist AI** is a production-ready serverless application demonstrating modern cloud architecture, AI integration, DevOps practices, and scalable software engineering principles.
