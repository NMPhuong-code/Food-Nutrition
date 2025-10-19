// This script will now handle both the landing page and the dashboard.

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'index.html' || currentPage === '') {
        // This part handles the landing page (index.html)
        if (document.getElementById('auth-section')) {
            setupLandingPage();
        }
    } else if (currentPage === 'dashboard.html') {
        // This part handles the dashboard page
        setupDashboardPage();
    }
});

// --- 1. LANDING PAGE LOGIC ---
function setupLandingPage() {
    const authSection = document.getElementById('auth-section');
    const userRole = sessionStorage.getItem('userRole');

    if (userRole) {
        // User is logged in
        authSection.innerHTML = `
            <div class="user-menu-container">
                <button id="user-menu-button"><i class="fa-solid fa-user-circle"></i></button>
                <div id="user-menu-dropdown" class="user-menu-dropdown">
                    <a href="dashboard.html">Hồ sơ của tôi</a>
                    ${userRole === 'admin' ? '<a href="dashboard.html?page=admin-page">Admin Panel</a>' : ''}
                    <button id="logout-button">Đăng xuất</button>
                </div>
            </div>
        `;
        document.getElementById('user-menu-button').addEventListener('click', toggleUserMenu);
        document.getElementById('logout-button').addEventListener('click', logout);
    } else {
        // User is not logged in
        authSection.innerHTML = `<a href="login.html">Đăng nhập</a>`;
    }
}

function toggleUserMenu() {
    const dropdown = document.getElementById('user-menu-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function logout() {
    sessionStorage.removeItem('userRole');
    localStorage.clear();
    window.location.href = 'index.html';
}

// Close dropdown if clicked outside
window.onclick = function(event) {
    if (event.target && !event.target.matches('#user-menu-button, #user-menu-button *')) {
        document.querySelectorAll('.user-menu-dropdown.show').forEach(d => d.classList.remove('show'));
    }
}


// --- 2. DASHBOARD PAGE LOGIC ---

// Global variables for dashboard
let nutritionData = {};
let macroChart;
let progressChart;

function setupDashboardPage() {
    const userRole = sessionStorage.getItem('userRole');
    if (!userRole) {
        window.location.href = 'login.html';
        return;
    }
    loadDashboardData();
}

async function loadDashboardData() {
    try {
        const response = await fetch('data.json');
        nutritionData = await response.json();
        
        initializeDashboardUI();
        initDashboardEventListeners();
        populateFoodDropdown();
        
        const params = new URLSearchParams(window.location.search);
        const page = params.get('page') || 'dashboard-page';
        showPage(page);

    } catch (error) {
        console.error("Lỗi khi tải dữ liệu cho dashboard:", error);
    }
}

function initializeDashboardUI() {
    const userRole = sessionStorage.getItem('userRole');
    const adminNavItem = document.getElementById('admin-nav-item');
    const userMenu = document.getElementById('user-menu-dropdown');

    if (userRole === 'admin') {
        adminNavItem.style.display = 'block';
    } else {
        adminNavItem.style.display = 'none';
    }

    userMenu.innerHTML = `
        <a href="dashboard.html">Hồ sơ của tôi</a>
        ${userRole === 'admin' ? '<a href="dashboard.html?page=admin-page">Admin Panel</a>' : ''}
        <button id="logout-button-dash">Đăng xuất</button>
    `;

    document.getElementById('logout-button-dash').addEventListener('click', logout);
    document.getElementById('user-menu-button').addEventListener('click', toggleUserMenu);
}

function initDashboardEventListeners() {
    document.getElementById('calculate-bmi-btn').addEventListener('click', calculateBMI);
    document.getElementById('photo-upload').addEventListener('change', handleImageUpload);
    document.getElementById('analyze-button').addEventListener('click', analyzeDishFromMock);
    document.getElementById('add-ingredient-btn').addEventListener('click', addIngredientRow);
    document.getElementById('analyze-recipe-btn').addEventListener('click', analyzeRecipe);
    document.getElementById('save-meal-btn').addEventListener('click', saveAnalyzedMeal);
    document.getElementById('export-csv-btn').addEventListener('click', exportHistoryToCSV);
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const pageElement = document.getElementById(pageId);
    if (pageElement) {
        pageElement.style.display = 'block';
    } else {
        // Fallback to dashboard if page not found
        document.getElementById('dashboard-page').style.display = 'block';
        pageId = 'dashboard-page';
    }
    
    document.querySelectorAll('#sidebar-nav .nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeButton = document.querySelector(`#sidebar-nav button[onclick="showPage('${pageId}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
        document.getElementById('page-title').textContent = activeButton.querySelector('span').textContent;
    }

    if (pageId === 'dashboard-page') updateDashboard();
    else if (pageId === 'history-page') loadHistory();
    else if (pageId === 'admin-page' && sessionStorage.getItem('userRole') === 'admin') {
        document.getElementById('admin-data-display').textContent = JSON.stringify(nutritionData, null, 2);
    }
}

// --- ALL DASHBOARD CORE FUNCTIONS ---

function calculateBMI() {
    const heightCm = parseFloat(document.getElementById('height-input').value);
    const weightKg = parseFloat(document.getElementById('weight-input').value);
    if (!heightCm || !weightKg) { alert("Vui lòng nhập đủ thông tin."); return; }
    
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    const goal = document.getElementById('goal-select').value;
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * 30 + 5; // Assume age 30
    let tdee = Math.round(bmr * 1.55);

    let status = "";
    if (bmi < 18.5) status = "Thiếu cân";
    else if (bmi < 25) status = "Bình thường";
    else status = "Thừa cân";

    if (goal === 'lose') tdee -= 500;
    else if (goal === 'gain') tdee += 500;

    document.getElementById('bmi-value').textContent = bmi.toFixed(2);
    document.getElementById('bmi-status').textContent = status;
    document.getElementById('tdee-value').textContent = tdee;

    localStorage.setItem('userTargetCalo', tdee);
    localStorage.setItem('userBMI', bmi.toFixed(2));
    localStorage.setItem('userBMIStatus', status);
    updateDashboard();
}

function handleImageUpload(event) {
    if (event.target.files[0]) {
        document.getElementById('mock-recognition-input').style.display = 'block';
    }
}

function populateFoodDropdown() {
    const select = document.getElementById('mock-food-name');
    if (!select || !nutritionData.dishes) return;
    select.innerHTML = '<option value="">-- Chọn món ăn --</option>';
    Object.keys(nutritionData.dishes).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = nutritionData.dishes[key].name;
        select.appendChild(option);
    });
}

function analyzeDishFromMock() {
    const key = document.getElementById('mock-food-name').value;
    if (!key) return;
    const dish = nutritionData.dishes[key];
    displayAnalysisResult(dish.name, dish);
}

function addIngredientRow() {
    document.querySelector('#recipe-input-table tbody').insertRow().innerHTML = `
        <td><input type="text" class="ingredient-name" placeholder="Ví dụ: Thịt gà luộc"></td>
        <td><input type="number" class="ingredient-amount" value="100"></td>
        <td><button onclick="removeRow(this)" class="secondary-btn">Xóa</button></td>`;
}

function removeRow(button) { button.closest('tr').remove(); }

function analyzeRecipe() {
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    document.querySelectorAll('#recipe-input-table tbody tr').forEach(row => {
        const name = row.querySelector('.ingredient-name').value.toLowerCase();
        const amount = parseFloat(row.querySelector('.ingredient-amount').value);
        if (!name || !amount) return;
        const key = Object.keys(nutritionData.ingredients).find(k => nutritionData.ingredients[k].name.toLowerCase().includes(name));
        if (key) {
            const item = nutritionData.ingredients[key];
            const multiplier = amount / 100;
            Object.keys(totals).forEach(p => totals[p] += item[p] * multiplier);
        }
    });
    displayAnalysisResult("Công Thức Cá Nhân", totals);
}

function displayAnalysisResult(name, data) {
    document.getElementById('analyzed-food-name').textContent = name;
    document.getElementById('total-calories').textContent = Math.round(data.calories);
    document.getElementById('total-protein').textContent = Math.round(data.protein);
    document.getElementById('total-carbs').textContent = Math.round(data.carbs);
    document.getElementById('total-fat').textContent = Math.round(data.fat);
    document.getElementById('analysis-result-area').style.display = 'block';
    drawMacroChart(data.protein, data.carbs, data.fat);
}

function drawMacroChart(protein = 0, carbs = 0, fat = 0) {
    const ctx = document.getElementById('macroChart').getContext('2d');
    if (macroChart) macroChart.destroy();
    macroChart = new Chart(ctx, {
        type: 'pie', data: { labels: ['Protein', 'Carbs', 'Fat'], datasets: [{ data: [protein, carbs, fat], backgroundColor: ['#4CAF50', '#2196F3', '#FFC107'] }] }, options: { responsive: true, maintainAspectRatio: false }
    });
}

function saveAnalyzedMeal() {
    if (document.getElementById('total-calories').textContent === '0') return;
    const meal = {
        time: new Date().toISOString(),
        name: document.getElementById('analyzed-food-name').textContent,
        calories: parseInt(document.getElementById('total-calories').textContent) || 0,
        protein: parseInt(document.getElementById('total-protein').textContent) || 0,
        carbs: parseInt(document.getElementById('total-carbs').textContent) || 0,
        fat: parseInt(document.getElementById('total-fat').textContent) || 0,
    };
    const history = JSON.parse(localStorage.getItem('nutriAppHistory') || '[]');
    history.push(meal);
    localStorage.setItem('nutriAppHistory', JSON.stringify(history));
    alert('Đã lưu bữa ăn!');
    updateDashboard();
}

function isToday(dateString) { const date = new Date(dateString); const today = new Date(); return date.toDateString() === today.toDateString(); }

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('nutriAppHistory') || '[]');
    const tableBody = document.querySelector('#history-table tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    let dailyCalo = 0;
    history.forEach(meal => {
        if (isToday(meal.time)) dailyCalo += meal.calories;
        const row = tableBody.insertRow(0);
        row.innerHTML = `<td>${new Date(meal.time).toLocaleString()}</td><td>${meal.name}</td><td>${meal.calories} kcal</td><td>${meal.protein}/${meal.carbs}/${meal.fat}g</td>`;
    });
    const target = localStorage.getItem('userTargetCalo') || 0;
    const summary = document.getElementById('daily-log-summary');
    if(summary) summary.innerHTML = `<h3>Tổng Calo Hôm Nay: <span class="highlight">${dailyCalo}</span> kcal / ${target} kcal</h3>`;
}

function exportHistoryToCSV() {
    const history = JSON.parse(localStorage.getItem('nutriAppHistory') || '[]');
    let csv = 'Time,Meal,Calories,Protein,Carbs,Fat\n';
    history.forEach(m => { csv += `${new Date(m.time).toLocaleString()},"${m.name}",${m.calories},${m.protein},${m.carbs},${m.fat}\n`; });
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    a.target = '_blank';
    a.download = 'nutri_history.csv';
    a.click();
}

function updateDashboard() {
    const history = JSON.parse(localStorage.getItem('nutriAppHistory') || '[]');
    let dailyCalo = 0;
    history.forEach(meal => { if (isToday(meal.time)) dailyCalo += meal.calories; });
    document.getElementById('dash-tdee-value').textContent = localStorage.getItem('userTargetCalo') || 0;
    document.getElementById('dash-daily-calo').textContent = dailyCalo;
    document.getElementById('dash-bmi-value').textContent = localStorage.getItem('userBMI') || '--';
    document.getElementById('dash-bmi-status').textContent = localStorage.getItem('userBMIStatus') || '';
    drawProgressChart(history, localStorage.getItem('userTargetCalo') || 0);
}

function drawProgressChart(history, target) {
    const ctx = document.getElementById('progressChart').getContext('2d');
    if (!ctx) return;
    const labels = [];
    const dailyTotals = {};
    for (let i = 6; i >= 0; i--) {
        const date = new Date(); date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        labels.push(date); dailyTotals[dateString] = 0;
    }
    history.forEach(meal => {
        const dateString = meal.time.split('T')[0];
        if (dailyTotals[dateString] !== undefined) dailyTotals[dateString] += meal.calories;
    });
    if (progressChart) progressChart.destroy();
    progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Calo Đã Nạp', data: Object.values(dailyTotals), borderColor: '#28a745', fill: true },
                { label: 'Mục Tiêu (TDEE)', data: Array(7).fill(target), borderColor: '#dc3545', borderDash: [5, 5] }
            ]
        },
        options: { scales: { x: { type: 'time', time: { unit: 'day', displayFormats: { day: 'dd/MM' } } } } }
    });
}

