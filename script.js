// Biến toàn cục để lưu CSDL và Biểu đồ
let nutritionData = {};
let macroChart;
let currentUser = null; // Quản lý trạng thái đăng nhập

// --- A. Khởi tạo & Điều hướng ---

// Hàm tải dữ liệu (data.json) khi ứng dụng bắt đầu
async function loadAppData() {
    try {
        const response = await fetch('data.json');
        nutritionData = await response.json();
        console.log("Dữ liệu ứng dụng đã tải xong.");
        
        // Cài đặt ban đầu
        populateFoodDropdown(); 
        initEventListeners();
        loadHistory();
        
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
    }
}

// Hàm hiển thị trang (Điều hướng)
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active-page');
    });
    const pageElement = document.getElementById(pageId);
    if (pageElement) {
        pageElement.style.display = 'block';
        pageElement.classList.add('active-page');
    }

    // Cập nhật nội dung Admin khi cần
    if (pageId === 'admin-page') {
        // [LƯU Ý: Nếu không có logic đăng nhập, trang admin sẽ lỗi]
        document.getElementById('admin-data-display').textContent = JSON.stringify(nutritionData, null, 2);
    }
}

// Khởi tạo sự kiện nghe
function initEventListeners() {
    // 1. BMI
    document.getElementById('calculate-bmi-btn').addEventListener('click', calculateBMI);
    
    // 2. Phân tích Ảnh (Mô phỏng AI)
    document.getElementById('photo-upload').addEventListener('change', handleImageUpload);
    document.getElementById('analyze-button').addEventListener('click', analyzeDishFromMock);

    // 3. Phân tích Recipe
    document.getElementById('add-ingredient-btn').addEventListener('click', addIngredientRow);
    document.getElementById('analyze-recipe-btn').addEventListener('click', analyzeRecipe);

    // 4. Lịch sử
    document.getElementById('save-meal-btn').addEventListener('click', saveAnalyzedMeal);
    document.getElementById('export-csv-btn').addEventListener('click', exportHistoryToCSV);

    // Load lịch sử và hiển thị
    loadHistory();
}

// --- B. Logic BMI & TDEE ---

function calculateBMI() {
    const heightCm = parseFloat(document.getElementById('height-input').value);
    const weightKg = parseFloat(document.getElementById('weight-input').value);
    const goal = document.getElementById('goal-select').value;
    const age = 30; // Giả lập tuổi 30, vì không có input trong code bạn gửi

    if (!heightCm || !weightKg || heightCm < 50 || weightKg < 10) {
        alert("Vui lòng nhập chiều cao và cân nặng hợp lệ.");
        return;
    }

    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    
    // Giả lập TDEE đơn giản (Dùng công thức cơ bản)
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    const tdee = Math.round(bmr * 1.55);

    document.getElementById('bmi-value').textContent = bmi.toFixed(2);

    let status = '';
    let advice = '';
    let targetCalo = tdee;

    if (bmi < 18.5) { status = "Thiếu cân"; advice = "Cần tăng cường dinh dưỡng."; }
    else if (bmi >= 18.5 && bmi < 25) { status = "Bình thường"; advice = "Duy trì chế độ ăn uống hiện tại."; }
    else if (bmi >= 25) { status = "Thừa cân"; advice = "Cần điều chỉnh chế độ ăn uống và tập luyện."; }

    if (goal === 'lose') targetCalo = tdee - 500;
    else if (goal === 'gain') targetCalo = tdee + 500;

    document.getElementById('bmi-status').textContent = status;
    document.getElementById('tdee-value').textContent = targetCalo;
    document.getElementById('health-advice').textContent = `${advice} Mục tiêu Calo hàng ngày: ${targetCalo} kcal.`;
}

// --- C. Logic Phân tích Ảnh (Mô phỏng) ---

// Đổ dữ liệu món ăn vào dropdown
function populateFoodDropdown() {
    const select = document.getElementById('mock-food-name');
    select.innerHTML = '<option value="">-- Chọn món ăn để phân tích --</option>';
    
    if (nutritionData && nutritionData.dishes) {
        Object.keys(nutritionData.dishes).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = nutritionData.dishes[key].name;
            select.appendChild(option);
        });
    }
}

// Xử lý hiển thị ảnh
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('food-image').src = e.target.result;
            document.getElementById('food-image').style.display = 'block';
            document.getElementById('mock-recognition-input').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Phân tích món ăn từ dropdown (Mô phỏng kết quả AI)
function analyzeDishFromMock() {
    const selectedDishKey = document.getElementById('mock-food-name').value;
    const dishData = nutritionData.dishes[selectedDishKey];
    
    if (!dishData) {
        alert("Vui lòng chọn một món ăn hợp lệ.");
        return;
    }

  
    displayAnalysisResult(dishData.name, dishData); 
    
    // Gợi ý Healthy Swap 
    suggestHealthySwap(dishData);
}

// --- D. Logic Phân tích Công thức (Recipe) ---

function addIngredientRow() {
    const tableBody = document.querySelector('#recipe-input-table tbody');
    const newRow = tableBody.insertRow();
    
    if (!document.getElementById('ingredient-list')) {
        const datalist = document.createElement('datalist');
        datalist.id = 'ingredient-list';
        if (nutritionData && nutritionData.ingredients) {
            Object.keys(nutritionData.ingredients).forEach(key => {
                const option = document.createElement('option');
                option.value = nutritionData.ingredients[key].name;
                datalist.appendChild(option);
            });
        }
        document.body.appendChild(datalist);
    }
    
    newRow.innerHTML = `
        <td><input type="text" class="ingredient-name" list="ingredient-list" placeholder="Ví dụ: Thịt gà luộc"></td>
        <td><input type="number" class="ingredient-amount" value="100"></td>
        <td><button onclick="removeRow(this)" class="secondary-btn">Xóa</button></td>
    `;
}

function removeRow(button) {
    button.closest('tr').remove();
}

function analyzeRecipe() {
    let totalCalo = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
    const rows = document.querySelectorAll('#recipe-input-table tbody tr');

    rows.forEach(row => {
        const nameInput = row.querySelector('.ingredient-name').value.trim().toLowerCase();
        const amount = parseFloat(row.querySelector('.ingredient-amount').value);

        if (!nameInput || !amount || isNaN(amount)) return;

        const ingredientKey = Object.keys(nutritionData.ingredients).find(key => 
            nutritionData.ingredients[key].name.toLowerCase().includes(nameInput)
        );

        if (ingredientKey) {
            const item = nutritionData.ingredients[ingredientKey];
            const multiplier = amount / 100;

            totalCalo += item.calories * multiplier;
            totalProtein += item.protein * multiplier;
            totalCarbs += item.carbs * multiplier;
            totalFat += item.fat * multiplier;
        }
    });

    const mockDishName = "Công Thức Cá Nhân";
    const resultData = {
        name: mockDishName,
        calories: totalCalo,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
        micronutrients: "Dựa trên thành phần"
    };
    
    displayAnalysisResult(mockDishName, resultData);
    document.getElementById('swap-suggestion-area').innerHTML = '';
}

// --- E. Hiển thị & Trực quan hóa (ĐÃ SỬA LỖI LOGIC NÀY) ---

function displayAnalysisResult(dishName, data) {
    const nameEl = document.getElementById('analyzed-food-name');
    const microEl = document.getElementById('micronutrients-display');
    const calEl = document.getElementById('total-calories');
    const proteinEl = document.getElementById('total-protein');
    const carbEl = document.getElementById('total-carbs');
    const fatEl = document.getElementById('total-fat');

    if (nameEl) nameEl.textContent = dishName;
    if (microEl) microEl.textContent = data.micronutrients || 'N/A';
    if (calEl) calEl.textContent = Math.round(data.calories);
    if (proteinEl) proteinEl.textContent = Math.round(data.protein);
    if (carbEl) carbEl.textContent = Math.round(data.carbs);
    if (fatEl) fatEl.textContent = Math.round(data.fat);

    const resultArea = document.getElementById('analysis-result-area');
    if (resultArea) resultArea.style.display = 'block';

    drawMacroChart(data.protein, data.carbs, data.fat);
}


function drawMacroChart(protein, carbs, fat) {
    const ctx = document.getElementById('macroChart').getContext('2d');
    const totalMacro = protein + carbs + fat;
    const data = [
        (protein / totalMacro) * 100, (carbs / totalMacro) * 100, (fat / totalMacro) * 100
    ].map(n => isNaN(n) ? 0 : n);
    
    if (macroChart) macroChart.destroy(); 

    macroChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Protein', 'Carbs', 'Fat'],
            datasets: [{
                data: data,
                backgroundColor: ['#4CAF50', '#2196F3', '#FFC107'],
                hoverOffset: 4
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Phân Bố Macro (%)' } } }
    });
}

// 5. Healthy Swaps
function suggestHealthySwap(data) {
    const swapKey = Object.keys(nutritionData.healthy_swaps).find(key => data.name.toLowerCase().includes(key.toLowerCase()));
    
    const swapData = nutritionData.healthy_swaps[swapKey || 'bo_tuoi'];
    
    if (swapData) {
        document.getElementById('swap-suggestion-area').innerHTML = `
            <h4>🔄 Gợi Ý Lựa Chọn Lành Mạnh (Smart Substitutions):</h4>
            <p>Thay thế: <b>${swapKey ? data.name : 'Bơ động vật'}</b></p>
            <p>Bằng: <b>${swapData.alternative}</b> | Ảnh hưởng: <b>${swapData.impact}</b></p>
        `;
    }
}


// --- F. Lịch sử & Theo dõi (LocalStorage) ---


function saveAnalyzedMeal() {
    const caloriesText = document.getElementById('total-calories').textContent;

    // KIỂM TRA ĐIỀU KIỆN (Đã sửa lỗi này):
    if (caloriesText === '0' || caloriesText === '--' || !caloriesText.trim()) {
        alert("Vui lòng phân tích món ăn trước khi lưu nhật ký!");
        return; 
    }
    
    // ĐẢM BẢO LẤY GIÁ TRỊ VÀ LÀM TRÒN AN TOÀN TRƯỚC KHI LƯU
    const safeParse = (id) => {
        const value = document.getElementById(id).textContent;
        // Trả về 0 nếu giá trị là rỗng hoặc không phải số hợp lệ
        return Math.round(parseFloat(value) || 0); 
    };
    
    const meal = {
        time: new Date().toLocaleString(),
        name: document.getElementById('analyzed-food-name').textContent,
        // Lấy giá trị đã được làm tròn và kiểm tra
        calories: safeParse('total-calories'),
        protein: safeParse('total-protein'),
        carbs: safeParse('total-carbs'),
        fat: safeParse('total-fat')
    };
    
    // Logic lưu trữ LocalStorage (Giữ nguyên)
    const history = JSON.parse(localStorage.getItem('nutriAppHistory') || '[]');
    history.push(meal);
    localStorage.setItem('nutriAppHistory', JSON.stringify(history));
    
    loadHistory();
    alert(`Bữa ăn "${meal.name}" đã được lưu vào lịch sử.`);
}
// (Các hàm loadHistory và exportHistoryToCSV giữ nguyên)

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('nutriAppHistory') || '[]');
    const tableBody = document.querySelector('#history-table tbody');
    tableBody.innerHTML = '';
    
    let dailyCalo = 0;

    history.slice().reverse().forEach(meal => { 
        const row = tableBody.insertRow();
        row.innerHTML = `<td>${meal.time}</td><td>${meal.name}</td><td>${meal.calories} kcal</td><td>P/C/F: ${meal.protein}/${meal.carbs}/${meal.fat}g</td>`;
        dailyCalo += meal.calories;
    });

    document.getElementById('daily-log-summary').innerHTML = `
        <h3>Tổng Calo Hôm Nay: <span class="highlight">${dailyCalo}</span> kcal</h3>
        <p class="guide-text">So với mục tiêu (<span id="tdee-value-summary">0</span> kcal).</p>
    `;
    document.getElementById('tdee-value-summary').textContent = document.getElementById('tdee-value').textContent;
}

function exportHistoryToCSV() {
    const history = JSON.parse(localStorage.getItem('nutriAppHistory') || '[]');
    let csvContent = "data:text/csv;charset=utf-8,Time,Meal,Calories (kcal),Protein (g),Carbs (g),Fat (g)\n";

    history.forEach(meal => {
        csvContent += `${meal.time},"${meal.name.replace(/"/g, '""')}",${meal.calories},${meal.protein},${meal.carbs},${meal.fat}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "nutri_history.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
}


// --- G. Admin và Tabs ---

function showAnalysisTab(tabId) {
    document.querySelectorAll('.analysis-tab').forEach(tab => tab.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId + '-btn').classList.add('active');
}

// Khởi chạy ứng dụng
document.addEventListener('DOMContentLoaded', loadAppData);