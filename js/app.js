// Глобальные переменные для авторизации
// let isUserAuthenticated = false;

// Функция для проверки авторизации перед выполнением операций
function checkAuth() {
    if (!isUserAuthenticated) {
        console.warn("Попытка выполнить операцию без авторизации");
        return false;
    }
    return true;
}

// Функция для обработки ошибок Firebase
function handleFirebaseError(error) {
    console.error("Firebase error:", error);
    
    if (error.code === 'permission-denied') {
        console.error("Доступ запрещен. Возможно, вы не авторизованы или ваш токен устарел.");
        // Если токен устарел, выходим из системы
        firebase.auth().signOut().then(() => {
            // Обновляем страницу для повторной авторизации
            location.reload();
        });
    }
}


// Функция для отображения модального окна выбора рецепта
function showRecipeSelectionModal(day, meal) {
    // Сохраняем информацию о выбранном дне и приёме пищи
    document.getElementById('selected-day').value = day;
    document.getElementById('selected-meal').value = meal;
    
    // Очищаем поле поиска и сбрасываем фильтр категорий
    document.getElementById('recipe-search-in-modal').value = '';
    document.getElementById('category-filter-in-modal').value = '';
    
    // Заполняем список рецептов
    renderRecipesInModal();
    
    // Открываем модальное окно
    selectRecipeModal.show();
}

// Функция для отображения рецептов в модальном окне
function renderRecipesInModal() {
    const recipeList = document.getElementById('recipe-list-in-modal');
    recipeList.innerHTML = '';
    
    const searchText = document.getElementById('recipe-search-in-modal').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter-in-modal').value;
    const sortFilter = document.getElementById('sort-filter-in-modal').value;
    
    let filteredRecipes = [...recipes];
    
    // Применяем фильтр по тексту поиска
    if (searchText) {
        filteredRecipes = filteredRecipes.filter(recipe => {
            return recipe.name.toLowerCase().includes(searchText) ||
                (recipe.description && recipe.description.toLowerCase().includes(searchText));
        });
    }
    
    // Применяем фильтр по категории
    if (categoryFilter) {
        filteredRecipes = filteredRecipes.filter(recipe => {
            return recipe.categories && recipe.categories.includes(categoryFilter);
        });
    }
    
    // Применяем сортировку, если выбрана
    if (sortFilter) {
        filteredRecipes = sortRecipesByFilter(filteredRecipes, sortFilter);
    }
    
    if (filteredRecipes.length === 0) {
        recipeList.innerHTML = '<div class="list-group-item">Aucune recette trouvée</div>';
    } else {
        filteredRecipes.forEach(recipe => {
            const item = document.createElement('a');
            item.href = '#';
            item.className = 'list-group-item list-group-item-action';
            
            // Добавляем информацию о категориях
            let categoriesHTML = '';
            if (recipe.categories && recipe.categories.length > 0) {
                recipe.categories.forEach(categoryId => {
                    const category = categories.find(c => c.id === categoryId);
                    if (category) {
                        categoriesHTML += `<span class="badge" style="background-color: ${category.color}; margin-right: 5px;">${category.name}</span>`;
                    }
                });
            }
            
            // Добавляем стоимость
            let costHTML = '';
            let totalCost = 0;
            if (recipe.ingredients && recipe.ingredients.length > 0) {
                recipe.ingredients.forEach(ingredient => {
                    if (ingredient.price) {
                        totalCost += parseFloat(ingredient.price);
                    }
                });
                
                if (totalCost > 0) {
                    costHTML = `<span class="badge bg-success">${totalCost.toFixed(2)} €</span>`;
                }
            }
            
            // Добавляем информацию о пищевой ценности для сортировки
            let nutritionHTML = '';
            if (recipe.nutrition) {
                const calories = recipe.nutrition.calories || 0;
                const proteins = recipe.nutrition.proteins || 0;
                const fats = recipe.nutrition.fats || 0;
                const carbs = recipe.nutrition.carbs || 0;
                
                nutritionHTML = `
                    <div class="small text-muted mt-1">
                        ${calories > 0 ? `${calories} kcal · ` : ''}
                        ${proteins > 0 ? `P: ${proteins}g · ` : ''}
                        ${fats > 0 ? `L: ${fats}g · ` : ''}
                        ${carbs > 0 ? `G: ${carbs}g` : ''}
                    </div>
                `;
            }
            
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${recipe.name || 'Sans nom'}</strong>
                        ${nutritionHTML}
                        <div class="mt-1">${categoriesHTML}</div>
                    </div>
                    ${costHTML}
                </div>
            `;
            
            item.setAttribute('data-id', recipe.id);
            
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                const recipeId = this.getAttribute('data-id');
                const day = document.getElementById('selected-day').value;
                const meal = document.getElementById('selected-meal').value;
                
                // Добавляем рецепт в план и закрываем модальное окно
                addToPlan(recipeId, day, meal);
            });
            
            recipeList.appendChild(item);
        });
    }
}

function setupSearchClearButtons() {
    // Функция для настройки кнопки очистки для конкретного поля поиска
    function setupClearButton(inputId) {
        const inputField = document.getElementById(inputId);
        if (!inputField) return;
        
        // Находим кнопку очистки рядом с полем ввода
        const clearButton = inputField.parentElement.querySelector('.clear-search-btn');
        if (!clearButton) return;
        
        // Показываем/скрываем кнопку очистки в зависимости от наличия текста
        inputField.addEventListener('input', function() {
            clearButton.style.display = this.value ? 'block' : 'none';
        });
        
        // Обработчик для кнопки очистки
        clearButton.addEventListener('click', function() {
            inputField.value = '';
            clearButton.style.display = 'none';
            
            // Запускаем поиск с пустым значением
            if (inputId === 'recipe-search') {
                searchRecipes();
            } else if (inputId === 'recipe-search-in-modal') {
                // Для поиска в модальном окне
                document.getElementById('recipe-search-in-modal').value = '';
                // Также сбрасываем фильтр категорий
                document.getElementById('category-filter-in-modal').value = '';
                // Сбрасываем сортировку
                document.getElementById('sort-filter-in-modal').value = '';
                // Обновляем результаты
                filterRecipesInModal();
            }
        });
    }
    
    // Настраиваем все поля поиска
    setupClearButton('recipe-search');
    setupClearButton('recipe-search-in-modal');
}

/**
 * Функция для расчета процентного соотношения БЖУ
 * @param {Object} nutrition - Объект с данными о пищевой ценности
 * @returns {Object|null} - Объект с процентами и цветами или null, если нет данных
 */
function calculateNutritionPercentages(nutrition) {
    // Проверяем наличие данных о пищевой ценности
    if (!nutrition || 
        (nutrition.proteins === undefined && nutrition.fats === undefined && nutrition.carbs === undefined) ||
        (parseFloat(nutrition.proteins || 0) === 0 && parseFloat(nutrition.fats || 0) === 0 && parseFloat(nutrition.carbs || 0) === 0)) {
            console.log("Pas de données nutritionnelles");
        return null;
    }
    
    // Получаем значения БЖУ (или 0, если не указаны)
    const proteins = parseFloat(nutrition.proteins || 0);
    const fats = parseFloat(nutrition.fats || 0);
    const carbs = parseFloat(nutrition.carbs || 0);
    
    // Вычисляем общую сумму БЖУ
    const total = proteins + fats + carbs;
    
    // Если сумма равна нулю, возвращаем null (нельзя делить на ноль)
    if (total === 0) {
        console.log("La somme des nutriments est égale à zéro");
        return null;
    }
    
    // Вычисляем проценты
    const proteinPercent = (proteins / total) * 100;
    const fatPercent = (fats / total) * 100;
    const carbPercent = (carbs / total) * 100;
    
    console.log(`Nutriments en pourcentage: P-${proteinPercent.toFixed(1)}%, L-${fatPercent.toFixed(1)}%, G-${carbPercent.toFixed(1)}%`);
    
    // Определяем цвета для каждого значения
    // Идеальные значения: белки 20%, жиры 30%, углеводы 50%
    const proteinColor = getNutrientStatusClass(proteinPercent, 20);
    const fatColor = getNutrientStatusClass(fatPercent, 30);
    const carbColor = getNutrientStatusClass(carbPercent, 50);
    
    return {
        proteins: {
            value: proteinPercent.toFixed(1),
            class: proteinColor
        },
        fats: {
            value: fatPercent.toFixed(1),
            class: fatColor
        },
        carbs: {
            value: carbPercent.toFixed(1),
            class: carbColor
        }
    };
}

/**
 * Функция для определения класса CSS в зависимости от отклонения от идеального значения
 * @param {number} percent - Фактический процент
 * @param {number} ideal - Идеальный процент
 * @returns {string} - CSS-класс для отображения состояния
 */
function getNutrientStatusClass(percent, ideal) {
    const deviation = Math.abs(percent - ideal);
    
    if (deviation <= 5) {
        return 'good'; // В пределах ±5% от идеала - зеленый
    } else if (percent < ideal) {
        return 'warning'; // Меньше идеала - оранжевый
    } else {
        return 'danger'; // Больше идеала - красный
    }
}

// Добавьте вызов этой функции в инициализацию приложения
document.addEventListener('DOMContentLoaded', function() {
    // Другие инициализации...
    
    // Настройка кнопок очистки поиска
    setupSearchClearButtons();
});

// Функция для фильтрации рецептов в модальном окне
function filterRecipesInModal() {
    renderRecipesInModal();
}

// Функция для удаления рецепта из плана питания
function removeFromPlan(recipeId, day, meal) {
    if (!mealPlan[day] || !mealPlan[day][meal]) return;
    
    // Удаляем рецепт из плана
    mealPlan[day][meal] = mealPlan[day][meal].filter(id => id !== recipeId);
    
    // Сохраняем план в Firestore
    db.collection('mealPlan').doc('current').set(mealPlan).then(() => {
        // Отображаем обновленный план
        renderMealPlan();
    }).catch(error => {
        console.error("Ошибка при обновлении плана питания:", error);
    });
}



// Функция для генерации списка покупок
function generateShoppingList() {
    // Собираем все ингредиенты из рецептов в плане питания
    let allIngredients = [];
    
    // Проходим по плану питания и собираем все ингредиенты
    Object.values(mealPlan).forEach(dayPlan => {
        Object.values(dayPlan).forEach(mealRecipes => {
            mealRecipes.forEach(recipeId => {
                const recipe = recipes.find(r => r.id === recipeId);
                if (recipe && recipe.ingredients) {
                    recipe.ingredients.forEach(ingredient => {
                        if (!ingredient.name) return;
                        
                        const name = ingredient.name.trim();
                        if (!name) return;
                        
                        // Находим категорию продукта по ID
                        let categoryObj = { id: null, name: 'Sans catégorie', priority: 999 };
                        
                        if (ingredient.categoryId) {
                            const foundCategory = ingredientCategories.find(c => c.id === ingredient.categoryId);
                            if (foundCategory) {
                                categoryObj = {
                                    id: foundCategory.id,
                                    name: foundCategory.name,
                                    priority: foundCategory.priority
                                };
                            }
                        }
                        
                        // Добавляем ингредиент в общий список
                        allIngredients.push({
                            name: name,
                            nameLower: name.toLowerCase(), // Для поиска без учета регистра
                            amount: ingredient.amount || '',
                            price: ingredient.price ? parseFloat(ingredient.price) : 0,
                            category: categoryObj
                        });
                    });
                }
            });
        });
    });
    
    // Теперь группируем ингредиенты по имени (без учета регистра)
    const ingredientGroups = {};
    
    allIngredients.forEach(ingredient => {
        const nameKey = ingredient.nameLower;
        
        // Создаем уникальный ключ для варианта
        const amountStr = ingredient.amount || '';
        const priceNum = ingredient.price ? ingredient.price.toFixed(2) : '0';
        const variantKey = `${amountStr}_${priceNum}`;
        
        if (!ingredientGroups[nameKey]) {
            // Создаем новую группу
            ingredientGroups[nameKey] = {
                name: ingredient.name, // Используем оригинальное имя для отображения
                totalCount: 1,
                variants: {},
                category: ingredient.category
            };
            
            // Добавляем первый вариант
            ingredientGroups[nameKey].variants[variantKey] = {
                amount: amountStr,
                price: ingredient.price,
                count: 1
            };
        } else {
            // Обновляем существующую группу
            ingredientGroups[nameKey].totalCount += 1;
            
            // Проверяем, есть ли такой вариант
            if (ingredientGroups[nameKey].variants[variantKey]) {
                // Увеличиваем счетчик существующего варианта
                ingredientGroups[nameKey].variants[variantKey].count += 1;
            } else {
                // Добавляем новый вариант
                ingredientGroups[nameKey].variants[variantKey] = {
                    amount: amountStr,
                    price: ingredient.price,
                    count: 1
                };
            }
        }
    });
    
    // Форматируем список покупок
    const shoppingList = document.getElementById('shopping-list');
    const noMessage = document.getElementById('no-shopping-list-message');
    const totalContainer = document.getElementById('shopping-list-total');
    
    // Очищаем список
    shoppingList.innerHTML = '';
    
    // Получаем список групп ингредиентов
    const ingredientGroupsList = Object.values(ingredientGroups);
    
    if (ingredientGroupsList.length === 0) {
        noMessage.style.display = 'block';
        totalContainer.style.display = 'none';
        return;
    } else {
        noMessage.style.display = 'none';
    }
    
    // Группируем ингредиенты по категориям
    const categorizedIngredients = {};
    
    ingredientGroupsList.forEach(group => {
        const categoryName = group.category.name;
        
        if (!categorizedIngredients[categoryName]) {
            categorizedIngredients[categoryName] = {
                name: categoryName,
                priority: group.category.priority,
                items: []
            };
        }
        
        categorizedIngredients[categoryName].items.push(group);
    });
    
    // Сортируем категории по приоритету
    const sortedCategories = Object.values(categorizedIngredients).sort((a, b) => a.priority - b.priority);
    
    // Вычисляем общую стоимость
    let totalPrice = 0;

    
    
    // Отображаем ингредиенты по категориям
    sortedCategories.forEach(category => {
        // Создаем заголовок категории
        const categoryHeader = document.createElement('li');
        categoryHeader.className = 'list-group-item list-group-item-secondary';
        categoryHeader.textContent = category.name;
        shoppingList.appendChild(categoryHeader);
        
        // Сортируем ингредиенты в категории по алфавиту
        const sortedGroups = category.items.sort((a, b) => a.name.localeCompare(b.name));
        
        // Добавляем ингредиенты
        sortedGroups.forEach(group => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            
            // Получаем варианты ингредиента
            const variants = Object.values(group.variants);
            
            // Формируем общую строку с информацией о продукте
            let itemText = `<strong>${group.name}</strong>`;
            
            // Собираем все количества в одну строку
            let amountsText = '';
            let itemTotalPrice = 0;
            
            variants.forEach(variant => {
                if (variant.amount) {
                    if (amountsText) amountsText += ', ';
                    amountsText += variant.amount;
                    if (variant.count > 1) {
                        amountsText += ` ×${variant.count}`;
                    }
                }
                
                // Считаем общую цену
                itemTotalPrice += variant.price * variant.count;
            });
            
            // Добавляем количество, если оно есть
            if (amountsText) {
                itemText += ` (${amountsText})`;
            }
            
            // Добавляем общую цену
            if (itemTotalPrice > 0) {
                itemText += ` - ${itemTotalPrice.toFixed(2)} €`;
            }
            
            // Обновляем общую стоимость
            totalPrice += itemTotalPrice;
            
            // Создаем содержимое элемента списка
            listItem.innerHTML = `
                <div class="form-check">
                    <input class="form-check-input shopping-item-checkbox" type="checkbox" id="item-${group.name.replace(/\s+/g, '-')}">
                    <label class="form-check-label" for="item-${group.name.replace(/\s+/g, '-')}">
                        ${itemText}
                    </label>
                </div>
            `;
            
            // Добавляем обработчик для обновления итоговой стоимости при изменении чекбокса
            const checkbox = listItem.querySelector('.shopping-item-checkbox');
            if (itemTotalPrice > 0) {
                checkbox.setAttribute('data-price', itemTotalPrice.toFixed(2));
                checkbox.addEventListener('change', updateShoppingListTotal);
            }
            
            // Добавляем атрибуты с категорией для использования при копировании
            listItem.setAttribute('data-category', group.category.name);
            listItem.setAttribute('data-category-priority', group.category.priority);
            listItem.setAttribute('data-price', itemTotalPrice.toFixed(2));
            
            shoppingList.appendChild(listItem);
        });
    });
    
    // Отображаем общую стоимость
    document.getElementById('shopping-list-total-price').textContent = totalPrice.toFixed(2) + ' €';
    totalContainer.style.display = 'block';
    
    // Переключаемся на вкладку списка покупок
    document.getElementById('shopping-list-tab').click();
}

// Функция для обновления общей стоимости списка покупок
function updateShoppingListTotal() {
    let totalPrice = 0;
    
    document.querySelectorAll('.shopping-item-checkbox').forEach(checkbox => {
        if (!checkbox.checked && checkbox.hasAttribute('data-price')) {
            totalPrice += parseFloat(checkbox.getAttribute('data-price'));
        }
    });
    
    document.getElementById('shopping-list-total-price').textContent = totalPrice.toFixed(2) + ' €';
}

// Функция настройки списка покупок
function setupShoppingList() {
    // Обработчик для печати списка покупок
    document.getElementById('print-shopping-list-btn').addEventListener('click', function() {
        window.print();
    });
    
    // Обработчик для копирования списка покупок
    document.getElementById('copy-shopping-list-btn').addEventListener('click', function() {
        // Собираем текст списка, исключая отмеченные продукты
        let shoppingListText = '';
        let totalPrice = 0;
        
        // Собираем категории и элементы
        const categorizedItems = {};
        
        // Проходим по всем элементам и группируем по категориям
        document.querySelectorAll('#shopping-list .list-group-item').forEach(item => {
            // Пропускаем заголовки категорий
            if (item.classList.contains('list-group-item-secondary')) {
                return;
            }
            
            const checkbox = item.querySelector('.shopping-item-checkbox');
            // Пропускаем отмеченные элементы
            if (checkbox && checkbox.checked) {
                return;
            }
            
            const category = item.getAttribute('data-category') || 'другое';
            
            if (!categorizedItems[category]) {
                categorizedItems[category] = [];
            }
            
            // Получаем текст продукта (всю строку целиком)
            const label = item.querySelector('.form-check-label');
            if (!label) return;
            
            // Извлекаем текст продукта, удаляя HTML-теги
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = label.innerHTML;
            const productText = tempDiv.textContent.trim();
            
            categorizedItems[category].push(productText);
            
            // Добавляем стоимость к общей сумме, если есть
            if (item.hasAttribute('data-price')) {
                totalPrice += parseFloat(item.getAttribute('data-price'));
            }
        });
        
        // Создаем массив категорий с приоритетами
        const categoriesWithPriority = [];
        
        Object.keys(categorizedItems).forEach(categoryName => {
            // Находим приоритет категории из первого элемента
            let priority = 100; // По умолчанию
            
            // Ищем элемент с data-category-priority
            document.querySelectorAll(`#shopping-list [data-category="${categoryName}"]`).forEach(item => {
                if (item.hasAttribute('data-category-priority')) {
                    priority = parseInt(item.getAttribute('data-category-priority'));
                    return; // выходим из forEach после нахождения первого элемента
                }
            });
            
            categoriesWithPriority.push({
                name: categoryName,
                priority: priority,
                items: categorizedItems[categoryName]
            });
        });
        
        // Сортируем категории по приоритету
        const sortedCategories = categoriesWithPriority.sort((a, b) => a.priority - b.priority);
        
        // Формируем текст по категориям
        sortedCategories.forEach(category => {
            // Название категории выделяем жирным И ПИШЕМ ЗАГЛАВНЫМИ БУКВАМИ
            shoppingListText += `**${category.name.toUpperCase()}**\n`;
            
            category.items.forEach(item => {
                // Каждый пункт добавляем без маркера, просто с новой строки
                shoppingListText += item + '\n';
            });
            
            shoppingListText += '\n';
        });
        
        // Добавляем общую стоимость в конец списка
        shoppingListText += `Coût total: ${totalPrice.toFixed(2)} €`;
        
        // Копируем в буфер обмена
        navigator.clipboard.writeText(shoppingListText).then(() => {
            // Визуальная индикация успешного копирования
            const copyButton = document.getElementById('copy-shopping-list-btn');
            copyButton.innerHTML = '<i class="fas fa-check"></i> Copié';
            setTimeout(() => {
                copyButton.innerHTML = '<i class="fas fa-copy"></i> Copier';
            }, 2000);
        }).catch(err => {
            console.error('Erreur lors de la copie :', err);
        });
    });
    
    // Обработчик для чекбоксов списка покупок
    document.addEventListener('change', function(e) {
        if (e.target && e.target.classList.contains('shopping-item-checkbox')) {
            const label = e.target.nextElementSibling;
            
            if (e.target.checked) {
                label.classList.add('checked-item');
            } else {
                label.classList.remove('checked-item');
            }
            
            // Обновляем общую стоимость
            updateShoppingListTotal();
        }
    });
}// Главный файл приложения

// Глобальные переменные
let recipes = []; // Массив всех рецептов
let categories = []; // Массив всех категорий
let currentRecipeId = null; // ID текущего редактируемого рецепта
let recipeImageFile = null; // Файл изображения для загрузки
let mealPlan = {}; // План питания
let ingredientCategories = []; // Массив категорий продуктов

// DOM элементы
const recipeModal = new bootstrap.Modal(document.getElementById('recipe-modal'));
const viewRecipeModal = new bootstrap.Modal(document.getElementById('view-recipe-modal'));
const categoryModal = new bootstrap.Modal(document.getElementById('category-modal'));
const addToPlanModal = new bootstrap.Modal(document.getElementById('add-to-plan-modal'));
const selectRecipeModal = new bootstrap.Modal(document.getElementById('select-recipe-modal'));

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Настройка обработчиков событий для навигации
    setupNavigation();
    
    // Настройка обработчиков для управления рецептами
    setupRecipeManagement();
    
    // Настройка обработчиков для категорий
    setupCategories();
    
    // Настройка обработчиков для плана питания
    setupMealPlanning();
    
    // Настройка обработчиков для списка покупок
    setupShoppingList();
    
    // Загрузка данных из Firebase
    loadData();
});

// Функция настройки навигации между вкладками
function setupNavigation() {
    // Обработчики для вкладок навигации
    document.getElementById('recipes-tab').addEventListener('click', function(e) {
        e.preventDefault();
        showSection('recipes-section');
        setActiveTab(this);
    });
    
    document.getElementById('meal-plan-tab').addEventListener('click', function(e) {
        e.preventDefault();
        showSection('meal-plan-section');
        setActiveTab(this);
    });
    
    document.getElementById('shopping-list-tab').addEventListener('click', function(e) {
        e.preventDefault();
        showSection('shopping-list-section');
        setActiveTab(this);
    });
    
    document.getElementById('categories-tab').addEventListener('click', function(e) {
        e.preventDefault();
        showSection('categories-section');
        setActiveTab(this);
    });
}

// Функция для переключения между секциями
function showSection(sectionId) {
    // Скрываем все секции
    document.getElementById('recipes-section').style.display = 'none';
    document.getElementById('meal-plan-section').style.display = 'none';
    document.getElementById('shopping-list-section').style.display = 'none';
    document.getElementById('categories-section').style.display = 'none';
    
    // Показываем нужную секцию
    document.getElementById(sectionId).style.display = 'block';
}

// Функция для установки активной вкладки
function setActiveTab(tab) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    tab.classList.add('active');
}

// Функция настройки управления рецептами
function setupRecipeManagement() {
    // Обработчик для открытия формы добавления рецепта
    document.getElementById('add-recipe-btn').addEventListener('click', function() {
        resetRecipeForm();
        document.getElementById('recipe-modal-title').textContent = 'Ajouter une nouvelle recette';
        recipeModal.show();
    });
    
    // Обработчик для сохранения рецепта
    document.getElementById('save-recipe-btn').addEventListener('click', saveRecipe);
    
    // Обработчик для добавления ингредиента
    document.getElementById('add-ingredient-btn').addEventListener('click', addIngredientField);
    
    // Обработчик для поиска рецептов
document.getElementById('search-btn').addEventListener('click', searchRecipes);
document.getElementById('recipe-search').addEventListener('input', searchRecipes);

// Обработчик изменения категории в фильтре
document.getElementById('category-filter').addEventListener('change', searchRecipes);

// Обработчик для сортировки рецептов
document.getElementById('sort-filter').addEventListener('change', searchRecipes);
    
    // Обработчики для изображения
    document.getElementById('recipe-image').addEventListener('change', handleImageSelection);
    document.getElementById('remove-image-btn').addEventListener('click', removeSelectedImage);
    
    // Обработчик для добавления категории к рецепту
    document.getElementById('add-category-to-recipe-btn').addEventListener('click', addCategoryToRecipe);
    
    // Обработчики для модального окна просмотра рецепта
    document.getElementById('edit-recipe-btn').addEventListener('click', function() {
        viewRecipeModal.hide();
        loadRecipeForEditing(currentRecipeId);
    });
    
    document.getElementById('add-to-plan-btn').addEventListener('click', function() {
        viewRecipeModal.hide();
        document.getElementById('plan-recipe-id').value = currentRecipeId;
        addToPlanModal.show();
    });
    
    // Обработчик для удаления рецепта
    document.getElementById('delete-recipe-btn').addEventListener('click', function() {
        deleteRecipe(currentRecipeId);
    });
    
    // Обработчик для расчета стоимости ингредиентов
    document.addEventListener('input', function(e) {
        if (e.target && (e.target.classList.contains('ingredient-price') || e.target.classList.contains('ingredient-amount'))) {
            calculateTotalCost();
        }
    });
    
    // Обработчик для поиска рецептов в модальном окне выбора рецепта
    document.getElementById('recipe-search-in-modal').addEventListener('keyup', function() {
        filterRecipesInModal();
    });
    
    // Обработчик для фильтрации по категориям в модальном окне
    document.getElementById('category-filter-in-modal').addEventListener('change', function() {
        filterRecipesInModal();
    });

    document.getElementById('sort-filter-in-modal').addEventListener('change', function() {
        filterRecipesInModal();
    });
}

// Функция загрузки данных из Firebase
// Функция загрузки данных
function loadData() {
    console.log("Начало загрузки данных...");
    
    // Проверяем авторизацию перед загрузкой данных
    if (!isUserAuthenticated) {
        console.warn("Попытка загрузить данные без авторизации");
        return;
    }
    
    // Загрузка категорий
    db.collection('categories').get().then((snapshot) => {
        categories = [];
        snapshot.forEach((doc) => {
            categories.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Заполняем выпадающие списки категорий
        populateCategoryDropdowns();
        // Отображаем категории в разделе управления категориями
        renderCategories();
    }).catch((error) => {
        console.error("Ошибка при загрузке категорий:", error);
        handleFirebaseError(error);
    });

    // Загрузка категорий продуктов
    db.collection('ingredientCategories').get().then((snapshot) => {
        ingredientCategories = [];
        snapshot.forEach((doc) => {
            ingredientCategories.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Сортируем категории по приоритету
        ingredientCategories.sort((a, b) => a.priority - b.priority);
        
        // Отображаем категории продуктов
        renderIngredientCategories();
        
        // Заполняем выпадающие списки категорий продуктов
        populateIngredientCategoryDropdowns();
    }).catch((error) => {
        console.error("Ошибка при загрузке категорий продуктов:", error);
        handleFirebaseError(error);
    });
    
    // Загрузка рецептов
    db.collection('recipes').get().then((snapshot) => {
        recipes = [];
        snapshot.forEach((doc) => {
            recipes.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Отображаем рецепты
        renderRecipes();
    }).catch((error) => {
        console.error("Ошибка при загрузке рецептов:", error);
        handleFirebaseError(error);
    });
    
    // Загрузка плана питания
    db.collection('mealPlan').doc('current').get().then((doc) => {
        if (doc.exists) {
            mealPlan = doc.data();
        } else {
            // Создаем пустой план питания, если его нет
            mealPlan = {
                monday: { breakfast: [], lunch: [], dinner: [] },
                tuesday: { breakfast: [], lunch: [], dinner: [] },
                wednesday: { breakfast: [], lunch: [], dinner: [] },
                thursday: { breakfast: [], lunch: [], dinner: [] },
                friday: { breakfast: [], lunch: [], dinner: [] },
                saturday: { breakfast: [], lunch: [], dinner: [] },
                sunday: { breakfast: [], lunch: [], dinner: [] }
            };
        }
        
        // Отображаем план питания
        renderMealPlan();
    }).catch((error) => {
        console.error("Ошибка при загрузке плана питания:", error);
        handleFirebaseError(error);
    });
}

// Функция для отображения рецептов


// Функция для отображения массива рецептов (оригинальных или отфильтрованных)
function displayRecipes(recipesToShow) {
    try {
        const container = document.getElementById('recipes-container');
        const noRecipesMessage = document.getElementById('no-recipes-message');
        
        if (!container) {
            console.error("Не найден контейнер для рецептов! Проверьте ID 'recipes-container'");
            return;
        }
        
        if (!noRecipesMessage) {
            console.error("Не найден элемент для сообщения об отсутствии рецептов! Проверьте ID 'no-recipes-message'");
            // Продолжаем работу, так как это некритично
        }
        
        // Очищаем контейнер
        container.innerHTML = '';
        
        if (!recipesToShow || recipesToShow.length === 0) {
            if (noRecipesMessage) {
                noRecipesMessage.style.display = 'block';
            }
            return;
        } else {
            if (noRecipesMessage) {
                noRecipesMessage.style.display = 'none';
            }
        }
        
        // Отображаем каждый рецепт
        recipesToShow.forEach(recipe => {
            // Создаем карточку рецепта
            const card = document.createElement('div');
            card.className = 'col-md-4 mb-4';
            
            // Вычисляем стоимость рецепта
            let totalCost = 0;
            if (recipe.ingredients && recipe.ingredients.length > 0) {
                recipe.ingredients.forEach(ingredient => {
                    if (ingredient.price) {
                        totalCost += parseFloat(ingredient.price);
                    }
                });
            }
            
            // Формируем HTML для категорий
            let categoriesHTML = '';
            if (recipe.categories && recipe.categories.length > 0) {
                categoriesHTML = '<div class="mb-2">';
                recipe.categories.forEach(categoryId => {
                    const category = categories.find(c => c.id === categoryId);
                    if (category) {
                        categoriesHTML += `<span class="category-badge" style="background-color: ${category.color}; color: white;">${category.name}</span> `;
                    }
                });
                categoriesHTML += '</div>';
            }
            
            // Формируем HTML карточки
            const cardHTML = `
    <div class="card recipe-card h-100" data-id="${recipe.id}">
        ${recipe.imageUrl ? `<img src="${recipe.imageUrl}" class="card-img-top" alt="${recipe.name}">` : ''}
        <div class="card-body">
            <h5 class="card-title">${recipe.name || 'Sans nom'}</h5>
            ${categoriesHTML}
            <p class="card-text">${recipe.description || 'Pas de description'}</p>
            ${totalCost > 0 ? `<p class="text-success mb-2">Coût: ${totalCost.toFixed(2)} €</p>` : ''}
        </div>
                    <div class="card-footer bg-transparent">
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-sm btn-outline-primary view-recipe-btn" data-id="${recipe.id}">
                                <i class="fas fa-eye"></i> Voir
                            </button>
                            <button class="btn btn-sm btn-outline-success add-to-plan-btn" data-id="${recipe.id}">
                                <i class="fas fa-calendar-plus"></i> Au plan
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            card.innerHTML = cardHTML;
            container.appendChild(card);
        });
        
        // Добавляем обработчики для кнопок на карточках
        document.querySelectorAll('.view-recipe-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Останавливаем всплытие
                const recipeId = this.getAttribute('data-id');
                viewRecipe(recipeId);
            });
        });
        
        document.querySelectorAll('.add-to-plan-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Останавливаем всплытие
                const recipeId = this.getAttribute('data-id');
                document.getElementById('plan-recipe-id').value = recipeId;
                addToPlanModal.show();
            });
        });
        
        // Добавляем обработчик клика на карточку для просмотра рецепта
        document.querySelectorAll('.recipe-card').forEach(card => {
            if (card) {
                card.style.cursor = 'pointer';
                card.addEventListener('click', function(e) {
                    if (!e.target.closest('button')) {
                        const recipeId = this.getAttribute('data-id');
                        viewRecipe(recipeId);
                    }
                });
            }
        });
    } catch (error) {
        console.error("Ошибка в функции displayRecipes:", error);
    }
}

// Функция для сброса формы рецепта
function resetRecipeForm() {
    // Сбрасываем скрытое поле ID
    document.getElementById('recipe-id').value = '';
    
    // Сбрасываем основные поля
    document.getElementById('recipe-name').value = '';
    document.getElementById('recipe-description').value = '';
    document.getElementById('recipe-instructions').value = '';
    
    // Сбрасываем КБЖУ
    document.getElementById('recipe-calories').value = '';
    document.getElementById('recipe-proteins').value = '';
    document.getElementById('recipe-fats').value = '';
    document.getElementById('recipe-carbs').value = '';
    
    // Сбрасываем изображение
    document.getElementById('recipe-image').value = '';
    document.getElementById('image-preview-container').style.display = 'none';
    recipeImageFile = null;
    
    // Очищаем контейнер ингредиентов
    const ingredientsContainer = document.getElementById('ingredients-container');
    ingredientsContainer.innerHTML = '';
    
    // Добавляем первый пустой ингредиент
    addIngredientField();
    
    // Очищаем категории
    document.getElementById('recipe-categories-container').innerHTML = '';
    
    // Обновляем отображение общей стоимости
    document.getElementById('recipe-total-cost').textContent = '0 €';
    
    // Сбрасываем глобальную переменную текущего рецепта
    currentRecipeId = null;
}

// Функция для добавления поля ингредиента
function addIngredientField() {
    const container = document.getElementById('ingredients-container');
    const template = document.getElementById('ingredient-template');
    const newIngredient = template.content.cloneNode(true);
    
    // Добавляем обработчик для удаления ингредиента
    newIngredient.querySelector('.remove-ingredient-btn').addEventListener('click', function() {
        this.closest('.ingredient-item').remove();
        calculateTotalCost(); // Пересчитываем стоимость
    });
    
    // Добавляем обработчики для расчета стоимости
    const priceInput = newIngredient.querySelector('.ingredient-price');
    priceInput.addEventListener('input', calculateTotalCost);
    
    // Заполняем выпадающий список категорий продуктов
    const categorySelect = newIngredient.querySelector('.ingredient-category');
    categorySelect.innerHTML = '<option value="">Catégorie</option>';
    
    // Добавляем категории продуктов, отсортированные по приоритету
    ingredientCategories.sort((a, b) => a.priority - b.priority);
    
    if (ingredientCategories.length === 0) {
        // Если категорий нет, добавляем опцию "Sans catégorie"
        categorySelect.innerHTML = '<option value="">Sans catégorie</option>';
    } else {
        // Иначе заполняем существующими категориями
        ingredientCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }
    
    container.appendChild(newIngredient);
}

// Функция для расчета общей стоимости рецепта
function calculateTotalCost() {
    let totalCost = 0;
    
    document.querySelectorAll('.ingredient-item').forEach(item => {
        const priceInput = item.querySelector('.ingredient-price');
        if (priceInput && priceInput.value) {
            totalCost += parseFloat(priceInput.value);
        }
    });
    
    document.getElementById('recipe-total-cost').textContent = totalCost.toFixed(2) + ' €';
}

// Функция для обработки выбора изображения
function handleImageSelection(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    recipeImageFile = file;
    
    // Показываем превью изображения
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('image-preview');
        preview.src = e.target.result;
        document.getElementById('image-preview-container').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Функция для удаления выбранного изображения
function removeSelectedImage() {
    document.getElementById('recipe-image').value = '';
    document.getElementById('image-preview-container').style.display = 'none';
    recipeImageFile = null;
}

// Функция для сохранения рецепта
function saveRecipe() {
    if (!checkAuth()) {
        alert("Vous devez être connecté pour effectuer cette action");
        return;
    }
    try {
        console.log("Начало функции saveRecipe");
        
        // Получаем ID рецепта (если редактируем)
        const recipeId = document.getElementById('recipe-id').value || null;
        console.log("ID рецепта:", recipeId);
        
        // Собираем основные данные
        const name = document.getElementById('recipe-name').value || '';
        const description = document.getElementById('recipe-description').value || '';
        const instructions = document.getElementById('recipe-instructions').value || '';
        
        // Собираем КБЖУ
        const calories = document.getElementById('recipe-calories').value || null;
        const proteins = document.getElementById('recipe-proteins').value || null;
        const fats = document.getElementById('recipe-fats').value || null;
        const carbs = document.getElementById('recipe-carbs').value || null;
        
        // Собираем ингредиенты
        const ingredients = [];
        document.querySelectorAll('.ingredient-item').forEach(item => {
            const name = item.querySelector('.ingredient-name').value;
            const amount = item.querySelector('.ingredient-amount').value;
            const price = item.querySelector('.ingredient-price').value;
            const categoryId = item.querySelector('.ingredient-category').value;
            
            if (name || amount || price) {
                ingredients.push({ 
                    name, 
                    amount,
                    price: price ? parseFloat(price) : null,
                    categoryId: categoryId || null
                });
            }
        });
        
        console.log("Ингредиенты:", ingredients);
        
        // Собираем ID категорий
        const categoryIds = [];
        document.querySelectorAll('.recipe-category').forEach(categoryElement => {
            categoryIds.push(categoryElement.getAttribute('data-category-id'));
        });
        
        console.log("ID категорий:", categoryIds);
        
        // Создаем объект рецепта
        const recipe = {
            name,
            description,
            instructions,
            ingredients,
            categories: categoryIds,
            nutrition: {
                calories: calories ? parseInt(calories) : null,
                proteins: proteins ? parseFloat(proteins) : null,
                fats: fats ? parseFloat(fats) : null,
                carbs: carbs ? parseFloat(carbs) : null
            }
        };
        
        console.log("Объект рецепта:", recipe);
        
        // Простая функция для обновления интерфейса после операции
        const updateUI = () => {
            try {
                console.log("Обновление интерфейса");
                
                // Закрываем модальное окно
                if (recipeModal) {
                    recipeModal.hide();
                }
                
                // Повторно загружаем рецепты с сервера
                db.collection('recipes').get().then((snapshot) => {
                    console.log("Получены рецепты из Firestore:", snapshot.size);
                    
                    // Обновляем массив рецептов
                    recipes = [];
                    snapshot.forEach((doc) => {
                        recipes.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    
                    console.log("Обновлен массив рецептов:", recipes.length);
                    
                    // Отображаем обновленный список рецептов
                    renderRecipes();
                    
                    // Визуальное подтверждение
                    const toast = document.createElement('div');
                    toast.className = 'alert alert-success fixed-top mx-auto mt-3';
                    toast.style.maxWidth = '500px';
                    toast.style.textAlign = 'center';
                    toast.style.zIndex = '9999';
                    toast.style.width = '75%';
                    toast.innerHTML = recipeId ? 'Recette mise à jour avec succès!' : 'Recette ajoutée avec succès!';
                    document.body.appendChild(toast);
                    
                    setTimeout(() => {
                        if (document.body.contains(toast)) {
                            document.body.removeChild(toast);
                        }
                    }, 2000);
                }).catch(error => {
                    console.error("Ошибка при загрузке рецептов:", error);
                });
            } catch (error) {
                console.error("Ошибка в функции updateUI:", error);
            }
        };
        
        // Обработка изображения и сохранение рецепта
        const saveToFirestore = (imageUrl = null) => {
            try {
                console.log("Начало функции saveToFirestore");
                
                // Если есть изображение, добавляем его URL
                if (imageUrl) {
                    recipe.imageUrl = imageUrl;
                    console.log("Добавлен URL изображения:", imageUrl);
                } else if (recipeId) {
                    // Если редактируем и нет нового изображения, сохраняем существующее URL
                    const existingRecipe = recipes.find(r => r.id === recipeId);
                    if (existingRecipe && existingRecipe.imageUrl) {
                        recipe.imageUrl = existingRecipe.imageUrl;
                        console.log("Сохранен существующий URL изображения:", recipe.imageUrl);
                    }
                }
                
                if (recipeId) {
                    // Редактирование существующего рецепта
                    recipe.updatedAt = new Date();
                    console.log("Обновление рецепта в Firestore, ID:", recipeId);
                    
                    // Сохраняем в Firestore
                    db.collection('recipes').doc(recipeId).update(recipe)
                        .then(() => {
                            console.log("Рецепт успешно обновлен в Firestore");
                            updateUI();
                        })
                        .catch(error => {
                            console.error("Ошибка при обновлении рецепта в Firestore:", error);
                        });
                } else {
                    // Добавление нового рецепта
                    recipe.createdAt = new Date();
                    console.log("Добавление нового рецепта в Firestore");
                    
                    // Сохраняем в Firestore
                    db.collection('recipes').add(recipe)
                        .then(docRef => {
                            console.log("Рецепт успешно добавлен в Firestore, ID:", docRef.id);
                            updateUI();
                        })
                        .catch(error => {
                            console.error("Ошибка при добавлении рецепта в Firestore:", error);
                        });
                }
            } catch (error) {
                console.error("Ошибка в функции saveToFirestore:", error);
            }
        };
        
        // Если есть новое изображение, загружаем его сначала
        if (recipeImageFile) {
            console.log("Загрузка изображения в Storage");
            
            const storageRef = storage.ref('recipe-images/' + (recipeId || Date.now().toString()));
            storageRef.put(recipeImageFile)
                .then(snapshot => {
                    console.log("Изображение успешно загружено");
                    return snapshot.ref.getDownloadURL();
                })
                .then(downloadURL => {
                    console.log("Получен URL изображения:", downloadURL);
                    // Сохраняем рецепт с URL изображения
                    saveToFirestore(downloadURL);
                })
                .catch(error => {
                    console.error("Ошибка при загрузке изображения:", error);
                    // Если не удалось загрузить изображение, сохраняем рецепт без него
                    saveToFirestore();
                });
        } else {
            console.log("Нет нового изображения, сохраняем рецепт");
            // Сохраняем рецепт без нового изображения
            saveToFirestore();
        }
    } catch (error) {
        console.error("Общая ошибка в функции saveRecipe:", error);
    }
}

// Функция для отображения уведомления
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} fixed-top mx-auto mt-3`;
    toast.style.maxWidth = '500px';
    toast.style.textAlign = 'center';
    toast.style.zIndex = '9999';
    toast.style.width = '75%';
    toast.innerHTML = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (document.body.contains(toast)) {
            document.body.removeChild(toast);
        }
    }, 2000);
}

function renderRecipes() {
    try {
        const container = document.getElementById('recipes-container');
        const noRecipesMessage = document.getElementById('no-recipes-message');
        
        if (!container) {
            console.error("Не найден контейнер для рецептов! Проверьте ID 'recipes-container'");
            return;
        }
        
        if (!noRecipesMessage) {
            console.error("Не найден элемент для сообщения об отсутствии рецептов! Проверьте ID 'no-recipes-message'");
            // Продолжаем работу, так как это некритично
        }
        
        // Очищаем контейнер
        container.innerHTML = '';
        
        if (!recipes || recipes.length === 0) {
            if (noRecipesMessage) {
                noRecipesMessage.style.display = 'block';
            }
            return;
        } else {
            if (noRecipesMessage) {
                noRecipesMessage.style.display = 'none';
            }
        }
        
        // Отображаем каждый рецепт
        recipes.forEach(recipe => {
            // Создаем карточку рецепта
            const card = document.createElement('div');
            card.className = 'col-md-4 mb-4';
            
            // Вычисляем стоимость рецепта
            let totalCost = 0;
            if (recipe.ingredients && recipe.ingredients.length > 0) {
                recipe.ingredients.forEach(ingredient => {
                    if (ingredient.price) {
                        totalCost += parseFloat(ingredient.price);
                    }
                });
            }
            
            // Формируем HTML для категорий
            let categoriesHTML = '';
            if (recipe.categories && recipe.categories.length > 0) {
                categoriesHTML = '<div class="mb-2">';
                recipe.categories.forEach(categoryId => {
                    const category = categories.find(c => c.id === categoryId);
                    if (category) {
                        categoriesHTML += `<span class="category-badge" style="background-color: ${category.color}; color: white;">${category.name}</span> `;
                    }
                });
                categoriesHTML += '</div>';
            }
            
            // Формируем HTML карточки
            const cardHTML = `
    <div class="card recipe-card h-100" data-id="${recipe.id}">
        ${recipe.imageUrl ? `<img src="${recipe.imageUrl}" class="card-img-top" alt="${recipe.name}">` : ''}
        <div class="card-body">
            <h5 class="card-title">${recipe.name || 'Sans nom'}</h5>
            ${categoriesHTML}
            <p class="card-text">${recipe.description || 'Pas de description'}</p>
            ${totalCost > 0 ? `<p class="text-success mb-2">Coût: ${totalCost.toFixed(2)} €</p>` : ''}
        </div>
                    <div class="card-footer bg-transparent">
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-sm btn-outline-primary view-recipe-btn" data-id="${recipe.id}">
                                <i class="fas fa-eye"></i> Voir
                            </button>
                            <button class="btn btn-sm btn-outline-success add-to-plan-btn" data-id="${recipe.id}">
                                <i class="fas fa-calendar-plus"></i> Au plan
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            card.innerHTML = cardHTML;
            container.appendChild(card);
        });
        
        // Добавляем обработчики для кнопок на карточках
        document.querySelectorAll('.view-recipe-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Останавливаем всплытие
                const recipeId = this.getAttribute('data-id');
                viewRecipe(recipeId);
            });
        });
        
        document.querySelectorAll('.add-to-plan-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Останавливаем всплытие
                const recipeId = this.getAttribute('data-id');
                document.getElementById('plan-recipe-id').value = recipeId;
                addToPlanModal.show();
            });
        });
        
        // Добавляем обработчик клика на карточку для просмотра рецепта
        document.querySelectorAll('.recipe-card').forEach(card => {
            if (card) {
                card.style.cursor = 'pointer';
                card.addEventListener('click', function(e) {
                    if (!e.target.closest('button')) {
                        const recipeId = this.getAttribute('data-id');
                        viewRecipe(recipeId);
                    }
                });
            }
        });
    } catch (error) {
        console.error("Ошибка в функции renderRecipes:", error);
    }
}



// Функция для просмотра рецепта
function viewRecipe(recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    // Сохраняем ID рецепта для возможного редактирования
    currentRecipeId = recipeId;
    
    // Заполняем модальное окно данными рецепта
    document.getElementById('view-recipe-title').textContent = recipe.name || 'Sans nom';
    
    // Отображаем изображение, если есть
    const imageContainer = document.getElementById('view-recipe-image-container');
    if (recipe.imageUrl) {
        document.getElementById('view-recipe-image').src = recipe.imageUrl;
        imageContainer.style.display = 'block';
    } else {
        imageContainer.style.display = 'none';
    }
    
    // Отображаем категории
    const categoriesContainer = document.getElementById('view-recipe-categories-container');
    categoriesContainer.innerHTML = '';
    
    if (recipe.categories && recipe.categories.length > 0) {
        recipe.categories.forEach(categoryId => {
            const category = categories.find(c => c.id === categoryId);
            if (category) {
                const categoryBadge = document.createElement('span');
                categoryBadge.className = 'category-badge';
                categoryBadge.style.backgroundColor = category.color;
                categoryBadge.style.color = 'white';
                categoryBadge.textContent = category.name;
                categoriesContainer.appendChild(categoryBadge);
            }
        });
    }
    
    // Отображаем описание, если есть
    const descriptionContainer = document.getElementById('view-recipe-description-container');
    if (recipe.description) {
        document.getElementById('view-recipe-description').textContent = recipe.description;
        descriptionContainer.style.display = 'block';
    } else {
        descriptionContainer.style.display = 'none';
    }
    
    // Отображаем ингредиенты
    const ingredientsList = document.getElementById('view-recipe-ingredients');
    ingredientsList.innerHTML = '';
    
    if (recipe.ingredients && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach(ingredient => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            
            let ingredientText = ingredient.name || '';
            
            if (ingredient.amount) {
                ingredientText += ` - ${ingredient.amount}`;
            }
            
            if (ingredient.price) {
                ingredientText += ` (${ingredient.price} €)`;
            }
            
            li.textContent = ingredientText;
            ingredientsList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.textContent = 'Ingrédients non spécifiés';
        ingredientsList.appendChild(li);
    }
    

// Отображаем пищевую ценность, если есть
const nutritionContainer = document.getElementById('view-recipe-nutrition-container');
if (recipe.nutrition && (recipe.nutrition.calories || recipe.nutrition.proteins || recipe.nutrition.fats || recipe.nutrition.carbs)) {
    document.getElementById('view-recipe-calories').textContent = recipe.nutrition.calories || '-';
    document.getElementById('view-recipe-proteins').textContent = recipe.nutrition.proteins || '-';
    document.getElementById('view-recipe-fats').textContent = recipe.nutrition.fats || '-';
    document.getElementById('view-recipe-carbs').textContent = recipe.nutrition.carbs || '-';
    
    // Сбрасываем стили процентов перед новым расчетом
    document.getElementById('view-recipe-proteins-percent').textContent = '';
    document.getElementById('view-recipe-fats-percent').textContent = '';
    document.getElementById('view-recipe-carbs-percent').textContent = '';
    
    // Рассчитываем проценты БЖУ
    const percentages = calculateNutritionPercentages(recipe.nutrition);
    if (percentages) {
        // Обновляем проценты белков с цветовой индикацией
        const proteinPercentEl = document.getElementById('view-recipe-proteins-percent');
        proteinPercentEl.textContent = percentages.proteins.value + '%';
        proteinPercentEl.className = 'nutrition-percent ' + percentages.proteins.class;
        
        // Обновляем проценты жиров с цветовой индикацией
        const fatPercentEl = document.getElementById('view-recipe-fats-percent');
        fatPercentEl.textContent = percentages.fats.value + '%';
        fatPercentEl.className = 'nutrition-percent ' + percentages.fats.class;
        
        // Обновляем проценты углеводов с цветовой индикацией
        const carbPercentEl = document.getElementById('view-recipe-carbs-percent');
        carbPercentEl.textContent = percentages.carbs.value + '%';
        carbPercentEl.className = 'nutrition-percent ' + percentages.carbs.class;
    }
    
    nutritionContainer.style.display = 'block';
} else {
    nutritionContainer.style.display = 'none';
}
    
    // Отображаем стоимость, если есть ингредиенты с ценами
    const costContainer = document.getElementById('view-recipe-cost-container');
    let totalCost = 0;
    
    if (recipe.ingredients && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach(ingredient => {
            if (ingredient.price) {
                totalCost += parseFloat(ingredient.price);
            }
        });
    }
    
    if (totalCost > 0) {
        document.getElementById('view-recipe-cost').textContent = totalCost.toFixed(2);
        costContainer.style.display = 'block';
    } else {
        costContainer.style.display = 'none';
    }
    
    // Отображаем инструкции, если есть
    const instructionsContainer = document.getElementById('view-recipe-instructions-container');
    if (recipe.instructions) {
        document.getElementById('view-recipe-instructions').textContent = recipe.instructions;
        instructionsContainer.style.display = 'block';
    } else {
        instructionsContainer.style.display = 'none';
    }
    
    // Открываем модальное окно
    viewRecipeModal.show();
}

// Функция для загрузки рецепта для редактирования
function loadRecipeForEditing(recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    // Устанавливаем ID рецепта в скрытое поле
    document.getElementById('recipe-id').value = recipeId;
    
    // Заполняем основные поля
    document.getElementById('recipe-name').value = recipe.name || '';
    document.getElementById('recipe-description').value = recipe.description || '';
    document.getElementById('recipe-instructions').value = recipe.instructions || '';
    
    // Заполняем КБЖУ, если есть
    if (recipe.nutrition) {
        document.getElementById('recipe-calories').value = recipe.nutrition.calories || '';
        document.getElementById('recipe-proteins').value = recipe.nutrition.proteins || '';
        document.getElementById('recipe-fats').value = recipe.nutrition.fats || '';
        document.getElementById('recipe-carbs').value = recipe.nutrition.carbs || '';
    }
    
    // Отображаем изображение, если есть
    if (recipe.imageUrl) {
        document.getElementById('image-preview').src = recipe.imageUrl;
        document.getElementById('image-preview-container').style.display = 'block';
    }
    
    // Очищаем и заполняем ингредиенты
    const ingredientsContainer = document.getElementById('ingredients-container');
    ingredientsContainer.innerHTML = '';
    
    if (recipe.ingredients && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach(ingredient => {
            const template = document.getElementById('ingredient-template');
            const ingredientElement = template.content.cloneNode(true);
            
            ingredientElement.querySelector('.ingredient-name').value = ingredient.name || '';
ingredientElement.querySelector('.ingredient-amount').value = ingredient.amount || '';
ingredientElement.querySelector('.ingredient-price').value = ingredient.price || '';

// Заполняем селект категорий ингредиентов
const categorySelect = ingredientElement.querySelector('.ingredient-category');
categorySelect.innerHTML = '<option value="">Catégorie</option>';

// Добавляем категории продуктов в селект
ingredientCategories.sort((a, b) => a.priority - b.priority);
ingredientCategories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
});

// Выбираем правильную категорию
if (ingredient.categoryId) {
    categorySelect.value = ingredient.categoryId;
}

            // Добавляем обработчик для удаления ингредиента
            ingredientElement.querySelector('.remove-ingredient-btn').addEventListener('click', function() {
                this.closest('.ingredient-item').remove();
                calculateTotalCost(); // Пересчитываем стоимость после удаления
            });
            
            ingredientsContainer.appendChild(ingredientElement);
        });
        
        // Вычисляем общую стоимость
        calculateTotalCost();
    } else {
        // Если ингредиентов нет, добавляем пустое поле
        addIngredientField();
    }
    
    // Очищаем и заполняем категории
    const categoriesContainer = document.getElementById('recipe-categories-container');
    categoriesContainer.innerHTML = '';
    
    if (recipe.categories && recipe.categories.length > 0) {
        recipe.categories.forEach(categoryId => {
            const category = categories.find(c => c.id === categoryId);
            if (category) {
                addCategoryElement(category.id, category.name, category.color);
            }
        });
    }
    
    // Изменяем заголовок модального окна
    document.getElementById('recipe-modal-title').textContent = 'Modifier la recette';
    
    // Открываем модальное окно
    recipeModal.show();
}

// Функция для удаления рецепта
function deleteRecipe(recipeId) {
    if (!checkAuth()) {
        alert("Vous devez être connecté pour effectuer cette action");
        return;
    }
    try {
        console.log("Начало функции deleteRecipe, ID:", recipeId);
        
        // Удаляем рецепт из Firestore
        db.collection('recipes').doc(recipeId).delete()
            .then(() => {
                console.log("Рецепт успешно удален из Firestore");
                
                // Удаляем рецепт из локального массива
                recipes = recipes.filter(r => r.id !== recipeId);
                console.log("Обновлен локальный массив рецептов:", recipes.length);
                
                // Закрываем модальное окно просмотра рецепта
                viewRecipeModal.hide();
                
                // Обновляем план питания, если рецепт был включен в него
                let planUpdated = false;
                
                Object.keys(mealPlan).forEach(day => {
                    Object.keys(mealPlan[day]).forEach(meal => {
                        if (mealPlan[day][meal].includes(recipeId)) {
                            mealPlan[day][meal] = mealPlan[day][meal].filter(id => id !== recipeId);
                            planUpdated = true;
                        }
                    });
                });
                
                // Если план питания был изменен, сохраняем его
                if (planUpdated) {
                    console.log("Обновление плана питания после удаления рецепта");
                    
                    db.collection('mealPlan').doc('current').set(mealPlan)
                        .then(() => {
                            console.log("План питания успешно обновлен");
                            // Отображаем обновленный план питания
                            renderMealPlan();
                        })
                        .catch(error => {
                            console.error("Ошибка при обновлении плана питания:", error);
                        });
                }
                
                // Отображаем обновленный список рецептов
                renderRecipes();
                
                // Визуальное подтверждение
                const toast = document.createElement('div');
                toast.className = 'alert alert-success fixed-top mx-auto mt-3';
                toast.style.maxWidth = '500px';
                toast.style.textAlign = 'center';
                toast.style.zIndex = '9999';
                toast.style.width = '75%';
                toast.innerHTML = 'Recette supprimée avec succès!';
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 2000);
            })
            .catch(error => {
                console.error("Ошибка при удалении рецепта из Firestore:", error);
            });
    } catch (error) {
        console.error("Общая ошибка в функции deleteRecipe:", error);
    }
}

// Функция для добавления категории к рецепту
function addCategoryToRecipe() {
    const categorySelect = document.getElementById('category-selector');
    const categoryId = categorySelect.value;
    
    if (!categoryId) return;
    
    // Проверяем, не добавлена ли уже эта категория
    const existingCategory = document.querySelector(`.recipe-category[data-category-id="${categoryId}"]`);
    if (existingCategory) return;
    
    const category = categories.find(c => c.id === categoryId);
    if (category) {
        addCategoryElement(category.id, category.name, category.color);
    }
    
    // Сбрасываем выбор в селекте
    categorySelect.value = '';
}

// Функция для добавления элемента категории
function addCategoryElement(categoryId, categoryName, categoryColor) {
    const categoriesContainer = document.getElementById('recipe-categories-container');
    
    const categoryElement = document.createElement('span');
    categoryElement.className = 'recipe-category';
    categoryElement.setAttribute('data-category-id', categoryId);
    categoryElement.style.backgroundColor = categoryColor;
    categoryElement.style.color = 'white';
    categoryElement.innerHTML = `
        ${categoryName}
        <i class="fas fa-times remove-category"></i>
    `;
    
    // Добавляем обработчик для удаления категории
    categoryElement.querySelector('.remove-category').addEventListener('click', function() {
        categoryElement.remove();
    });
    
    categoriesContainer.appendChild(categoryElement);
}

// Функция для поиска рецептов
// Функция для поиска и фильтрации рецептов
function searchRecipes() {
    try {
        const searchText = document.getElementById('recipe-search').value.toLowerCase();
        const categoryFilter = document.getElementById('category-filter').value;
        const sortFilter = document.getElementById('sort-filter').value;
        
        console.log("Поиск с параметрами:", { searchText, categoryFilter, sortFilter });
        
        // Если все поля пустые, показываем все рецепты без сортировки
        if (!searchText && !categoryFilter && !sortFilter) {
            renderRecipes();
            return;
        }
        
        // Фильтруем рецепты
        let filteredRecipes = [...recipes];
        
        // Применяем фильтр по тексту поиска
        if (searchText) {
            filteredRecipes = filteredRecipes.filter(recipe => {
                return (recipe.name && recipe.name.toLowerCase().includes(searchText)) ||
                    (recipe.description && recipe.description.toLowerCase().includes(searchText)) ||
                    (recipe.ingredients && recipe.ingredients.some(ing => ing.name && ing.name.toLowerCase().includes(searchText)));
            });
        }
        
        // Применяем фильтр по категории
        if (categoryFilter) {
            filteredRecipes = filteredRecipes.filter(recipe => {
                return recipe.categories && recipe.categories.includes(categoryFilter);
            });
        }
        
        // Применяем сортировку, если выбрана
        if (sortFilter) {
            filteredRecipes = sortRecipesByFilter(filteredRecipes, sortFilter);
        }
        
        console.log("Найдено рецептов:", filteredRecipes.length);
        
        // Отображаем отфильтрованные рецепты
        displayRecipes(filteredRecipes);
    } catch (error) {
        console.error("Ошибка в функции searchRecipes:", error);
        // В случае ошибки показываем все рецепты
        renderRecipes();
    }
}

// Функция для фильтрации рецептов по категории
function filterRecipes() {
    searchRecipes(); // Используем существующую функцию поиска
}

// Функция для сортировки рецептов
function sortRecipes() {
    searchRecipes(); // Используем существующую функцию поиска
}

function renderFilteredRecipes(filteredRecipes) {
    // Сохраняем оригинальный массив
    const originalRecipes = [...recipes];
    
    // Временно заменяем массив рецептов
    recipes = filteredRecipes;
    
    // Используем основную функцию рендеринга
    renderRecipes();
    
    // Восстанавливаем оригинальный массив
    recipes = originalRecipes;
}

// Добавьте новую функцию renderFilteredRecipes():
function renderFilteredRecipes(filteredRecipes) {
    const container = document.getElementById('recipes-container');
    const noRecipesMessage = document.getElementById('no-recipes-message');
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    if (filteredRecipes.length === 0) {
        noRecipesMessage.style.display = 'block';
        return;
    } else {
        noRecipesMessage.style.display = 'none';
    }
    
    // Отображаем каждый рецепт
    filteredRecipes.forEach(recipe => {
        // Создаем карточку рецепта
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        
        // Вычисляем стоимость рецепта
        let totalCost = 0;
        if (recipe.ingredients && recipe.ingredients.length > 0) {
            recipe.ingredients.forEach(ingredient => {
                if (ingredient.price) {
                    totalCost += parseFloat(ingredient.price);
                }
            });
        }
        
        // Формируем HTML для категорий
        let categoriesHTML = '';
        if (recipe.categories && recipe.categories.length > 0) {
            categoriesHTML = '<div class="mb-2">';
            recipe.categories.forEach(categoryId => {
                const category = categories.find(c => c.id === categoryId);
                if (category) {
                    categoriesHTML += `<span class="category-badge" style="background-color: ${category.color}; color: white;">${category.name}</span> `;
                }
            });
            categoriesHTML += '</div>';
        }
        
        // Формируем HTML карточки
        const cardHTML = `
    <div class="card recipe-card h-100" data-id="${recipe.id}">
        ${recipe.imageUrl ? `<img src="${recipe.imageUrl}" class="card-img-top" alt="${recipe.name}">` : ''}
        <div class="card-body">
            <h5 class="card-title">${recipe.name || 'Sans nom'}</h5>
            ${categoriesHTML}
            <p class="card-text">${recipe.description || 'Pas de description'}</p>
            ${totalCost > 0 ? `<p class="text-success mb-2">Coût: ${totalCost.toFixed(2)} €</p>` : ''}
        </div>
                <div class="card-footer bg-transparent">
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-sm btn-outline-primary view-recipe-btn" data-id="${recipe.id}">
                            <i class="fas fa-eye"></i> Voir
                        </button>
                        <button class="btn btn-sm btn-outline-success add-to-plan-btn" data-id="${recipe.id}">
                            <i class="fas fa-calendar-plus"></i> Au plan
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        card.innerHTML = cardHTML;
        container.appendChild(card);
        
        
    });


    document.querySelectorAll('.recipe-card').forEach(card => {
        // Добавляем стиль для курсора, чтобы было понятно, что карточка кликабельна
        card.style.cursor = 'pointer';
        
        // Добавляем обработчик на всю карточку
        card.addEventListener('click', function(e) {
            // Проверяем, не кликнули ли по кнопкам или их дочерним элементам
            if (!e.target.closest('button')) {
                // Находим ID рецепта из ближайшей кнопки просмотра
                const viewButton = this.querySelector('.view-recipe-btn');
                if (viewButton) {
                    const recipeId = viewButton.getAttribute('data-id');
                    viewRecipe(recipeId);
                }
            }
        });
    });
    
    // Добавляем обработчики для кнопок на карточках
    document.querySelectorAll('.view-recipe-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Останавливаем всплытие, чтобы не срабатывал клик на карточке
            const recipeId = this.getAttribute('data-id');
            viewRecipe(recipeId);
        });
    });
    
    document.querySelectorAll('.add-to-plan-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Останавливаем всплытие, чтобы не срабатывал клик на карточке
            const recipeId = this.getAttribute('data-id');
            document.getElementById('plan-recipe-id').value = recipeId;
            addToPlanModal.show();
        });
    });
}

// Функция для фильтрации рецептов по категории
function filterRecipes() {
    searchRecipes(); // Используем существующую функцию поиска
}

// Функция для сортировки рецептов
function sortRecipes() {
    searchRecipes(); // Используем существующую функцию поиска
}

// Функция для сортировки рецептов по выбранному фильтру
function sortRecipesByFilter(recipeArray, filter) {
    try {
        console.log("Tri par:", filter);
        
        // Делаем копию массива, чтобы не изменять оригинал
        const sortedArray = [...recipeArray];
        
        switch (filter) {
            case 'price-asc':
                return sortedArray.sort((a, b) => calculateRecipeCost(a) - calculateRecipeCost(b));
            case 'price-desc':
                return sortedArray.sort((a, b) => calculateRecipeCost(b) - calculateRecipeCost(a));
            case 'calories-asc':
                return sortedArray.sort((a, b) => {
                    const caloriesA = a.nutrition && a.nutrition.calories ? a.nutrition.calories : 0;
                    const caloriesB = b.nutrition && b.nutrition.calories ? b.nutrition.calories : 0;
                    return caloriesA - caloriesB;
                });
            case 'calories-desc':
                return sortedArray.sort((a, b) => {
                    const caloriesA = a.nutrition && a.nutrition.calories ? a.nutrition.calories : 0;
                    const caloriesB = b.nutrition && b.nutrition.calories ? b.nutrition.calories : 0;
                    return caloriesB - caloriesA;
                });
            case 'proteins-asc':
                return sortedArray.sort((a, b) => {
                    const proteinsA = a.nutrition && a.nutrition.proteins ? a.nutrition.proteins : 0;
                    const proteinsB = b.nutrition && b.nutrition.proteins ? b.nutrition.proteins : 0;
                    return proteinsA - proteinsB;
                });
            case 'proteins-desc':
                return sortedArray.sort((a, b) => {
                    const proteinsA = a.nutrition && a.nutrition.proteins ? a.nutrition.proteins : 0;
                    const proteinsB = b.nutrition && b.nutrition.proteins ? b.nutrition.proteins : 0;
                    return proteinsB - proteinsA;
                });
            case 'fats-asc':
                return sortedArray.sort((a, b) => {
                    const fatsA = a.nutrition && a.nutrition.fats ? a.nutrition.fats : 0;
                    const fatsB = b.nutrition && b.nutrition.fats ? b.nutrition.fats : 0;
                    return fatsA - fatsB;
                });
            case 'fats-desc':
                return sortedArray.sort((a, b) => {
                    const fatsA = a.nutrition && a.nutrition.fats ? a.nutrition.fats : 0;
                    const fatsB = b.nutrition && b.nutrition.fats ? b.nutrition.fats : 0;
                    return fatsB - fatsA;
                });
            case 'carbs-asc':
                return sortedArray.sort((a, b) => {
                    const carbsA = a.nutrition && a.nutrition.carbs ? a.nutrition.carbs : 0;
                    const carbsB = b.nutrition && b.nutrition.carbs ? b.nutrition.carbs : 0;
                    return carbsA - carbsB;
                });
            case 'carbs-desc':
                return sortedArray.sort((a, b) => {
                    const carbsA = a.nutrition && a.nutrition.carbs ? a.nutrition.carbs : 0;
                    const carbsB = b.nutrition && b.nutrition.carbs ? b.nutrition.carbs : 0;
                    return carbsB - carbsA;
                });
            default:
                return sortedArray;
        }
    } catch (error) {
        console.error("Ошибка в функции sortRecipesByFilter:", error);
        return recipeArray; // В случае ошибки возвращаем исходный массив
    }
}

function calculateRecipeCost(recipe) {
    try {
        let totalCost = 0;
        if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
            recipe.ingredients.forEach(ingredient => {
                if (ingredient.price) {
                    totalCost += parseFloat(ingredient.price);
                }
            });
        }
        return totalCost;
    } catch (error) {
        console.error("Ошибка в функции calculateRecipeCost:", error);
        return 0; // В случае ошибки возвращаем 0
    }
}

// Функция настройки управления категориями
function setupCategories() {
    // Обработчик для открытия формы добавления категории блюд
    document.getElementById('add-recipe-category-btn').addEventListener('click', function() {
        document.getElementById('category-id').value = ''; // Сбрасываем ID
        document.getElementById('category-name').value = '';
        document.getElementById('category-color').value = '#007bff';
        document.querySelector('#category-modal .modal-title').textContent = 'Ajouter une catégorie';
        new bootstrap.Modal(document.getElementById('category-modal')).show();
    });
    
    // Обработчик для сохранения категории блюд
    document.getElementById('save-category-btn').addEventListener('click', saveCategory);
    
    // Обработчик для открытия формы добавления категории продуктов
    document.getElementById('add-ingredient-category-btn').addEventListener('click', function() {
        document.getElementById('ingredient-category-id').value = ''; // Сбрасываем ID
        document.getElementById('ingredient-category-name').value = '';
        document.getElementById('ingredient-category-priority').value = '10';
        document.querySelector('#ingredient-category-modal .modal-title').textContent = 'Ajouter une catégorie d\'ingrédients';
        new bootstrap.Modal(document.getElementById('ingredient-category-modal')).show();
    });
    
    // Обработчик для сохранения категории продуктов
    document.getElementById('save-ingredient-category-btn').addEventListener('click', saveIngredientCategory);
}

// Функция для сохранения категории
function saveCategory() {
    // Проверка авторизации
    if (!checkAuth()) {
        alert("Vous devez être connecté pour effectuer cette action");
        return;
    }
    const categoryId = document.getElementById('category-id').value;
    const name = document.getElementById('category-name').value.trim();
    const color = document.getElementById('category-color').value;
    
    if (!name) {
        alert('Veuillez entrer un nom de catégorie!');
        return;
    }
    
    // Проверяем существование категории только при создании новой
    if (!categoryId && categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        alert('Cette catégorie existe déjà!');
        return;
    }
    
    if (categoryId) {
        // Редактирование существующей категории
        db.collection('categories').doc(categoryId).update({
            name,
            color,
            updatedAt: new Date()
        }).then(() => {
            // Обновляем категорию в локальном массиве
            const index = categories.findIndex(c => c.id === categoryId);
            if (index !== -1) {
                categories[index].name = name;
                categories[index].color = color;
            }
            
            // Отображаем обновленный список категорий
            renderCategories();
            
            // Обновляем выпадающие списки категорий
            populateCategoryDropdowns();
            
            // Закрываем модальное окно
            document.getElementById('category-modal').querySelector('.btn-close').click();
        }).catch(error => {
            console.error("Ошибка при обновлении категории:", error);
        });
    } else {
        // Добавление новой категории
        db.collection('categories').add({
            name,
            color,
            createdAt: new Date()
        }).then(docRef => {
            const newCategory = {
                id: docRef.id,
                name,
                color
            };
            
            // Добавляем категорию в локальный массив
            categories.push(newCategory);
            
            // Отображаем обновленный список категорий
            renderCategories();
            
            // Обновляем выпадающие списки категорий
            populateCategoryDropdowns();
            
            // Закрываем модальное окно
            document.getElementById('category-modal').querySelector('.btn-close').click();
        }).catch(error => {
            console.error("Ошибка при добавлении категории:", error);
        });
    }
}

// Функция для отображения категорий
function renderCategories() {
    const container = document.getElementById('recipe-categories-list');
    const noMessage = document.getElementById('no-recipe-categories-message');
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    if (categories.length === 0) {
        noMessage.style.display = 'block';
        return;
    } else {
        noMessage.style.display = 'none';
    }
    
    // Отображаем каждую категорию
    categories.forEach(category => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        listItem.innerHTML = `
            <div>
                <span class="category-color" style="background-color: ${category.color};"></span>
                ${category.name}
            </div>
            <div class="btn-group">
                
                <button class="btn btn-sm btn-outline-danger delete-category-btn" data-id="${category.id}" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.appendChild(listItem);
    });
    
    // Добавляем обработчики для кнопок удаления
    document.querySelectorAll('.delete-category-btn').forEach(button => {
        button.addEventListener('click', function() {
            const categoryId = this.getAttribute('data-id');
            deleteCategory(categoryId);
        });
    });
    
    // Добавляем обработчики для кнопок редактирования
    document.querySelectorAll('.edit-category-btn').forEach(button => {
        button.addEventListener('click', function() {
            const categoryId = this.getAttribute('data-id');
            editCategory(categoryId);
        });
    });
}

// Функция для отображения категорий продуктов
function renderIngredientCategories() {
    const container = document.getElementById('ingredient-categories-list');
    const noMessage = document.getElementById('no-ingredient-categories-message');
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    if (ingredientCategories.length === 0) {
        noMessage.style.display = 'block';
        return;
    } else {
        noMessage.style.display = 'none';
    }
    
    // Отображаем каждую категорию продуктов, сортируя по приоритету
    ingredientCategories.sort((a, b) => a.priority - b.priority);
    
    ingredientCategories.forEach(category => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        listItem.innerHTML = `
            <div>
                <span class="badge bg-secondary">${category.priority}</span>
                ${category.name}
            </div>
            <div class="btn-group">
                <button class="btn btn-sm btn-outline-primary edit-ingredient-category-btn" data-id="${category.id}" title="Редактировать">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-ingredient-category-btn" data-id="${category.id}" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.appendChild(listItem);
    });
    
    // Добавляем обработчики для кнопок удаления
    document.querySelectorAll('.delete-ingredient-category-btn').forEach(button => {
        button.addEventListener('click', function() {
            const categoryId = this.getAttribute('data-id');
            deleteIngredientCategory(categoryId);
        });
    });
    
    // Добавляем обработчики для кнопок редактирования
    document.querySelectorAll('.edit-ingredient-category-btn').forEach(button => {
        button.addEventListener('click', function() {
            const categoryId = this.getAttribute('data-id');
            editIngredientCategory(categoryId);
        });
    });
}

// Функция для редактирования категории продуктов
function editIngredientCategory(categoryId) {
    const category = ingredientCategories.find(c => c.id === categoryId);
    if (!category) return;
    
    // Заполняем форму данными категории
    document.getElementById('ingredient-category-id').value = categoryId;
    document.getElementById('ingredient-category-name').value = category.name;
    document.getElementById('ingredient-category-priority').value = category.priority;
    
    // Изменяем заголовок модального окна
    document.querySelector('#ingredient-category-modal .modal-title').textContent = 'Modifier la catégorie d\'ingrédients';
    
    // Показываем модальное окно
    new bootstrap.Modal(document.getElementById('ingredient-category-modal')).show();
}

// Функция для заполнения выпадающих списков категорий продуктов
function populateIngredientCategoryDropdowns() {
    // Получаем все селекты категорий продуктов на странице
    const selects = document.querySelectorAll('.ingredient-category');
    
    // Для каждого селекта
    selects.forEach(select => {
        // Сохраняем текущее выбранное значение
        const currentValue = select.value;
        
        // Очищаем список
        select.innerHTML = '<option value="">Catégorie</option>';
        
        // Проверяем, есть ли категории
        if (ingredientCategories.length === 0) {
            select.innerHTML = '<option value="">Sans catégorie</option>';
        } else {
            // Добавляем категории продуктов, отсортированные по приоритету
            ingredientCategories.sort((a, b) => a.priority - b.priority);
            
            ingredientCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id; // Используем ID категории как значение
                option.textContent = category.name;
                select.appendChild(option);
            });
        }
        
        // Восстанавливаем выбранное значение
        select.value = currentValue;
    });
}

// Функционал кнопки возврата наверх
document.addEventListener('DOMContentLoaded', function() {
    const backToTopBtn = document.getElementById('back-to-top-btn');
    
    // Показываем кнопку при прокрутке
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    // Действие при клике на кнопку
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

// Модифицируем функцию очистки плана питания для удаления подтверждения
function clearMealPlan() {
    // Создаем пустой план питания без подтверждения
    mealPlan = {
        monday: { breakfast: [], lunch: [], dinner: [] },
        tuesday: { breakfast: [], lunch: [], dinner: [] },
        wednesday: { breakfast: [], lunch: [], dinner: [] },
        thursday: { breakfast: [], lunch: [], dinner: [] },
        friday: { breakfast: [], lunch: [], dinner: [] },
        saturday: { breakfast: [], lunch: [], dinner: [] },
        sunday: { breakfast: [], lunch: [], dinner: [] }
    };
    
    // Сохраняем план в Firestore
    db.collection('mealPlan').doc('current').set(mealPlan).then(() => {
        // Отображаем обновленный план
        renderMealPlan();
        
        // Визуальное подтверждение вместо alert
        const clearButton = document.getElementById('clear-meal-plan-btn');
        const originalText = clearButton.innerHTML;
        clearButton.innerHTML = '<i class="fas fa-check"></i> Очищено';
        clearButton.classList.remove('btn-danger');
        clearButton.classList.add('btn-success');
        
        // Возвращаем исходный текст кнопки через 2 секунды
        setTimeout(() => {
            clearButton.innerHTML = originalText;
            clearButton.classList.remove('btn-success');
            clearButton.classList.add('btn-danger');
        }, 2000);
    }).catch(error => {
        console.error("Ошибка при очистке плана питания:", error);
    });
}

// Функция для удаления категории продуктов
function deleteIngredientCategory(categoryId) {
    // Проверка авторизации
    if (!checkAuth()) {
        alert("Vous devez être connecté pour effectuer cette action");
        return;
    }
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie d\'ingrédients?')) return;
    
    // Удаляем категорию из Firestore
    db.collection('ingredientCategories').doc(categoryId).delete().then(() => {
        // Удаляем категорию из локального массива
        ingredientCategories = ingredientCategories.filter(c => c.id !== categoryId);
        
        // Отображаем обновленный список категорий
        renderIngredientCategories();
        
        // Обновляем выпадающие списки категорий
        populateIngredientCategoryDropdowns();
    }).catch(error => {
        console.error("Ошибка при удалении категории продуктов:", error);
    });
}

// Функция для сохранения категории продуктов
function saveIngredientCategory() {
    // Проверка авторизации
    if (!checkAuth()) {
        alert("Vous devez être connecté pour effectuer cette action");
        return;
    }
    const categoryId = document.getElementById('ingredient-category-id').value;
    const name = document.getElementById('ingredient-category-name').value.trim();
    const priority = parseInt(document.getElementById('ingredient-category-priority').value) || 10;
    
    if (!name) {
        alert('Veuillez entrer un nom pour la catégorie d\'ingrédients !');
        return;
    }
    
    // Проверяем существование категории только при создании новой
    if (!categoryId && ingredientCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        alert('Cette catégorie d\'ingrédients existe déjà!');
        return;
    }
    
    if (categoryId) {
        // Редактирование существующей категории
        db.collection('ingredientCategories').doc(categoryId).update({
            name,
            priority,
            updatedAt: new Date()
        }).then(() => {
            // Обновляем категорию в локальном массиве
            const index = ingredientCategories.findIndex(c => c.id === categoryId);
            if (index !== -1) {
                ingredientCategories[index].name = name;
                ingredientCategories[index].priority = priority;
            }
            
            // Отображаем обновленный список категорий
            renderIngredientCategories();
            
            // Обновляем выпадающие списки категорий
            populateIngredientCategoryDropdowns();
            
            // Закрываем модальное окно
            document.getElementById('ingredient-category-modal').querySelector('.btn-close').click();
        }).catch(error => {
            console.error("Ошибка при обновлении категории продуктов:", error);
        });
    } else {
        // Добавление новой категории
        db.collection('ingredientCategories').add({
            name,
            priority,
            createdAt: new Date()
        }).then(docRef => {
            const newCategory = {
                id: docRef.id,
                name,
                priority,
                createdAt: new Date()
            };
            
            // Добавляем категорию в локальный массив
            ingredientCategories.push(newCategory);
            
            // Отображаем обновленный список категорий
            renderIngredientCategories();
            
            // Обновляем выпадающие списки категорий
            populateIngredientCategoryDropdowns();
            
            // Закрываем модальное окно
            document.getElementById('ingredient-category-modal').querySelector('.btn-close').click();
        }).catch(error => {
            console.error("Ошибка при добавлении категории продуктов:", error);
        });
    }
}

// Функция для удаления категории
function deleteCategory(categoryId) {
    // Проверка авторизации
    if (!checkAuth()) {
        alert("Vous devez être connecté pour effectuer cette action");
        return;
    }
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie?')) return;
    
    // Находим рецепты, которые используют эту категорию
    const affectedRecipes = recipes.filter(recipe => recipe.categories && recipe.categories.includes(categoryId));
    
    // Удаляем категорию из Firestore
    db.collection('categories').doc(categoryId).delete().then(() => {
        // Удаляем категорию из локального массива
        categories = categories.filter(c => c.id !== categoryId);
        
        // Обновляем рецепты, которые использовали эту категорию
        if (affectedRecipes.length > 0) {
            const batch = db.batch();
            affectedRecipes.forEach(recipe => {
                const recipeRef = db.collection('recipes').doc(recipe.id);
                const updatedCategories = recipe.categories.filter(c => c !== categoryId);
                batch.update(recipeRef, { categories: updatedCategories });
            });
            
            batch.commit().then(() => {
                // Обновляем локальные рецепты
                recipes.forEach(recipe => {
                    if (recipe.categories && recipe.categories.includes(categoryId)) {
                        recipe.categories = recipe.categories.filter(c => c !== categoryId);
                    }
                });
                
                // Отображаем обновленные списки
                renderRecipes();
            });
        }
        
        // Отображаем обновленный список категорий
        renderCategories();
        
        // Обновляем выпадающие списки категорий
        populateCategoryDropdowns();
    }).catch(error => {
        console.error("Ошибка при удалении категории:", error);
    });
}

// Функция для заполнения выпадающих списков категорий
function populateCategoryDropdowns() {
    // Заполняем списки для формы рецепта и фильтров
    const categorySelector = document.getElementById('category-selector');
    const categoryFilter = document.getElementById('category-filter');
    const categoryFilterInModal = document.getElementById('category-filter-in-modal');
    
    // Сохраняем текущие выбранные значения
    const categorySelectorValue = categorySelector ? categorySelector.value : '';
    const categoryFilterValue = categoryFilter ? categoryFilter.value : '';
    const categoryFilterInModalValue = categoryFilterInModal ? categoryFilterInModal.value : '';
    
    // Очищаем списки
    if (categorySelector) categorySelector.innerHTML = '<option value="">Sélectionnez une catégorie</option>';
    if (categoryFilter) categoryFilter.innerHTML = '<option value="">Toutes les catégories</option>';
    if (categoryFilterInModal) categoryFilterInModal.innerHTML = '<option value="">Toutes les catégories</option>';
    
    // Добавляем категории
    categories.forEach(category => {
        // Для формы рецепта
        if (categorySelector) {
            const categoryOption = document.createElement('option');
            categoryOption.value = category.id;
            categoryOption.textContent = category.name;
            categorySelector.appendChild(categoryOption);
        }
        
        // Для фильтра на главной странице
        if (categoryFilter) {
            const filterOption = document.createElement('option');
            filterOption.value = category.id;
            filterOption.textContent = category.name;
            categoryFilter.appendChild(filterOption);
        }
        
        // Для фильтра в модальном окне
        if (categoryFilterInModal) {
            const modalFilterOption = document.createElement('option');
            modalFilterOption.value = category.id;
            modalFilterOption.textContent = category.name;
            categoryFilterInModal.appendChild(modalFilterOption);
        }
    });
    
    // Восстанавливаем выбранные значения
    if (categorySelector) categorySelector.value = categorySelectorValue;
    if (categoryFilter) categoryFilter.value = categoryFilterValue;
    if (categoryFilterInModal) categoryFilterInModal.value = categoryFilterInModalValue;
}

// Функция настройки плана питания
function setupMealPlanning() {
    // Обработчик для добавления рецепта в план
    document.getElementById('confirm-add-to-plan-btn').addEventListener('click', function() {
        const recipeId = document.getElementById('plan-recipe-id').value;
        const day = document.getElementById('plan-day').value;
        const meal = document.getElementById('plan-meal').value;
        
        addToPlan(recipeId, day, meal);
    });
    
    // Обработчик для создания списка покупок на основе плана
    document.getElementById('generate-shopping-list-btn').addEventListener('click', generateShoppingList);
    
    // Обработчик для очистки плана питания
    document.getElementById('clear-meal-plan-btn').addEventListener('click', clearMealPlan);
}

// Функция для добавления рецепта в план питания
function addToPlan(recipeId, day, meal) {
    // Проверка авторизации
    if (!checkAuth()) {
        alert("Vous devez être connecté pour effectuer cette action");
        return;
    }
    // Проверяем, существует ли рецепт
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    // Создаем структуру плана питания, если её нет
    if (!mealPlan[day]) {
        mealPlan[day] = {};
    }
    if (!mealPlan[day][meal]) {
        mealPlan[day][meal] = [];
    }
    
    // Проверяем, не добавлен ли уже этот рецепт
    if (mealPlan[day][meal].includes(recipeId)) {
        alert('Cette recette est déjà ajoutée au plan pour le jour et le repas spécifiés.');
        addToPlanModal.hide();
        selectRecipeModal.hide();
        return;
    }
    
    // Добавляем рецепт в план
    mealPlan[day][meal].push(recipeId);
    
    // Сохраняем план в Firestore
    db.collection('mealPlan').doc('current').set(mealPlan).then(() => {
        // Отображаем обновленный план
        renderMealPlan();
        
        // Закрываем модальные окна
        addToPlanModal.hide();
        selectRecipeModal.hide();
        
        // Переключаемся на вкладку плана питания
        document.getElementById('meal-plan-tab').click();
    }).catch(error => {
        console.error("Ошибка при обновлении плана питания:", error);
    });
}

// Функция для отображения плана питания
function renderMealPlan() {
    // Обрабатываем каждую ячейку плана
    document.querySelectorAll('.meal-cell').forEach(cell => {
        const day = cell.getAttribute('data-day');
        const meal = cell.getAttribute('data-meal');
        
        // Очищаем ячейку
        cell.innerHTML = '';
        
        // Добавляем кнопку для добавления рецепта
        const addButton = document.createElement('button');
        addButton.className = 'btn btn-sm btn-outline-secondary w-100';
        addButton.innerHTML = '<i class="fas fa-plus"></i> Ajouter';
        addButton.addEventListener('click', function() {
            // Показываем модальное окно для выбора рецепта
            showRecipeSelectionModal(day, meal);
        });
        
        cell.appendChild(addButton);
        
        // Проверяем, есть ли рецепты для этого дня и приёма пищи
        if (mealPlan[day] && mealPlan[day][meal] && mealPlan[day][meal].length > 0) {
            // Удаляем кнопку добавления
            cell.removeChild(addButton);
            
            // Добавляем рецепты
            mealPlan[day][meal].forEach(recipeId => {
                const recipe = recipes.find(r => r.id === recipeId);
                if (recipe) {
                    const mealItem = document.createElement('div');
                    mealItem.className = 'meal-item';
                    mealItem.innerHTML = `
                        ${recipe.name}
                        <i class="fas fa-times remove-meal" data-day="${day}" data-meal="${meal}" data-recipe="${recipeId}"></i>
                    `;
                    
                    // Добавляем обработчик для просмотра рецепта при клике
                    mealItem.addEventListener('click', function(e) {
                        // Исключаем клик по кнопке удаления
                        if (e.target.closest('.remove-meal')) return;
                        viewRecipe(recipeId);
                    });
                    
                    cell.appendChild(mealItem);
                }
            });
            
            // Добавляем кнопку в конец для добавления ещё одного рецепта
            cell.appendChild(addButton);
        }
    });
    
    // Добавляем обработчики для кнопок удаления
    document.querySelectorAll('.remove-meal').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const day = this.getAttribute('data-day');
            const meal = this.getAttribute('data-meal');
            const recipeId = this.getAttribute('data-recipe');
            removeFromPlan(recipeId, day, meal);
        });
    });
}
