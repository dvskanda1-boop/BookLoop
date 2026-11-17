
import os
from dotenv import load_dotenv
from openai import OpenAI

# Load API key from .env file
load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")

if not API_KEY:
    raise ValueError(
        "API key not found! Check your .env file."
    )

# Connect to OpenRouter
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=API_KEY
)

# AI conversation instructions
messages = [
    {
        "role": "system",
        "content": """
        You are an intelligent AI assistant for a
        Book Exchange application.

        Your main responsibilities are:

        1. Help users exchange books.
        2. Help users find available books.
        3. Explain how to list books.
        4. Help users donate old books.
        5. Give advice about selling books.
        6. Suggest books based on user interests.
        7. Help students find academic books.
        8. Answer educational and book-related questions.

        BEHAVIOUR:

        - Always be friendly and helpful.
        - Give clear and simple answers.
        - Keep answers relevant to books and education.
        - Ask useful follow-up questions when needed.
        - Never ask which platform the user is using.
        - Do not claim that a book is available unless
          actual inventory data confirms it.
        - If a question is unrelated to books, politely
          explain your main purpose and still try to help.

        You are already integrated into the
        Book Exchange application.
        """
    }
]

print("\n===================================")
print("     AI BOOK EXCHANGE CHATBOT")
print("===================================")
print("Welcome! Ask me anything about books.")
print("Type 'exit' to stop chatting.\n")


# Main chatbot loop
while True:

    question = input("You: ").strip()

    if not question:
        print("AI: Please enter a question.\n")
        continue

    if question.lower() in ["exit", "quit", "bye"]:
        print("\nAI: Thank you for using Book Exchange!")
        print("Happy Reading! Goodbye! 📚")
        break

    # Add user question to conversation history
    messages.append({
        "role": "user",
        "content": question
    })

    try:

        print("\nAI is thinking...\n")

        response = client.chat.completions.create(
            model="openrouter/free",
            messages=messages
        )

        answer = response.choices[0].message.content

        if not answer:
            answer = "Sorry, I could not generate a response."

        print("AI:", answer)
        print()

        # Save AI response for conversation context
        messages.append({
            "role": "assistant",
            "content": answer
        })

    except Exception as e:

        # Remove failed user message so it is not
        # included in the next request
        messages.pop()

        print("AI: Sorry, something went wrong.")
        print("Error:", str(e))
        print("Please try again.\n")
