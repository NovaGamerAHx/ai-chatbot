<div align="center">
  <img src="static/images/6.png" alt="AI Chatbot Logo" width="120" height="120">
  
  # 🤖 Smart AI Chatbot with Web RAG

  **A Modern, Full-Stack AI Assistant powered by Google Gemini 2.5 Flash & Tavily Search**

  [![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

  [Features](#-key-features) • [Tech Stack](#-tech-stack) • [Installation](#%EF%B8%8F-installation--setup) • [API Docs](#-api-endpoints) • [Database](#-database-schema)
</div>

---

## 🚀 Key Features

*   **⚡ Dual-Mode AI:** Choose between **Standard LLM** (Gemini 2.5 Flash) for creative tasks, or **Web Search Mode** (RAG via Tavily) for real-time, accurate information.
*   **🔗 Smart Citations:** Like Perplexity, the bot provides clickable source links (`[1]`, `[2]`) with website titles and icons for verified answers.
*   **🔐 User Authentication:** Secure registration and login system. Data is isolated per user.
*   **💬 Chat Management:** Full CRUD operations for chats (Create, Rename, Delete, History).
*   **🎨 Beautiful UI/UX:** A responsive, dark-mode compatible interface built with pure JavaScript and TailwindCSS. Custom scrollbars and modern gradients.
*   **🛠️ Developer Friendly:** Includes custom `.bat` scripts for 1-click running, pushing, pulling, and building CSS on Windows.

---

## 🛠️ Tech Stack

**Backend:**
*   **Framework:** FastAPI
*   **ORM:** SQLAlchemy (with PostgreSQL support via `psycopg2-binary`)
*   **Validation:** Pydantic & Pydantic-Settings
*   **AI Services:** `google-generativeai` (Gemini), `tavily-python` (Web Search)

**Frontend:**
*   **Core:** HTML5, Vanilla JavaScript (`app.js`, `api.js`, `ui.js`)
*   **Styling:** Tailwind CSS (v4)
*   **Icons & Markdown:** Lucide Icons, Marked.js

---

## ⚙️ Environment Variables (`.env`)

Create a `.env` file in the root of the project (next to `main.py`). The application will not start without these variables.

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Your Google AI Studio API Key | `AIzaSy...` |
| `TAVILY_API_KEY` | Your Tavily Search API Key | `tvly-...` |
| `DATABASE_URL` | SQLAlchemy Connection String | `sqlite:///./local_chat.db` |
| `MODEL_NAME` | (Optional) Gemini Model Version | `gemini-2.5-flash` |

---

## 🖥️ Installation & Setup

### Option 1: Local Development (Windows)

We have created developer-friendly Batch scripts to automate the workflow.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-chatbot.git
   cd ai-chatbot
   ```

2. **Setup Python Environment:**
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure Environment:** Create the `.env` file as described above.

4. **Run the Application:**
   Simply double-click or run:
   ```cmd
   .\run.bat
   ```
   *The server will start at `http://127.0.0.1:8000`.*

> **💡 Dev Tools included:** 
> * `build-css.bat`: Watch and compile TailwindCSS.
> * `push.bat`: Auto-commit and push to GitHub.
> * `pull.bat`: Fetch latest changes from GitHub.

### Option 2: GitHub Codespaces

1. Click **Code** -> **Codespaces** -> **Create codespace on main**.
2. Wait for the environment to build.
3. Open the terminal and install dependencies: `pip install -r requirements.txt`
4. Manually create the `.env` file in the file explorer.
5. Run the server: `python -m uvicorn main:app --reload`

---

## 📡 API Endpoints

Base URL: `http://127.0.0.1:8000/api/v1`

### Authentication (`/auth`)

| Method | Endpoint | Description | Payload (JSON) |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Create a new user account | `{"username": "...", "password": "..."}` |
| `POST` | `/login` | Authenticate and get User Data | `{"username": "...", "password": "..."}` |

### Chat Operations (`/chat`)
*(All chat operations require proper User Identification logic implemented in `Depends(get_current_user)`)*

| Method | Endpoint | Description | Request Body / Params |
| :--- | :--- | :--- | :--- |
| `POST` | `/send` | Send a prompt to AI | `{"chat_id": 1, "text": "...", "is_web_search": true}` |
| `GET` | `/list` | Get all chats for current user | - |
| `GET` | `/{chat_id}/history`| Get full conversation history | Path: `chat_id` |
| `PUT` | `/{chat_id}/rename` | Rename a specific chat | Query: `?title=New Name` |
| `DELETE`| `/{chat_id}` | Delete a chat & its messages | Path: `chat_id` |

---

## 🗄️ Database Schema

The application uses a relational database architecture:

1.  **Users:** Stores credentials and account info.
2.  **Chats:** A user can have multiple chats. Stores `title` and timestamps.
3.  **Messages:** Belongs to a Chat. Stores `role` (user/assistant), `mode` (standard/web), and `content`.
4.  **Citations:** Belongs to an Assistant Message. Stores exact `url`, `title`, `snippet`, and `ref_index` for RAG transparency.

---

## 📂 Project Structure

```text
ai-chatbot/
├── app/
│   ├── api/v1/         # Route definitions (auth.py, chat.py)
│   ├── core/           # Configuration (config.py)
│   ├── db/             # SQLAlchemy Models & Base (models.py)
│   ├── schemas/        # Pydantic validation (chat.py, user.py)
│   ├── services/       # AI & Logic (llm_service.py, chat_service.py)
│   └── utils/          # Prompt templates
├── static/             # Frontend Assets
│   ├── css/            # Tailwind Input/Output
│   ├── js/             # Vanilla JS Modules
│   └── index.html      # Main UI
├── *.bat               # Windows Developer Scripts
├── main.py             # FastAPI App Entry Point
└── requirements.txt    # Python Dependencies
```

---
<div align="center">
  <i>Developed with ❤️ using FastAPI & TailwindCSS</i>
</div>


