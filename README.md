# 💬 Samvaad

### Real-Time Chat Application

**Samvaad** is a modern real-time chat application designed to provide seamless, fast, and interactive communication between users. Built using the **MERN stack** with **Socket.IO**, Samvaad enables users to communicate in real time with a responsive and user-friendly interface.

> **Samvaad** — *Connect. Communicate. Converse.*

---

## 🚀 Features

* 🔐 **User Authentication**

  * User registration and login
  * Secure password handling
  * JWT-based authentication

* 💬 **Real-Time Messaging**

  * Instant one-to-one messaging
  * Messages delivered without page refresh
  * Real-time communication using Socket.IO

* 🟢 **Online / Offline Status**

  * Real-time user presence
  * Easily identify active users

* ⌨️ **Typing Indicators**

  * See when another user is typing
  * Provides a more natural chat experience

* 📱 **Responsive Interface**

  * Works across desktop and mobile screen sizes
  * Clean and intuitive chat interface

* 👤 **User Profiles**

  * User information and profile management
  * Profile picture support

* 🗄️ **Persistent Messages**

  * Messages are stored in MongoDB
  * Conversations remain available after reconnecting

* ⚡ **Fast Communication**

  * WebSocket-based real-time communication
  * Low-latency message delivery

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
* JWT
* bcrypt

### Database

* MongoDB
* Mongoose

### Development Tools

* Git
* GitHub
* VS Code
* Postman
* npm

---

## 🏗️ Application Architecture

```text
                         ┌──────────────────────┐
                         │       Client         │
                         │      React.js        │
                         └──────────┬───────────┘
                                    │
                         HTTP / REST API
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       Server         │
                         │   Node.js + Express  │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
          ┌──────────────────┐            ┌──────────────────┐
          │     Socket.IO    │            │     MongoDB      │
          │ Real-Time Events │            │     Database     │
          └──────────────────┘            └──────────────────┘
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

> The exact folder structure may differ depending on the current implementation.

---

# ⚙️ Installation & Setup

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/samvaad.git
```

Move into the project directory:

```bash
cd samvaad
```

---

## 2. Install Dependencies

### Backend

```bash
cd server
npm install
```

### Frontend

Open another terminal:

```bash
cd client
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the backend/server directory.

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

> Never commit your `.env` file to GitHub.

Make sure `.gitignore` contains:

```text
.env
node_modules/
```

---

# ▶️ Running the Application

## Start the Backend

```bash
cd server
npm run dev
```

or:

```bash
npm start
```

The backend will run on:

```text
http://localhost:5000
```

---

## Start the Frontend

In another terminal:

```bash
cd client
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# 🔄 How Samvaad Works

### 1. User Authentication

The user creates an account or logs into an existing account.

```text
User
  │
  ▼
Login / Register
  │
  ▼
Express API
  │
  ▼
MongoDB
  │
  ▼
JWT Token
  │
  ▼
Authenticated User
```

### 2. Starting a Conversation

After authentication, users can select another user and open a conversation.

### 3. Sending a Message

When a user sends a message:

```text
User A
  │
  ▼
React Client
  │
  ▼
Socket.IO
  │
  ▼
Server
  │
  ├──────────────► MongoDB
  │
  ▼
Socket.IO
  │
  ▼
User B
```

The receiver gets the message instantly without refreshing the page.

---

# 🔌 Real-Time Communication

Samvaad uses **Socket.IO** to establish a persistent connection between the client and server.

This allows the application to handle real-time events such as:

```text
message
typing
user_online
user_offline
join_chat
leave_chat
```

This makes the application significantly more interactive than a traditional request-response chat system.

---

# 🔐 Security

Samvaad follows several basic security practices:

* Password hashing using bcrypt
* JWT-based authentication
* Protected API routes
* Environment variables for sensitive credentials
* MongoDB database security
* `.env` excluded from version control

---

# 🧪 API Testing

Backend APIs can be tested using **Postman**.

Example endpoints:

```text
POST   /api/users/register
POST   /api/users/login
GET    /api/users
GET    /api/messages/:conversationId
POST   /api/messages
```

> Endpoint names may vary according to the current implementation.

---

# 📸 Screenshots

Add screenshots of your application here:

### Login

```text
[ Add Login Screenshot ]
```

### Chat Dashboard

```text
[ Add Chat Dashboard Screenshot ]
```

### Conversation

```text
[ Add Chat Screenshot ]
```

### Mobile View

```text
[ Add Mobile Screenshot ]
```

---

# 🌐 Deployment

Samvaad can be deployed using platforms such as:

* **Frontend:** Vercel
* **Backend:** Render
* **Database:** MongoDB Atlas

For production deployment, configure the appropriate environment variables on the hosting platform.

Example:

```env
MONGO_URL=production_database_url
JWT_SECRET=production_secret
CLIENT_URL=production_frontend_url
```

---

# 📈 Future Improvements

The project can be extended with:

* 👥 Group chats
* 📎 File and document sharing
* 🖼️ Image sharing
* 🎤 Voice messages
* 📹 Video calling
* 🔔 Push notifications
* 😊 Emoji reactions
* 🗑️ Delete/edit messages
* 🔎 Message search
* 📌 Message pinning
* 🔒 End-to-end encryption
* 🌙 Dark/light theme
* 🤖 AI-powered chat assistant
* 📊 Chat analytics

---

# 🎯 Learning Outcomes

Through Samvaad, the project demonstrates practical implementation of:

* Full-stack web development
* MERN architecture
* REST APIs
* Real-time communication
* WebSockets
* Authentication and authorization
* MongoDB data modeling
* JWT authentication
* Password hashing
* Client-server communication
* API testing
* Deployment

---

# 👨‍💻 Developer

**Roshan Jadhav**

Computer Science Engineering Student

### Skills Demonstrated

```text
React.js • Node.js • Express.js • MongoDB
Socket.IO • JavaScript • JWT • REST APIs
Git • GitHub • Postman
```

---

# ⭐ Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature/new-feature
```

3. Make your changes
4. Commit your changes

```bash
git commit -m "Add new feature"
```

5. Push the branch

```bash
git push origin feature/new-feature
```

6. Open a Pull Request

---

# 📄 License

This project is created for educational and portfolio purposes.

---

## ⭐ If you like Samvaad

Give the repository a ⭐ on GitHub and feel free to explore, contribute, or suggest improvements.

---

**Built with ❤️ using the MERN Stack + Socket.IO**
