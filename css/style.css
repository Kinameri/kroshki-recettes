// Глобальные переменные для состояния авторизации
let isUserAuthenticated = false;

// Функция для авторизации через Google
function signInWithGoogle() {
    console.log("Начало авторизации через Google...");
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // Показываем статус
    document.getElementById('auth-status').textContent = "Connexion en cours...";
    document.getElementById('auth-error').style.display = 'none';
    
    // Отключаем кнопку во время авторизации
    document.getElementById('google-auth-button').disabled = true;
    
    // Запускаем процесс авторизации с всплывающим окном
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            // Авторизация успешна, но мы не делаем здесь ничего особенного
            // onAuthStateChanged обработает это событие
            console.log("Успешная авторизация через Google:", result.user.email);
        })
        .catch((error) => {
            console.error("Ошибка авторизации через Google:", error);
            
            // Показываем ошибку
            let errorMessage;
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    errorMessage = "Fenêtre de connexion fermée. Veuillez réessayer.";
                    break;
                case 'auth/popup-blocked':
                    errorMessage = "Le popup a été bloqué. Veuillez autoriser les popups pour ce site.";
                    break;
                case 'auth/cancelled-popup-request':
                    errorMessage = "Requête annulée. Veuillez réessayer.";
                    break;
                case 'auth/unauthorized-domain':
                    errorMessage = "Ce domaine n'est pas autorisé pour l'authentification. Contactez l'administrateur.";
                    break;
                default:
                    errorMessage = "Erreur d'authentification: " + error.message;
            }
            
            document.getElementById('auth-error').textContent = errorMessage;
            document.getElementById('auth-error').style.display = 'block';
            document.getElementById('auth-status').textContent = "Échec de la connexion";
            
            // Включаем кнопку обратно
            document.getElementById('google-auth-button').disabled = false;
        });
}

// Функция для выхода из системы
function signOut() {
    console.log("Начало процесса выхода из системы...");
    
    firebase.auth().signOut()
        .then(() => {
            console.log("Пользователь вышел из системы");
            
            // onAuthStateChanged обработает это событие
        })
        .catch((error) => {
            console.error("Ошибка при выходе из системы:", error);
            alert("Erreur lors de la déconnexion: " + error.message);
        });
}

// Слушатель для отслеживания состояния авторизации
firebase.auth().onAuthStateChanged((user) => {
    console.log("Изменение состояния авторизации:", user ? "авторизован" : "не авторизован");
    
    // Сохраняем состояние авторизации в глобальной переменной
    isUserAuthenticated = !!user;
    
    // Включаем кнопку авторизации
    const googleButton = document.getElementById('google-auth-button');
    if (googleButton) googleButton.disabled = false;
    
    if (user) {
        // Пользователь авторизован
        
        // Проверяем, имеет ли пользователь доступ
        const authorizedEmails = ['bandurian.marharyta@gmail.com', 'chiousse.thomas@gmail.com']; // Замените на ваши разрешенные email
        const userEmail = user.email;
        
        if (authorizedEmails.includes(userEmail)) {
            console.log("Пользователь авторизован и имеет доступ:", userEmail);
            
            // Показываем приложение
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('app-container').style.display = 'block';
            
            // Отображаем информацию о пользователе
            const userInfoElement = document.getElementById('user-info');
            if (userInfoElement) {
                userInfoElement.textContent = userEmail;
                userInfoElement.style.display = 'inline-block';
            }
            
            // Показываем кнопку выхода
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            
            // Загружаем данные приложения
            if (typeof loadData === 'function') {
                console.log("Загрузка данных приложения...");
                loadData();
            } else {
                console.warn("Функция loadData не найдена!");
            }
        } else {
            // Пользователь не авторизован для использования приложения
            console.warn("Пользователь не имеет доступа:", userEmail);
            
            // Показываем сообщение об ошибке
            document.getElementById('auth-error').textContent = 
                "Vous n'êtes pas autorisé à utiliser cette application. Contactez l'administrateur.";
            document.getElementById('auth-error').style.display = 'block';
            document.getElementById('auth-status').textContent = "Accès refusé";
            
            // Выходим из системы
            firebase.auth().signOut();
        }
    } else {
        // Пользователь не авторизован
        console.log("Пользователь не авторизован");
        
        // Показываем форму авторизации
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
        
        // Скрываем информацию о пользователе и кнопку выхода
        const userInfoElement = document.getElementById('user-info');
        if (userInfoElement) userInfoElement.style.display = 'none';
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.style.display = 'none';
        
        // Обновляем статус
        document.getElementById('auth-status').textContent = "Veuillez vous connecter";
    }
});

// Обработчик загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM загружен, проверка состояния авторизации...");
    
    // Обновляем статус на странице
    document.getElementById('auth-status').textContent = "Vérification de l'authentification...";
    
    // Функция auth().onAuthStateChanged выше будет автоматически 
    // вызвана, когда страница загрузится, и обработает состояние авторизации
});

console.log("auth.js загружен");
