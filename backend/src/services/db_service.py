import os
import boto3
from boto3.dynamodb.conditions import Key, Attr
from services.faq_filter import is_faq_candidate, normalize_query

# Initialize DynamoDB resource
TABLE_NAME = os.environ.get("TABLE_NAME", "StudentQuestionsTable")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


def save_question_item(item: dict) -> dict:
    """Saves a question item to DynamoDB and updates question frequency tracking."""
    # Always set default ask_count if not provided
    if "ask_count" not in item:
        item["ask_count"] = 1

    question_text = item.get("question", "")

    # Check if this question qualifies for FAQ candidate tracking
    if is_faq_candidate(question_text):
        normalized = normalize_query(question_text)
        item["query_hash"] = normalized
    
    table.put_item(Item=item)
    return item


def track_question_frequency(raw_question: str, category: str = "General") -> None:
    """
    Increments the frequency count for valid FAQ candidates in DynamoDB.
    Ignores short greetings, filler words, and small queries.
    """
    if not is_faq_candidate(raw_question):
        return  # Skip tracking greetings like 'hi' or 'hello'

    normalized_hash = normalize_query(raw_question)

    try:
        table.update_item(
            Key={"id": f"freq_{normalized_hash}"},
            UpdateExpression=(
                "SET ask_count = if_not_exists(ask_count, :zero) + :incr, "
                "question = if_not_exists(question, :q), "
                "category = if_not_exists(category, :cat), "
                "is_faq_candidate = :true_val"
            ),
            ExpressionAttributeValues={
                ":zero": 0,
                ":incr": 1,
                ":q": raw_question.strip(),
                ":cat": category,
                ":true_val": True
            }
        )
    except Exception as err:
        print(f"Error updating question frequency: {err}")


def fetch_all_questions() -> list:
    """Retrieves all stored questions and answers from DynamoDB."""
    response = table.scan()
    return response.get("Items", [])


def fetch_faq_questions(min_ask_count: int = 3) -> list:
    """
    Retrieves questions that:
    1. Are explicitly marked as is_faq = True, OR
    2. Have an ask_count >= min_ask_count (frequently asked across users).
    
    Filters out short conversational filler.
    """
    response = table.scan(
        FilterExpression=(
            Attr("is_faq").eq(True) | 
            Attr("category").eq("FAQ") | 
            Attr("ask_count").gte(min_ask_count)
        )
    )
    items = response.get("Items", [])

    # Ensure returned FAQs meet quality filters
    valid_faqs = [
        item for item in items 
        if is_faq_candidate(item.get("question", "")) or item.get("is_faq") is True
    ]

    return valid_faqs


def delete_question_by_id(question_id: str) -> bool:
    """Deletes a question item by ID from DynamoDB."""
    response = table.delete_item(
        Key={"id": question_id},
        ReturnValues="ALL_OLD"
    )
    return "Attributes" in response
