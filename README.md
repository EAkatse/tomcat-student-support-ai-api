# 🎓 StudyPal AI - Serverless API & Frontend

Welcome to the **StudyPal AI** project! 
This repository contains a fully serverless backend built with AWS SAM, API Gateway, DynamoDB, Cognito Authentication, and Python Lambda functions integrated with Groq LLM, along with a CloudFront-hosted frontend.

---

## 🛠️ Prerequisites

Before getting started, make sure you have installed and configured:
1. **AWS CLI** (configured with your AWS credentials: `aws configure`)
2. **AWS SAM CLI**
3. **Python 3.12**
4. **Groq API Key**: Get a free API key in 30 seconds at [console.groq.com/keys](https://console.groq.com/keys). 
					 Remenber to always keep your code secret and do not ever show it in any of your codes. Your Groq API key is marked with NoEcho: true in CloudFormation, so it will never be exposed in logs or pushed to GitHub.

---

## 🚀 Deployment Instructions

### Step 1: Clone the Repository
```bash
git clone <your-repository-url>
cd student-support-ai-api


---
### Step 2: Build & Deploy with SAM
Run the following commands in the root directory:

```bash
sam build && sam deploy


###While setting default arguments for 'sam deploy, input the following when prompted:     

        setting default arguments for 'sam deploy
        =========================================
        Stack Name [student-support-ai-system]: student-support-ai-system
        AWS Region [us-east-1]: us-east-1
        Parameter GroqApiKey: Paste your personal Groq API Key (gsk_...)
        Confirm changes before deploy [y/N]: y 
        Allow SAM CLI IAM role creation [Y/n]: y
        Disable rollback [y/N]: n
        Save arguments to configuration file [Y/n]: y
        SAM configuration file [samconfig.toml]: (Press Enter Key) 
        SAM configuration environment [default]: (Press Enter Key)



---
### Step 3: Link Backend Keys to Frontend
Once deployment completes, SAM outputs 4 key values in your terminal:

*ApiUrl
*UserPoolId
*UserPoolClientId
*S3BucketName
*CloudFrontURL


Open frontend/index.html and update the CONFIG object around line 350:

JavaScript
const CONFIG = {
    UserPoolId: "<YOUR_USER_POOL_ID>",
    ClientId: "<YOUR_USER_POOL_CLIENT_ID>",
    ApiUrl: "<YOUR_API_GATEWAY_URL>"
};


---
### Step 4: Sync Frontend to S3
Upload the updated index.html to your generated S3 bucket:

Bash
aws s3 sync frontend/index.html s3://<YOUR_S3_BUCKET_NAME>/


Your web app is now live at your CloudFrontURL!



### For future updates to the backend code or infrastructure:

Bash
sam build && sam deploy --guided 

SAM will remember your configuration settings from samconfig.toml.



























