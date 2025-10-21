# DÁN TOÀN BỘ KHỐI NÀY VÀO ĐẦU FILE
import json, os, requests 
from difflib import get_close_matches

# Khóa API sẽ được đọc từ Biến Môi trường của hệ thống
EDAMAM_APP_ID = os.environ.get("EDAMAM_ID")
EDAMAM_APP_KEY = os.environ.get("EDAMAM_KEY")
OFF_USER_AGENT = "NutriApp/1.0" 

DATA_PATH = os.path.join(os.path.dirname(__file__), 'data.json')

# Khối code khởi tạo biến toàn cục
try:
    with open(DATA_PATH, encoding='utf-8') as f:
        data = json.load(f)

    # Lấy ra list các "giá trị" từ mỗi dictionary
    dishes_list = list(data.get('dishes', {}).values())
    ingredients_list = list(data.get('ingredients', {}).values())
    FOODS = dishes_list + ingredients_list

    BY_ID = {item['id']: item for item in FOODS if 'id' in item}
    BY_NAME = {item['name'].lower(): item for item in FOODS if 'name' in item}
except (FileNotFoundError, json.JSONDecodeError):
    # Nếu file data.json có vấn đề, khởi tạo các biến rỗng để chương trình không bị crash
    FOODS = []
    BY_ID = {}
    BY_NAME = {}

# --- LOGIC CACHING VÀ GỌI API BÊN NGOÀI ---

# --- LOGIC CACHING VÀ GỌI API BÊN NGOÀI ---

# THAY BẰNG HÀM NÀY
def save_data_to_cache(new_data_item):
    """Lưu dữ liệu món ăn mới vào data.json."""
    global FOODS, BY_ID, BY_NAME

    # Đọc lại toàn bộ cấu trúc dictionary từ file
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        full_data = json.load(f)

    # Thêm món ăn mới vào danh sách 'dishes'
    # Nếu chưa có 'dishes', tạo mới
    if 'dishes' not in full_data:
        full_data['dishes'] = []
    # full_data['dishes'].append(new_data_item)
    full_data['dishes'][new_data_item['id']] = new_data_item

    # Cập nhật lại các biến trong bộ nhớ
    FOODS.append(new_data_item)
    BY_ID[new_data_item['id']] = new_data_item
    BY_NAME[new_data_item['name'].lower()] = new_data_item

    # Lưu lại toàn bộ cấu trúc dictionary
    with open(DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(full_data, f, ensure_ascii=False, indent=2)
def fetch_nutrition_from_edamam(query):
    """Gọi Edamam API (Chính)."""
    if not EDAMAM_APP_ID or not EDAMAM_APP_KEY: return None
    
    url = f"https://api.edamam.com/api/nutrition-data?app_id={EDAMAM_APP_ID}&app_key={EDAMAM_APP_KEY}&ingr={query}"
    try:
        response = requests.get(url)
        response.raise_for_status() 
        data = response.json()
        
        if 'calories' in data and data['calories'] > 0:
            return {
                "id": query.replace(' ', '_').lower(), "name": query,
                "serving_default": 100, "serving_unit": "g",
                "kcal_per_serving": data.get('calories', 0),
                "protein_g": data['totalNutrients'].get('PROCNT', {}).get('quantity', 0),
                "carbs_g": data['totalNutrients'].get('CHOCDF', {}).get('quantity', 0),
                "fat_g": data['totalNutrients'].get('FAT', {}).get('quantity', 0),
                "source": "Edamam"
            }
        return None
    except requests.exceptions.RequestException:
        return None

def fetch_nutrition_from_openfoodfacts(query):
    """Gọi OpenFoodFacts API (Dự phòng)."""
    url = f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={query}&search_simple=1&action=process&json=1"
    headers = {'User-Agent': OFF_USER_AGENT}
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        for product in data.get('products', []):
            if 'nutriments' in product and 'energy-kcal_100g' in product['nutriments']:
                nutr = product['nutriments']
                return {
                    "id": query.replace(' ', '_').lower(), "name": product.get('product_name', query),
                    "serving_default": 100, "serving_unit": "g",
                    "kcal_per_serving": nutr.get('energy-kcal_100g', 0),
                    "protein_g": nutr.get('proteins_100g', 0),
                    "carbs_g": nutr.get('carbohydrates_100g', 0),
                    "fat_g": nutr.get('fat_100g', 0),
                    "source": "OpenFoodFacts"
                }
        return None
    except requests.exceptions.RequestException:
        return None

def fuzzy_find(label, n=3, cutoff=0.5):
    """Tìm kiếm phân cấp: Cache -> Edamam -> OpenFoodFacts."""
    keys = list(BY_NAME.keys()) + list(BY_ID.keys())
    matches = get_close_matches(label.lower(), keys, n=n, cutoff=0.5)
    
    results = []
    for m in matches:
        if m in BY_ID: results.append(BY_ID[m])
        elif m in BY_NAME: results.append(BY_NAME[m])
            
    if results: return results

    # 1. Gọi Edamam (Chính)
    new_item = fetch_nutrition_from_edamam(label)
    if new_item:
        save_data_to_cache(new_item)
        return [new_item] 

    # 2. Gọi OpenFoodFacts (Dự phòng)
    new_item = fetch_nutrition_from_openfoodfacts(label)
    if new_item:
        save_data_to_cache(new_item)
        return [new_item] 
        
    return []

def compute_scaled(item, portion_g):
    """Tính toán lại dinh dưỡng theo khẩu phần."""
    serving = item.get('serving_default', 100)
    factor = float(portion_g) / float(serving) if serving else 0
    return {
        "id": item['id'], "name": item['name'], "portion_g": float(portion_g),
        "kcal": round(item.get('kcal_per_serving', 0) * factor, 1),
        "protein_g": round(item.get('protein_g', 0) * factor, 1),
        "carbs_g": round(item.get('carbs_g', 0) * factor, 1),
        "fat_g": round(item.get('fat_g', 0) * factor, 1),
        "is_estimate": item.get('is_estimate', True)
    }