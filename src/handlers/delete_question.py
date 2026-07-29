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

        path_params = event.get('pathParameters') or {}
        question_id = path_params.get('id')

        if not question_id:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"error": "Question ID parameter is required."})
            }

        # Check if item exists
        existing = table.get_item(Key={'id': question_id})
        item = existing.get('Item')

        if not item:
            return {
                "statusCode": 404,
                "headers": headers,
                "body": json.dumps({"error": f"Question with ID '{question_id}' not found."})
            }

        # Verify user owns the item (if userId was recorded)
        item_owner = item.get('userId')
        if item_owner and user_id and item_owner != user_id:
            return {
                "statusCode": 403,
                "headers": headers,
                "body": json.dumps({"error": "You do not have permission to delete this question."})
            }

        table.delete_item(Key={'id': question_id})

        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"message": f"Question '{question_id}' deleted successfully."})
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }
