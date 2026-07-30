import json
import os
from services.db_service import fetch_faq_questions

DEFAULT_FAQS = [
    {
        "id": "faq-1",
        "category": "Tuition & Fees",
        "question": "When are tuition payments due for the current semester?",
        "answer": "Tuition fees are due two weeks prior to the start of each semester. Late payments incur a 5% administrative surcharge after the official registration deadline."
    },
    {
        "id": "faq-2",
        "category": "Tuition & Fees",
        "question": "How do I request a tuition payment plan?",
        "answer": "You can apply for an installment plan through the Student Financial Portal under 'Billing & Payments' before the start of the second week of classes."
    },
    {
        "id": "faq-3",
        "category": "Academics",
        "question": "How long does an academic semester last?",
        "answer": "A standard academic semester runs for 15 weeks, including 13 weeks of instructional lectures, 1 mid-semester break, and 1 dedicated exam week."
    },
    {
        "id": "faq-4",
        "category": "Academics",
        "question": "What is the deadline to add or drop a course?",
        "answer": "The official Add/Drop period ends at 11:59 PM on Friday of the second week of the semester. Dropping after this date results in a 'W' on your transcript."
    },
    {
        "id": "faq-5",
        "category": "Course Registration",
        "question": "How do I clear a prerequisite hold on my account?",
        "answer": "Prerequisite holds must be waived by your Academic Advisor or Department Head via the Registrar portal before registration opens."
    },
    {
        "id": "faq-6",
        "category": "Exams",
        "question": "Where can I find my final exam schedule and room assignments?",
        "answer": "Final exam schedules are published on the portal 4 weeks before the exam period under 'Academic Services' -> 'Exam Timetable'."
    },
    {
        "id": "faq-7",
        "category": "Exams",
        "question": "What should I do if I have two exams scheduled at the exact same time?",
        "answer": "Submit an Exam Conflict Resolution form through the Academic Registry at least 10 business days prior to the start of the examination week."
    },
    {
        "id": "faq-8",
        "category": "General",
        "question": "How do I reset my student portal or campus Wi-Fi password?",
        "answer": "Visit the IT Helpdesk self-service page or stop by the Campus Library IT Desk with a valid photo ID to reset your portal credentials."
    }
]


def handler(event, context):
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "OPTIONS,GET"
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"message": "OK"})}

    faqs = []

    try:
        # Fetch filtered FAQs meeting threshold criteria
        faqs = fetch_faq_questions(min_ask_count=3)

        # Fallback to defaults if no custom/frequent FAQs exist yet
        if not faqs:
            faqs = DEFAULT_FAQS

    except Exception as e:
        print(f"[ERROR] Failed to fetch FAQ questions: {str(e)}")
        faqs = DEFAULT_FAQS

    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps({"data": faqs})
    }
