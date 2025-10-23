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

// --- NEW PLANNER CONSTANTS ---
const MEAL_CATEGORIES = [
    { 
        title: '7 Days Diet - Thuần Việt', 
        description: 'Thực đơn giảm cân 7 ngày ngon chuẩn Việt.', 
        image: 'image/Bua_an_dd_7day.jpg', // SỬ DỤNG 'image/'
        link: 'https://mealplan.vn/thuc-don-giam-can-ngon-chuan-viet/' 
    },
    { 
        title: '7 Days Flat Belly Diet', 
        description: 'Kế hoạch ăn uống cho vòng eo thon gọn.', 
        image: 'image/san-pham-chay-giau-protein.png', // SỬ DỤNG 'image/'
        link: '#' 
    },
    { 
        title: 'Your Best Body Meal Plan', 
        description: 'Xây dựng chế độ dinh dưỡng cá nhân.', 
        image: 'image/com-chay-005.webp', // SỬ DỤNG 'image/'
        link: '#' 
    },
    { 
        title: 'Easy eating plan for Weight Loss', 
        description: 'Kế hoạch ăn uống đơn giản, dễ thực hiện.', 
        image: 'image/image3_202509132252067351.jpg', // SỬ DỤNG 'image/'
        link: '#' 
    },
];
const WEEK_DAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
// --- END NEW PLANNER CONSTANTS ---


// --- 1. LANDING PAGE LOGIC ---
function setupLandingPage() {
    const authSection = document.getElementById('auth-section');
    const userRole = sessionStorage.getItem('userRole');

    if (userRole) {
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
        authSection.innerHTML = `<a href="login.html" class="login-button">Đăng nhập</a>`;
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

window.onclick = function(event) {
    if (event.target && !event.target.matches('#user-menu-button, #user-menu-button *')) {
        document.querySelectorAll('.user-menu-dropdown.show').forEach(d => d.classList.remove('show'));
    }
}

// --- 2. DASHBOARD PAGE LOGIC ---
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

// THAY THẾ TOÀN BỘ HÀM CŨ BẰNG HÀM MỚI NÀY
function initDashboardEventListeners() {
    // Hàm này sẽ kiểm tra nếu phần tử tồn tại trước khi thêm sự kiện
    const addSafeListener = (id, event, handler) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
        }
    };

    // Gắn các sự kiện một cách an toàn
    addSafeListener('calculate-bmi-btn', 'click', calculateBMI);
    addSafeListener('photo-upload', 'change', handleImageUpload);
    addSafeListener('confirm-analysis-btn', 'click', confirmAndAnalyzeNutrition);
    addSafeListener('add-ingredient-btn', 'click', addIngredientRow);
    addSafeListener('analyze-recipe-btn', 'click', analyzeRecipe);
    addSafeListener('save-meal-btn', 'click', saveAnalyzedMeal);
    addSafeListener('export-csv-btn', 'click', exportHistoryToCSV);
    addSafeListener('save-weekly-plan-btn', 'click', saveWeeklyPlan);
    addSafeListener('export-weekly-plan-btn', 'click', exportWeeklyPlanToCSV);

    // Scroll to Top Logic (phần này không đổi)
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const scrollableContent = document.querySelector('.page-content-wrapper');

    if (scrollToTopBtn && scrollableContent) {
        scrollableContent.addEventListener('scroll', () => {
            if (scrollableContent.scrollTop > 100) {
                scrollToTopBtn.style.display = "block";
            } else {
                scrollToTopBtn.style.display = "none";
            }
        });

        scrollToTopBtn.addEventListener('click', () => {
            scrollableContent.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const pageElement = document.getElementById(pageId);
    if (pageElement) {
        pageElement.style.display = 'block';
    } else {
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
    else if (pageId === 'planner-page') renderPlannerPage(); 
    else if (pageId === 'admin-page' && sessionStorage.getItem('userRole') === 'admin') {
        document.getElementById('admin-data-display').textContent = JSON.stringify(nutritionData, null, 2);
    }
}

// --- NEW PLANNER PAGE FUNCTIONS ---

function renderPlannerPage() {
    renderMealCategories();
    renderWeeklyPlannerTable();
    loadWeeklyPlan();
}

function renderMealCategories() {
    const container = document.getElementById('meal-category-container');
    if (!container) return;
    
    container.innerHTML = MEAL_CATEGORIES.map(category => `
        <a href="${category.link}" target="_blank" class="category-card">
            <img src="${category.image}" alt="${category.title}">
            <div class="category-info">
                <h4>${category.title}</h4>
                <p>${category.description}</p>
            </div>
        </a>
    `).join('');
}

function renderWeeklyPlannerTable() {
    const headerRow = document.getElementById('table-day-headers');
    const tableBody = document.getElementById('planner-table-body');
    if (!headerRow || !tableBody) return;

    // Render Headers (Thứ Hai -> Chủ Nhật)
    headerRow.innerHTML = '<th>Bữa Ăn</th>' + WEEK_DAYS.map(day => `<th>${day}</th>`).join('');

    // Render Body (Breakfast, Lunch, Dinner, Snack)
    tableBody.innerHTML = MEAL_TYPES.map(type => `
        <tr data-meal-type="${type}">
            <td class="meal-type-header">${type}</td>
            ${WEEK_DAYS.map(day => `
                <td data-day="${day}" data-meal="${type}">
                    <input type="text" class="meal-input" data-day="${day}" data-meal="${type}" placeholder="Thêm món ăn">
                </td>
            `).join('')}
        </tr>
    `).join('');
}

function loadWeeklyPlan() {
    const savedPlan = JSON.parse(localStorage.getItem('weeklyMealPlan') || '{}');
    if (Object.keys(savedPlan).length === 0) return;

    MEAL_TYPES.forEach(meal => {
        WEEK_DAYS.forEach(day => {
            const input = document.querySelector(`.meal-input[data-day="${day}"][data-meal="${meal}"]`);
            if (input && savedPlan[day] && savedPlan[day][meal]) {
                input.value = savedPlan[day][meal];
            }
        });
    });
}

function saveWeeklyPlan() {
    const weeklyPlan = {};
    WEEK_DAYS.forEach(day => {
        weeklyPlan[day] = {};
        MEAL_TYPES.forEach(meal => {
            const input = document.querySelector(`.meal-input[data-day="${day}"][data-meal="${meal}"]`);
            if (input && input.value.trim()) {
                weeklyPlan[day][meal] = input.value.trim();
            }
        });
    });

    localStorage.setItem('weeklyMealPlan', JSON.stringify(weeklyPlan));
    alert('Đã lưu kế hoạch ăn uống tuần này!');
}

function exportWeeklyPlanToCSV() {
    const weeklyPlan = JSON.parse(localStorage.getItem('weeklyMealPlan') || '{}');
    
    // Nếu chưa lưu lần nào, chỉ xuất khung bảng
    if (Object.keys(weeklyPlan).length === 0) {
        // Tự động tạo kế hoạch trống để xuất
        WEEK_DAYS.forEach(day => weeklyPlan[day] = {});
    }

    let csv = 'Bữa Ăn,' + WEEK_DAYS.join(',') + '\n';

    MEAL_TYPES.forEach(meal => {
        let row = `"${meal}"`;
        WEEK_DAYS.forEach(day => {
            const dish = weeklyPlan[day] && weeklyPlan[day][meal] ? weeklyPlan[day][meal] : '';
            // Escape double quotes and enclose in double quotes for CSV safety
            row += `,"${dish.replace(/"/g, '""')}"`;
        });
        csv += row + '\n';
    });

    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.target = '_blank';
    a.download = 'weekly_meal_plan.csv';
    a.click();
}

// --- Function to handle tab switching on Analysis Page (Khắc phục lỗi) ---
function showAnalysisTab(tabId) {
    document.querySelectorAll('.analysis-tab').forEach(tab => tab.style.display = 'none');
    
    // Xử lý nút active trong tab-nav
    document.querySelectorAll('#analysis-page .tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Hiển thị tab tương ứng
    const tabElement = document.getElementById(tabId);
    if (tabElement) {
        tabElement.style.display = 'block';
    }
    
    // Kích hoạt nút tương ứng
    const tabButton = document.getElementById(tabId + '-btn');
    if (tabButton) {
        tabButton.classList.add('active');
    }
}

// --- ALL DASHBOARD CORE FUNCTIONS ---

function calculateBMI() {
    const heightCm = parseFloat(document.getElementById('height-input').value);
    const weightKg = parseFloat(document.getElementById('weight-input').value);
    const gender = document.getElementById('gender-select').value; // Lấy giá trị giới tính
    const age = 30; // Giả định tuổi 30 cho công thức BMR nếu không có input tuổi

    if (!heightCm || !weightKg) { alert("Vui lòng nhập đủ thông tin."); return; }
    
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    const goal = document.getElementById('goal-select').value;
    
    // Công thức BMR (Mifflin-St Jeor Equation)
    // Nam: (10 × cân nặng kg) + (6.25 × chiều cao cm) - (5 × tuổi) + 5
    // Nữ: (10 × cân nặng kg) + (6.25 × chiều cao cm) - (5 × tuổi) - 161
    let bmr;
    if (gender === 'male') {
        bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
    } else { // female
        bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
    }
    
    // TDEE = BMR * hệ số hoạt động (ví dụ: 1.55 cho hoạt động vừa phải)
    let tdee = Math.round(bmr * 1.55);

    let status = "";
    let statusColor = "";

    // Phân loại BMI
    if (bmi < 18.5) {
        status = "Thiếu cân";
        statusColor = "#2196F3"; // Xanh dương (Underweight)
    } else if (bmi < 25) {
        status = "Bình thường";
        statusColor = "#4CAF50"; // Xanh lá (Normal)
    } else if (bmi < 30) {
        status = "Thừa cân";
        statusColor = "#FFC107"; // Vàng (Overweight)
    } else {
        status = "Béo phì";
        statusColor = "#F44336"; // Đỏ (Obese)
    }

    // Điều chỉnh TDEE theo mục tiêu 
    if (goal === 'lose') tdee -= 500;
    else if (goal === 'gain') tdee += 500;

    // Cập nhật giao diện đơn giản (Kết quả Calo/TDEE)
    document.getElementById('bmi-status').textContent = status;
    document.getElementById('tdee-value').textContent = tdee;

    // CẬP NHẬT GIAO DIỆN TRỰC QUAN MỚI
    document.getElementById('bmi-value-large').textContent = bmi.toFixed(1);
    const statusBar = document.getElementById('bmi-status-bar');
    statusBar.querySelector('.status-text').textContent = status;
    statusBar.style.backgroundColor = statusColor;
    
    // Lưu vào Local Storage
    localStorage.setItem('userTargetCalo', tdee);
    localStorage.setItem('userBMI', bmi.toFixed(1));
    localStorage.setItem('userBMIStatus', status);
    updateDashboard();
}

// THAY THẾ HÀM CŨ BẰNG HÀM MỚI NÀY
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Lấy các element trên giao diện
    const preview = document.getElementById('image-preview');
    const statusMsg = document.getElementById('api-status-message');
    const suggestionsEl = document.getElementById('food-suggestions');
    const portionControl = document.getElementById('portion-control');
    const resultArea = document.getElementById('analysis-result-area');

    // Reset giao diện
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
    suggestionsEl.innerHTML = '';
    portionControl.style.display = 'none';
    resultArea.style.display = 'none';
    statusMsg.style.color = '#007bff';
    statusMsg.textContent = 'Đang gửi ảnh và phân tích... Vui lòng đợi trong giây lát.';

    const fd = new FormData();
    fd.append('photo', file);

    try {
        // 1. GỌI API /api/photo/upload
        const response = await fetch('http://127.0.0.1:5000/api/photo/upload', {
            method: 'POST',
            body: fd
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        statusMsg.textContent = 'AI đã nhận diện được các món sau. Vui lòng chọn một gợi ý:';

        // 2. HIỂN THỊ CÁC GỢI Ý (SUGGESTIONS)
        if (data.suggestions && data.suggestions.length > 0) {
            data.suggestions.forEach(s => {
                const btn = document.createElement('button');
                btn.textContent = `${s.name} ( khớp với: ${s.match_label} )`;
                btn.className = 'secondary-btn';
                btn.style.margin = '5px';
                btn.onclick = () => selectFoodSuggestion(s.food_id, s.name);
                suggestionsEl.appendChild(btn);
            });
        } else {
            statusMsg.textContent = 'Không nhận diện được món ăn nào phù hợp trong ảnh.';
        }

    } catch (error) {
        statusMsg.style.color = 'red';
        statusMsg.textContent = `Lỗi: ${error.message}. Vui lòng kiểm tra lại backend server và khóa API.`;
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
// Dán 2 hàm mới này vào file script.js
let currentFoodId = null; // Biến toàn cục để lưu ID món ăn đã chọn

function selectFoodSuggestion(foodId, foodName) {
    currentFoodId = foodId;
    document.getElementById('selected-food-name').textContent = foodName;
    document.getElementById('portion-control').style.display = 'block';

    // Đánh dấu nút được chọn
    const suggestionsEl = document.getElementById('food-suggestions');
    suggestionsEl.querySelectorAll('button').forEach(btn => {
        btn.style.backgroundColor = '#6c757d'; // Reset màu
    });
    // Tìm nút được click và đổi màu
    const clickedButton = Array.from(suggestionsEl.querySelectorAll('button')).find(btn => btn.textContent.startsWith(foodName));
    if (clickedButton) {
        clickedButton.style.backgroundColor = '#28a745'; // Màu xanh lá
    }
}

async function confirmAndAnalyzeNutrition() {
    if (!currentFoodId) {
        alert('Vui lòng chọn một gợi ý món ăn trước.');
        return;
    }

    const portion = parseFloat(document.getElementById('portion-input').value) || 0;
    const statusMsg = document.getElementById('api-status-message');
    statusMsg.textContent = 'Đang tính toán dinh dưỡng...';

    try {
        // 3. GỌI API /api/photo/confirm
        const response = await fetch('http://127.0.0.1:5000/api/photo/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ food_id: currentFoodId, portion_g: portion })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        if (data.result) {
            const res = data.result;
            // 4. HIỂN THỊ KẾT QUẢ CUỐI CÙNG (tái sử dụng hàm cũ)
            statusMsg.textContent = ''; // Xóa thông báo
            displayAnalysisResult(res.name, {
                calories: res.kcal,
                protein: res.protein_g,
                carbs: res.carbs_g,
                fat: res.fat_g
            });
        }
    } catch (error) {
        statusMsg.style.color = 'red';
        statusMsg.textContent = `Lỗi: ${error.message}`;
    }
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