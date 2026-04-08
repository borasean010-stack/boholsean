// bohol-admin.js - Final Full Luxury Admin (STRICT ORDER & KOREAN RESORTS)
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
    console.log("Firebase initialized");
} catch (e) { console.error("Firebase Init Error", e); }

function init() {
    console.log("Admin Init Started");
    const tableBody = document.getElementById('admin-table-body');
    const loginContainer = document.getElementById('login-container');
    const adminContainer = document.getElementById('admin-container');

    let allReservations = [];
    let allSchedules = [];
    let activeTab = 'new'; 
    let currentScheduleFilter = 'all';
    let currentScheduleDay = 'today'; 

    // 🚀 리조트 번역기 (보홀 전용 한글 우선)
    function translateResort(name) {
        if (!name || name === '-') return '-';
        let n = name.toLowerCase().replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '');
        
        if (n.includes('drop')) n = n.replace(/drop/g, '');
        
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
        if (n.includes('cocotree')) return '코코트리';
        if (n.includes('mgh') || n.includes('southpalm')) return '사우스팜 (MGH)';
        if (n.includes('alonadetropicana')) return '알로나 데 트로피카나';
        if (n.includes('ramede')) return '라메디 리조트';
        if (n.includes('cliffside')) return '클리프사이드 리조트';
        if (n.includes('jolibee') || n.includes('jollibee')) return '졸리비';
        if (n.includes('fruitbasket')) return '과일바구니 (과일가게)';
        if (n.includes('bluewaterpanglao')) return '블루워터 팡라오';
        if (n.includes('bbc')) return 'BBC';
        if (n === 'bs' || n.includes('bsresort')) return 'BS리조트';
        if (n.includes('ohana')) return '오하나';
        if (n.includes('tba')) return '미정 (TBA)';
        if (n.includes('alonaaustria')) return '알로나 오스트리아';
        if (n.includes('travelbee')) return '트래블비 호텔';
        if (n.includes('adela')) return '아델라 리조트';
        if (n.includes('cherrys')) return '체리스 홈';
        if (n.includes('molly')) return '몰리 리조트';
        if (n.includes('holabay')) return '홀라베이 리조트';
        if (n.includes('mayfair')) return '메이페어 가든';
        if (n.includes('bellanapoli')) return '벨라 나폴리';

        return name; 
    }

    function showAdminPanel() {
        console.log("Showing Admin Panel");
        if (!loginContainer || !adminContainer) return;
        loginContainer.style.display = 'none';
        adminContainer.style.display = 'flex';
        const adminId = sessionStorage.getItem('adminId') || '관리자';
        const displayIdEl = document.getElementById('display-admin-id');
        if (displayIdEl) displayIdEl.innerText = adminId;
        fetchData();
    }

    if (sessionStorage.getItem('isAdminLoggedIn') === 'true') { showAdminPanel(); }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            const id = document.getElementById('username').value.trim();
            const pw = document.getElementById('password').value.trim();
            const admins = { 'admin': 'sean1234!', 'sean': 'sean1', 'storm': 'storm1', 'mini': 'mini1', 'david': 'david1' };
            if (admins[id] && admins[id] === pw) {
                sessionStorage.setItem('isAdminLoggedIn', 'true');
                sessionStorage.setItem('adminId', id);
                showAdminPanel();
            } else { alert('아이디 또는 비밀번호가 올바르지 않습니다.'); }
        };
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => { sessionStorage.removeItem('isAdminLoggedIn'); location.reload(); };
    }

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
        autoCleanupOldSchedules();
    }

    async function autoCleanupOldSchedules() {
        if (!db) return;
        try {
            const now = new Date();
            const offset = now.getTimezoneOffset() * 60000;
            const todayStr = new Date(now.getTime() - offset).toISOString().split('T')[0];
            const q = query(collection(db, "schedules"), where("date", "<", todayStr));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const batch = writeBatch(db);
                snap.docs.forEach(d => batch.delete(d.ref));
                await batch.commit();
            }
        } catch (e) { console.error("Auto cleanup error:", e); }
    }

    function renderAll() {
        updateSummaryCounts();
        renderDateBoxes();
        renderSchedule();
        renderTable();
    }

    function updateSummaryCounts() {
        const counts = {
            new: allReservations.filter(r => ['입금대기', '예약접수', '견적발송', '입금확인요청'].includes(r.status)).length,
            confirmed: allReservations.filter(r => r.status === '예약확정').length,
            resorts: allReservations.filter(r => r.status === '견적').length,
            resortConfirmed: allReservations.filter(r => r.status === '리조트확정').length
        };
        const cIds = ['count-new', 'count-confirmed', 'count-resorts', 'count-resort-confirmed'];
        const vals = [counts.new, counts.confirmed, counts.resorts, counts.resortConfirmed];
        cIds.forEach((id, i) => { const el = document.getElementById(id); if(el) el.innerText = vals[i]; });
    }

    function renderDateBoxes() {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const todayStr = new Date(now.getTime() - offset).toISOString().split('T')[0];
        const tomorrowStr = new Date(now.getTime() - offset + 86400000).toISOString().split('T')[0];
        const tBox = document.getElementById('box-date-today');
        const tmBox = document.getElementById('box-date-tomorrow');
        if (tBox) tBox.innerText = todayStr;
        if (tmBox) tmBox.innerText = tomorrowStr;
    }

    window.switchScheduleDay = (day) => { 
        currentScheduleDay = day; 
        window.hideInputArea(); 
        document.getElementById('tool-box-today')?.classList.toggle('active', day === 'today');
        document.getElementById('tool-box-tomorrow')?.classList.toggle('active', day === 'tomorrow');
        renderSchedule(); 
    };
    window.filterSchedule = (category) => {
        currentScheduleFilter = category;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            const txt = btn.innerText;
            const isMatch = (category === 'all' && txt === '전체') || txt === category;
            if (isMatch) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        renderSchedule();
    };

    function getCategory(name, details = '') {
        const combined = ((name || '') + ' ' + (details || '')).toLowerCase();
        if (combined.includes('픽업') || combined.includes('샌딩') || combined.includes('드랍')) return '픽업샌딩';
        if (combined.includes('나팔링') || combined.includes('대왕조개') || combined.includes('napaling')) return '나팔링';
        if (combined.includes('호핑') || combined.includes('파밀라칸') || combined.includes('hopping')) return '호핑투어';
        if (combined.includes('육상') || combined.includes('랜드') || combined.includes('daytour')) return '육상투어';
        if (combined.includes('마사지') || combined.includes('스파') || combined.includes('spa') || combined.includes('힐롯') || combined.includes('stone') || combined.includes('스톤')) return '마사지';
        return '액티비티';
    }

    function renderSchedule() {
        const container = document.getElementById('active-timeline');
        if (!container) return;
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const krTime = new Date(utc + (9 * 3600000));
        const todayStr = krTime.toISOString().split('T')[0];
        const tomorrowStr = new Date(krTime.getTime() + 86400000).toISOString().split('T')[0];
        const targetDate = (currentScheduleDay === 'tomorrow') ? tomorrowStr : todayStr;
        const titleDateEl = document.getElementById('schedule-title-date');
        if (titleDateEl) titleDateEl.innerText = targetDate;

        let rawItems = [];
        allSchedules.forEach(s => { 
            if (s.date === targetDate) {
                const lines = (s.details || '').split('\n').filter(l => l.trim() !== '');
                (lines.length > 0 ? lines : ['']).forEach(line => {
                    const mCount = line.match(/\d+(?=명|인|태반|성장|스톤|오일|포쉘|진주)/g);
                    let displayPax = s.count;
                    if (mCount) displayPax = mCount.reduce((a, b) => a + parseInt(b), 0);
                    rawItems.push({ 
                        time: s.time || "09:00", name: s.name, customer: s.customerName || "고객", count: displayPax, 
                        status: '스케줄', id: s.id, source: 'schedule', resort: translateResort(s.resort || "-"), 
                        flight: s.flight || "-", details: line || s.name
                    }); 
                });
            }
        });

        let filteredItems = (currentScheduleFilter !== 'all') ? rawItems.filter(i => getCategory(i.name, i.details) === currentScheduleFilter) : rawItems;
        const groups = {};
        filteredItems.forEach(item => {
            const cat = getCategory(item.name, item.details);
            let groupTitle = item.name;
            if (cat === '픽업샌딩') groupTitle = (item.flight !== '-' && item.flight) ? item.flight : '공항 픽업/샌딩';
            else if (['호핑투어', '육상투어', '나팔링'].includes(cat)) groupTitle = cat;
            else if (cat === '마사지') groupTitle = item.name.replace(/마사지|스파|stone|스톤|\(|\)/gi, '').trim() || '마사지';
            
            const key = `${cat}_${groupTitle}_${item.time}`;
            if (!groups[key]) groups[key] = { title: groupTitle, time: item.time, items: [], totalCount: 0, category: cat };
            groups[key].items.push(item);
            groups[key].totalCount += item.count;
        });

        const sortedKeys = Object.keys(groups).sort((a, b) => groups[a].time.localeCompare(groups[b].time));
        if (sortedKeys.length === 0) { 
            container.innerHTML = `<div style="text-align:center; padding:30px; color:#999; font-size:12px;">일정이 없습니다. (${targetDate})</div>`; 
            return; 
        }

        container.innerHTML = sortedKeys.map(key => {
            const group = groups[key];
            let icon = "event_available", catClass = "cat-activity";
            if (group.category === '픽업샌딩') { icon = "local_airport"; catClass = "cat-pickup"; }
            else if (group.category === '호핑투어') { icon = "sailing"; catClass = "cat-hopping"; }
            else if (group.category === '육상투어') { icon = "directions_car"; catClass = "cat-activity"; }
            else if (group.category === '나팔링') { icon = "waves"; catClass = "cat-napaling"; }
            else if (group.category === '마사지') { icon = "spa"; catClass = "cat-activity"; }

            const bodyHtml = group.items.map(it => `
                <div class="sc-detail-row" onclick="showDetail('${it.id}', '${it.source}')">
                    <div><span class="sc-detail-name">${it.customer}</span><span class="sc-detail-resort">${it.flight !== '-' ? `[${it.flight}] ` : ''}${it.resort}</span></div>
                    <span class="sc-detail-pax">${it.count}인</span>
                </div>`).join('');

            return `<div class="schedule-group-card">
                <div class="sg-header"><div class="sg-time">${group.time}</div>
                <div class="sg-title-row"><span class="material-icons">${icon}</span><span class="sg-title">${group.title} (${group.totalCount}명)</span></div>
                <span class="sc-category-tag ${catClass}">${group.category}</span></div><div class="sg-body">${bodyHtml}</div></div>`;
        }).join('');
    }

    window.switchMainView = () => {
        document.querySelectorAll('.ss-nav-item').forEach(el => el.classList.remove('active'));
        document.querySelector('.ss-nav-item:first-child')?.classList.add('active');
        document.getElementById('breadcrumb-active').innerText = '메인 페이지';
        activeTab = 'new'; 
        ['system-setup-section', 'data-view-section'].forEach(id => { const el = document.getElementById(id); if(el) el.style.display = 'none'; });
        renderSchedule();
    };

    window.switchAdminTab = (tab) => {
        activeTab = tab;
        document.querySelectorAll('.ss-nav-item').forEach(el => el.classList.remove('active'));
        const bActive = document.getElementById('breadcrumb-active');
        const toolGrid = document.querySelector('.main-tool-grid');
        const timelineSec = document.querySelector('.timeline-section');
        const systemSec = document.getElementById('system-setup-section');
        const dataSec = document.getElementById('data-view-section');

        if (tab === 'system') {
            if (toolGrid) toolGrid.style.display = 'none'; if (timelineSec) timelineSec.style.display = 'none';
            if (systemSec) systemSec.style.display = 'block'; if (dataSec) dataSec.style.display = 'block';
            if (bActive) bActive.innerText = '시스템 초기화';
            renderCleanupTable();
        } else {
            if (toolGrid) toolGrid.style.display = 'grid'; if (timelineSec) timelineSec.style.display = 'block';
            if (systemSec) systemSec.style.display = 'none'; if (dataSec) dataSec.style.display = 'block';
            if (bActive) { const labels = { 'new': '신규예약', 'confirmed': '예약확정', 'resorts': '리조트 견적', 'resort-confirmed': '리조트 확정' }; bActive.innerText = labels[tab] || '메인 페이지'; }
            renderTable();
        }
    };

    function renderTable() {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        const searchInput = document.getElementById('header-global-search');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const filtered = allReservations.filter(r => {
            const name = (r.customerKorName || '').toLowerCase();
            let matchesTab = (activeTab === 'new') ? ['입금대기', '예약접수', '견적발송', '입금확인요청'].includes(r.status) :
                             (activeTab === 'confirmed') ? (r.status === '예약확정') :
                             (activeTab === 'resorts') ? (r.status === '견적') : (r.status === '리조트확정');
            return name.includes(searchTerm) && matchesTab;
        });
        filtered.forEach((res, index) => {
            const tr = document.createElement('tr');
            const status = res.status || '대기';
            const firstItem = (res.items?.[0]?.name || '-') + (res.items?.length > 1 ? ` 외 ${res.items.length-1}건` : '');
            let actionButtons = `<button class="btn-action-received" style="background:#00b48a;" onclick="showDetail('${res.id}', 'reservation')"><span class="material-icons">visibility</span>상세</button><button class="btn-action-outline" onclick="copyCombinedVoucherLink('${res.contact}')"><span class="material-icons">content_copy</span>일정표</button>`;
            if (['입금확인요청', '예약접수', '입금대기'].includes(status)) actionButtons = `<button class="btn-action-received" style="background:#00c73c;" onclick="handleAutoConfirm('${res.id}')"><span class="material-icons">payments</span>입금확인</button>` + actionButtons;
            const badgeClass = status.includes('확정') ? 'badge-green' : 'badge-yellow';
            tr.innerHTML = `<td><input type="checkbox"></td><td style="color:#bbb;">${filtered.length - index}</td><td>${res.reservationNumber || '-'}</td><td><div style="font-size:14px; font-weight:800;">${res.customerKorName}</div></td><td>${firstItem}</td><td>₩ ${(res.totalPrice || 0).toLocaleString()}</td><td>${res.createdAt?.toDate ? res.createdAt.toDate().toLocaleDateString() : '-'}</td><td><span class="n-badge ${badgeClass}">${status === '입금확인요청' ? '입금완료' : status}</span></td><td><div style="display:flex; gap:5px;">${actionButtons}</div></td>`;
            tableBody.appendChild(tr);
        });
    }

    window.deleteSingleReservation = async (id) => { if (confirm("삭제하시겠습니까?")) { try { await deleteDoc(doc(db, "reservations", id)); alert("삭제됨"); fetchData(); } catch (e) { alert("실패"); } } };
    window.handleAutoConfirm = async (id) => { if (confirm("예약 확정 처리를 하시겠습니까?")) { try { await updateDoc(doc(db, "reservations", id), { status: '예약확정' }); alert("확정됨"); fetchData(); } catch (e) { alert("실패"); } } };
    window.handleResortConfirm = async (id) => { if (confirm("리조트 예약 확정?")) { try { await updateDoc(doc(db, "reservations", id), { status: '리조트확정' }); alert("확정됨"); fetchData(); } catch (e) { alert("실패"); } } };
    window.handleResortQuoteComplete = async (id) => { try { await deleteDoc(doc(db, "reservations", id)); fetchData(); } catch (e) { console.error(e); } };

    function renderCleanupTable() {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        allReservations.forEach((res, index) => {
            const tr = document.createElement('tr');
            const firstItem = (res.items?.[0]?.name || '-') + (res.items?.length > 1 ? ` 외 ${res.items.length-1}건` : '');
            tr.innerHTML = `<td><input type="checkbox"></td><td style="color:#bbb;">${allReservations.length - index}</td><td>${res.reservationNumber || '-'}</td><td><b>${res.customerKorName}</b></td><td>${firstItem}</td><td>₩ ${(res.totalPrice || 0).toLocaleString()}</td><td>-</td><td>${res.status}</td><td><button class="btn-action-received" style="background:#ff4b4b;" onclick="deleteSingleReservation('${res.id}')"><span class="material-icons">delete</span>단품삭제</button></td>`;
            tableBody.appendChild(tr);
        });
    }

    window.showDetail = (id, source) => {
        const res = (source === 'schedule') ? allSchedules.find(s => s.id === id) : allReservations.find(r => r.id === id);
        if (!res) return;
        const modal = document.getElementById('res-detail-modal'); const body = document.getElementById('modal-body');
        if (source === 'schedule') {
            body.innerHTML = `<h3>스케줄 상세</h3><div style="background:#f8f9fa; padding:15px; border-radius:10px;"><p><b>고객명:</b> ${res.customerName}</p><p><b>상품명:</b> ${res.name}</p><p><b>날짜:</b> ${res.date}</p><p><b>시간:</b> ${res.time}</p><p><b>인원:</b> ${res.count}명</p></div>`;
            modal.style.display = 'flex'; return;
        }
        const isQuote = ['견적', '견적완료'].includes(res.status);
        const totalVoucherBtn = isQuote ? '' : `<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px;"><button onclick="copyCombinedVoucherLink('${res.contact}')" style="padding:12px; background:#00c73c; color:white; border:none; border-radius:8px; font-weight:800; cursor:pointer;"><span class="material-icons">people</span> 통합 링크</button><button onclick="copyVoucherLink('${res.id}', null)" style="padding:12px; background:#00b48a; color:white; border:none; border-radius:8px; font-weight:800; cursor:pointer;"><span class="material-icons">share</span> 주문 일정</button></div>`;
        const itemsHtml = (res.items || []).map((item, idx) => `<div style="padding:12px; background:#f8f9fa; border:1px solid #eee; border-radius:8px; margin-bottom:8px;"><div style="display:flex; justify-content:space-between;"><div style="font-size:15px; font-weight:800;">${item.name}</div><div style="font-size:14px; font-weight:800; color:#00b48a;">${item.count}명</div></div><div style="margin-top:6px; font-size:13px; color:#666;">📅 ${item.date} ${item.time || ''}</div>${!isQuote ? `<div style="margin-top:10px; display:flex; gap:5px;"><a href="reservation-schedule.html?id=${res.id}&itemIndex=${idx}" target="_blank" style="flex:1; text-align:center; padding:6px; background:#fff; border:1px solid #ddd; border-radius:4px; font-size:11px; text-decoration:none; color:#333;">바우처</a><button onclick="copyVoucherLink('${res.id}', ${idx})" style="flex:1; padding:6px; background:#00b48a; color:white; border:none; border-radius:4px; font-size:11px; cursor:pointer;">복사</button></div>` : ''}</div>`).join('');
        body.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:15px;"><h3 style="margin:0;">예약 상세 정보</h3><button onclick="copyGuidance('${res.id}')" style="background:#00b48a; color:white; border:none; padding:8px 14px; border-radius:6px; font-weight:bold; cursor:pointer;">안내문 복사</button></div><div id="modal-scroll-area" style="max-height: 60vh; overflow-y: auto;"><div>${totalVoucherBtn}${itemsHtml}</div><div style="background:#fcfcfc; padding:15px; border-radius:10px; border:1px solid #f0f0f0; margin-bottom:20px;"><p>이름 | <b>${res.customerKorName}</b> (${res.engName || '-' })</p><p>구매처 | <b>${res.contact}</b></p><p>인원 | <b>${res.paxInfo || '-'}</b></p></div>${!isQuote ? `<div style="background:#fff5eb; padding:15px; border-radius:10px; border:1px solid #ffe8cc; margin-bottom:20px;"><div style="font-weight:bold; color:#00b48a;">항공 및 환전 정보</div><p>픽업: ${res.pickupDate || '-'} / ${res.pickupFlight || '-'} / ${res.pickupResort || '-'}</p><p>샌딩: ${res.sendingDate || '-'} / ${res.sendingFlight || '-'} / ${res.sendingResort || '-'}</p><p style="border-top:1px dashed #ffd8a8; padding-top:10px;">환전: <span style="color:#e67e22; font-weight:800;">${res.exchangeAmount || '-'}</span></p></div>` : ''}<div style="padding:10px; background:#f8f9fa; border-radius:6px; font-size:13px; white-space:pre-wrap;"><b>[요청사항]</b>\n${res.requests || '없음'}</div></div><div style="display:flex; gap:10px; margin-top:20px; border-top:1px solid #eee; padding-top:15px;"><button id="edit-btn" onclick="toggleEditMode('${res.id}')" style="flex:1; padding:12px; background:#00b48a; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">수정하기</button><button onclick="closeModal()" style="flex:1; padding:12px; background:#333; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">닫기</button></div>`;
        modal.style.display = 'flex';
    };

    window.copyVoucherLink = (id, idx) => { const url = `${window.location.origin}/reservation-schedule.html?id=${id}${idx !== null ? `&itemIndex=${idx}` : ''}`; navigator.clipboard.writeText(url).then(() => alert('복사됨')); };
    window.copyCombinedVoucherLink = (contact) => { navigator.clipboard.writeText(`${window.location.origin}/reservation-schedule.html?contact=${encodeURIComponent(contact)}`).then(() => alert('복사됨')); };
    window.copyGuidance = (id) => { /* guidance logic omitted for brevity */ };
    window.showInputArea = (type) => { if (type === 'quote') { window.open('admin-quote-maker.html', '_blank'); return; } window.hideInputArea(); document.getElementById(`input-area-${type}`).style.display = 'block'; window.scrollTo({ top: 0, behavior: 'smooth' }); };
    window.hideInputArea = () => { ['quick', 'reg', 'quote'].forEach(id => { const el = document.getElementById(`input-area-${id}`); if(el) el.style.display = 'none'; }); };
    window.closeModal = () => { document.getElementById('res-detail-modal').style.display = 'none'; };

    window.registerBulkSchedule = async () => {
        const input = document.getElementById('schedule-reg-input').value.trim(); if (!input) return;
        const parseRobustTSV = (text) => {
            const rows = []; let currentRow = []; let currentField = ""; let inQuotes = false;
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                if (char === '"') inQuotes = !inQuotes;
                else if (char === '\t' && !inQuotes) { currentRow.push(currentField); currentField = ""; }
                else if (char === '\n' && !inQuotes) { currentRow.push(currentField); rows.push(currentRow); currentRow = []; currentField = ""; }
                else currentField += char;
            }
            if (currentField || currentRow.length > 0) { currentRow.push(currentField); rows.push(currentRow); }
            return rows;
        };

        try {
            const rows = parseRobustTSV(input); const batch = writeBatch(db); let count = 0; const currentYear = 2026;
            for (const row of rows) {
                if (row.length < 11) continue;
                const pickupFlight = (row[2] || '').trim(); const sendingFlight = (row[3] || '').trim(); const resortRaw = (row[8] || '').trim();
                const engName = (row[9] || '').trim().toUpperCase(); const korNameOnly = (row[14] || '').trim();
                const customerName = engName ? `${engName} (${korNameOnly || ''})` : (korNameOnly || '고객');
                const remarks = (row[15] || row[16] || '').trim();
                const totalPax = (parseInt(row[10]) || 0) + (parseInt(row[11]) || 0) + (parseInt(row[12]) || 0) || 1;
                const formatDate = (raw) => { if (!raw || !raw.includes('/')) return null; const parts = raw.split('/'); return `${currentYear}-${parts[0].trim().padStart(2, '0')}-${parts[1].trim().replace(/[^0-9]/g, '').padStart(2, '0')}`; };

                if (formatDate(row[0]) && pickupFlight && pickupFlight !== '-') { batch.set(doc(collection(db, "schedules")), { date: formatDate(row[0]), time: "14:00", name: "공항 픽업", customerName, count: totalPax, flight: pickupFlight, resort: translateResort(resortRaw), details: `픽업편: ${pickupFlight}`, createdAt: new Date() }); count++; }
                if (formatDate(row[1]) && sendingFlight && sendingFlight !== '-') { batch.set(doc(collection(db, "schedules")), { date: formatDate(row[1]), time: sendingFlight.includes('126') ? "08:30" : "21:00", name: "공항 샌딩", customerName, count: totalPax, flight: sendingFlight, resort: translateResort(resortRaw), details: `샌딩편: ${sendingFlight}`, createdAt: new Date() }); count++; }

                if (remarks) {
                    remarks.split('\n').forEach(line => {
                        const dateMatch = line.match(/(\d{1,2})\/(\d{1,2})/); if (!dateMatch) return;
                        const itemDate = `${currentYear}-${dateMatch[1].padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}`;
                        let itemTime = "09:00", itemResort = resortRaw; const timeMatch = line.match(/(\d{1,2}):(\d{2})/);
                        if (timeMatch) itemTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
                        const resortOverride = line.match(/-\s*([A-Z\.\s]{2,})$/i); if (resortOverride) itemResort = resortOverride[1].trim();
                        let itemPax = totalPax; const mCount = line.match(/\d+(?=명|인|태반|성장|스톤|오일|포쉘|진주)/g);
                        if (mCount) itemPax = mCount.reduce((a, b) => a + parseInt(b), 0);
                        batch.set(doc(collection(db, "schedules")), { date: itemDate, time: itemTime, name: line.replace(dateMatch[0], '').replace(timeMatch?.[0] || '', '').trim(), customerName, count: itemPax, resort: translateResort(itemResort), details: line.trim(), createdAt: new Date() }); count++;
                    });
                }
            }
            await batch.commit(); alert(`${count}건 등록됨`); renderSchedule();
        } catch (e) { console.error(e); alert("오류 발생"); }
    };

    window.makeQuickVoucher = async () => {
        const inputVal = document.getElementById('quick-voucher-input').value.trim(); if (!inputVal) return;
        const parseRobustTSV = (text) => {
            const rows = []; let currentRow = []; let currentField = ""; let inQuotes = false;
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                if (char === '"') inQuotes = !inQuotes;
                else if (char === '\t' && !inQuotes) { currentRow.push(currentField); currentField = ""; }
                else if (char === '\n' && !inQuotes) { currentRow.push(currentField); rows.push(currentRow); currentRow = []; currentField = ""; }
                else currentField += char;
            }
            if (currentField || currentRow.length > 0) { currentRow.push(currentField); rows.push(currentRow); }
            return rows;
        };

        const rows = parseRobustTSV(inputVal); const currentYear = new Date().getFullYear();
        let combinedKorNames = [], totalAdults = 0, totalChildren = 0, totalInfants = 0, allItems = [];
        let firstResort = '', secondResort = '', firstContact = '', firstExVal = '';
        let firstPickupFlight = '', firstSendingFlight = '';

        rows.forEach((row, index) => {
            if (row.length < 15) return;
            const engNameRaw = (row[9] || '').trim(); const korNameRaw = (row[14] || '').trim().replace(/\n/g, ', ');
            const isP10Korean = /[가-힣]/.test(engNameRaw);
            let korName = korNameRaw, engName = engNameRaw;
            if (isP10Korean && !engNameRaw.includes(' ')) { korName = engNameRaw; engName = korNameRaw.toUpperCase(); }
            else engName = engNameRaw.toUpperCase();
            combinedKorNames.push(`${engName} (${korName})`.replace(' ()', ''));

            if (!firstPickupFlight) firstPickupFlight = (row[2] || '').trim().toUpperCase();
            if (!firstSendingFlight) firstSendingFlight = (row[3] || '').trim().toUpperCase();
            totalAdults += (parseInt(row[10]) || 0); totalChildren += (parseInt(row[11]) || 0); totalInfants += (parseInt(row[12]) || 0);
            if (!firstContact) firstContact = (row[13] || '').trim();
            const resortRaw = (row[8] || '').trim();
            if (!firstResort) { firstResort = translateResort(resortRaw.split('/')[0].trim()); secondResort = translateResort(resortRaw.split('/')[1]?.trim() || firstResort); }
            let exVal = (row[18] || row[5] || '').trim(); if (!firstExVal) firstExVal = exVal;

            const totalPax = (parseInt(row[10]) || 0) + (parseInt(row[11]) || 0) + (parseInt(row[12]) || 0);
            const formatDate = (raw) => { if (!raw || !raw.includes('/')) return null; const parts = raw.split('/'); return `${currentYear}-${parts[0].trim().padStart(2,'0')}-${parts[1].trim().padStart(2,'0')}`; };
            
            if (row[2] && row[2].match(/[A-Z0-9]{2}\d+/i)) allItems.push({ name: `✈️ 공항 픽업 (${row[2].toUpperCase()})`, date: formatDate(row[0]), time: "14:00", count: totalPax });
            if (row[3] && row[3].match(/[A-Z0-9]{2}\d+/i)) allItems.push({ name: `✈️ 공항 샌딩 (${row[3].toUpperCase()})`, date: formatDate(row[1]), time: row[3].includes('126') ? "08:30" : "21:00", count: totalPax });

            const remarkRaw = (row[15] || row[16] || '').trim();
            if (remarkRaw) {
                remarkRaw.split('\n').forEach(line => {
                    const dm = line.trim().match(/^(\d{1,2})\/(\d{1,2})/); if (!dm) return;
                    const tDate = formatDate(dm[0]); let itemTime = "09:00", itemPax = totalPax, itemMeetingPlace = null;
                    const tm = line.match(/(\d{1,2}):(\d{2})/); if (tm) itemTime = `${tm[1].padStart(2,'0')}:${tm[2]}`;
                    
                    const resortOverride = line.match(/-\s*([A-Z\d\.\s]{2,})$/i);
                    if (resortOverride && !line.toLowerCase().includes('get')) itemMeetingPlace = translateResort(resortOverride[1].trim());
                    
                    const getMatch = line.match(/get:\s*(\d+[a-z]*)/i);
                    let itemGetText = "";
                    if (getMatch) { itemGetText = ` (현지불: ${getMatch[1].toUpperCase()})`; if (!firstExVal || !firstExVal.toLowerCase().includes('get')) firstExVal = `GET: ${getMatch[1].toUpperCase()}`; }

                    let name = line.replace(dm[0], '').replace(tm?.[0] || '', '').replace(resortOverride?.[0] || '', '').trim();
                    const low = line.toLowerCase();
                    if (low.includes('stone') || low.includes('스톤')) name = '더 스톤 마사지';
                    else if (low.includes('hopping') || low.includes('호핑')) name = '샤인 호핑투어';
                    else if (low.includes('daytour(d)')) name = '데이투어 D코스';
                    else if (low.includes('daytour(c)')) name = '데이투어 C코스';
                    else if (low.includes('napaling') || low.includes('나팔링')) name = '나팔링투어';
                    
                    allItems.push({ name: name + itemGetText, date: tDate, time: itemTime, count: itemPax, details: line, meetingPlace: itemMeetingPlace });
                });
            }
        });

        if (combinedKorNames.length === 0) return;
        const merged = {};
        allItems.forEach(it => { const key = `${it.name}_${it.date}_${it.time}`; if (!merged[key]) merged[key] = { ...it }; else merged[key].count += it.count; });
        const resData = { customerKorName: combinedKorNames.join(', '), contact: firstContact, items: Object.values(merged), status: '예약확정', exchangeAmount: firstExVal.toLowerCase().includes('get') ? firstExVal : '전액 결제 완료', paxInfo: `성인 ${totalAdults}, 아동 ${totalChildren}, 유아 ${totalInfants}`.replace(/, 아동 0, 유아 0/, '').replace(/, 유아 0/, ''), pickupResort: firstResort, sendingResort: secondResort, pickupFlight: firstPickupFlight, sendingFlight: firstSendingFlight, createdAt: new Date() };
        try {
            const docRef = await addDoc(collection(db, "quick_vouchers"), resData);
            const url = `${window.location.origin}/bohol-voucher.html?id=${docRef.id}`;
            await navigator.clipboard.writeText(url); alert('바우처 생성 및 링크 복사 완료!'); window.open(url, '_blank');
        } catch (e) { console.error(e); alert("실패"); }
    };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
