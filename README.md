<div align="center">
  <br />
  <h1>🎯 Attendify</h1>
  <p>
    <strong>A sleek, Apple-inspired minimalistic attendance & task tracking application.</strong>
  </p>
  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  </p>
</div>

<br />

## 🌟 About The Project

**Attendify** is a modern, beautifully designed web application built to help students and professionals effortlessly manage their attendance, tasks, and daily schedules. Featuring a premium, iOS-like minimalistic design, it tracks your attendance health, predicts safe-to-miss classes, and syncs your data seamlessly to the cloud using Firebase.

### ✨ Key Features

- **📊 Intelligent Attendance Tracking:** Keep an eye on your overall and subject-wise attendance percentages.
- **🔮 Smart Predictions:** Instantly know how many classes you need to attend to reach your goal, or how many you can safely miss.
- **✅ Task Management:** Built-in task manager to track assignments, exams, and daily to-dos with due dates.
- **🎨 Premium Apple-Minimalist UI:** Smooth micro-animations with `framer-motion`, beautiful glassmorphism effects, and highly refined spacing.
- **🌗 Dark/Light Mode:** First-class support for both dark and light themes.
- **☁️ Cloud Sync:** Powered by Firebase Authentication and Firestore to keep your data synced across all your devices.

---

## 🛠️ Built With

* [React](https://reactjs.org/)
* [TypeScript](https://www.typescriptlang.org/)
* [Vite](https://vitejs.dev/)
* [Tailwind CSS](https://tailwindcss.com/)
* [Framer Motion](https://www.framer.com/motion/)
* [Firebase](https://firebase.google.com/)
* [Lucide Icons](https://lucide.dev/)

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You will need Node.js and npm installed on your machine.
* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. **Clone the repo**
   ```sh
   git clone https://github.com/YOUR_USERNAME/attendify.git
   ```
2. **Navigate into the project directory**
   ```sh
   cd attendify
   ```
3. **Install NPM packages**
   ```sh
   npm install
   ```
4. **Setup Firebase Configuration**
   Create a `.env` file in the root directory and add your Firebase project keys:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
5. **Start the Development Server**
   ```sh
   npm run dev
   ```

---

## 📱 Usage

1. Sign in using your Google account (via Firebase Auth).
2. Add your **Subjects** (set total classes, credits, and upload course materials).
3. Switch to the **Attendance** tab to easily mark your daily presence or absence.
4. Use the **Tasks** tab to create assignments or to-dos and link them to specific subjects.
5. Check your **Dashboard** to view an overview of your schedule and intelligent attendance insights!

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <p>Built with ❤️ using React & Tailwind</p>
</div>
