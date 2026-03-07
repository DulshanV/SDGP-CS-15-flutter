from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from groq import Groq  # We import Groq instead of Ollama

app = Flask(__name__)
CORS(app)

def _load_local_env():
    """Load KEY=VALUE pairs from a local .env file if present."""
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if not os.path.exists(env_path):
        return

    with open(env_path, "r", encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


_load_local_env()

# --- INITIALIZE GROQ FROM ENV ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get("message")

    if not groq_client:
        return jsonify({
            "response": "Server configuration error: GROQ_API_KEY is missing."
        }), 500
    
    if not user_message:
        return jsonify({"response": "Error: No message received"}), 400

    # Load Knowledge Base
    kb_content = ""
    # Look for knowledge_base.txt in the backend folder
    kb_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backend", "data", "knowledge_base.txt")
    if os.path.exists(kb_path):
        with open(kb_path, "r", encoding="utf-8") as f:
            kb_content = f.read()

    # --- THE BRAIN: Strictly configured as a Help Desk Guide ---
    system_instruction = f"""
    You are the 'CeylonHS Website Support Guide'. 
    Your ONLY job is to help users understand how to use the CeylonHS website.
    
    STRICT RULES:
    1. YOU ARE NOT THE SEARCH ENGINE. 
    2. NEVER ask the user what product they want to search for.
    3. NEVER attempt to give an HS code.
    4. If a user gives you a product name (e.g., "laptop" or "tea"), tell them politely: "Please type that into the main 'HS Code Finder' search box on the webpage to get your result."
    
    HOW TO USE THE SYSTEM:
    - To find an HS code: Scroll to the 'HS Code Finder' section, enter product details, and click 'Search'.
    - Favorites: Users can save an HS code by clicking the 'Star' icon next to a search result.
    - History: Past searches are saved in the 'History' tab on the user dashboard.
    - Accounts: Login requires a registered student or agent ID.
    - Tech Support: Email support@ceylonhs.lk.
    
    KNOWLEDGE BASE (use this to answer questions about CeylonHS):
    {kb_content}
    
    STYLE:
    - Keep answers very short and helpful (1-2 sentences maximum).
    """

    try:
        # --- SEND REQUEST TO GROQ CLOUD ---
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {'role': 'system', 'content': system_instruction},
                {'role': 'user', 'content': user_message},
            ],
            model=GROQ_MODEL
        )
        
        # Extract the text response from Groq's data structure
        bot_reply = chat_completion.choices[0].message.content
        return jsonify({"response": bot_reply})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"response": "System is temporarily offline."}), 500

if __name__ == '__main__':
    if not GROQ_API_KEY:
        print("[WARN] GROQ_API_KEY is not set. Add it in Thevinu/.env or environment variables.")
    print("--- CeylonHS Cloud Guide Running on Port 5001 ---")
    app.run(port=5001, debug=True)