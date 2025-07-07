# 🛍️ Melange E-Commerce Web Application (Demo Version)

Welcome to the **Melange E-Commerce Web App** — a full-stack online shopping experience built as part of the **CS308 Software Engineering course** at **Sabancı University**.

> ⚠️ **Note:** This repository is intended **only for demonstration purposes**. The original repository with the complete commit history, documentation, and deployment pipeline is maintained privately to comply with academic integrity and collaboration guidelines.

---

## 📌 Project Overview

This project simulates a **modern e-commerce platform** featuring product browsing, a shopping cart, wishlist management, secure login, purchase flow, and administrative functionalities.

It was developed by a team of undergraduate students as part of their **CS308 Software Engineering Term Project (Spring 2025)** under the supervision of course instructors at **Sabancı University**.

---

## 🏗️ Tech Stack

### ⚙️ Backend (Private Repository)
- **Language**: Python
- **Framework**: Flask (with SQLAlchemy)
- **Database**: PostgreSQL (hosted on Google Cloud Compute Engine)
- **Authentication**: JWT-based Token System
- **Deployment**: Gunicorn + Nginx on VM, CI/CD via GitHub Actions (private)

### 🎨 Frontend (This Repo)
- **Language**: JavaScript (ES6+)
- **Library**: React.js
- **Styling**: CSS Modules
- **Routing**: React Router
- **State Management**: React Hooks + localStorage
- **API Communication**: Fetch API (RESTful Endpoints)

---

## 🔑 Key Features

### 👤 User Features
- Browse products by gender categories: **Men**, **Women**, **Teen**
- View detailed product information, including:
  - Images
  - Variants (color/size)
  - Discounted prices
- Add/remove items from:
  - 🛒 **Shopping Bag**
  - ❤️ **Wishlist**
- Login/Register securely (with JWT)
- Modify item quantities
- Proceed to checkout with:
  - Delivery & payment options
  - Dynamic coupon entry and transaction summary

### 🛠️ Admin Features (private)
- Admin login and token validation
- Product upload interface with:
  - Images
  - Variants (colors, sizes)
  - Price and stock entry
- Admin dashboard and analytics

---

## 📁 Project Structure

```
melange-ecommerce-demo/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── Footer/        # Reusable footer section
│   ├── MainPage/          # Navbar, Main Landing
│   ├── ProductPage/       # Detailed product view
│   ├── Shopingbag/        # Shopping Bag drawer
│   ├── Authentication/    # SignIn UI
│   ├── AdminPages/        # Admin login panel (disabled here)
│   ├── Wishlist/          # Wishlist interface
│   ├── PurchasePage/      # Checkout process
│   ├── App.js             # React routes
│   └── index.js           # Entry point
└── README.md
```

---

## 🧪 How to Run (Frontend Only)

> Ensure you have **Node.js (v18+)** and **npm** installed.

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/melange-ecommerce-demo.git
cd melange-ecommerce-demo
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm start
```

The app should now be running at [http://localhost:3000](http://localhost:3000)

---

## 🧩 Sample Routes (UI Preview)

| Page                 | Route                          |
|----------------------|--------------------------------|
| Main Landing         | `/`                            |
| Category Page        | `/category?category_gender=Men`|
| Product Detail       | `/product_page?product_id=xxx` |
| Wishlist             | `/wishlist`                    |
| Checkout             | `/checkout`                    |
| Admin Login (Demo)   | `/admin_login` (disabled)      |

---

## 🔐 Disclaimer

- 🔒 This repository **does not contain** any credentials, secrets, or production deployments.
- 🔐 Backend source code, commit logs, and documentation are kept in a **private GitHub repository** to ensure code originality and respect academic policies.
- 🧠 All frontend data (such as sample products) are for UI testing and demonstration only.

---

## 📚 Course Context

This project was developed for:

**Course**: CS308 - Software Engineering  
**University**: Sabancı University  
**Semester**: Spring 2025  
**Instructor**: [Instructor Name Placeholder]  
**Team Role**: Scrum Master / Full Stack Developer – [Your Name]

---

## 📸 Screenshots

<details>
  <summary>Main Page</summary>
  <img src="docs/screenshots/mainpage.png" width="600"/>
</details>

<details>
  <summary>Shopping Bag</summary>
  <img src="docs/screenshots/shoppingbag.png" width="600"/>
</details>

<details>
  <summary>Wishlist</summary>
  <img src="docs/screenshots/wishlist.png" width="600"/>
</details>

<details>
  <summary>Purchase Page</summary>
  <img src="docs/screenshots/purchase.png" width="600"/>
</details>

---

## 👨‍💻 Authors

- **Berke Ayyıldızlı** - Full Stack Development, Scrum Master
- Plus additional team members (omitted here for demo privacy)

---

## 📄 License

This project is for academic and personal demonstration purposes only.  
All rights reserved © 2025.

---

## 🙏 Acknowledgments

- Sabancı University Faculty of Engineering and Natural Sciences
- CS308 Teaching Team
- React, PostgreSQL, Flask, and the Open Source community

---
