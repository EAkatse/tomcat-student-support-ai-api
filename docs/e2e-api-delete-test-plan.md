# End-to-End API Test Plan: Delete Assignment

This document covers the live end-to-end checks for the assigned Delete task:

- Execute Postman or cURL requests against live `POST /ask`, `GET /question`, `GET /faqs`, and `DELETE /question/{id}` endpoints.
- Verify live CORS headers and HTTP status codes `200`, `400`, and `404`.
- Confirm the delete endpoint removes a real question record created during the test.

## Route Note

The SAM template defines the FAQ endpoint as `GET /faqs`, and the frontend also calls `/faqs`.
The assignment text says `GET /FAQ`; API Gateway paths are case-sensitive, so `/FAQ` is not the implemented route in this repo.

Test `/faqs` as the canonical FAQ endpoint. If the task board requires literal `/FAQ` evidence, run it as an extra route-mismatch check and record the actual API Gateway status separately.

## Prerequisites

- A deployed API Gateway Prod URL from the SAM stack output, without a trailing slash.
- A valid Cognito ID token for authenticated endpoints:
  - Required for `POST /ask`, `GET /question`, and `DELETE /question/{id}`.
  - Not required for `GET /faqs`.
- A test user account that can create and delete its own question records.
- Do not save tokens, passwords, or API keys in committed files or screenshots.

To get the ID token from the hosted frontend after signing in, open the browser console and run:

```javascript
localStorage.getItem("studypal_id_token")
```

PowerShell setup:

```powershell
$env:API_BASE = "https://<api-id>.execute-api.<region>.amazonaws.com/Prod"
$env:ID_TOKEN = "<paste-cognito-id-token>"
$env:ORIGIN = "https://example.test"
New-Item -ItemType Directory -Force .\e2e-evidence
```

## Expected Status Coverage

| Case | Endpoint | Expected |
|---|---|---|
| Valid ask request | `POST /ask` | `200` |
| Invalid ask request with no question and no attachment | `POST /ask` | `400` |
| Fetch authenticated question history | `GET /question` | `200` |
| Fetch public FAQs | `GET /faqs` | `200` |
| Delete missing record | `DELETE /question/{missing-id}` | `404` |
| Delete created test record | `DELETE /question/{created-id}` | `200` |
| Confirm deleted record is gone | `GET /question` | `200`, deleted ID absent |

Expected CORS headers on live responses:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers` includes `Content-Type` and `Authorization` on authenticated routes.
- `Access-Control-Allow-Methods` includes the method being tested and `OPTIONS`.

## cURL Execution

Use `curl.exe` in PowerShell so the real cURL binary runs instead of the PowerShell alias.

### 1. Verify CORS Preflight

```powershell
curl.exe -i -s -X OPTIONS "$($env:API_BASE)/ask" `
  -H "Origin: $env:ORIGIN" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: content-type,authorization"

curl.exe -i -s -X OPTIONS "$($env:API_BASE)/question" `
  -H "Origin: $env:ORIGIN" `
  -H "Access-Control-Request-Method: GET" `
  -H "Access-Control-Request-Headers: authorization"

curl.exe -i -s -X OPTIONS "$($env:API_BASE)/faqs" `
  -H "Origin: $env:ORIGIN" `
  -H "Access-Control-Request-Method: GET"

curl.exe -i -s -X OPTIONS "$($env:API_BASE)/question/e2e-missing-id" `
  -H "Origin: $env:ORIGIN" `
  -H "Access-Control-Request-Method: DELETE" `
  -H "Access-Control-Request-Headers: authorization"
```

Pass criteria:

- Each preflight returns `HTTP/1.1 200`.
- The response includes `Access-Control-Allow-Origin`.
- The response includes the requested method in `Access-Control-Allow-Methods`.

### 2. POST /ask Happy Path - 200

```powershell
curl.exe -s -D .\e2e-evidence\ask-200.headers.txt `
  -o .\e2e-evidence\ask-200.body.json `
  -w 'POST /ask valid => HTTP %{http_code}\n' `
  -X POST "$($env:API_BASE)/ask" `
  -H "Origin: $env:ORIGIN" `
  -H "Authorization: Bearer $env:ID_TOKEN" `
  -H "Content-Type: application/json" `
  --data-raw '{"question":"E2E smoke test: what office handles exam conflicts?","category":"Exams","chatId":"e2e-delete-smoke","chatTitle":"E2E Delete Smoke"}'
```

Capture the created question ID for the delete test:

```powershell
$askBody = Get-Content .\e2e-evidence\ask-200.body.json -Raw | ConvertFrom-Json
$env:CREATED_QUESTION_ID = $askBody.data.id
$env:CREATED_QUESTION_ID
```

Pass criteria:

- Status is `200`.
- Body contains `data.id`, `data.question`, `data.answer`, and `data.createdAt`.
- CORS headers are present in `ask-200.headers.txt`.

### 3. GET /question Happy Path - 200

```powershell
curl.exe -s -D .\e2e-evidence\question-200.headers.txt `
  -o .\e2e-evidence\question-200.body.json `
  -w 'GET /question => HTTP %{http_code}\n' `
  -X GET "$($env:API_BASE)/question" `
  -H "Origin: $env:ORIGIN" `
  -H "Authorization: Bearer $env:ID_TOKEN"
```

Pass criteria:

- Status is `200`.
- Body contains `count` and `data`.
- `data` includes the `CREATED_QUESTION_ID` from the previous step.
- CORS headers are present in `question-200.headers.txt`.

### 4. GET /faqs Happy Path - 200

```powershell
curl.exe -s -D .\e2e-evidence\faqs-200.headers.txt `
  -o .\e2e-evidence\faqs-200.body.json `
  -w 'GET /faqs => HTTP %{http_code}\n' `
  -X GET "$($env:API_BASE)/faqs" `
  -H "Origin: $env:ORIGIN"
```

Pass criteria:

- Status is `200`.
- Body contains `data`.
- `data` is an array of FAQ records.
- CORS headers are present in `faqs-200.headers.txt`.

Optional literal assignment route check:

```powershell
curl.exe -i -s -X GET "$($env:API_BASE)/FAQ" -H "Origin: $env:ORIGIN"
```

Record this separately as a route-name discrepancy check, because `/FAQ` is not defined by `backend/template.yaml`.

### 5. POST /ask Validation Error - 400

```powershell
curl.exe -s -D .\e2e-evidence\ask-400.headers.txt `
  -o .\e2e-evidence\ask-400.body.json `
  -w 'POST /ask invalid => HTTP %{http_code}\n' `
  -X POST "$($env:API_BASE)/ask" `
  -H "Origin: $env:ORIGIN" `
  -H "Authorization: Bearer $env:ID_TOKEN" `
  -H "Content-Type: application/json" `
  --data-raw '{}'
```

Pass criteria:

- Status is `400`.
- Body contains an `error` explaining that either a question or attachment is required.
- CORS headers are present in `ask-400.headers.txt`.

### 6. DELETE /question/{missing-id} Not Found - 404

```powershell
curl.exe -s -D .\e2e-evidence\delete-404.headers.txt `
  -o .\e2e-evidence\delete-404.body.json `
  -w 'DELETE /question missing => HTTP %{http_code}\n' `
  -X DELETE "$($env:API_BASE)/question/e2e-missing-id-000000" `
  -H "Origin: $env:ORIGIN" `
  -H "Authorization: Bearer $env:ID_TOKEN"
```

Pass criteria:

- Status is `404`.
- Body contains an `error` saying the question ID was not found.
- CORS headers are present in `delete-404.headers.txt`.

### 7. DELETE /question/{created-id} Happy Path - 200

```powershell
curl.exe -s -D .\e2e-evidence\delete-200.headers.txt `
  -o .\e2e-evidence\delete-200.body.json `
  -w 'DELETE /question created => HTTP %{http_code}\n' `
  -X DELETE "$($env:API_BASE)/question/$($env:CREATED_QUESTION_ID)" `
  -H "Origin: $env:ORIGIN" `
  -H "Authorization: Bearer $env:ID_TOKEN"
```

Pass criteria:

- Status is `200`.
- Body contains a success `message`.
- CORS headers are present in `delete-200.headers.txt`.

### 8. Confirm Cleanup

```powershell
curl.exe -s -D .\e2e-evidence\question-after-delete.headers.txt `
  -o .\e2e-evidence\question-after-delete.body.json `
  -w 'GET /question after delete => HTTP %{http_code}\n' `
  -X GET "$($env:API_BASE)/question" `
  -H "Origin: $env:ORIGIN" `
  -H "Authorization: Bearer $env:ID_TOKEN"

Select-String -Path .\e2e-evidence\question-after-delete.body.json -Pattern $env:CREATED_QUESTION_ID
```

Pass criteria:

- Status is `200`.
- `Select-String` returns no matching line for the deleted ID.

## Header Verification

After running the requests, inspect all captured response headers:

```powershell
Select-String -Path .\e2e-evidence\*.headers.txt `
  -Pattern "HTTP/|Access-Control-Allow-Origin|Access-Control-Allow-Headers|Access-Control-Allow-Methods"
```

Every saved response should show the expected HTTP status and CORS headers.

## Postman Execution

Create a Postman environment with:

| Variable | Value |
|---|---|
| `api_base` | `https://<api-id>.execute-api.<region>.amazonaws.com/Prod` |
| `id_token` | Cognito ID token |
| `origin` | `https://example.test` |
| `created_question_id` | Leave blank until the `POST /ask` test stores it |

Create these requests:

| Name | Method | URL | Auth/Header |
|---|---|---|---|
| Ask valid | `POST` | `{{api_base}}/ask` | `Authorization: Bearer {{id_token}}`, JSON body |
| Ask invalid | `POST` | `{{api_base}}/ask` | `Authorization: Bearer {{id_token}}`, body `{}` |
| Get questions | `GET` | `{{api_base}}/question` | `Authorization: Bearer {{id_token}}` |
| Get FAQs | `GET` | `{{api_base}}/faqs` | No auth |
| Delete missing | `DELETE` | `{{api_base}}/question/e2e-missing-id-000000` | `Authorization: Bearer {{id_token}}` |
| Delete created | `DELETE` | `{{api_base}}/question/{{created_question_id}}` | `Authorization: Bearer {{id_token}}` |

Add this common Postman test script to each request, changing the expected status code per request:

```javascript
pm.test("status code matches expectation", function () {
  pm.response.to.have.status(200);
});

pm.test("CORS origin header exists", function () {
  pm.expect(pm.response.headers.get("Access-Control-Allow-Origin")).to.exist;
});
```

For the valid `POST /ask` request, add:

```javascript
const body = pm.response.json();
pm.environment.set("created_question_id", body.data.id);
pm.test("created question id returned", function () {
  pm.expect(body.data.id).to.be.a("string").and.not.empty;
});
```

For the cleanup `GET /question` request after deletion, add:

```javascript
const body = pm.response.json();
const deletedId = pm.environment.get("created_question_id");
const ids = (body.data || []).map(item => item.id);
pm.test("deleted record is absent", function () {
  pm.expect(ids).to.not.include(deletedId);
});
```

## Evidence Log

| Step | Expected | Actual status | CORS present | Body check | Pass/Fail | Notes |
|---|---:|---:|---|---|---|---|
| `OPTIONS /ask` | `200` |  |  | Allows `POST` |  |  |
| `OPTIONS /question` | `200` |  |  | Allows `GET` |  |  |
| `OPTIONS /faqs` | `200` |  |  | Allows `GET` |  |  |
| `OPTIONS /question/{id}` | `200` |  |  | Allows `DELETE` |  |  |
| `POST /ask` valid | `200` |  |  | `data.id` returned |  |  |
| `GET /question` | `200` |  |  | Created ID visible |  |  |
| `GET /faqs` | `200` |  |  | `data` array returned |  |  |
| `POST /ask` invalid | `400` |  |  | Validation error returned |  |  |
| `DELETE /question/missing` | `404` |  |  | Not found error returned |  |  |
| `DELETE /question/{created-id}` | `200` |  |  | Success message returned |  |  |
| `GET /question` after delete | `200` |  |  | Deleted ID absent |  |  |

## Common Failure Interpretation

- `401` or `403` on authenticated endpoints usually means the token is missing, expired, malformed, or from the wrong Cognito app.
- `500` on `POST /ask` usually points to backend configuration or Groq API failure; do not continue to delete until a valid `data.id` is created.
- `404` on deleting the created record usually means the ID was not captured correctly, the record was already deleted, or the request used a different authenticated user.
- Missing CORS headers on `4xx` responses means API Gateway CORS or `GatewayResponses` configuration needs review before marking the task complete.
