document.addEventListener('DOMContentLoaded', function(){
  const input = document.getElementById('photoInput');
  const preview = document.getElementById('preview');
  const suggestionsEl = document.getElementById('suggestions');
  const portionControl = document.getElementById('portionControl');
  const portionInput = document.getElementById('portionInput');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const resultEl = document.getElementById('result');
  let currentFoodId = null;
  let currentFoodName = null;

  // Xử lý sự kiện khi file ảnh được chọn
  input.addEventListener('change', async (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    
    // Hiển thị ảnh preview
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
    
    // Tạo FormData để gửi ảnh lên Backend
    const fd = new FormData();
    fd.append('photo', file);
    
    // 1. GỌI API UPLOAD để nhận diện ảnh (Clarifai)
    const r = await fetch('/api/photo/upload', { method:'POST', body: fd });
    const j = await r.json();
    
    suggestionsEl.innerHTML = '';
    
    if (j.error) {
        suggestionsEl.innerHTML = `<p style="color: red;">Lỗi Server: ${j.error}</p>`;
        portionControl.style.display = 'none';
        return;
    }

    // 2. HIỂN THỊ CÁC GỢI Ý (SUGGESTIONS)
    (j.suggestions || []).forEach(s=>{
      const btn = document.createElement('button');
      // Hiển thị tên món ăn và nhãn nhận diện (ví dụ: Phở Gà (Chicken Pho))
      btn.textContent = `${s.name} (Nhãn: ${s.match_label})`;
      btn.style.display = 'block';
      btn.style.marginTop = '5px';
      btn.style.padding = '8px 12px';
      btn.style.backgroundColor = '#007bff';
      btn.style.color = 'white';
      btn.style.border = 'none';
      btn.style.cursor = 'pointer';
      btn.onclick = ()=> {
        currentFoodId = s.food_id;
        currentFoodName = s.name;
        portionInput.value = 400; // Thiết lập mặc định 400g (phổ biến cho món Việt)
        
        // Hiển thị khu vực chỉnh khẩu phần
        portionControl.style.display = 'block';
        resultEl.innerHTML = `<p>Đã chọn: <b>${currentFoodName}</b>. Vui lòng nhập khẩu phần (g).</p>`;
      };
      suggestionsEl.appendChild(btn);
    });
    
    // Nếu không có gợi ý nào
    if((j.suggestions || []).length === 0){
      suggestionsEl.innerHTML = `<p style="color: red; font-weight: bold;">No suggestions (Không nhận diện được món ăn nào khớp).</p>`;
    }
  });

  // Xử lý sự kiện khi người dùng bấm nút "Analyze"
  analyzeBtn.addEventListener('click', async ()=>{
    if(!currentFoodId) return alert('Vui lòng chọn một gợi ý món ăn trước.');
    
    const portion = parseFloat(portionInput.value) || 0;
    
    // 3. GỌI API CONFIRM để tính toán dinh dưỡng theo khẩu phần
    const r = await fetch('/api/photo/confirm', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ food_id: currentFoodId, portion_g: portion })
    });
    
    const j = await r.json();
    
    if(j.result){
      const res = j.result;
      
      // 4. HIỂN THỊ KẾT QUẢ VÀ LỜI KHUYÊN (Tương tự như giao diện mẫu)
      let html = `<div style="margin-top: 30px; padding: 20px; border: 2px solid #28a745; border-radius: 8px; background-color: #f7fff7;">
                      <h3>✅ Phân Tích Dinh Dưỡng</h3>
                      <p><b>Món ăn:</b> ${res.name} (${res.portion_g}g)</p>
                      
                      <p style="font-weight: bold;">
                          Calo: <span style="color: #dc3545;">${res.kcal} kcal</span> | 
                          Protein: ${res.protein_g}g | 
                          Carbs: ${res.carbs_g}g | 
                          Fat: ${res.fat_g}g
                      </p>
                      
                      <div style="margin-top: 15px; padding: 15px; background-color: #ffffff; border-radius: 6px;">
                          <h4>💡 Kiến Thức Dinh Dưỡng Về Món Ăn Này</h4>
                          <p style="margin-bottom: 5px;">${res.name} ${res.description}</p>
                          <p><b>Lời khuyên:</b> ${res.advice}</p>
                      </div>
                  </div>`;
                  
      resultEl.innerHTML = html;
    } else if (j.error) {
      resultEl.innerHTML = `<p style="color: red;">Lỗi tính toán: ${j.error}</p>`;
    }
  });
});