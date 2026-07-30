import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ.get('TABLE_NAME', 'StudentQuestionsTable')
table = dynamodb.Table(TABLE_NAME)

def handler(event, context):
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET,DELETE"
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"message": "CORS OK"})}

    try:
        # Extract Cognito User ID
        user_id = None
        try:
            user_id = event['requestContext']['authorizer']['claims']['sub']
        except (KeyError, TypeError):
            pass

        response = table.scan()
        items = response.get('Items', [])

        # Return only items that explicitly belong to this user
        if user_id:
            items = [item for item in items if item.get('userId') == user_id]

        # Sort newest first based on createdAt timestamp
        items.sort(key=lambda x: x.get('createdAt', ''), reverse=True)

        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
                "count": len(items),
                "data": items
            })
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }
