# ============================================================================
# CHATBOT ROUTE

from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

chatbot_client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

CHATBOT_SYSTEM_PROMPT = """
You are a helpful customer support assistant for Lancely, a freelance marketplace platform.
Only answer questions related to Lancely features such as:
- Posting and searching jobs
- Submitting and managing proposals
- Messaging between clients and contractors
- Account and profile settings
- Reviews and ratings

If the user asks something unrelated to Lancely, politely redirect them.
Keep answers concise and friendly.
"""

@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    data = request.get_json()
    user_message = data.get('message', '').strip()
    history = data.get('history', [])

    if not user_message:
        return jsonify({'reply': 'Please enter a message.'}), 400

    messages = history + [{"role": "user", "content": user_message}]

    try:
        response = chatbot_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=512,
            system=CHATBOT_SYSTEM_PROMPT,
            messages=messages
        )
        return jsonify({'reply': response.content[0].text})
    except Exception as e:
        return jsonify({'reply': 'Sorry, something went wrong. Please try again.'}), 500
