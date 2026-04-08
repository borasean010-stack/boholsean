// bohol-admin.js - Final Full Luxury Admin (STRICT KOREAN & INPUT FIX)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, where, getDocs, addDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCqvsvuOGnQoNL3J0oGsOcN66ZOP0JlN5w",
    authDomain: "boholsean-14014193-11202.firebaseapp.com",
    projectId: "boholsean-14014193-11202",
    storageBucket: "boholsean-14014193-11202.firebasestorage.app",
    messagingSenderId: "684378696978",
    appId: "1:684378696978:web:868e1e33581f38a188d7cb"
};

let db = null;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) { console.error("Firebase Init Error", e); }

function init() {
    const tableBody = document.getElementById('admin-table-body');
    const loginContainer = document.getElementById('login-container');
    const adminContainer = document.getElementById('admin-container');

    let allReservations = [];
    let allSchedules = [];
    let activeTab = 'new'; 
    let currentScheduleFilter = 'all';
    let currentScheduleDay = 'today'; 

    // 🚀 상품명 한글 번역기
    function translateTourName(name) {
        if (!name) return '-';
        const low = name.toLowerCase();
        if (low.includes('stone') || low.includes('스톤')) return '더 스톤 마사지';
        if (low.includes('hopping') || low.includes('호핑')) return '샤인 호핑투어';
        if (low.includes('daytour(d)') || low.includes('육상투어d')) return '데이투어 D코스';
        if (low.includes('daytour(c)') || low.includes('육상투어c')) return '데이투어 C코스';
        if (low.includes('napaling') || low.includes('나팔링')) return '나팔링투어';
        if (low.includes('oslob') || low.includes('오슬롭')) return '오슬롭 고래상어';
        if (low.includes('pamilacan') || low.includes('파밀라칸')) return '파밀라칸 호핑';
        if (low.includes('firefly') || low.includes('반딧불')) return '반딧불 투어';
        if (low.includes('boholshow') || low.includes('보홀쇼')) return '보홀쇼 (어메이징)';
        if (low.includes('sunset') || low.includes('선셋')) return '선셋 낚시';
        if (low.includes('pickup') || low.includes('픽업')) return '공항 픽업';
        if (low.includes('sending') || low.includes('샌딩') || low.includes('drop')) return '공항 샌딩';
        return name;
    }

    // 🚀 리조트 한글 번역기
    function translateResort(name) {
        if (!name || name === '-') return '-';
        let n = name.toLowerCase().replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '');
        if (n.includes('halona')) return '헤난 알로나';
        if (n.includes('htawala')) return '헤난 타왈라';
        if (n.includes('hpmr') || n.includes('hpremier')) return '헤난 프리미어';
        if (n.includes('begrand')) return '비그랜드';
        if (n.includes('mithi')) return '미티';
        if (n.includes('bathala')) return '바탈라 리조트';
        if (n.includes('amihan')) return '아미한';
        if (n.includes('modala')) return '모달라';
        if (n.includes('tamarind')) return '타마린드';
        if (n.includes('alonanorthland')) return '알로나 노스랜드';
        if (n.includes('luxuhotel')) return '럭슈 호텔';
        if (n.includes('danbi')) return '단비 리조트';
        if (n.includes('southpalm')) return '사우스팜';
        if (n.includes('jollibee')) return '졸리비';
        if (n.includes('bbc')) return 'BBC';
        if (n === 'bs' || n.includes('bsresort')) return 'BS리조트';
        if (n.includes('adela')) return '아델라 리조트';
        return name; 
    }

    // 🚀 입력창 제어 (퀵바우처, 견적서 등)
    window.showInputArea = (type) => {
        window.hideInputArea();
        const el = document.getElementById(`input-area-${type}`);
        if (el) {
            el.style.display = 'block';
            el.scrollIntoView({ behavior: 'smooth' });
        } else if (type === 'quote') {
            window.open('admin-quote-maker.html', '_blank');
        }
    };

    window.hideInputArea = () => {
        ['quick', 'reg', 'quote'].forEach(id => {
            const el = document.getElementById(`input-area-${id}`);
            if(el) el.style.display = 'none';
        });
    };

    function showAdminPanel() {
        if (!loginContainer || !adminContainer) return;
        loginContainer.style.display = 'none';
        adminContainer.style.display = 'flex';
        fetchData();
    }

    if (sessionStorage.getItem('isAdminLoggedIn') === 'true') showAdminPanel();

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            const id = document.getElementById('username').value.trim();
            const pw = document.getElementById('password').value.trim();
            const admins = { 'admin': 'sean1234!', 'sean': 'sean1', 'storm': 'storm1', 'mini': 'mini1', 'david': 'david1' };
            if (admins[id] === pw) {
                sessionStorage.setItem('isAdminLoggedIn', 'true');
                sessionStorage.setItem('adminId', id);
                showAdminPanel();
            } else alert('로그인 실패');
        };
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.onclick = () => { sessionStorage.removeItem('isAdminLoggedIn'); location.reload(); };

    function fetchData() {
        if (!db) return;
        onSnapshot(query(collection(db, "reservations"), orderBy("createdAt", "desc")), (snap) => {
            allReservations = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderAll();
        });
        onSnapshot(query(collection(db, "schedules"), orderBy("date", "asc")), (snap) => {
            allSchedules = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderAll();
        });
    }

    function renderAll() {
        updateSummaryCounts(); renderSchedule(); renderTable();
    }

    function updateSummaryCounts() {
        const counts = {
            new: allReservations.filter(r => ['입금대기', '예약접수', '견적발송', '입금확인요청'].includes(r.status)).length,
            confirmed: allReservations.filter(r => r.status === '예약확정').length,
            resorts: allReservations.filter(r => r.status === '견적').length,
            resortConfirmed: allReservations.filter(r => r.status === '리조트확정').length
        };
        ['count-new', 'count-confirmed', 'count-resorts', 'count-resort-confirmed'].forEach((id, i) => {
            const el = document.getElementById(id);
            if(el) el.innerText = Object.values(counts)[i];
        });
    }

    window.switchScheduleDay = (day) => { currentScheduleDay = day; renderSchedule(); };

    function renderSchedule() {
        const container = document.getElementById('active-timeline');
        if (!container) return;
        const targetDate = (currentScheduleDay === 'tomorrow') 
            ? new Date(new Date().getTime() + 86400000 + 32400000).toISOString().split('T')[0]
            : new Date(new Date().getTime() + 32400000).toISOString().split('T')[0];
        
        let rawItems = [];
        allSchedules.forEach(s => { 
            if (s.date === targetDate) {
                const lines = (s.details || '').split('\n').filter(l => l.trim() !== '');
                (lines.length > 0 ? lines : ['']).forEach(line => {
                    const mCount = line.match(/\d+(?=명|인|태반|성장|스톤|오일|포쉘|진주)/g);
                    let displayPax = s.count;
                    if (mCount) displayPax = mCount.reduce((a, b) => a + parseInt(b), 0);
                    rawItems.push({ 
                        time: s.time || "09:00", name: translateTourName(s.name), customer: s.customerName || "고객", count: displayPax, 
                        status: '스케줄', id: s.id, source: 'schedule', resort: translateResort(s.resort || "-"), 
                        flight: s.flight || "-", details: line || s.name
                    }); 
                });
            }
        });

        const sorted = rawItems.sort((a, b) => a.time.localeCompare(b.time));
        if (sorted.length === 0) { container.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">일정이 없습니다.</div>'; return; }

        container.innerHTML = sorted.map(it => `
            <div class="schedule-group-card" onclick="showDetail('${it.id}', '${it.source}')">
                <div class="sg-header">
                    <div class="sg-time">${it.time}</div>
                    <div class="sg-title-row"><span class="sg-title">${it.name} (${it.count}명)</span></div>
                </div>
                <div class="sg-body">
                    <div class="sc-detail-row">
                        <div><span class="sc-detail-name">${it.customer}</span><span class="sc-detail-resort">${it.resort}</span></div>
                        <span class="sc-detail-pax">${it.count}인</span>
                    </div>
                </div>
            </div>`).join('');
    }

    window.switchAdminTab = (tab) => {
        activeTab = tab;
        document.querySelectorAll('.ss-nav-item').forEach(el => el.classList.remove('active'));
        if (tab === 'system') {
            document.getElementById('system-setup-section').style.display = 'block';
            renderCleanupTable();
        } else {
            document.getElementById('system-setup-section').style.display = 'none';
            renderTable();
        }
    };

    function renderTable() {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        const filtered = allReservations.filter(r => {
            if (activeTab === 'new') return ['입금대기', '예약접수', '견적발송', '입금확인요청'].includes(r.status);
            if (activeTab === 'confirmed') return r.status === '예약확정';
            if (activeTab === 'resorts') return r.status === '견적';
            return r.status === '리조트확정';
        });
        filtered.forEach((res, index) => {
            const tr = document.createElement('tr');
            const firstItem = translateTourName(res.items?.[0]?.name || '-') + (res.items?.length > 1 ? ` 외 ${res.items.length-1}건` : '');
            tr.innerHTML = `<td><input type="checkbox"></td><td style="color:#bbb;">${filtered.length - index}</td><td>${res.reservationNumber || '-'}</td><td><b>${res.customerKorName}</b></td><td>${firstItem}</td><td>₩ ${(res.totalPrice || 0).toLocaleString()}</td><td>${res.createdAt?.toDate ? res.createdAt.toDate().toLocaleDateString() : '-'}</td><td><span class="n-badge">${res.status}</span></td><td><button class="btn-action-received" onclick="showDetail('${res.id}', 'reservation')">상세</button></td>`;
            tableBody.appendChild(tr);
        });
    }

    window.registerBulkSchedule = async () => {
        const input = document.getElementById('schedule-reg-input').value.trim(); if (!input) return;
        const rows = input.split('\n').map(r => r.split('\t'));
        const batch = writeBatch(db); let count = 0;
        for (const row of rows) {
            if (row.length < 11) continue;
            const customerName = (row[9] || '').trim().toUpperCase() + " (" + (row[14] || '').trim() + ")";
            const remarks = (row[15] || row[16] || '').trim();
            if (remarks) {
                remarks.split('\n').forEach(line => {
                    const dm = line.match(/(\d{1,2})\/(\d{1,2})/); if (!dm) return;
                    const itName = translateTourName(line.replace(dm[0], '').trim());
                    batch.set(doc(collection(db, "schedules")), { date: `2026-${dm[1].padStart(2,'0')}-${dm[2].padStart(2,'0')}`, time: "09:00", name: itName, customerName, count: 1, resort: translateResort(row[8]), createdAt: new Date() }); count++;
                });
            }
        }
        await batch.commit(); alert(`${count}건 등록됨`); renderSchedule();
    };

    window.makeQuickVoucher = async () => {
        const inputVal = document.getElementById('quick-voucher-input').value.trim(); if (!inputVal) return;
        const rows = inputVal.split('\n').map(r => r.split('\t'));
        let combinedKorNames = [], allItems = [], firstContact = '', firstResort = '', firstEx = '';
        rows.forEach(row => {
            if (row.length < 15) return;
            combinedKorNames.push(`${row[9].toUpperCase()} (${row[14]})`);
            if (!firstContact) firstContact = row[13];
            if (!firstResort) firstResort = translateResort(row[8]);
            const remarkRaw = (row[15] || row[16] || '').trim();
            if (remarkRaw) {
                remarkRaw.split('\n').forEach(line => {
                    const dm = line.match(/(\d{1,2})\/(\d{1,2})/); if (!dm) return;
                    const getMatch = line.match(/get:\s*(\d+[a-z]*)/i);
                    if (getMatch) firstEx = getMatch[1].toUpperCase();
                    allItems.push({ name: translateTourName(line.replace(dm[0], '').trim()), date: `2026-${dm[1].padStart(2,'0')}-${dm[2].padStart(2,'0')}`, time: "09:00", count: 1 });
                });
            }
        });
        const resData = { customerKorName: combinedKorNames.join(', '), contact: firstContact, items: allItems, status: '예약확정', exchangeAmount: firstEx || '전액 결제 완료', pickupResort: firstResort, createdAt: new Date() };
        const docRef = await addDoc(collection(db, "quick_vouchers"), resData);
        window.open(`bohol-voucher.html?id=${docRef.id}`, '_blank');
    };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
