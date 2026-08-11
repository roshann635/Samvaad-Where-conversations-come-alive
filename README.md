# 💬 Samvaad

### Real-Time Chat Application

Samvaad is a modern **real-time chat application** built with the **MERN stack** and **Socket.IO**. It enables users to communicate instantly through a responsive and interactive chat interface with secure authentication and persistent messaging.

---

## ✨ Features

* 🔐 **User Authentication** — Secure registration and login
* 💬 **Real-Time Messaging** — Instant message delivery using Socket.IO
* 🟢 **Online/Offline Status** — Real-time user presence
* ⌨️ **Typing Indicator** — See when another user is typing
* 👤 **User Profiles** — Manage user information and profile pictures
* 💾 **Persistent Messages** — Conversations stored securely in MongoDB
* 📱 **Responsive UI** — Optimized for different screen sizes
* ⚡ **REST APIs** — Backend APIs for users, authentication, and messaging
* 🔒 **Password Security** — Passwords protected using bcrypt
* 🎫 **JWT Authentication** — Token-based authentication for protected routes

---

## 🛠️ Tech Stack

### Frontend

* React.js
* JavaScript
* HTML5
* CSS3
* Axios
* React Router

### Backend

* Node.js
* Express.js
* Socket.IO

### Database

* MongoDB
* Mongoose

### Authentication & Security

* JSON Web Tokens (JWT)
* bcrypt

### Tools

* Git & GitHub
* Postman
* VS Code
* npm

---

## 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │      React.js       │
                    │      Frontend       │
                    └──────────┬──────────┘
                               │
                    REST API + Socket.IO
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Node.js + Express │
                    │       Backend       │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
             ┌─────────────┐       ┌─────────────┐
             │  Socket.IO  │       │   MongoDB   │
             │ Real-Time   │       │  Database   │
             │ Communication│      │             │
             └─────────────┘       └─────────────┘
```

---

## 📂 Project Structure

```text
Samvaad/
│
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── context/
│       ├── services/
│       ├── assets/
│       ├── App.jsx
│       └── main.jsx
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── sockets/
│   ├── config/
│   ├── server.js
│   └── package.json
│
├── .gitignore
├── README.md
└── package.json
```

> Update the structure above if your actual folder organization is different.

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/samvaad.git
cd samvaad
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Install frontend dependencies

```bash
cd ../client
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file inside the backend directory:

```env
PORT=5000
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

### Example

```env
PORT=5000
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/samvaad
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```

> ⚠️ Never commit your `.env` file to GitHub.

---

## ▶️ Running Locally

### Start the Backend

```bash
cd server
npm run dev
```

The backend will start on:

```text
http://localhost:5000
```

### Start the Frontend

Open another terminal:

```bash
cd client
npm run dev
```

The frontend will start on:

```text
http://localhost:5173
```

---

## 🔄 Real-Time Communication

Samvaad uses **Socket.IO** to establish a persistent connection between users.

The application handles real-time events such as:

```text
User connects
      ↓
Socket connection established
      ↓
User joins chat
      ↓
Message sent
      ↓
Socket.IO emits event
      ↓
Receiver gets message instantly
      ↓
Message stored in MongoDB
```

This eliminates the need for continuously refreshing the page to receive new messages.

---

## 🔐 Authentication Flow

```text
Register / Login
       ↓
Express API
       ↓
Validate User
       ↓
Password Verification
       ↓
JWT Token Generated
       ↓
Authenticated Requests
```

Passwords are hashed using **bcrypt**, while JWT is used to protect authenticated routes.

---

## 🧪 API Testing

The backend APIs can be tested using **Postman**.

Typical endpoints include:

```text
POST   /api/users/register
POST   /api/users/login
GET    /api/users
POST   /api/messages
GET    /api/messages/:conversationId
```

> The exact endpoints may vary depending on the current implementation.

---

## 🚀 Deployment

Samvaad can be deployed using:

| Component | Platform      |
| --------- | ------------- |
| Frontend  | Vercel        |
| Backend   | Render        |
| Database  | MongoDB Atlas |

For production deployment, configure the required environment variables on the respective hosting platforms.

---

## 📸 Screenshots

### 🔐 Login

*Add your login screenshot here.*

### 💬 Chat Interface

*Add your chat interface screenshot here.*

### 👤 User Profile

*Add your profile screenshot here.*

---

## 🔮 Future Enhancements

* 👥 Group conversations
* 📎 File and document sharing
* 🖼️ Image sharing
* 🎤 Voice messages
* 📹 Video calling
* 🔔 Push notifications
* 😊 Message reactions
* ✏️ Edit and delete messages
* 🔎 Message search
* 📌 Pin important messages
* 🌙 Dark mode
* 🔒 End-to-end encryption

---

## 📚 Key Learning Outcomes

Through Samvaad, I gained practical experience in:

* Full-stack MERN development
* Real-time communication using WebSockets
* REST API development
* JWT authentication
* Password hashing and security
* MongoDB data modeling
* Client-server architecture
* Socket event handling
* API testing with Postman
* Full-stack deployment

---

## 👨‍💻 Developer

**Roshan Jadhav**

Computer Science Engineering Student

### Technologies

```text
React.js • Node.js • Express.js • MongoDB
Socket.IO • JavaScript • JWT • bcrypt
Git • GitHub • Postman
```

---

## ⭐ Support

If you found this project useful or interesting, consider giving the repository a ⭐.

---

### 📄 License

This project is developed for **educational and portfolio purposes**.
