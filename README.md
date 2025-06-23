# StudentBuddy - AI-Powered Learning Assistant

A web application that transforms study materials into interactive quizzes using AI technology.

## Project Structure
```
studentBuddy/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── auth/
│   │   └── quiz/
│   ├── .env
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   └── auth/
    ├── .env
    └── package.json
```

## Prerequisites
- Python 3.8+
- Node.js 14+
- GROQ API key

## Quick Start

### Clone the Repository
```bash
git clone <repository-url>
cd studentBuddy
```


Create `.env` file:
```properties
GROQ_API_KEY=your_groq_api_key
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```


### Frontend Setup
```bash
# Navigate to frontend directory from studentbuddy
cd frontend

# Install dependencies
npm install

```
## Running the Application

### Start Backend Server(Linux)
```bash
# Navigate to backend directory from studentbuddy

cd backend
source .venv/bin/activate
cd app
fastapi dev main.py
```

### Start Backend Server(windows)
```bash
# Navigate to backend directory from studentbuddy

cd backend
.venv\Scripts\activate
cd app
fastapi dev main.py
```

### Start Frontend Development Server
```bash
cd frontend
npm run dev
```

## Access Points
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Features
- 📚 AI-powered quiz generation from study materials
- ✍️ Interactive quiz interface
- 🔐 User authentication
- 📊 Progress tracking
- 🤖 AI-powered doubt solving (Coming soon)

## Environment Variables

### .env
| Variable | Description |
|----------|------------|
| GROQ_API_KEY | API key for GROQ AI services |


## Development
- Backend: FastAPI with SQLite database
- Frontend: React with Vite
- Authentication: JWT tokens
- AI Integration: GROQ API

## Troubleshooting

### Common Issues
1. **Server Connection Issues**
   - Verify both servers are running
   - Check if ports 8000 and 5173 are available
   - Ensure `.env` files are configured correctly

2. **Authentication Issues**
   - Check if tokens are being generated correctly
   - Verify SECRET_KEY is set properly
   - Clear browser cache if needed

3. **Quiz Generation Issues**
   - Verify GROQ API key is valid
   - Check file upload size limits
   - Monitor backend logs for errors

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

