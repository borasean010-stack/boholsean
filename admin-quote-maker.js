import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCqvsvuOGnQoNL3J0oGsOcN66ZOP0JlN5w",
    authDomain: "boholsean-14014193-11202.firebaseapp.com",
    projectId: "boholsean-14014193-11202",
    storageBucket: "boholsean-14014193-11202.firebasestorage.app",
    messagingSenderId: "684378696978",
    appId: "1:684378696978:web:868e1e33581f38a188d7cb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 📦 상세 상품 및 옵션 데이터 (사용자 요청 가격 반영) ---
const PRODUCT_DATA = {
    "육상투어C": [
        { name: "2인 (인당)", price: 72500 },
        { name: "3인 (인당)", price: 65500 },
        { name: "4인 (인당)", price: 58000 },
        { name: "미취학", price: 43500 }
    ],
    "육상투어D": [
        { name: "2인 (인당)", price: 116000 },
        { name: "3인 (인당)", price: 108500 },
        { name: "4인 (인당)", price: 101500 },
        { name: "미취학", price: 72500 }
    ],
    "육상투어D + 힐롯(90분)": [
        { name: "2인 (인당)", price: 151000 },
        { name: "3인 (인당)", price: 143500 },
        { name: "4인 (인당)", price: 136500 }
    ],
    "샤인호핑투어(조인)": [
        { name: "성인", price: 94500 },
        { name: "미취학", price: 72500 }
    ],
    "호핑투어 (단독)": [
        { name: "2인 (인당)", price: 79750 },
        { name: "3인 (인당)", price: 72500 },
        { name: "4~5인 (인당)", price: 65250 },
        { name: "6인 이상 (인당)", price: 58000 }
    ],
    "오슬롭 고래상어": [
        { name: "성인", price: 109500 },
        { name: "소인 (만 3~9세)", price: 95000 }
    ],
    "선반팩": [
        { name: "2인 (인당)", price: 116000 },
        { name: "3인 (인당)", price: 109000 },
        { name: "4인 (인당)", price: 101500 },
        { name: "미취학", price: 79500 }
    ],
    "반딧불 투어": [
        { name: "성인", price: 58500 },
        { name: "아동", price: 43500 }
    ],
    "나팔링 투어": [
        { name: "성인", price: 58500 },
        { name: "아동", price: 43500 }
    ],
    "대왕조개 + 나팔링": [
        { name: "성인/아동", price: 60000 },
        { name: "35개월 이하", price: 0 }
    ],
    "보홀쇼": [
        { name: "성인", price: 56000 },
        { name: "만 4세 이하", price: 0 }
    ],
    "파밀라칸 호핑투어": [
        { name: "2인 (인당)", price: 129000 },
        { name: "3~5인 (인당)", price: 116000 },
        { name: "6인 이상 (인당)", price: 105000 }
    ],
    "안다투어": [
        { name: "2~5인 (인당)", price: 163000 },
        { name: "6인 이상 (인당)", price: 155000 }
    ],
    "패러세일링": [
        { name: "2인 이상 (인당)", price: 79500 },
        { name: "1인 탑승 시", price: 116000 }
    ],
    "제트스키": [
        { name: "15분", price: 72500 },
        { name: "30분", price: 130500 }
    ],
    "ATV & 버그카": [
        { name: "ATV", price: 35000 },
        { name: "버그카", price: 70000 }
    ],
    "체험/스쿠버 다이빙": [
        { name: "체험 다이빙", price: 94500 },
        { name: "나팔링 체험 다이빙", price: 109000 },
        { name: "프리다이빙 체험", price: 101500 }
    ],
    "공항 픽업샌딩 (6인까지)": [
        { name: "공항 편도 픽드랍", price: 25000 },
        { name: "공항 왕복 픽드랍", price: 50000 }
    ],
    "항구 픽업샌딩 (6인까지)": [
        { name: "항구 편도 픽드랍", price: 35000 },
        { name: "항구 왕복 픽드랍", price: 70000 }
    ],
    "스파/마사지": [
        { name: "힐롯+수린스파 90분", price: 35000 },
        { name: "스톤 1+1 100분 (현지불 3000페소)", price: 0 }
    ],
    "기타(수동입력)": [
        { name: "직접 입력 옵션", price: 0 }
    ]
};

window.addItemRow = () => {
    const tbody = document.getElementById('item-tbody');
    const row = document.createElement('tr');
    row.className = 'item-row';
    
    const productOptions = Object.keys(PRODUCT_DATA).map(name => `<option value="${name}">${name}</option>`).join('');
    
    row.innerHTML = `
        <td><select class="item-select" onchange="onProductChange(this)" style="font-weight:700;">
            <option value="">상품 선택</option>
            ${productOptions}
        </select></td>
        <td><input type="number" class="item-count" value="1" min="1" oninput="calculateRow(this)" style="text-align:center;"></td>
        <td><select class="item-type" onchange="onTypeChange(this)" style="color:#007aff; font-weight:600;">
            <option value="">종류/옵션 선택</option>
        </select></td>
        <td><input type="text" class="item-subtotal" value="₩ 0" readonly style="background:#f9fafb; border:none; text-align:right; font-weight:800; color:#00b48a;"></td>
        <td><button class="btn-remove" onclick="removeRow(this)">✕</button></td>
        <input type="hidden" class="item-price" value="0">
    `;
    tbody.appendChild(row);
};

window.onProductChange = (select) => {
    const row = select.closest('tr');
    const typeSelect = row.querySelector('.item-type');
    const productName = select.value;
    
    if (!productName) {
        typeSelect.innerHTML = '<option value="">종류 선택</option>';
        return;
    }

    const types = PRODUCT_DATA[productName];
    typeSelect.innerHTML = types.map(t => `<option value="${t.name}" data-price="${t.price}">${t.name} (₩${t.price.toLocaleString()})</option>`).join('');
    
    onTypeChange(typeSelect);
};

window.onTypeChange = (select) => {
    const row = select.closest('tr');
    const priceInput = row.querySelector('.item-price');
    const selectedOption = select.options[select.selectedIndex];
    
    priceInput.value = selectedOption.dataset.price || 0;
    calculateRow(select);
};

window.calculateRow = (el) => {
    const row = el.closest('tr');
    const count = parseInt(row.querySelector('.item-count').value) || 0;
    const price = parseInt(row.querySelector('.item-price').value) || 0;
    const subtotal = count * price;
    row.querySelector('.item-subtotal').value = '₩ ' + subtotal.toLocaleString();
    updateTotal();
};

window.removeRow = (btn) => {
    btn.closest('tr').remove();
    updateTotal();
};

function updateTotal() {
    let total = 0;
    document.querySelectorAll('.item-row').forEach(row => {
        const count = parseInt(row.querySelector('.item-count').value) || 0;
        const price = parseInt(row.querySelector('.item-price').value) || 0;
        total += (count * price);
    });
    document.getElementById('total-amount').innerText = '₩ ' + total.toLocaleString();
}

window.submitQuote = async () => {
    const btn = document.querySelector('.btn-submit');
    if (btn.disabled) return;

    const rows = document.querySelectorAll('.item-row');
    if (rows.length === 0) { alert('상품을 추가해 주세요.'); return; }

    const items = [];
    let totalPrice = 0;

    rows.forEach(row => {
        const productName = row.querySelector('.item-select').value;
        const typeName = row.querySelector('.item-type').value;
        const count = parseInt(row.querySelector('.item-count').value) || 0;
        const price = parseInt(row.querySelector('.item-price').value) || 0;
        
        if (productName && typeName) {
            items.push({ 
                name: `${productName} - ${typeName}`, 
                date: "-", 
                count: count, 
                price: price 
            });
            totalPrice += (count * price);
        }
    });

    if (items.length === 0) { alert('상품 구성을 완료해 주세요.'); return; }

    try {
        btn.disabled = true;
        btn.innerText = "생성 중...";

        const docRef = await addDoc(collection(db, "quotes"), {
            customerKorName: "(고객 입력 대기)",
            items: items,
            totalPrice: totalPrice,
            status: '견적발송',
            createdAt: new Date()
        });

        const url = `${window.location.origin}/quote.html?id=${docRef.id}`;
        await navigator.clipboard.writeText(url);
        alert('견적 링크가 생성되어 복사되었습니다!');
        window.close();
    } catch (e) { 
        console.error(e); 
        btn.disabled = false;
        btn.innerText = "견적서 생성 및 링크 복사";
    }
};

addItemRow();
