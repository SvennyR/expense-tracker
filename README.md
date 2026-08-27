# Expense Tracker
A full-stack expense tracking App for monthly budget managment

## Tech Stack

* **Frontend**: React, Chart.js, CSS Variables (by shadcn/ui Slate palette)
* **Backend**: Python (Flask), SQLAlchemy, JWT Bearer Auth
* **Database**: PostgreSQL

## Local Setup

### Prerequisites
* Python 3.11+
* Node.js 20+
* PostgreSQL databaser server running locally

### Quick Start with Docker

* **Prerequisites** Docker Desktop installed and running.

```bash
# Clone repository
git clone https://github.com/SvennyR/expense-tracker.git
cd expense-tracker

# Build and start all services (Frontend, Backend, PostgreSQL)
docker compose up --build
```
> **Access Points:**
> * **Frontend:** `http://localhost:5173`
> * **Backend API:** `http://localhost:5000

### Backend Setup (Flask) for personal use or adjustment
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run venv enviroment
.\venv\Scripts\Activate.ps1

# Run database migrations / start application
python app.py
```
### Frontend Setup (React)
```bash
# Navigate to frontend directory
cd frontend

# Install packages
npm install

# Start development server
npm run dev
```

## License

This project is licensed under the MIT License - see the [LICENSE] file for details.
