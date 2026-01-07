# 🤖 AI Chatbot with RAG & Web Search

A modern, full-stack AI Chatbot application capable of answering questions using internal knowledge (Google Gemini) or real-time web search (Tavily Search API). The system supports user authentication, chat history persistence, and a citation system similar to Perplexity.

---

## 🚀 Features

- **Dual Mode AI:** Standard Chat (LLM only) & Web Search Mode (RAG).
- **Smart Query Generation:** Automatically breaks down complex questions into optimized search queries.
- **Citations:** Displays sources used in the answer with clickable links `[1]`.
- **Chat Management:** Create, Rename, Delete, and Archive conversations.
- **Authentication:** Simple Login/Register system.
- **Responsive UI:** Clean, dark-themed interface using Vanilla JS/CSS.
- **Database:** Supports SQLite (Local) and PostgreSQL (Production).

---

## 🛠️ Tech Stack

- **Backend:** Python (FastAPI), SQLAlchemy, Pydantic.
- **Frontend:** Vanilla JavaScript, HTML5, CSS3.
- **AI Models:** Google Gemini 1.5 Flash.
- **Search Engine:** Tavily AI.
- **Database:** SQLite (Dev) / PostgreSQL (Prod).

---

## 🔑 Environment Variables (.env)

Create a `.env` file in the root directory.

| Variable | Description | Example |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Your Google Gemini API Key | `AIzaSy...` |
| `TAVILY_API_KEY` | Your Tavily Search API Key | `tvly-...` |
| `DATABASE_URL` | DB Connection String | `sqlite:///./local_chat.db` |
| `MODEL_NAME` | Gemini Model Version | `gemini-1.5-flash` |

**Optional (For Local Dev with VPN/Proxy):**
```properties
HTTP_PROXY=http://127.0.0.1:10809
HTTPS_PROXY=http://127.0.0.1:10809
```

---

## 💻 Local Installation (Laptop)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/REPO_NAME.git
    cd REPO_NAME
    ```

2.  **Create a Virtual Environment:**
    ```bash
    python -m venv venv
    # Windows:
    .\venv\Scripts\activate
    # Mac/Linux:
    source venv/bin/activate
    ```

3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Server:**
    ```bash
    uvicorn main:app --reload
    ```

5.  **Access:** Open `http://127.0.0.1:8000` in your browser.

---

## ☁️ GitHub Codespaces Setup

Codespaces is the recommended way to develop without proxy issues.

1.  Open your repository on GitHub.
2.  Click **Code** -> **Codespaces** -> **Create codespace on main**.
3.  Once the VS Code interface loads, create a `.env` file manually (Codespaces does not copy it).
4.  Open the terminal (`Ctrl + ~`) and run:
    ```bash
    pip install -r requirements.txt
    ```
5.  **Run the Application:**
    Use this specific command to ensure the path is found:
    ```bash
    python -m uvicorn main:app --reload
    ```
6.  Click **"Open in Browser"** when the notification appears.

---

## 🚀 Deployment on Render (Step-by-Step)

Do not use SQLite on Render (data will be lost). Use PostgreSQL.

### Phase 1: Create Database
1.  Go to [Render Dashboard](https://dashboard.render.com).
2.  Click **New +** -> **PostgreSQL**.
3.  Name: `chat-db`, Plan: **Free**.
4.  Click **Create Database**.
5.  Copy the **"Internal Database URL"** (starts with `postgres://...`).

### Phase 2: Deploy Web Service
1.  Click **New +** -> **Web Service**.
2.  Connect your GitHub repository.
3.  **Settings:**
    *   **Runtime:** Python 3
    *   **Build Command:** `pip install -r requirements.txt`
    *   **Start Command:** `uvicorn main:app --host 0.0.0.0 --port 10000`
4.  **Environment Variables:**
    Add the following keys manually:
    *   `GEMINI_API_KEY`: `...`
    *   `TAVILY_API_KEY`: `...`
    *   `MODEL_NAME`: `gemini-1.5-flash`
    *   `DATABASE_URL`: Paste the **Internal Database URL** you copied earlier.
5.  Click **Deploy**.

---

## 📡 API Endpoints Documentation

All endpoints are prefixed with `/api/v1`.

### 🔐 Authentication

| Method | Endpoint | Description | Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user | `{"username": "...", "password": "..."}` |
| `POST` | `/auth/login` | Login and get User ID | `{"username": "...", "password": "..."}` |

### 💬 Chat Operations
**Header Required:** `Authorization: dummy_token_{user_id}`

| Method | Endpoint | Description | Payload / Params |
| :--- | :--- | :--- | :--- |
| `POST` | `/chat/send` | Send message (Standard/Web) | `{"chat_id": 12, "text": "Hi", "is_web_search": true}` <br> *Set `chat_id: null` for new chat.* |
| `GET` | `/chat/list` | Get all user chats | - |
| `GET` | `/chat/{id}/history` | Get messages of a chat | Path Param: `chat_id` |
| `DELETE`| `/chat/{id}` | Delete a chat | Path Param: `chat_id` |
| `PUT` | `/chat/{id}/rename` | Rename a chat | Query Param: `?title=NewName` |

---

## 📂 Project Structure

```plaintext
├── app/
│   ├── api/            # API Routes (Auth, Chat)
│   ├── core/           # Configs & Settings
│   ├── db/             # Database Models & CRUD
│   ├── schemas/        # Pydantic Models (Validation)
│   ├── services/       # Business Logic (LLM, Search)
│   └── utils/          # Prompts & Helper functions
├── static/             # Frontend (HTML, CSS, JS)
├── main.py             # Application Entry Point
├── requirements.txt    # Dependencies
└── .env                # Secrets (Not committed)
```

## ⚠️ Important Notes

1.  **Database Persistence:** When running locally, `local_chat.db` stores data. On Render, ensure `DATABASE_URL` points to PostgreSQL, otherwise, data is lost on restart.
2.  **Proxy:** If developing locally in restricted regions, ensure `HTTP_PROXY` is set in `.env` for Tavily/Gemini to work.
3.  **Citations:** The backend automatically parses search results and formats them. Frontend renders `[1]` as clickable links.
