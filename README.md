# 🛒 FreshMart — Premium Grocery Store

A full-stack grocery selling web application built with **React + Vite** (frontend), **Express.js** (backend), and **SQLite** (database).

## ✨ Features

- **Product Catalog** — Browse 24 grocery items across 6 categories (Fruits, Vegetables, Dairy, Bakery, Beverages, Snacks)
- **Search & Filter** — Real-time search by name + category pill filters
- **User Authentication** — Register/Login with JWT tokens and bcrypt password hashing
- **Shopping Cart** — Add, update quantity, remove items with persistent server-side storage
- **Checkout** — Place orders with delivery address, automatic stock management
- **Order History** — View past orders with expandable item details
- **Premium Dark UI** — Modern glassmorphism design with micro-animations
- **Responsive** — Works on desktop, tablet, and mobile

## 🚀 Quick Start

### Prerequisites
- Node.js v18+

### Setup

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Seed the database with 24 products
npm run seed

# 3. Start the backend server (port 3001)
npm run dev

# 4. In a new terminal, install frontend dependencies
cd ../frontend
npm install

# 5. Start the frontend dev server (port 5173)
npm run dev
```

### Access the App
Open **http://localhost:5173** in your browser.

## 📁 Project Structure

```
├── backend/                    # Express.js API server
│   ├── server.js               # Entry point (port 3001)
│   ├── db/
│   │   ├── database.js         # SQLite connection + helpers
│   │   └── seed.js             # Seeds 24 products
│   ├── middleware/
│   │   └── auth.js             # JWT authentication
│   ├── routes/                 # API route definitions
│   └── controllers/            # Business logic
│
├── frontend/                   # React + Vite SPA
│   ├── vite.config.js          # Proxy /api → backend
│   ├── src/
│   │   ├── context/            # Auth + Cart state management
│   │   ├── components/         # Navbar, ProductCard, Toast
│   │   ├── pages/              # 7 pages (Home, Products, Cart, etc.)
│   │   └── utils/api.js        # API fetch wrapper
│   └── public/
│       └── hero-banner.jpg     # AI-generated hero image
│
└── README.md
```

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/products` | No | List products (?category=&search=) |
| GET | `/api/products/:id` | No | Get single product |
| GET | `/api/cart` | Yes | Get cart items |
| POST | `/api/cart` | Yes | Add to cart |
| PUT | `/api/cart/:id` | Yes | Update quantity |
| DELETE | `/api/cart/:id` | Yes | Remove item |
| DELETE | `/api/cart` | Yes | Clear cart |
| POST | `/api/orders` | Yes | Place order |
| GET | `/api/orders` | Yes | Order history |
| GET | `/api/orders/:id` | Yes | Order details |

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router, Vanilla CSS
- **Backend**: Express.js, sql.js (SQLite), JWT, bcryptjs
- **Design**: Dark theme, glassmorphism, Inter + Outfit fonts, micro-animations
