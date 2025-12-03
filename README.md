# TigerTix

## Project Overview
TigerTix is an event management and ticketing platform designed for Clemson University. The application provides secure user authentication, event browsing, ticket booking with LLM-driven language processing, and voice interface capabilities. Built with a microservices architecture, TigerTix ensures scalability, maintainability, and seamless user experience.

## Tech Stack
**Frontend**: React.js
**Backend**: Node.js with Express.js
**Database**: SQLite
**Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing
**LLM API**: Claude Anthropic
**Testing**: Jest, Supertest, React Testing Library
**CI/CD**: GitHub Actions

## Architecture Summary
TigerTix employs a microservices architecture with four independent services communicating through RESTful APIs:

### Microservices
1. **Auth Service** - Handles user registration, login, JWT token generation and validation
2. **Client Service** - Manages user-facing features (event browsing, bookings)
3. **Admin Service** -  Provides administrative functions (event management, user management)
4. **LLM Service** - Processes language booking requests with intent extraction and confirmation

### Data Flow
1. User registers/logs in → Auth service hashes password with bcrypt → Issues JWT tokens (30-min access token, 7-day refresh token)
2. Access token included in Authorization header for all API requests
3. Each microservice validates JWT tokens independently (stateless authentication)
4. Frontend automatically refreshes expired access tokens using refresh token
5. LLM service processes booking requests → Extracts intent/entities → Requires user confirmation before finalizing
6. All services share SQLite database with service-specific table ownership
7. Database transactions ensure consistency during concurrent operations

## Installation & Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- Git

### Clone Repository
git clone [GITHUB_REPO_URL]
cd tigertix

### Backend Setup & Backend Server Start
cd backend
npm install
npm start

### Frontend Setup & Frontend Development Server Start
cd frontend
npm install
npm start

## Environment Variables Setup

### Backend Environment Variables
- **PORT**: Backend server port
- **JWT_SECRET**: Secret key for access tokens
- **JWT_REFRESH_SECRET**: Secret key for refresh tokens
- **DATABASE_URL**: SQLite database file path
- **LLM_API_KEY**: API key for LLM service
- **NODE_ENV**: Environment (development/production)

### Frontend Environment Variables
- **REACT_APP_API_URL**: Base API URL
- **REACT_APP_AUTH_SERVICE_URL**: Auth service endpoint
- **REACT_APP_CLIENT_SERVICE_URL**: Client service endpoint
- **REACT_APP_ADMIN_SERVICE_URL**: Admin service endpoint
- **REACT_APP_LLM_SERVICE_URL**: LLM service endpoint

## How To Run Regression Tests


## Team Members, Instructor, TAs, & Roles


## License

