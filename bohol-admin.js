// bohol-admin.js - Final Full Luxury Admin (MGH NAME FIX & ROBUST PARSING)
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

    function translateTourName(name) {
        if (!name) return '-';
        const low = name.toLowerCase();
        if (low.includes('p.hopping') || low.includes('프라이빗')) return '프라이빗 호핑투어';
        if (low.includes('fire show') || low.includes('파이어쇼') || low.includes('amazing')) return '파이어쇼';
        if (low.includes('surin') || low.includes('수린')) return '수린 마사지샵';
        if (low.includes('stone') || low.includes('스톤')) return '더 스톤 마사지';
        if (low.includes('hopping') || low.includes('호핑')) return '샤인 호핑투어';
        if (low.includes('daytour(d)') || low.includes('daytour d') || low.includes('육상투어d') || (low.includes('daytour') && low.includes('d'))) return '데이투어 D코스';
        if (low.includes('daytour(c)') || low.includes('daytour c') || low.includes('육상투어c') || (low.includes('daytour') && low.includes('c'))) return '데이투어 C코스';
        if (low.includes('parasailing') || low.includes('파라세일링')) return '파라세일링';
        if (low.includes('napaling') || low.includes('나팔링')) return '나팔링투어';
        if (low.includes('oslob') || low.includes('오슬롭')) return '오슬롭 고래상어';
        if (low.includes('pamilacan') || low.includes('파밀라칸')) return '파밀라칸 호핑';
        if (low.includes('firefly') || low.includes('반딧불')) return '반딧불 투어';
        if (low.includes('sunset') || low.includes('선셋')) return '선셋 낚시';
        if (low.includes('pickup') || low.includes('픽업')) return '공항 픽업';
        if (low.includes('sending') || low.includes('샌딩') || low.includes('drop')) return '공항 샌딩';
        return name;
    }

    function translateResort(name) {
        if (!name || name === '-') return '-';
        let n = name.toLowerCase().replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '');
        if (n.includes('mgh')) return 'MGH'; // 🚀 MGH는 리조트 이름 그 자체로 고정!
        if (n.includes('halona')) return '헤난 알로나';
        if (n.includes('htawala')) return '헤난 타왈라';
        if (n.includes('hpmr') || n.includes('hpremier')) return '헤난 프리미어';
        if (n.includes('begrand')) return '비그랜드';
        if (n.includes('mithi')) return '미티 리조트';
        if (n.includes('bathala')) return '바탈라 리조트';
        if (n.includes('amihan')) return '아미한 리조트';
        if (n.includes('modala')) return '모달라 리조트';
        if (n.includes('tamarind')) return '타마린드';
        if (n.includes('alonanorthland')) return '알로나 노스랜드';
        if (n.includes('luxuhotel')) return '럭슈 호텔';
        if (n.includes('danbi')) return '단비 리조트';
        if (n.includes('southpalm')) return '사우스팜';
        if (n.includes('jollibee') || n.includes('jollibee')) return '졸리비';
        if (n.includes('bbc')) return 'BBC';
        if (n === 'bs' || n.includes('bsresort')) return 'BS리조트';
        if (n.includes('adela')) return '아델라 리조트';
        if (n.includes('fruitbasket')) return '과일바구니';
        return name; 
    }

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

    function getDateStr(offsetDays = 0) {
        const d = new Date(); d.setHours(d.getHours() + 9); 
        if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);
        return d.toISOString().split('T')[0];
    }

    window.showInputArea = (type) => {
        window.hideInputArea();
        const el = document.getElementById(`input-area-${type}`);
        if (el) { el.style.display = 'block'; el.scrollIntoView({ behavior: 'smooth' }); }
        else if (type === 'quote') window.open('admin-quote-maker.html', '_blank');
    };

    window.hideInputArea = () => { ['quick', 'reg', 'quote'].forEach(id => { const el = document.getElementById(`input-area-${id}`); if(el) el.style.display = 'none'; }); };

    function showAdminPanel() {
        if (!loginContainer || !adminContainer) return;
        loginContainer.style.display = 'none'; adminContainer.style.display = 'flex'; fetchData();
    }

    if (sessionStorage.getItem('isAdminLoggedIn') === 'true') showAdminPanel();

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            const id = document.getElementById('username').value.trim();
            const pw = document.getElementById('password').value.trim();
            const admins = { 'admin': 'sean1234!', 'sean': 'sean1', 'storm': 'storm1', 'mini': 'mini1', 'david': 'david1' };
            if (admins[id] === pw) { sessionStorage.setItem('isAdminLoggedIn', 'true'); sessionStorage.setItem('adminId', id); showAdminPanel(); }
            else alert('로그인 실패');
        };
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.onclick = () => { sessionStorage.removeItem('isAdminLoggedIn'); location.reload(); };

    function fetchData() {
        if (!db) return;
        onSnapshot(query(collection(db, "reservations"), orderBy("createdAt", "desc")), (snap) => {
            allReservations = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderAll();
        });
        onSnapshot(query(collection(db, "schedules"), orderBy("date", "asc")), (snap) => {
            allSchedules = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderAll();
        });
    }

    function renderAll() { updateSummaryCounts(); renderDateBoxes(); renderSchedule(); renderTable(); }

    function updateSummaryCounts() {
        const counts = {
            new: allReservations.filter(r => ['입금대기', '예약접수', '견적발송', '입금확인요청'].includes(r.status)).length,
            confirmed: allReservations.filter(r => r.status === '예약확정').length,
            resorts: allReservations.filter(r => r.status === '견적').length,
            resortConfirmed: allReservations.filter(r => r.status === '리조트확정').length
        };
        ['count-new', 'count-confirmed', 'count-resorts', 'count-resort-confirmed'].forEach((id, i) => {
            const el = document.getElementById(id); if(el) el.innerText = Object.values(counts)[i];
        });
    }

    function renderDateBoxes() {
        if (document.getElementById('box-date-today')) document.getElementById('box-date-today').innerText = getDateStr(0);
        if (document.getElementById('box-date-tomorrow')) document.getElementById('box-date-tomorrow').innerText = getDateStr(1);
    }

    function getCategory(name, details = '') {
        const combined = ((name || '') + ' ' + (details || '')).toLowerCase();
        if (combined.includes('픽업') || combined.includes('샌딩') || combined.includes('drop')) return '픽업샌딩';
        if (combined.includes('나팔링')) return '나팔링';
        if (combined.includes('호핑') || combined.includes('파밀라칸')) return '호핑투어';
        if (combined.includes('데이투어') || combined.includes('육상')) return '육상투어';
        if (combined.includes('마사지') || combined.includes('스파') || combined.includes('수린') || combined.includes('스톤')) return '마사지';
        return '액티비티';
    }

    window.filterSchedule = (category) => {
        currentScheduleFilter = category;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            const btnText = btn.innerText.trim();
            btn.classList.toggle('active', (category === 'all' && btnText === '전체') || btnText === category);
        });
        renderSchedule();
    };

    window.switchScheduleDay = (day) => { 
        currentScheduleDay = day; 
        document.getElementById('tool-box-today')?.classList.toggle('active', day === 'today');
        document.getElementById('tool-box-tomorrow')?.classList.toggle('active', day === 'tomorrow');
        renderSchedule(); 
    };

    function renderSchedule() {
        const container = document.getElementById('active-timeline');
        if (!container) return;
        const targetDate = (currentScheduleDay === 'tomorrow') ? getDateStr(1) : getDateStr(0);
        if (document.getElementById('schedule-title-date')) document.getElementById('schedule-title-date').innerText = targetDate;

        let rawItems = [];
        allSchedules.forEach(s => { 
            if (s.date === targetDate) {
                const lines = (s.details || '').split('\n').filter(l => l.trim() !== '');
                (lines.length > 0 ? lines : ['']).forEach(line => {
                    const mCount = line.match(/\d+(?=명|인|태반|성장|스톤|오일|포쉘|진주)/g);
                    let displayPax = s.count; if (mCount) displayPax = mCount.reduce((a, b) => a + parseInt(b), 0);
                    rawItems.push({ 
                        time: s.time || "09:00", name: translateTourName(s.name), customer: s.customerName || "고객", count: displayPax, 
                        status: '스케줄', id: s.id, source: 'schedule', resort: translateResort(s.resort || "-"), 
                        flight: s.flight || "-", details: line || s.name
                    }); 
                });
            }
        });

        let filteredItems = (currentScheduleFilter !== 'all') ? rawItems.filter(item => getCategory(item.name, item.details) === currentScheduleFilter) : rawItems;
        const groups = {};
        filteredItems.forEach(item => {
            const cat = getCategory(item.name, item.details);
            let groupTitle = item.name;
            if (cat === '픽업샌딩') groupTitle = (item.flight !== '-' && item.flight) ? item.flight : '공항 픽업/샌딩';
            else if (['호핑투어', '육상투어', '나팔링'].includes(cat)) groupTitle = cat;
            else if (cat === '마사지') groupTitle = item.name.replace(/마사지샵|마사지|스파|스톤|\(|\)/gi, '').trim() || '마사지';
            const key = `${cat}_${groupTitle}_${item.time}`;
            if (!groups[key]) groups[key] = { title: groupTitle, time: item.time, items: [], totalCount: 0, category: cat };
            groups[key].items.push(item); groups[key].totalCount += item.count;
        });

        const sortedKeys = Object.keys(groups).sort((a, b) => groups[a].time.localeCompare(groups[b].time));
        if (sortedKeys.length === 0) { container.innerHTML = `<div style="text-align:center; padding:30px; color:#999;">일정이 없습니다.</div>`; return; }

        container.innerHTML = sortedKeys.map(key => {
            const group = groups[key];
            let icon = "event_available", catClass = "cat-activity";
            if (group.category === '픽업샌딩') { icon = "local_airport"; catClass = "cat-pickup"; }
            else if (group.category === '호핑투어') { icon = "sailing"; catClass = "cat-hopping"; }
            else if (group.category === '나팔링') { icon = "waves"; catClass = "cat-napaling"; }
            else if (group.category === '마사지') { icon = "spa"; catClass = "cat-activity"; }

            const bodyHtml = group.items.map(it => `
                <div class="sc-detail-row" onclick="showDetail('${it.id}', '${it.source}')">
                    <div><span class="sc-detail-name">${it.customer}</span><span class="sc-detail-resort">${it.resort}</span></div>
                    <span class="sc-detail-pax">${it.count}인</span>
                </div>`).join('');

            return `<div class="schedule-group-card">
                <div class="sg-header"><div class="sg-time">${group.time}</div>
                <div class="sg-title-row"><span class="material-icons">${icon}</span><span class="sg-title">${group.title} (${group.totalCount}명)</span></div>
                <span class="sc-category-tag ${catClass}">${group.category}</span></div><div class="sg-body">${bodyHtml}</div></div>`;
        }).join('');
    }

    window.switchAdminTab = (tab) => {
        activeTab = tab;
        document.querySelectorAll('.ss-nav-item').forEach(el => el.classList.remove('active'));
        if (tab === 'system') document.getElementById('system-setup-section').style.display = 'block';
        else { document.getElementById('system-setup-section').style.display = 'none'; renderTable(); }
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

    window.handleClearSchedules = async () => {
        if (!confirm("정말로 모든 스케줄을 삭제하시겠습니까?")) return;
        try {
            const q = query(collection(db, "schedules"));
            const snap = await getDocs(q);
            const batch = writeBatch(db);
            snap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
            alert("삭제 완료"); renderSchedule();
        } catch (e) { alert("실패"); }
    };

    window.registerBulkSchedule = async () => {
        const inputArea = document.getElementById('schedule-reg-input');
        const input = inputArea.value.trim(); if (!input) return;
        const rows = parseRobustTSV(input); const batch = writeBatch(db); let count = 0; const currentYear = 2026;
        for (const row of rows) {
            if (row.length < 11) continue;
            const customerName = (row[9] || '').trim().toUpperCase() + " (" + (row[14] || '').trim().replace(/\n/g, ', ') + ")";
            const resortRaw = (row[8] || '').trim();
            const totalPax = (parseInt(row[10]) || 0) + (parseInt(row[11]) || 0) + (parseInt(row[12]) || 0) || 1;
            const formatDate = (raw) => { if (!raw || !raw.includes('/')) return null; const parts = raw.split('/'); return `${currentYear}-${parts[0].trim().padStart(2, '0')}-${parts[1].trim().replace(/[^0-9]/g, '').padStart(2, '0')}`; };

            if (formatDate(row[0]) && row[2] && row[2] !== '-') { batch.set(doc(collection(db, "schedules")), { date: formatDate(row[0]), time: "전날 재안내", name: "공항 픽업", customerName, count: totalPax, flight: row[2].trim().toUpperCase(), resort: translateResort(resortRaw), createdAt: new Date() }); count++; }
            if (formatDate(row[1]) && row[3] && row[3] !== '-') { batch.set(doc(collection(db, "schedules")), { date: formatDate(row[1]), time: "전날 재안내", name: "공항 샌딩", customerName, count: totalPax, flight: row[3].trim().toUpperCase(), resort: translateResort(resortRaw), createdAt: new Date() }); count++; }

            const remarks = (row[15] || row[16] || '').trim();
            if (remarks) {
                remarks.split('\n').forEach(line => {
                    const dm = line.match(/(\d{1,2})\/(\d{1,2})/); if (!dm) return;
                    const tm = line.match(/(\d{1,2}):(\d{2})/);
                    let itemTime = tm ? `${tm[1].padStart(2,'0')}:${tm[2]}` : "09:00";
                    let itemResort = resortRaw;
                    const resortOverride = line.match(/-\s*([A-Z\d\.\s]{2,})$/i);
                    if (resortOverride && !line.toLowerCase().includes('get')) itemResort = resortOverride[1].trim();
                    const itName = translateTourName(line.replace(dm[0], '').replace(tm?.[0] || '', '').replace(resortOverride?.[0] || '', '').trim());
                    batch.set(doc(collection(db, "schedules")), { date: `${currentYear}-${dm[1].padStart(2,'0')}-${dm[2].padStart(2,'0')}`, time: itemTime, name: itName, customerName, count: totalPax, resort: translateResort(itemResort), details: line.trim(), createdAt: new Date() }); count++;
                });
            }
        }
        await batch.commit(); alert(`${count}건 등록됨`); inputArea.value = ''; renderSchedule();
    };

    window.makeQuickVoucher = async () => {
        const inputArea = document.getElementById('quick-voucher-input');
        const inputVal = inputArea.value.trim(); if (!inputVal) return;
        const rows = parseRobustTSV(inputVal); const currentYear = 2026;
        let combinedKorNames = [], allItems = [], firstContact = '', firstResort = '', firstEx = '', totalAdults = 0, totalChildren = 0, totalInfants = 0;
        rows.forEach(row => {
            if (row.length < 15) return;
            combinedKorNames.push(`${row[9].toUpperCase()} (${row[14].replace(/\n/g, ', ')})`);
            totalAdults += (parseInt(row[10]) || 0); totalChildren += (parseInt(row[11]) || 0); totalInfants += (parseInt(row[12]) || 0);
            const totalPax = (parseInt(row[10]) || 0) + (parseInt(row[11]) || 0) + (parseInt(row[12]) || 0);
            if (!firstContact) firstContact = row[13];
            if (!firstResort) firstResort = translateResort(row[8]);
            const formatDate = (raw) => { if (!raw || !raw.includes('/')) return null; const parts = raw.split('/'); return `${currentYear}-${parts[0].trim().padStart(2,'0')}-${parts[1].trim().padStart(2,'0')}`; };

            if (row[2] && row[2] !== '-') allItems.push({ name: "공항 픽업", date: formatDate(row[0]), time: "전날 재안내", count: totalPax });
            if (row[3] && row[3] !== '-') allItems.push({ name: "공항 샌딩", date: formatDate(row[1]), time: "전날 재안내", count: totalPax });

            const remarkRaw = (row[15] || row[16] || '').trim();
            if (remarkRaw) {
                remarkRaw.split('\n').forEach(line => {
                    const dm = line.match(/(\d{1,2})\/(\d{1,2})/); if (!dm) return;
                    const tm = line.match(/(\d{1,2}):(\d{2})/);
                    let itemTime = tm ? `${tm[1].padStart(2,'0')}:${tm[2]}` : "09:00";
                    let itemResort = null;
                    const resortOverride = line.match(/-\s*([A-Z\d\.\s]{2,})$/i);
                    if (resortOverride && !line.toLowerCase().includes('get')) itemResort = translateResort(resortOverride[1].trim());
                    const getMatch = line.match(/get:\s*(\d+[a-z]*)/i);
                    if (getMatch) firstEx = `₱ ${getMatch[1].toUpperCase()}`;
                    let itName = translateTourName(line.replace(dm[0], '').replace(tm?.[0] || '', '').replace(resortOverride?.[0] || '', '').trim());
                    if (getMatch) itName += ` (현지불: ${getMatch[1].toUpperCase()})`;
                    allItems.push({ name: itName, date: `${currentYear}-${dm[1].padStart(2,'0')}-${dm[2].padStart(2,'0')}`, time: itemTime, count: totalPax, meetingPlace: itemResort });
                });
            }
        });
        const resData = { customerKorName: combinedKorNames.join(', '), contact: firstContact, items: allItems, status: '예약확정', exchangeAmount: firstEx || '전액 결제 완료', paxInfo: `성인 ${totalAdults}, 아동 ${totalChildren}, 유아 ${totalInfants}`.replace(/, 아동 0, 유아 0/, '').replace(/, 유아 0/, ''), pickupResort: firstResort, createdAt: new Date() };
        const docRef = await addDoc(collection(db, "quick_vouchers"), resData);
        inputArea.value = ''; window.open(`bohol-voucher.html?id=${docRef.id}`, '_blank');
    };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
