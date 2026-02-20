
Cannon App

Premium Lookmaxxing app by influencer Cannon, combining AI face analysis, structured improvement courses, TikTok Live event integration, progress tracking, and community features.


---

Project Structure

/Cannon
├── backend/         # FastAPI Python backend
├── mobile/          # React Native Expo mobile app
└── admin/           # React web admin panel


---

Tech Stack

Mobile: React Native + Expo SDK 54

Backend: FastAPI + MongoDB + LangGraph + Gemini 2.5 Flash

Payments: Stripe Subscriptions

Admin: React + Vite



---

Getting Started

Backend Setup

cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your API keys

# Run with Docker
cd docker
docker-compose up -d

# Or run directly
uvicorn main:app --reload


---

Face Analysis Microservice

Add a separate Face Analysis microservice and connect it to your main FastAPI backend.

Steps:

Clone Sarvagya Cannon Face Analysis

Run it on port 8001

Main backend calls it via HTTP


Architecture

Mobile App
    ↓
Main Backend (8000)
    ↓
Face Analysis Service (8001)

This keeps the system modular and scalable.


---

Step 1 — Create Face Service Folder

Inside your project root:

/Cannon
├── backend
├── mobile
├── admin
└── face_service   ← new


---

Step 2 — Clone Sarvagya Face Analysis

cd Cannon
git clone <sarvagya-face-analysis-repo-url> face_service

If it’s a private repo, use SSH or access token.


---

Step 3 — Setup Environment

cd face_service

python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

pip install -r requirements.txt


---

Step 4 — Run the Face Service

uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

Test

Open in browser:

http://localhost:8001/docs

If Swagger opens → service is running.


---

Mobile Setup

cd mobile

# Install dependencies
npm install

# Start Expo
npx expo start


---

Admin Setup

cd admin

# Install dependencies
npm install

# Start dev server
npm run dev


---

Environment Variables

Copy backend/.env.example to backend/.env and configure:

GEMINI_API_KEY — Google Gemini API key

STRIPE_SECRET_KEY — Stripe secret key

STRIPE_PRICE_ID — Stripe subscription price ID

AWS_ACCESS_KEY_ID — AWS S3 credentials



---

User Flow

1. Sign Up → Email/Password registration


2. Onboarding → Goals & experience questionnaire


3. Features Intro → App capabilities overview


4. Free Face Scan → Capture 3 photos (front, left, right)


5. Blurred Results → Preview with paywall


6. Subscribe → Stripe checkout ($9.99/month)


7. Full Access → Home, Chat, Forums, Leaderboard, Profile




---

API Documentation

Once backend is running:

http://localhost:8000/docs


---

License

Proprietary — All Rights Reserved


---