// Конфигурация Firebase
// Замените значения на свои после создания проекта в Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyACgakNCSmihYKxF7_batcrI4MBrqZHP8U",
    authDomain: "food-app-36065.firebaseapp.com",
    projectId: "food-app-36065",
    storageBucket: "food-app-36065.firebasestorage.app",
    messagingSenderId: "215657039698",
    appId: "1:215657039698:web:6dba521dd99a80fafc5c8b"
  };

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);

// Создание ссылок на сервисы Firebase
const db = firebase.firestore();
const storage = firebase.storage();

// Экспорт ссылок для использования в других файлах
window.db = db;
window.storage = storage;
