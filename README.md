# 🏋️ Iron Forge - Modern Fitness & Gym Web Application

A comprehensive, responsive web application for fitness enthusiasts, gym members, and personal trainers. Built with modern web standards and powered by Firebase for authentication and database management.

---

## ✨ Features

- **🔐 User Authentication:** Secure Google Sign-In and email login powered by Firebase Auth.
- **📅 Session Booking:** Interactive trainer booking system with date/time selection.
- **📊 Fitness Tracker:** Track your daily workouts, progress, and performance metrics.
- **💪 Training Programs:** Browse specialized workout routines (Strength, Cardio, HIIT).
- **📋 Membership Plans:** Transparent pricing tiers and plan comparison.
- **🧑‍🏫 Trainer Profiles:** Detailed trainer bios, specialties, and client reviews.
- **⚖️ BMI Calculator:** Quick and interactive health metric calculator.
- **💬 Smart Assistant:** Integrated chatbot for workout guidance and FAQs.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3 (Modern Glassmorphism & Cyberpunk/Neon Dark theme), Vanilla JavaScript (ES6 Modules)
- **Backend & Database:** Firebase Authentication, Cloud Firestore
- **Icons & Fonts:** FontAwesome 6, Google Fonts (Inter / Outfit)

---

## 🚀 Getting Started

### Prerequisites
To run the project locally with ES6 modules and Firebase enabled, run a local web server (do not open directly with `file://`):

### Running Locally

```bash
# Using Python
python -m http.server 8000

# OR using Node.js / npx
npx http-server .
```

Open your browser and navigate to `http://localhost:8000` (or `http://localhost:8080`).

---

## 📁 Project Structure

```
majorproject/
├── index.html            # Landing / Home page
├── login.html            # Authentication (Sign in / Sign up)
├── booking.html          # Trainer booking & schedule
├── tracker.html          # Fitness & workout tracking
├── training.html         # Training routines & programs
├── cardio.html           # Cardio-specific training
├── plans.html            # Membership pricing & plans
├── trainer-profile.html  # Trainer biography & specialties
├── bmi.html              # BMI & health calculator
├── css/                  # Stylesheets for each module
├── js/                   # Application logic & Firebase integration
│   ├── auth.js           # Authentication handler
│   ├── firebase-config.js# Firebase SDK config
│   ├── booking.js        # Booking logic
│   ├── tracker.js        # Fitness tracker logic
│   └── chatbot.js        # AI / Assistant chatbot
└── images/               # Media and trainer assets
```

---

## 👤 Author

- **Amit** - [amitkrPrajapati24](https://github.com/amitkrPrajapati24)
