import os
import json
import urllib.request
import urllib.error

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")


def generate_ai_response(prompt: str) -> str:
    """
    Generates an academic response for a student query using OpenAI API.
    Includes a fallback responder if the key is missing or the call fails.
    """
    if not OPENAI_API_KEY or OPENAI_API_KEY == "PLACEHOLDER_KEY":
        return _fallback_ai_responder(prompt)

    try:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}"
        }
        data = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful academic student support assistant for an educational institution. Provide clear, direct answers."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 300,
            "temperature": 0.5
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8"),
            headers=headers,
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result["choices"][0]["message"]["content"].strip()

    except Exception as e:
        print(f"Error calling OpenAI API: {str(e)}")
        return _fallback_ai_responder(prompt)


def _fallback_ai_responder(prompt: str) -> str:
    """Keyword-based fallback responder when OpenAI API key is unavailable."""
    lower_prompt = prompt.lower()

    if "fee" in lower_prompt or "tuition" in lower_prompt or "pay" in lower_prompt:
        return "Tuition fees can be paid via the student portal or directly at the finance office before the second week of the semester."
    elif "exam" in lower_prompt or "timetable" in lower_prompt or "schedule" in lower_prompt:
        return "Exam timetables are published 3 weeks prior to exam week on the student dashboard under Academic Schedules."
    elif "admission" in lower_prompt or "register" in lower_prompt or "course" in lower_prompt:
        return "Course registration is completed online via the Academic Records portal during normal registration weeks."
    elif "library" in lower_prompt or "book" in lower_prompt:
        return "The main campus library is open Monday through Friday from 8:00 AM to 10:00 PM, and Saturdays from 9:00 AM to 5:00 PM."
    else:
        return f"Thank you for your academic query regarding '{prompt}'. An advisor will review your question, or you can visit the Student Support Services center."
