import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDkDjmGKQDF-0Vu2S_qtI6W5Hf2-j4tKcM",
    authDomain: "boholsean-69b4a.firebaseapp.com",
    projectId: "boholsean-69b4a",
    storageBucket: "boholsean-69b4a.firebasestorage.app",
    messagingSenderId: "806585874771",
    appId: "1:806585874771:web:64a094d241730ca38109a6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 📦 상세 상품 및 옵션 데이터 (사용자 요청 가격 반영) ---
const PRODUCT_DATA = {
    "보라카이 왕복 픽업샌딩": [
        { name: "조인 픽업샌딩 ( Join )", price: 54900 },
        { name: "단독 픽업샌딩 ( 팀당 현지불 $40 별도 )", price: 54900 }
    ],
    "보라아재 카라바오 투어": [
        { name: "성인 투어 ( 08:00 )", price: 180000 },
        { name: "소인 투어", price: 135000 }
    ],
    "블랙펄 요트호핑투어": [
        { name: "점심 불포함 ( 선셋호핑 )", price: 85000 },
        { name: "점심 포함 ( 인당 현지불 $30 별도 )", price: 85000 }
    ],
    "시크릿 가든 말룸파티": [
        { name: "일반 투어 ( 09:40 )", price: 99000 },
        { name: "샌딩팩 투어 ( 09:00 )", price: 110000 },
        { name: "소인 투어", price: 90000 }
    ],
    "액티비티 (Activity)": [
        { name: "체험 다이빙", price: 55000 },
        { name: "파라세일링", price: 55000 },
        { name: "제트스키", price: 55000 },
        { name: "헬멧 다이빙", price: 44000 },
        { name: "프리다이빙 체험", price: 112500 },
        { name: "보라카이 랜드투어", price: 45000 },
        { name: "JL 스냅사진 촬영", price: 300000 },
        { name: "페어웨이 골프클럽", price: 192000 }
    ],
    "에스파 (S-SPA)": [
        { name: "퓨어오일 마사지", price: 55000 },
        { name: "태반 마사지", price: 55000 },
        { name: "스톤 마사지", price: 55000 },
        { name: "힐롯 마사지", price: 70000 },
        { name: "포핸드 마사지", price: 84000 },
        { name: "성장 마사지 (1시간)", price: 42000 },
        { name: "성장 마사지 (2시간)", price: 55000 }
    ],
    "보라스파": [
        { name: "꿀 마사지", price: 55000 },
        { name: "진주 마사지", price: 55000 },
        { name: "태반 마사지", price: 55000 }
    ],
    "루나스파": [
        { name: "스톤 마사지", price: 55000 },
        { name: "노니 마사지", price: 55000 },
        { name: "태반 마사지", price: 55000 }
    ],
    "마리스 스파": [
        { name: "스파 (스크럽 불포함)", price: 91000 },
        { name: "스파 (스크럽 포함)", price: 105000 },
        { name: "성장 마사지 (1시간)", price: 42000 },
        { name: "성장 마사지 (2시간)", price: 55000 }
    ],
    "포세이돈 스파": [
        { name: "VIP 마사지", price: 105000 },
        { name: "VVIP 마사지", price: 119000 },
        { name: "성장 마사지 (1시간)", price: 42000 },
        { name: "성장 마사지 (2시간)", price: 55000 }
    ],
    "헬리오스 스파": [
        { name: "허니스톤 마사지", price: 91000 },
        { name: "코코스파", price: 105000 },
        { name: "허니스톤 + 코코스파", price: 119000 },
        { name: "성장 마사지 (1시간)", price: 42000 },
        { name: "성장 마사지 (2시간)", price: 55000 }
    ],
    "카바얀 스파": [
        { name: "딥티슈 마사지", price: 49000 }
    ],
    "아유르베다": [
        { name: "태반 마사지", price: 55000 },
        { name: "스톤 마사지", price: 55000 },
        { name: "골든링 마사지", price: 77000 },
        { name: "아유르베다 스파", price: 91000 },
        { name: "성장 마사지 (1시간)", price: 42000 },
        { name: "성장 마사지 (2시간)", price: 55000 }
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

        const docRef = await addDoc(collection(db, "reservations"), {
            customerKorName: "(고객 입력 대기)",
            contact: "-",
            items: items,
            totalPrice: totalPrice,
            status: '견적발송',
            createdAt: new Date()
        });

        const url = `${window.location.origin}/quote.html?id=${docRef.id}`;
        await navigator.clipboard.writeText(url);
        alert('견적 링크가 생성되어 복사되었습니다!\n[신규예약] 탭에서 확인 가능합니다.');
        window.close();
    } catch (e) { 
        console.error(e); 
        btn.disabled = false;
        btn.innerText = "견적서 생성 및 링크 복사";
    }
};

addItemRow();
