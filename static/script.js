// This script will now handle both the landing page and the dashboard.

document.addEventListener('DOMContentLoaded', () => {
    // GỌI HÀM MỚI Ở ĐÂY
    setupCommonEventListeners(); // <--- THÊM DÒNG NÀY
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
        image: '/static/image/Bua_an_dd_7day.jpg', // SỬ DỤNG 'image/'
        link: 'https://mealplan.vn/thuc-don-giam-can-ngon-chuan-viet/' 
    },
    { 
        title: '7 Days Flat Belly Diet', 
        description: 'Kế hoạch ăn uống cho vòng eo thon gọn.', 
        image: '/static/image/san-pham-chay-giau-protein.png', // SỬ DỤNG 'image/'
        link: '#' 
    },
    { 
        title: 'Your Best Body Meal Plan', 
        description: 'Xây dựng chế độ dinh dưỡng cá nhân.', 
        image: '/static/image/com-chay-005.webp', // SỬ DỤNG 'image/'
        link: '#' 
    },
    { 
        title: 'Easy eating plan for Weight Loss', 
        description: 'Kế hoạch ăn uống đơn giản, dễ thực hiện.', 
        image: '/static/image/image3_202509132252067351.jpg', // SỬ DỤNG 'image/'
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
    localStorage.clear(); // Xóa toàn bộ localStorage, bao gồm cả màu theme
    window.location.href = '/';
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
let currentFoodId = null;

function setupDashboardPage() {
    // Không cần kiểm tra userRole ở đây nữa, cho phép guest truy cập
    loadDashboardData();
}

async function loadDashboardData() {
    
    // === THÊM 2 DÒNG NÀY VÀO ĐẦU HÀM ===
    // Áp dụng màu theme đã lưu (nếu có) ngay khi tải
    const savedColor = localStorage.getItem('siteThemeColor');
    if (savedColor) applyThemeColor(savedColor);
    // === KẾT THÚC THÊM ===

    try {
        // Tải dữ liệu JSON (mô phỏng API)
        const response = await fetch('/data.json');
        nutritionData = await response.json();
        
        const userRole = sessionStorage.getItem('userRole'); // Lấy userRole ở đây
        
        initializeDashboardUI(); // 1. Cài đặt UI (ẩn/hiện nút, menu)
        initDashboardEventListeners(); // 2. Gắn các trình nghe sự kiện
        populateFoodDropdown(); // 3. Đổ dữ liệu vào dropdown phân tích
        
        const params = new URLSearchParams(window.location.search);
        
        // 2. THAY ĐỔI LOGIC CHỌN TRANG MẶC ĐỊNH
        // Nếu có userRole, mặc định là 'dashboard-page', nếu không, mặc định là 'bmi-page'
        let page = params.get('page') || (userRole ? 'dashboard-page' : 'bmi-page');

        // 3. THÊM LỚP BẢO VỆ
        // Nếu người dùng guest cố tình truy cập trang cá nhân qua URL
        if (!userRole && (page === 'dashboard-page' || page === 'history-page' || page === 'admin-page')) {
            page = 'bmi-page'; // Chuyển hướng họ về trang BMI
        }

        showPage(page); // Hiển thị trang được chọn

    } catch (error) {
        console.error("Lỗi khi tải dữ liệu cho dashboard:", error);
    }
}

function initializeDashboardUI() {
    const userRole = sessionStorage.getItem('userRole');

    // Lấy các mục menu sidebar
    const dashboardNavItem = document.getElementById('dashboard-nav-item');
    const historyNavItem = document.getElementById('history-nav-item');
    const adminNavItem = document.getElementById('admin-nav-item');
    
    // Lấy khu vực auth ở header
    const authSection = document.getElementById('dashboard-auth-section');

    if (userRole) {
        // --- NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP ---

        // 1. Hiển thị các mục menu cá nhân
        if (dashboardNavItem) dashboardNavItem.style.display = 'block';
        if (historyNavItem) historyNavItem.style.display = 'block';
        
        // 2. Hiển thị mục Admin (nếu là admin)
        if (adminNavItem) {
            adminNavItem.style.display = (userRole === 'admin') ? 'block' : 'none';
        }

        // 3. Hiển thị menu người dùng
        if (authSection) {
            authSection.innerHTML = `
                <button id="user-menu-button"><i class="fa-solid fa-user-circle"></i></button>
                <div id="user-menu-dropdown" class="user-menu-dropdown">
                    <a href="dashboard.html">Hồ sơ của tôi</a>
                    ${userRole === 'admin' ? '<a href="dashboard.html?page=admin-page">Admin Panel</a>' : ''}
                    <button id="logout-button-dash">Đăng xuất</button>
                </div>
            `;
            // Gắn lại sự kiện cho các nút vừa tạo
            document.getElementById('logout-button-dash').addEventListener('click', logout);
            document.getElementById('user-menu-button').addEventListener('click', toggleUserMenu);
        }

    } else {
        // --- NGƯỜI DÙNG CHƯA ĐĂNG NHẬP (GUEST) ---

        // 1. Ẩn các mục menu cá nhân
        if (dashboardNavItem) dashboardNavItem.style.display = 'none';
        if (historyNavItem) historyNavItem.style.display = 'none';
        if (adminNavItem) adminNavItem.style.display = 'none';

        // 2. Hiển thị nút Đăng nhập trên header
        if (authSection) {
            authSection.innerHTML = '<a href="login.html" class="login-button-dash">Đăng nhập</a>';
        }
    }
}

// THAY THẾ TOÀN BỘ KHỐI XUNG ĐỘT BẰNG CODE NÀY

// THAY THẾ TOÀN BỘ CÁC PHIÊN BẢN CŨ CỦA HÀM NÀY BẰNG HÀM NÀY
function initDashboardEventListeners() {
    // Hàm trợ giúp để gắn sự kiện an toàn (ĐÂY LÀ HÀM BỊ THIẾU)
    const addSafeListener = (id, event, handler) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
        }
    };

    // Gắn các sự kiện một cách an toàn
    addSafeListener('calculate-bmi-btn', 'click', calculateBMI);
    addSafeListener('photo-upload', 'change', handleImageUpload);
    addSafeListener('confirm-analysis-btn', 'click', confirmAndAnalyzeNutrition); // Dùng nút mới
    addSafeListener('add-ingredient-btn', 'click', addIngredientRow);
    addSafeListener('analyze-recipe-btn', 'click', analyzeRecipe);
    addSafeListener('save-meal-btn', 'click', saveAnalyzedMeal);
    addSafeListener('export-csv-btn', 'click', exportHistoryToCSV);
    addSafeListener('save-weekly-plan-btn', 'click', saveWeeklyPlan);
    // DÒNG ĐÃ SỬA
    addSafeListener('export-weekly-plan-btn', 'click', exportWeeklyPlanToCSV);

    // Listener tùy chỉnh của bạn được giữ lại
    addSafeListener('admin-save-settings-btn', 'click', saveAdminSettings);

    // Logic color picker của bạn được giữ lại
    const colorPicker = document.getElementById('admin-color-picker');
    const savedColor = localStorage.getItem('siteThemeColor');
    if (colorPicker && savedColor) {
        colorPicker.value = savedColor;
    }

    // Scroll to Top Logic
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
            scrollableContent.scrollTo({ insetblockstart: 0, behavior: 'smooth' });
        });
    }
    // ... (các listener khác) ...
} // Kết thúc initDashboardEventListeners

function performSearch() {
    const query = document.querySelector('.search-bar input').value.trim().toLowerCase();
    const resultsContainer = document.getElementById('search-results-container');

    if (!query) {
        resultsContainer.style.display = 'none'; // Ẩn nếu không có gì để tìm
        return;
    }

    // Chỉ tìm kiếm trong mảng BLOG_POSTS
    categoryResults = MEAL_CATEGORIES.filter(category => 
            category.title.toLowerCase().includes(query)

    );

    displayBlogSearchResults(categoryResults);
}

function displayBlogSearchResults(results) {
    const container = document.getElementById('search-results-container');
    container.innerHTML = ''; // Xóa kết quả cũ

    if (results.length > 0) {
        results.forEach(post => {
            const item = document.createElement('a');
            item.href = post.link;
            item.className = 'search-result-item';
            item.textContent = post.title;
            container.appendChild(item);
        });
    } else {
        const noResult = document.createElement('div');
        noResult.className = 'no-results';
        noResult.textContent = 'Không tìm thấy kết quả nào.';
        container.appendChild(noResult);
    }

    container.style.display = 'block'; // Hiển thị ô kết quả
}
// }
// --- KẾT THÚC HÀM HIỂN THỊ ---

// ... (code còn lại của script.js) ...
// --- HÀM MỚI CHO CÁC THÀNH PHẦN CHUNG ---
function setupCommonEventListeners() {
    const searchInput = document.querySelector('.search-bar input');
    const searchIcon = document.querySelector('.search-bar i');
    const searchContainer = document.querySelector('.search-bar'); // Lấy cả container
    const resultsContainer = document.getElementById('search-results-container');

    if (searchInput && searchIcon) {
        // Thay vì tìm khi nhấn Enter, chúng ta sẽ tìm khi người dùng gõ
        searchInput.addEventListener('input', performSearch);
        
        // Khi nhấn vào icon kính lúp, focus vào ô input
        searchIcon.addEventListener('click', () => {
             searchInput.focus();
             performSearch();
        });
    }

    // Thêm sự kiện để đóng dropdown khi click ra ngoài
    window.addEventListener('click', function(e) {
        // Nếu click không nằm trong khu vực của thanh tìm kiếm
        if (searchContainer && !searchContainer.contains(e.target)) {
            if (resultsContainer) resultsContainer.style.display = 'none';
        }
    });
}

function showPage(pageId) {
    // Ẩn tất cả các trang
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    
    // Hiển thị trang được yêu cầu
    const pageElement = document.getElementById(pageId);
    if (pageElement) {
        pageElement.style.display = 'block';
    } else {
        // Nếu không tìm thấy trang, mặc định về trang BMI (an toàn cho guest)
        document.getElementById('bmi-page').style.display = 'block';
        pageId = 'bmi-page';
    }
    
    // Cập nhật trạng thái 'active' trên sidebar
    document.querySelectorAll('#sidebar-nav .nav-btn').forEach(btn => btn.classList.remove('active'));
    // Tìm đúng nút (button) đã được nhấn
    const activeButton = document.querySelector(`#sidebar-nav button[onclick="showPage('${pageId}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
        // Cập nhật tiêu đề trang trên header
        document.getElementById('page-title').textContent = activeButton.querySelector('span').textContent;
    }

    // Tải dữ liệu đặc thù cho từng trang (nếu cần)
    if (pageId === 'dashboard-page') updateDashboard();
    else if (pageId === 'history-page') loadHistory();
    else if (pageId === 'planner-page') renderPlannerPage(); // Không cần load gì cho admin-page vì nó là HTML tĩnh
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
    // === BẮT ĐẦU CODE MỚI ===
    // Khi chuyển qua tab công thức
    if (tabId === 'tab-recipe') {
        const tableBody = document.querySelector('#recipe-input-table tbody');
        // Nếu bảng chưa có hàng nào, tự động thêm 1 hàng
        if (tableBody && tableBody.rows.length === 0) {
            addIngredientRow();
        }
    }
    // === KẾT THÚC CODE MỚI ===
}

// --- ALL DASHBOARD CORE FUNCTIONS ---

/**
 * Hàm trợ giúp để làm tối hoặc sáng một mã màu HEX.
 * @param {string} color - Mã màu HEX (ví dụ: #FF0000)
 * @param {number} percent - Số phần trăm (ví dụ: -20 để làm tối 20%)
 * @returns {string} Mã màu HEX mới
 */
function lightenDarkenColor(color, percent) {
    let usePound = false;
    if (color[0] === "#") {
        color = color.slice(1);
        usePound = true;
    }
    const num = parseInt(color, 16);
    let r = (num >> 16) + percent;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + percent;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + percent;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    
    // PadStart(6, '0') đảm bảo màu luôn có 6 chữ số
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

/**
 * Áp dụng màu chủ đạo cho các biến CSS của trang.
 * @param {string} color - Mã màu HEX
 */
function applyThemeColor(color) {
    const darkColor = lightenDarkenColor(color, -20); // Làm tối 20% cho hover
    // Đặt biến CSS :root (biến toàn cục)
    document.documentElement.style.setProperty('--primary-color', color);
    document.documentElement.style.setProperty('--primary-color-dark', darkColor);
}

/**
 * Lưu cài đặt của Admin (hiện chỉ có màu) vào localStorage.
 */
function saveAdminSettings() {
    const color = document.getElementById('admin-color-picker').value;
    localStorage.setItem('siteThemeColor', color);
    applyThemeColor(color);
    alert('Đã lưu cài đặt màu chủ đạo!');
}

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
    
    // Chỉ cập nhật dashboard nếu người dùng đã đăng nhập
    if (sessionStorage.getItem('userRole')) {
        updateDashboard();
    }
    
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
        const response = await fetch('/api/photo/upload', {
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
            // THÊM DÒNG NÀY (Vì gợi ý có thể sai)
            suggestRecipeTab('Gợi ý không đúng? Thử ');
        } else {
            statusMsg.textContent = 'Không nhận diện được món ăn nào phù hợp trong ảnh.';
            // THÊM DÒNG NÀY VÀO
            suggestRecipeTab('Không tìm thấy món ăn? Thử ');
        }

    } catch (error) {
        statusMsg.style.color = 'red';
        statusMsg.textContent = `Lỗi: ${error.message}. Vui lòng kiểm tra lại backend server và khóa API.`;
        // THÊM DÒNG NÀY VÀO
        suggestRecipeTab('Gặp lỗi khi phân tích? Thử ');
    }
}

function populateFoodDropdown() {
    const select = document.getElementById('mock-food-name');
    if (!select || !nutritionData.dishes) return;
    select.innerHTML = '<option value="">-- Chọn món ăn --</option>';
    // Lấy dữ liệu từ data.json đã tải
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
    // 1. LẤY TÊN MÓN ĂN TỪ INPUT MỚI
    let dishName = document.getElementById('recipe-dish-name').value.trim();
    if (!dishName) {
        dishName = "Công Thức Cá Nhân"; // Tên mặc định nếu bỏ trống
    }

    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    let ingredientsList = []; // Tạo danh sách để hiển thị chi tiết

    document.querySelectorAll('#recipe-input-table tbody tr').forEach(row => {
        const nameInput = row.querySelector('.ingredient-name');
        const amountInput = row.querySelector('.ingredient-amount');
        
        const name = nameInput ? nameInput.value.toLowerCase() : '';
        const amount = parseFloat(amountInput ? amountInput.value : 0);
        
        if (!name || !amount) return;
        // --- LOGIC TÌM KIẾM MỚI (Tìm cả ingredients và dishes) ---
        let foundItem = null;
        let foundKey = null;

        // 1. Tìm trong 'ingredients' trước
        foundKey = Object.keys(nutritionData.ingredients || {}).find(k =>
            nutritionData.ingredients[k].name.toLowerCase().includes(name)
        );
        if (foundKey) {
            foundItem = nutritionData.ingredients[foundKey];
        } else {
            // 2. Nếu không thấy, tìm trong 'dishes'
            foundKey = Object.keys(nutritionData.dishes || {}).find(k =>
                nutritionData.dishes[k].name.toLowerCase().includes(name)
            );
            if (foundKey) {
                foundItem = nutritionData.dishes[foundKey];
            }
        }
        // --- KẾT THÚC LOGIC TÌM KIẾM MỚI ---

        // Sử dụng foundItem để kiểm tra kết quả
        if (foundItem) {
            const item = foundItem; // Đổi tên biến cho dễ hiểu
            const multiplier = amount / (item.serving_default || 100);

            // Tính toán cho từng nguyên liệu (code này giữ nguyên)
            const itemCalories = (item.kcal_per_serving || 0) * multiplier;
            const itemProtein = (item.protein_g || 0) * multiplier;
            const itemCarbs = (item.carbs_g || 0) * multiplier;
            const itemFat = (item.fat_g || 0) * multiplier;

            // Cộng vào tổng (code này giữ nguyên)
            totals.calories += itemCalories;
            totals.protein += itemProtein;
            totals.carbs += itemCarbs;
            totals.fat += itemFat;

            // Thêm vào danh sách để hiển thị chi tiết (code này giữ nguyên)
            ingredientsList.push(
                `<li>${item.name} (${amount}g): ${Math.round(itemCalories)} kcal (P:${Math.round(itemProtein)}/C:${Math.round(itemCarbs)}/F:${Math.round(itemFat)})</li>`
            );
        } else {
             // Báo lỗi nếu không tìm thấy ở cả hai nơi (code này giữ nguyên)
            ingredientsList.push(
                `<li style="color: red;">Không tìm thấy "${name}" trong data.json</li>`
            );
        }
        // // 2. TÌM KIẾM TRONG data.json (nutritionData.ingredients)
        // // Lưu ý: tìm trong 'ingredients', không phải 'dishes'
        // const key = Object.keys(nutritionData.ingredients).find(k => 
        //     nutritionData.ingredients[k].name.toLowerCase().includes(name)
        // );
        
        // if (key) {
        //     const item = nutritionData.ingredients[key];
        //     const multiplier = amount / (item.serving_default || 100); // Chia cho serving_default
            
        //     // Tính toán cho từng nguyên liệu
        //     const itemCalories = (item.kcal_per_serving || 0) * multiplier;
        //     const itemProtein = (item.protein_g || 0) * multiplier;
        //     const itemCarbs = (item.carbs_g || 0) * multiplier;
        //     const itemFat = (item.fat_g || 0) * multiplier;

        //     // Cộng vào tổng
        //     totals.calories += itemCalories;
        //     totals.protein += itemProtein;
        //     totals.carbs += itemCarbs;
        //     totals.fat += itemFat;

        //     // 3. Thêm vào danh sách để hiển thị chi tiết
        //     ingredientsList.push(
        //         `<li>${item.name} (${amount}g): ${Math.round(itemCalories)} kcal (P:${Math.round(itemProtein)}/C:${Math.round(itemCarbs)}/F:${Math.round(itemFat)})</li>`
        //     );
        // } else {
        //     // Báo lỗi nếu không tìm thấy
        //     ingredientsList.push(
        //         `<li style="color: red;">Không tìm thấy "${name}" trong data.json</li>`
        //     );
        // }
    });

    // 4. TRUYỀN TÊN MÓN ĂN VÀ DANH SÁCH CHI TIẾT VÀO HÀM HIỂN THỊ
    displayAnalysisResult(dishName, totals, ingredientsList);
}

function displayAnalysisResult(name, data, ingredientsList = []) {
    document.getElementById('analyzed-food-name').textContent = name;
    document.getElementById('total-calories').textContent = Math.round(data.calories);
    document.getElementById('total-protein').textContent = Math.round(data.protein);
    document.getElementById('total-carbs').textContent = Math.round(data.carbs);
    document.getElementById('total-fat').textContent = Math.round(data.fat);
    
    // === BẮT ĐẦU CODE NÂNG CẤP ===
    const resultArea = document.getElementById('analysis-result-area');
    
    // Xóa chi tiết cũ (nếu có)
    let detailsEl = document.getElementById('recipe-breakdown-details');
    if (detailsEl) detailsEl.remove();

    // Nếu có danh sách, chèn nó vào
    if (ingredientsList.length > 0) {
        detailsEl = document.createElement('div');
        detailsEl.id = 'recipe-breakdown-details';
        detailsEl.style.marginTop = '15px';
        detailsEl.innerHTML = `
            <h4>Chi tiết thành phần:</h4>
            <ul style="list-style-position: inside; padding-inline-start: 10px; font-size: 0.9em;">
                ${ingredientsList.join('')}
            </ul>
        `;
        // Chèn vào sau phần macro
        const chartEl = resultArea.querySelector('.chart-container');
        if(chartEl) {
            // Chèn sau biểu đồ (chartEl), trước nút Save
            chartEl.parentNode.insertBefore(detailsEl, chartEl.nextSibling);
        }
    }
    // === KẾT THÚC CODE NÂNG CẤP ===

    document.getElementById('analysis-result-area').style.display = 'block';
    drawMacroChart(data.protein, data.carbs, data.fat);
}

function drawMacroChart(protein = 0, carbs = 0, fat = 0) {
    const ctx = document.getElementById('macroChart').getContext('2d');
    if (macroChart) macroChart.destroy(); // Hủy biểu đồ cũ trước khi vẽ
    macroChart = new Chart(ctx, {
        type: 'pie', 
        data: { 
            labels: ['Protein', 'Carbs', 'Fat'], 
            datasets: [{ 
                data: [protein, carbs, fat], 
                backgroundColor: ['#4CAF50', '#2196F3', '#FFC107'] 
            }] 
        }, 
        options: { 
            responsive: true, 
            maintainAspectRatio: false 
        }
    });
}

function saveAnalyzedMeal() {
    // CHỈ CHO PHÉP LƯU NẾU ĐÃ ĐĂNG NHẬP
    if (!sessionStorage.getItem('userRole')) {
        alert('Vui lòng đăng nhập để sử dụng tính năng "Lưu Bữa Ăn".');
        return;
    }
    
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
    updateDashboard(); // Cập nhật dashboard (nếu đang ở trang đó)
}

//let currentFoodId = null; // Biến toàn cục để lưu ID món ăn đã chọn
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
        const response = await fetch('/api/photo/confirm', {
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

function isToday(dateString) { 
    const date = new Date(dateString); 
    const today = new Date(); 
    return date.toDateString() === today.toDateString(); 
}

function loadHistory() {
    // (Bản thân hàm này đã an toàn vì nó chỉ được gọi nếu showPage('history-page') được phép)
    const history = JSON.parse(localStorage.getItem('nutriAppHistory') || '[]');
    const tableBody = document.querySelector('#history-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = ''; // Xóa lịch sử cũ
    let dailyCalo = 0;
    
    history.forEach(meal => {
        if (isToday(meal.time)) dailyCalo += meal.calories;
        const row = tableBody.insertRow(0); // Chèn lên đầu
        row.innerHTML = `
            <td>${new Date(meal.time).toLocaleString()}</td>
            <td>${meal.name}</td>
            <td>${meal.calories} kcal</td>
            <td>${meal.protein}/${meal.carbs}/${meal.fat}g</td>
        `;
    });
    
    const target = localStorage.getItem('userTargetCalo') || 0;
    const summary = document.getElementById('daily-log-summary');
    if(summary) summary.innerHTML = `<h3>Tổng Calo Hôm Nay: <span class="highlight">${dailyCalo}</span> kcal / ${target} kcal</h3>`;
}

function exportHistoryToCSV() {
    // (An toàn vì nút này chỉ hiển thị trên trang 'history-page')
    const history = JSON.parse(localStorage.getItem('nutriAppHistory') || '[]');
    let csv = 'Time,Meal,Calories,Protein,Carbs,Fat\n';
    history.forEach(m => { 
        csv += `${new Date(m.time).toLocaleString()},"${m.name}",${m.calories},${m.protein},${m.carbs},${m.fat}\n`; 
    });
    
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    a.target = '_blank';
    a.download = 'nutri_history.csv';
    a.click();
}

function updateDashboard() {
    // (An toàn vì hàm này chỉ được gọi từ 'dashboard-page')
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
    
    // Tạo nhãn 7 ngày gần nhất
    for (let i = 6; i >= 0; i--) {
        const date = new Date(); date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        labels.push(date); 
        dailyTotals[dateString] = 0; // Khởi tạo = 0
    }
    
    // Tính tổng calo cho 7 ngày đó
    history.forEach(meal => {
        const dateString = meal.time.split('T')[0];
        if (dailyTotals[dateString] !== undefined) {
            dailyTotals[dateString] += meal.calories;
        }
    });
    
    if (progressChart) progressChart.destroy(); // Hủy biểu đồ cũ
    
    progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { 
                    label: 'Calo Đã Nạp', 
                    data: Object.values(dailyTotals), 
                    borderColor: '#28a745', 
                    fill: true 
                },
                { 
                    label: 'Mục Tiêu (TDEE)', 
                    data: Array(7).fill(target), 
                    borderColor: '#dc3545', 
                    borderDash: [5, 5] // Đường nét đứt
                }
            ]
        },
        options: { 
            scales: { 
                x: { 
                    type: 'time', 
                    time: { 
                        unit: 'day', 
                        displayFormats: { day: 'dd/MM' } 
                    } 
                } 
            } 
        }
    });
}

function suggestRecipeTab(messagePrefix) {
    const suggestionsEl = document.getElementById('food-suggestions');
    if (!suggestionsEl) return;

    // Xóa gợi ý cũ (nếu có)
    const oldSuggestion = document.getElementById('recipe-suggestion-message');
    if (oldSuggestion) oldSuggestion.remove();

    // Tạo link gợi ý
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = 'Phân tích công thức';
    link.style.fontWeight = 'bold';
    link.style.color = '#007bff';
    link.onclick = (e) => {
        e.preventDefault();
        showAnalysisTab('tab-recipe');
    };

    const suggestionMsg = document.createElement('div');
    suggestionMsg.id = 'recipe-suggestion-message';
    suggestionMsg.style.marginTop = '15px';
    suggestionMsg.style.padding = '10px';
    suggestionMsg.style.backgroundColor = '#e9f5ff';
    suggestionMsg.style.borderRadius = '5px';
    
    suggestionMsg.appendChild(document.createTextNode(messagePrefix));
    suggestionMsg.appendChild(link);
    suggestionMsg.appendChild(document.createTextNode(' để nhập thủ công.'));
    
    suggestionsEl.parentNode.insertBefore(suggestionMsg, suggestionsEl.nextSibling);
}

// --- FIXED SCROLL TO TOP BUTTON LOGIC ---

function setupScrollToTop() {
    const scrollBtn = document.getElementById('scrollToTopBtn');
    if (!scrollBtn) return; // Nếu không tìm thấy nút, thoát

    const wrapper = document.querySelector('.page-content-wrapper');
    const scrollTarget = wrapper || window;

    // Kiểm tra vị trí để hiển thị nút
    const checkScrollPosition = () => {
        const scrollTop = scrollTarget === window 
            ? window.pageYOffset || document.documentElement.scrollTop 
            : scrollTarget.scrollTop;

        scrollBtn.style.display = (scrollTop > 150) ? 'block' : 'none';
    };

    // Cuộn mượt lên đầu trang
    const scrollToTop = () => {
        if (scrollTarget === window) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Gắn sự kiện
    scrollTarget.addEventListener('scroll', checkScrollPosition);
    scrollBtn.addEventListener('click', scrollToTop);

    // Kiểm tra lần đầu
    checkScrollPosition();
}

// GỌI LẠI HÀM NÀY MỖI KHI ĐỔI TRANG
document.addEventListener('DOMContentLoaded', () => {
    setupScrollToTop();
});

// Đồng thời, gắn thêm sau mỗi lần showPage (để khi đổi trang vẫn hoạt động)
const originalShowPage = showPage;
showPage = function(pageId) {
    originalShowPage(pageId);
    setupScrollToTop(); // Gọi lại mỗi lần đổi trang
};
