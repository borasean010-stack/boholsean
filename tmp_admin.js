// admin.js - Final Full Luxury Admin (STRICT ORDER & KOREAN RESORTS)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, where, getDocs, addDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDkDjmGKQDF-0Vu2S_qtI6W5Hf2-j4tKcM",
    authDomain: "boracaysean-69b4a.firebaseapp.com",
    projectId: "boracaysean-69b4a",
    storageBucket: "boracaysean-69b4a.firebasestorage.app",
    messagingSenderId: "806585874771",
    appId: "1:806585874771:web:64a094d241730ca38109a6"
};

let db = null;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) { console.error("Firebase Init Error", e); }

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('admin-table-body');
    const loginContainer = document.getElementById('login-container');
    const adminContainer = document.getElementById('admin-container');

    let allReservations = [];
    let allSchedules = [];
    let activeTab = 'new'; 
    let currentScheduleFilter = 'all';
    let currentScheduleDay = 'today'; 

    // 🚀 리조트 번역기 (한글 우선)
    function translateResort(name) {
        if (!name || name === '-') return '-';
        const n = name.toLowerCase().replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '');
        if (n.includes('hgarden') || n.includes('henanngarden')) return '헤난 가든';
        if (n.includes('asya')) return '아샤';
        if (n.includes('lagoon')) return '헤난 라군';
        if (n.includes('prime')) return '헤난 프라임';
        if (n.includes('palm')) return '헤난 팜비치';
        if (n.includes('park')) return '헤난 파크';
        if (n.includes('crystal') || n.includes('sands')) return '헤난 크리스탈';
        if (n.includes('regency')) return '헤난 리젠시';
        if (n.includes('crimson')) return '크림슨';
        if (n.includes('savoy')) return '사보이';
        if (n.includes('belmont')) return '벨몬트';
        if (n.includes('hue')) return '휴 리조트';
        if (n.includes('fairway')) return '페어웨이';
        if (n.includes('discovery')) return '디스커버리';
        if (n.includes('movenpick')) return '모벤픽';
        if (n.includes('shangri')) return '샹그릴라';
        if (n.includes('astoria')) return '아스토리아';
        if (n.includes('mandarin') || n.includes('mbay') || n.includes('m,bay') || n === 'mbay' || n === 'm bay') return '만다린 베이';
        if (n.includes('lind')) return '더 린드';
        if (n.includes('feliz')) return '펠리즈';
        if (n.includes('coast')) return '코스트';
        if (n.includes('gray')) return '세븐스톤';
        if (n.includes('henann')) return '헤난';
        if (n.includes('aqua')) return '아쿠아';
        if (n.includes('canyon')) return '캐년';
        if (n.includes('lacarmela')) return '라카멜라';
        return name; 
    }

    function showAdminPanel() {
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
            const admins = { 
                'admin': 'sean1234!', 'luca': 'luca1', 'zohan': 'zohan1', 'windy': 'windy1', 'sean': 'sean1',
                'kelly': 'kelly1', 'leo': 'leo1', 'anna': 'anna1', 'pablo': 'pablo1', 'josh': 'josh1', 'kay': 'kay1', 'tina': 'tina1'
            };
            if (admins[id] && admins[id] === pw) {
                sessionStorage.setItem('isAdminLoggedIn', 'true');
                sessionStorage.setItem('adminId', id);
                showAdminPanel();
            } else { alert('아이디 또는 비밀번호가 올바르지 않습니다.'); }
        };
    }

    document.getElementById('logout-btn').onclick = () => { sessionStorage.removeItem('isAdminLoggedIn'); location.reload(); };

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
        if (combined.includes('픽업') || combined.includes('샌딩')) return '픽업/샌딩';
        if (combined.includes('hopping') || combined.includes('호핑')) return '호핑투어';
        if (combined.includes('land') || combined.includes('랜드')) return '랜드투어';
        if (combined.includes('malum') || combined.includes('말룸')) return '시크릿가든 말룸파티';
        return '액티비티';
    }

    function renderSchedule() {
        const container = document.getElementById('active-timeline');
        if (!container) return;
        
        // 🌏 필리핀 시간(UTC+8) 기준으로 오늘/내일 날짜 계산
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const krTime = new Date(utc + (9 * 3600000)); // 한국/필리핀 시간 (거의 동일)
        
        const todayStr = krTime.toISOString().split('T')[0];
        const tomorrow = new Date(krTime.getTime() + 86400000);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        const targetDate = (currentScheduleDay === 'tomorrow') ? tomorrowStr : todayStr;
        const titleDateEl = document.getElementById('schedule-title-date');
        if (titleDateEl) titleDateEl.innerText = targetDate;

        let rawItems = [];
        allSchedules.forEach(s => { 
            if (s.date === targetDate) {
                const lines = (s.details || '').split('\n').filter(l => l.trim() !== '');
                const displayLines = lines.length > 0 ? lines : [''];
                displayLines.forEach(line => {
                    const mCount = line.match(/\d+(?=명|인|태반|성장|스톤|오일|포쉘|진주)/g);
                    let displayPax = s.count;
                    if (mCount) displayPax = mCount.reduce((a, b) => a + parseInt(b), 0);

                    rawItems.push({ 
                        time: s.time || "09:00", 
                        name: s.name, 
                        customer: s.customerName || "고객", 
                        count: displayPax, 
                        status: '스케줄', id: s.id, source: 'schedule', 
                        resort: translateResort(s.resort || "-"), 
                        flight: s.flight || "-",
                        details: line || s.name
                    }); 
                });
            }
        });

        // 필터링 적용
        let filteredItems = rawItems;
        if (currentScheduleFilter !== 'all') {
            filteredItems = rawItems.filter(i => getCategory(i.name, i.details) === currentScheduleFilter);
        }
        
        const groups = {};
        filteredItems.forEach(item => {
            const cat = getCategory(item.name, item.details);
            let groupTitle = item.name;
            if (cat === '픽업/샌딩') {
                groupTitle = (item.flight !== '-' && item.flight) ? item.flight : '기타 항공편';
            } else if (cat === '호핑투어' || cat === '시크릿가든 말룸파티' || cat === '랜드투어') {
                groupTitle = cat;
            } else if (item.name.toLowerCase().includes('마사지') || item.name.toLowerCase().includes('스파')) {
                groupTitle = item.name.replace(/마사지|스파|\(|\)/g, '').trim() || '마사지';
            }
            const key = `${cat}_${groupTitle}_${item.time}`;
            if (!groups[key]) {
                groups[key] = { title: groupTitle, time: item.time, items: [], totalCount: 0, category: cat };
            }
            groups[key].items.push(item);
            groups[key].totalCount += item.count;
        });

        const sortedGroupKeys = Object.keys(groups).sort((a, b) => groups[a].time.localeCompare(groups[b].time));
        if (sortedGroupKeys.length === 0) { 
            container.innerHTML = `<div class="sc-empty" style="width:100%; text-align:center; padding:30px; color:#999; font-size:12px;">일정이 없습니다. (${targetDate})</div>`; 
            return; 
        }

        container.innerHTML = sortedGroupKeys.map(key => {
            const group = groups[key];
            let icon = "event_available", catClass = "cat-activity", catLabel = group.category;
            if (group.category === '픽업/샌딩') { icon = "local_airport"; catClass = "cat-pickup"; catLabel = "픽업/샌딩"; }
            else if (group.category === '호핑투어') { icon = "sailing"; catClass = "cat-hopping"; catLabel = "호핑투어"; }
            else if (group.category === '시크릿가든 말룸파티') { icon = "nature_people"; catClass = "cat-malum"; catLabel = "시크릿가든 말룸파티"; }
            else if (group.category === '랜드투어') { icon = "directions_car"; catClass = "cat-activity"; catLabel = "랜드투어"; }
            
            const isSpa = group.items.some(it => it.name.toLowerCase().includes('마사지') || it.name.toLowerCase().includes('스파'));
            if (isSpa) icon = "spa";

            let headerTitle = `${group.title} (${group.totalCount}명)`;

            let bodyHtml = "";
            if (group.category === '호핑투어') {
                const withJumbo = group.items.filter(it => it.details.includes('점보') || it.details.toLowerCase().includes('(j)'));
                const withoutJumbo = group.items.filter(it => !it.details.includes('점보') && !it.details.toLowerCase().includes('(j)'));
                if (withJumbo.length > 0) {
                    const count = withJumbo.reduce((acc, i) => acc + i.count, 0);
                    bodyHtml += `<div style="padding:8px 12px; background:#fff5eb; font-weight:bold; font-size:12px; color:#e67e22;">- 점보크랩 런치 포함 (${count}명)</div>`;
                    bodyHtml += withJumbo.map(it => `<div class="sc-detail-row" onclick="showDetail('${it.id}', '${it.source}')"><span class="sc-detail-name">${it.customer}</span><span class="sc-detail-pax">${it.count}인</span></div>`).join('');
                }
                if (withoutJumbo.length > 0) {
                    const count = withoutJumbo.reduce((acc, i) => acc + i.count, 0);
                    bodyHtml += `<div style="padding:8px 12px; background:#f8f9fa; font-weight:bold; font-size:12px; color:#666;">- 점보크랩 런치 불포함 (${count}명)</div>`;
                    bodyHtml += withoutJumbo.map(it => `<div class="sc-detail-row" onclick="showDetail('${it.id}', '${it.source}')"><span class="sc-detail-name">${it.customer}</span><span class="sc-detail-pax">${it.count}인</span></div>`).join('');
                }
            } else if (isSpa) {
                bodyHtml += group.items.map(it => {
                    return `<div class="sc-detail-row" onclick="showDetail('${it.id}', '${it.source}')"><span class="sc-detail-name">${it.customer}</span><span class="sc-detail-pax">${it.count}인</span><span class="sc-detail-resort">${it.resort}</span></div>`;
                }).join('');
            } else if (group.category === '픽업/샌딩') {
                bodyHtml = group.items.map(it => {
                    const flightInfo = (it.flight && it.flight !== '-') ? `[${it.flight}] ` : "";
                    return `<div class="sc-detail-row" onclick="showDetail('${it.id}', '${it.source}')"><span class="sc-detail-name">${it.customer}</span><span class="sc-detail-pax">${it.count}인</span><span class="sc-detail-resort">${flightInfo}${it.resort}</span></div>`;
                }).join('');
            } else if (group.category === '액티비티' || group.category === '랜드투어') {
                bodyHtml = group.items.map(it => {
                    const prefix = group.category === '액티비티' ? `[${it.name}] ` : "";
                    return `<div class="sc-detail-row" onclick="showDetail('${it.id}', '${it.source}')"><span class="sc-detail-name">${it.customer}</span><span class="sc-detail-pax">${it.count}인</span><span class="sc-detail-resort">${prefix}${it.resort}</span></div>`;
                }).join('');
            } else {
                bodyHtml = group.items.map(it => {
                    return `<div class="sc-detail-row" onclick="showDetail('${it.id}', '${it.source}')"><span class="sc-detail-name">${it.customer}</span><span class="sc-detail-pax">${it.count}인</span></div>`;
                }).join('');
            }

            return `<div class="schedule-group-card">
                <div class="sg-header">
                    <div class="sg-time">${group.time}</div>
                    <div class="sg-title-row">
                        <span class="material-icons">${icon}</span>
                        <span class="sg-title">${headerTitle}</span>
                    </div>
                    <span class="sc-category-tag ${catClass}">${catLabel}</span>
                </div>
                <div class="sg-body">${bodyHtml}</div>
            </div>`;
        }).join('');
    }

    window.switchMainView = () => {
        document.querySelectorAll('.ss-nav-item').forEach(el => el.classList.remove('active'));
        const firstNav = document.querySelector('.ss-nav-item:first-child');
        if (firstNav) firstNav.classList.add('active');
        document.getElementById('breadcrumb-active').innerText = '메인 페이지';
        activeTab = 'new'; 
        document.getElementById('system-setup-section').style.display = 'none';
        document.getElementById('data-view-section').style.display = 'block';
        renderTable();
    };

    window.switchAdminTab = (tab) => {
        activeTab = tab;
        document.querySelectorAll('.ss-nav-item').forEach(el => el.classList.remove('active'));
        if (tab === 'new') document.getElementById('nav-new-quotes')?.classList.add('active');
        document.querySelectorAll('.stat-card').forEach(el => el.classList.remove('active'));
        const statCard = document.getElementById(`stat-${tab}`);
        if (statCard) statCard.classList.add('active');
        const bActive = document.getElementById('breadcrumb-active');
        const toolGrid = document.querySelector('.main-tool-grid');
        const timelineSec = document.querySelector('.timeline-section');
        if (tab === 'system') {
            if (toolGrid) toolGrid.style.display = 'none';
            if (timelineSec) timelineSec.style.display = 'none';
            document.getElementById('system-setup-section').style.display = 'block';
            document.getElementById('data-view-section').style.display = 'block';
            if (bActive) bActive.innerText = '시스템 초기화';
            renderCleanupTable();
        } else {
            if (toolGrid) toolGrid.style.display = 'grid';
            if (timelineSec) timelineSec.style.display = 'block';
            document.getElementById('system-setup-section').style.display = 'none';
            document.getElementById('data-view-section').style.display = 'block';
            if (bActive) { const labels = { 'new': '신규 견적/예약', 'confirmed': '예약확정', 'resorts': '리조트 견적', 'resort-confirmed': '리조트 확정' }; bActive.innerText = labels[tab] || '메인 페이지'; }
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
            let matchesTab = false;
            if (activeTab === 'new') matchesTab = ['입금대기', '예약접수', '견적발송', '입금확인요청', '예약신청완료'].includes(r.status);
            else if (activeTab === 'confirmed') matchesTab = (r.status === '예약확정');
            else if (activeTab === 'resorts') matchesTab = (r.status === '견적');
            else if (activeTab === 'resort-confirmed') matchesTab = (r.status === '리조트확정');
            return name.includes(searchTerm) && matchesTab;
        });

        if (activeTab === 'new') {
            // 신규 탭일 경우 섹션 나누기
            const sections = [
                { title: "🔥 고객 예약 신청 (확인 필요)", status: ['예약신청완료', '입금확인요청'], color: "#ff4b4b" },
                { title: "📩 발송된 견적서 (대기 중)", status: ['견적발송'], color: "#007aff" },
                { title: "⏳ 입금 대기 / 기타 접수", status: ['입금대기', '예약접수'], color: "#666" }
            ];

            sections.forEach(sec => {
                const secData = filtered.filter(r => sec.status.includes(r.status));
                
                // 섹션 헤더 행
                const headTr = document.createElement('tr');
                headTr.innerHTML = `<td colspan="9" style="background:#fcfcfc; padding:15px 20px; text-align:left; font-weight:800; color:${sec.color}; border-left:5px solid ${sec.color}; font-size:14px;">${sec.title} (${secData.length}건)</td>`;
                tableBody.appendChild(headTr);

                if (secData.length === 0) {
                    const emptyTr = document.createElement('tr');
                    emptyTr.innerHTML = `<td colspan="9" style="padding:20px; color:#bbb; font-size:12px; text-align:center;">해당 내역이 없습니다.</td>`;
                    tableBody.appendChild(emptyTr);
                } else {
                    secData.forEach((res, index) => {
                        renderRow(res, filtered.length - index);
                    });
                }
            });
        } else {
            // 다른 탭은 기존 방식대로 출력
            filtered.forEach((res, index) => {
                renderRow(res, filtered.length - index);
            });
        }
    }

    // 행 출력을 위한 공통 함수 분리
    function renderRow(res, displayIndex) {
        const tr = document.createElement('tr');
        const status = res.status || '대기';
        const firstItem = (res.items?.[0]?.name || '-') + (res.items?.length > 1 ? ` 외 ${res.items.length-1}건` : '');
        let actionButtons = `<button class="btn-action-received" style="background:#ff6a00; border-color:#ff6a00;" onclick="showDetail('${res.id}', 'reservation')"><span class="material-icons">visibility</span>상세</button>`;
        
        if (status === '입금확인요청' || status === '예약신청완료') {
            actionButtons = `<button class="btn-action-received" style="background:#00c73c; border-color:#00c73c;" onclick="handleAutoConfirm('${res.id}')"><span class="material-icons">payments</span>입금확인</button>` + actionButtons;
        } else if (status === '예약접수' || status === '입금대기') {
            actionButtons = `<button class="btn-action-received" onclick="handleAutoConfirm('${res.id}')"><span class="material-icons">payments</span>입금확인</button>` + actionButtons;
        } else if (status === '견적발송') {
            actionButtons = `<button class="btn-action-outline" onclick="navigator.clipboard.writeText('${window.location.origin}/quote.html?id=${res.id}').then(()=>alert('링크복사됨'))"><span class="material-icons">link</span>견적링크</button>` + actionButtons;
        }

        if (status === '견적') actionButtons = `<button class="btn-action-received" onclick="handleResortQuoteComplete('${res.id}')"><span class="material-icons">task_alt</span>견적완료</button><button class="btn-action-received" style="background:#00c73c; border-color:#00c73c;" onclick="handleResortConfirm('${res.id}')"><span class="material-icons">check_circle</span>확정</button>` + actionButtons;
        
        const badgeClass = (status === '입금확인요청' || status === '예약신청완료') ? 'badge-yellow' : (status.includes('확정') ? 'badge-green' : 'badge-yellow');
        const displayStatus = (status === '입금확인요청' || status === '예약신청완료') ? '입금확인요망' : status;
        
        tr.innerHTML = `<td><input type="checkbox"></td><td style="color:#bbb;">${displayIndex}</td><td>${res.reservationNumber || '-'}</td><td><div style="font-size:14px; font-weight:800;">${res.customerKorName}</div></td><td>${firstItem}</td><td>₩ ${(res.totalPrice || 0).toLocaleString()}</td><td>${res.createdAt?.toDate ? res.createdAt.toDate().toLocaleDateString() : '-'}</td><td><span class="n-badge ${badgeClass}">${displayStatus}</span></td><td><div style="display:flex; gap:5px;">${actionButtons}</div></td>`;
        tableBody.appendChild(tr);
    }

    window.deleteSingleReservation = async (id) => {
        if (confirm("이 예약을 정말로 삭제하시겠습니까?")) {
            try { await deleteDoc(doc(db, "reservations", id)); alert("삭제되었습니다."); fetchData(); } catch (e) { alert("삭제 실패"); }
        }
    };

    window.handleAutoConfirm = async (id) => {
        if (!confirm("입금 확인 및 예약 확정 처리를 하시겠습니까?")) return;
        try {
            await updateDoc(doc(db, "reservations", id), { status: '예약확정' });
            alert("예약이 확정되었습니다.");
            fetchData();
        } catch (e) { alert("확정 처리 실패"); }
    };

    window.handleResortConfirm = async (id) => {
        if (!confirm("리조트 예약을 확정하시겠습니까?")) return;
        try {
            await updateDoc(doc(db, "reservations", id), { status: '리조트확정' });
            alert("리조트 예약이 확정되었습니다.");
            fetchData();
        } catch (e) { alert("확정 처리 실패"); }
    };

    window.handleResortQuoteComplete = async (id) => {
        try { await deleteDoc(doc(db, "reservations", id)); fetchData(); } catch (e) { console.error("삭제 실패", e); }
    };

    function renderCleanupTable() {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        allReservations.forEach((res, index) => {
            const tr = document.createElement('tr');
            const firstItem = (res.items?.[0]?.name || '-') + (res.items?.length > 1 ? ` 외 ${res.items.length-1}건` : '');
            tr.innerHTML = `<td><input type="checkbox"></td><td style="color:#bbb;">${allReservations.length - index}</td><td>${res.reservationNumber || '-'}</td><td><b>${res.customerKorName}</b></td><td>${firstItem}</td><td>₩ ${(res.totalPrice || 0).toLocaleString()}</td><td>-</td><td>${res.status}</td><td><button class="btn-action-received" style="background:#ff4b4b; border-color:#ff4b4b;" onclick="deleteSingleReservation('${res.id}')"><span class="material-icons">delete</span>단품삭제</button></td>`;
            tableBody.appendChild(tr);
        });
    }

    window.showDetail = (id, source) => {
        const res = source === 'schedule' ? allSchedules.find(s => s.id === id) : allReservations.find(r => r.id === id);
        if (!res) return;
        const modal = document.getElementById('res-detail-modal');
        const body = document.getElementById('modal-body');
        if (!modal || !body) return;
        if (source === 'schedule') {
            body.innerHTML = `<h3>스케줄 상세</h3><div style="background:#f8f9fa; padding:15px; border-radius:10px;"><p><b>고객명:</b> ${res.customerName}</p><p><b>상품명:</b> ${res.name}</p><p><b>날짜:</b> ${res.date}</p><p><b>시간:</b> ${res.time}</p><p><b>인원:</b> ${res.count}명</p></div>`;
            modal.style.display = 'flex'; return;
        }
        const isQuote = res.status === '견적' || res.status === '견적완료';
        const totalVoucherBtn = isQuote ? '' : `<div style="display:grid; grid-template-columns:1fr; margin-bottom:15px;"><button onclick="copyVoucherLink('${res.id}', null)" style="padding:12px; background:#ff6a00; color:white; border:none; border-radius:8px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;"><span class="material-icons" style="font-size:18px;">share</span> 주문 일정</button></div>`;
        const itemsHtml = (res.items || []).map((item, idx) => `
            <div style="padding:15px; background:#f8f9fa; border:1px solid #eee; border-radius:12px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <div style="font-size:16px; font-weight:800; color:#111;">${item.name}</div>
                    <div style="font-size:14px; font-weight:800; color:#ff6a00;">${item.count}인</div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:13px; color:#555;">
                    <div>📅 <b>날짜:</b> ${item.date || '-'}</div>
                    <div>📍 <b>픽업:</b> ${item.pickup || '-'}</div>
                </div>
                ${!isQuote ? `
                <div style="margin-top:12px; display:flex; gap:5px;">
                    <a href="reservation-schedule.html?id=${res.id}&itemIndex=${idx}" target="_blank" style="flex:1; text-align:center; padding:8px; background:#fff; border:1px solid #ddd; border-radius:6px; font-size:11px; text-decoration:none; color:#333; font-weight:700;">바우처</a>
                    <button onclick="copyVoucherLink('${res.id}', ${idx})" style="flex:1; padding:8px; background:#ff6a00; color:white; border:none; border-radius:6px; font-size:11px; cursor:pointer; font-weight:700;">링크복사</button>
                </div>` : ''}
            </div>`).join('');
        const displayEngName = res.engName || '-';
        const displayExchange = res.exchangeAmount || '-';
        const displayPax = res.paxInfo || (res.items?.[0]?.count ? `${res.items[0].count}명` : '-');
        body.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:15px; border-bottom:1px solid #eee;"><h3 style="margin:0;">예약 상세 정보</h3><button onclick="copyGuidance('${res.id}')" style="background:#ff6a00; color:white; border:none; padding:8px 14px; border-radius:6px; font-weight:bold; cursor:pointer;">👉 안내문 복사</button></div><div id="modal-scroll-area" style="max-height: 60vh; overflow-y: auto;"><div style="margin-bottom:20px;">${totalVoucherBtn}${itemsHtml}</div><div style="background:#fcfcfc; padding:15px; border-radius:10px; border:1px solid #f0f0f0; margin-bottom:20px;"><p style="margin:0;">이름 | <b>${res.customerKorName}</b> (${displayEngName})</p><p style="margin:5px 0 0 0;">인원 | <b>${displayPax}</b></p></div>${!isQuote ? `<div style="background:#fff5eb; padding:15px; border-radius:10px; border:1px solid #ffe8cc; margin-bottom:20px;"><div style="font-weight:bold; margin-bottom:10px; color:#ff6a00;">✈️ 항공 및 환전 정보</div><p style="margin:5px 0; font-size:13px;"><b>픽업:</b> ${res.pickupDate || '-'} / ${res.pickupFlight || '-'} / ${res.pickupResort || '-'}</p><p style="margin:5px 0; font-size:13px;"><b>샌딩:</b> ${res.sendingDate || '-'} / ${res.sendingFlight || '-'} / ${res.sendingResort || '-'}</p><p style="margin-top:10px; padding-top:10px; border-top:1px dashed #ffd8a8;"><b>💰 환전:</b> <span style="font-size:15px; color:#e67e22; font-weight:800;">${displayExchange}</span></p></div>` : ''}<div style="padding:10px; background:#f8f9fa; border-radius:6px; font-size:13px; white-space:pre-wrap;"><b>[요청사항]</b>\n${res.requests || '없음'}</div></div><div style="display:flex; gap:10px; margin-top:20px; padding-top:15px; border-top:1px solid #eee;"><button id="edit-btn" onclick="toggleEditMode('${res.id}')" style="flex:1; padding:12px; background:#ff6a00; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">수정하기</button><button onclick="closeModal()" style="flex:1; padding:12px; background:#333; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">창 닫기</button></div>`;
        modal.style.display = 'flex';
    };

    window.copyVoucherLink = (id, idx) => { const url = `${window.location.origin}/reservation-schedule.html?id=${id}${idx !== null ? `&itemIndex=${idx}` : ''}`; navigator.clipboard.writeText(url).then(() => alert('바우처 링크가 복사되었습니다.')); };
    window.copyCombinedVoucherLink = (contact) => { navigator.clipboard.writeText(`${window.location.origin}/reservation-schedule.html?contact=${encodeURIComponent(contact)}`).then(() => alert('통합 일정표 링크 복사 완료!')); };
    window.copyGuidance = (id) => { 
        const res = allReservations.find(r => r.id === id); 
        if (!res) return; 
        
        let msg = `[보라카이션 예약 확정 안내]\n\n대표자: ${res.customerKorName}\n투어내역:\n${res.items.map(i => `- ${i.name} (${i.date} ${i.time || ''}) / ${i.count}명`).join('\n')}`;
        
        // 보라아재 호핑투어 포함 시 전용 안내문 추가
        const hasBoraAjae = res.items.some(i => i.name.includes('보라아재') || i.name.includes('카라바오'));
        if (hasBoraAjae) {
            msg += `\n\n------------------\n🚨📢 8시 (08:00) / 각반 선착장 미팅😊💜\n보라카이가 제주도라면, 카라바오는 우도라고 생각하시면 이해가 편하십니다. 보라카이에서 배를 타고 1시간정도 이동, 카라바오 섬에 도착하여 아재호핑 전용공간으로 안내해드립니다. 해당 장소에서 진행하는 온종일 투어입니다. 아재투어의 전용공간은 보라아재에서 준비한 다양한 액티비티 및 사진 포인트가 많이 있는 매력적인 장소입니다. 넉넉한 시간으로 편안하고 즐거운 시간이 되시길 바랍니다.\n\n✅ 미팅 시간 및 장소\n🔺현지시각 오전 8시 까지 각반 선착장 도착\n** 미팅시간 10분 전 도착 권장. 미팅 시간내 미 도착시 노쇼처리, 환불불가합니다 **\n🔺각반(CAGBAN PORT) 선착장 세븐일레븐 앞 보라아재 피켓 든 직원을 찾아주세요! 👍\n주의!!! 각반선착장 입니다. E-트라이크(툭툭이) 탑승 후 각반 혹은 각반포트 말씀해주시면 됩니다. \n디몰출발을 기준으로 시간은 15분 내외, 비용은 한 대당 150페소~200페소 정도이니 참고해주세요.\n\n✅ 포함 사항\n씨푸드런치, 무제한 음료+맥주+물, 라면간식, 선상 사진촬영, 수중 사진촬영, vip 밀착케어, 스노클 장비 무상 대여(구명조끼, 스노클마스크), 스노클링, 스킨다이빙, 슬라이드, 포토스팟, 줄낚시, 클리프다이빙 등등\n\n✅ 필수 준비물\n래쉬가드, 선크림, 비치타올, 아쿠아슈즈, 불포함 매너팁 인당 200페소(유아 포함)\n\n✅ 안내 및 주의사항\n* 투어 당일 출발시 날씨에 따라 호핑투어 진행 동선 및 장소, 내용 등등이 변경되어 진행될 수 있습니다.\n* 미팅 후 다른 분들과 함께 조인으로 액티비티가 진행됩니다. 서로 피해가 없도록, 약속시간은 꼭 지켜주세요.\n* 고가의 귀중품, 많은 현금, 여권은 필히 리조트에 두고 오세요!\n* 식사 불포함인 36개월 이하의 아이들의 식사는 따로 준비가 되어 있지 않습니다. (흰 쌀밥은 제공)\n* 맥주와 음료를 무제한으로 제공 해드리고 있지만, 테이크 아웃은 엄격히 금하고 있습니다!\n* 수중사진은 서비스 품목으로 현지 사정상 제공 불가일 수 있는 점 양해 부탁드립니다.\n* 지나친 음주로 물놀이가 안전하지 않다 판단되는 경우 제재를 받으실 수도 있습니다.\n\n📌 우천 시 안내\n보라카이는 스콜성 비가 자주 내리는 지역입니다. 비가 내리더라도 별도의 안내가 없는 경우, 호핑투어는 정상적으로 진행됩니다. 😊`;
        }
        
        msg += `\n\n감사합니다.`;
        navigator.clipboard.writeText(msg).then(() => alert('안내문이 복사되었습니다.')); 
    };
    window.showInputArea = (type) => { 
        if (type === 'quote') {
            window.open('admin-quote-maker.html', '_blank');
            return;
        }
        window.hideInputArea(); 
        document.getElementById(`input-area-${type}`).style.display = 'block'; 
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    };
    window.hideInputArea = () => { ['quick', 'reg', 'quote'].forEach(id => { const el = document.getElementById(`input-area-${id}`); if(el) el.style.display = 'none'; }); };
    window.closeModal = () => { document.getElementById('res-detail-modal').style.display = 'none'; };

    window.registerBulkSchedule = async () => {
        const input = document.getElementById('schedule-reg-input').value.trim();
        if (!input) return;
        
        const parseRobustTSV = (text) => {
            const rows = [];
            let currentRow = [];
            let currentField = "";
            let inQuotes = false;
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                if (char === '"') { inQuotes = !inQuotes; }
                else if (char === '\t' && !inQuotes) { currentRow.push(currentField); currentField = ""; }
                else if (char === '\n' && !inQuotes) { currentRow.push(currentField); rows.push(currentRow); currentRow = []; currentField = ""; }
                else { currentField += char; }
            }
            if (currentField || currentRow.length > 0) { currentRow.push(currentField); rows.push(currentRow); }
            return rows;
        };

        try {
            const rows = parseRobustTSV(input);
            const batch = writeBatch(db);
            let count = 0;
            const currentYear = new Date().getFullYear();

            for (const row of rows) {
                if (row.length < 10) continue; // 유효하지 않은 행 스킵

                // 데이터 위치 (제공된 스니펫 기준)
                // 0:픽업일, 1:샌딩일, 2:픽업편, 3:샌딩편, 9:리조트, 10:영문명, 11~13:인원, 15:한글명, 16:비고
                const pickupDateRaw = (row[0] || '').trim();
                const sendingDateRaw = (row[1] || '').trim();
                const pickupFlight = (row[2] || '').trim();
                const sendingFlight = (row[3] || '').trim();
                const resortRaw = (row[9] || '').trim();
                
                const engName = (row[10] || '').trim().toUpperCase();
                const korNameOnly = (row[15] || '').trim();
                const customerName = engName ? `${engName} (${korNameOnly || ''})`.replace(' ()', '') : (korNameOnly || '고객');
                const remarks = (row[16] || '').trim();
                
                const p1 = parseInt(row[11]) || 0;
                const p2 = parseInt(row[12]) || 0;
                const p3 = parseInt(row[13]) || 0;
                const totalPax = p1 + p2 + p3 || 1;

                const formatDate = (raw) => {
                    if (!raw || !raw.includes('/')) return null;
                    const parts = raw.split('/');
                    const m = parts[0].trim().padStart(2, '0');
                    const d = parts[1].trim().replace(/[^0-9]/g, '').padStart(2, '0');
                    return `${currentYear}-${m}-${d}`;
                };

                // 1. 공항 픽업 등록
                const pDate = formatDate(pickupDateRaw);
                if (pDate && pickupFlight && pickupFlight !== '-') {
                    let pTime = "14:00"; // TW125 포함 모든 픽업 기본 14:00
                    const docRef = doc(collection(db, "schedules"));
                    batch.set(docRef, {
                        date: pDate, time: pTime, name: "공항 픽업",
                        customerName: customerName, count: totalPax, flight: pickupFlight,
                        resort: translateResort(resortRaw), details: `픽업편: ${pickupFlight}`,
                        createdAt: new Date()
                    });
                    count++;
                }

                // 2. 공항 샌딩 등록
                const sDate = formatDate(sendingDateRaw);
                if (sDate && sendingFlight && sendingFlight !== '-') {
                    const fl = sendingFlight.toUpperCase().trim();
                    let sTime = "21:00";
                    if (fl === 'TW126') sTime = "08:30";
                    else if (fl.startsWith('TW') || fl.startsWith('5J') || fl.startsWith('Z2') || fl.startsWith('DG') || (fl.startsWith('PR') && !['PR469', 'PR489'].includes(fl))) sTime = "전날 재안내";
                    
                    const docRef = doc(collection(db, "schedules"));
                    batch.set(docRef, {
                        date: sDate, time: sTime, name: "공항 샌딩",
                        customerName: customerName, count: totalPax, flight: sendingFlight,
                        resort: translateResort(resortRaw), details: `샌딩편: ${sendingFlight}`,
                        createdAt: new Date()
                    });
                    count++;
                }

                // 3. 비고란 상세 스케줄 파싱
                if (remarks) {
                    const lines = remarks.split('\n');
                    for (const line of lines) {
                        const dateMatch = line.match(/(\d{1,2})\/(\d{1,2})/);
                        if (!dateMatch) continue;

                        const itemDate = `${currentYear}-${dateMatch[1].padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}`;
                        let itemTime = "09:00";
                        let itemName = "기타 일정";
                        const lowerLine = line.toLowerCase();

                        // 시간 추출
                        const timeMatch = line.match(/(\d{1,2}):(\d{2})/);
                        if (timeMatch) itemTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;

                        // 상품명 및 특이 시간 설정
                        if (lowerLine.includes('land') || lowerLine.includes('랜드')) {
                            itemName = "보라카이 랜드투어";
                            itemTime = "10:30"; // 랜드투어 무조건 10:30
                        }
                        else if (lowerLine.includes('hopping') || lowerLine.includes('호핑')) {
                            if (lowerLine.includes('j') || lowerLine.includes('점보')) itemName = "블랙펄 호핑투어 (+점보크랩 점심)";
                            else itemName = "블랙펄 선셋 호핑투어";
                            if (!timeMatch) itemTime = lowerLine.includes('j') ? "12:30" : "13:30";
                        }
                        else if (lowerLine.includes('malum') || lowerLine.includes('말룸')) {
                            itemName = "시크릿가든 말룸파티";
                            if (!timeMatch) itemTime = "09:40";
                        }
                        else if (lowerLine.includes('luna') || lowerLine.includes('루나')) itemName = "루나스파";
                        else if (lowerLine.includes('bora') || lowerLine.includes('보라')) itemName = "보라스파";
                        else if (lowerLine.includes('sspa') || lowerLine.includes('에스파')) itemName = "에스파(SSPA)";
                        else if (lowerLine.includes('kabayan') || lowerLine.includes('카바얀')) itemName = "카바얀";
                        else if (lowerLine.includes('hilot') || lowerLine.includes('힐롯')) itemName = "힐롯마사지";
                        else if (lowerLine.includes('poseidon') || lowerLine.includes('포세이돈')) itemName = "포세이돈";
                        else if (lowerLine.includes('maris') || lowerLine.includes('마리스')) itemName = "마리스";
                        else if (lowerLine.includes('diving') || lowerLine.includes('다이빙')) itemName = "체험다이빙";
                        else if (lowerLine.includes('golf') || lowerLine.includes('골프')) itemName = "골프";
                        else if (lowerLine.includes('jetski') || lowerLine.includes('zetski') || lowerLine.includes('제트스키')) itemName = "제트스키";
                        else if (lowerLine.includes('helmet') || lowerLine.includes('헬멧')) itemName = "헬멧다이빙";
                        else if (lowerLine.includes('para') || lowerLine.includes('파라')) itemName = "파라세일링";
                        else if (lowerLine.includes('마사지') || lowerLine.includes('스파')) itemName = "마사지";


                        // 세부 인원 (태반4 등)
                        let itemPax = totalPax;
                        const mCount = line.match(/\d+(?=명|인|태반|성장|스톤|오일|포쉘|진주)/g);
                        if (mCount) itemPax = mCount.reduce((a, b) => a + parseInt(b), 0);

                        const docRef = doc(collection(db, "schedules"));
                        batch.set(docRef, {
                            date: itemDate, time: itemTime, name: itemName,
                            customerName: customerName, count: itemPax,
                            resort: translateResort(resortRaw), details: line.trim(),
                            createdAt: new Date()
                        });
                        count++;
                    }
                }
            }

            if (count > 0) {
                await batch.commit();
                alert(`${count}건의 스케줄이 성공적으로 등록되었습니다.`);
                document.getElementById('schedule-reg-input').value = '';
                window.hideInputArea();
                renderSchedule();
            } else {
                alert("등록 가능한 데이터를 찾지 못했습니다. 형식을 확인해주세요.");
            }
        } catch (e) {
            console.error("Bulk Register Error:", e);
            alert("등록 중 오류가 발생했습니다.");
        }
    };

    window.handleClearSchedules = async () => {
        if (!confirm("현재 등록된 모든 일정(스케줄)만 삭제하시겠습니까?\n(예약 내역이나 바우처는 삭제되지 않습니다.)")) return;
        try {
            if (!db) { alert("데이터베이스 연결 오류"); return; }
            const snap = await getDocs(collection(db, "schedules"));
            if (snap.empty) { alert("삭제할 일정이 없습니다."); return; }
            
            const batch = writeBatch(db);
            snap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
            alert("일정 데이터만 삭제 완료되었습니다.");
        } catch (e) { 
            console.error("Clear Schedules Error:", e);
            alert("삭제 중 오류가 발생했습니다."); 
        }
    };

    window.handleClearAllData = async () => {
        if (!confirm("정말로 모든 데이터를 초기화하시겠습니까? (예약, 바우처, 스케줄 포함)")) return;
        try {
            const colls = ["reservations", "quick_vouchers", "schedules", "resort_quotes"];
            for (const c of colls) {
                const snap = await getDocs(collection(db, c));
                const batch = writeBatch(db);
                snap.docs.forEach(d => batch.delete(d.ref));
                await batch.commit();
            }
            alert("전체 초기화 완료");
            location.reload();
        } catch (e) { alert("초기화 실패"); }
    };

    window.toggleEditMode = (id) => {
        const res = allReservations.find(r => r.id === id); if (!res) return;
        const scrollArea = document.getElementById('modal-scroll-area'); const editBtn = document.getElementById('edit-btn');
        if (editBtn.innerText === '수정하기') {
            editBtn.innerText = '저장하기';
            scrollArea.innerHTML = `<div style="background:#f8f9fa; padding:15px; border-radius:12px;"><label style="font-size:11px; color:#999;">한글명</label><input type="text" id="edit-name" value="${res.customerKorName}" style="width:100%; padding:8px; margin-bottom:10px;"><div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;"><div><label style="font-size:11px; color:#999;">픽업일</label><input type="text" id="edit-p-date" value="${res.pickupDate || ''}" style="width:100%; padding:8px;"></div><div><label style="font-size:11px; color:#999;">픽업리조트</label><input type="text" id="edit-p-resort" value="${res.pickupResort || ''}" style="width:100%; padding:8px;"></div></div><div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;"><div><label style="font-size:11px; color:#999;">샌딩일</label><input type="text" id="edit-s-date" value="${res.sendingDate || ''}" style="width:100%; padding:8px;"></div><div><label style="font-size:11px; color:#999;">샌딩리조트</label><input type="text" id="edit-s-resort" value="${res.sendingResort || ''}" style="width:100%; padding:8px;"></div></div><label style="font-size:11px; color:#999; margin-top:10px; display:block;">총 금액</label><input type="number" id="edit-price" value="${res.totalPrice}" style="width:100%; padding:8px; margin-bottom:10px;"><label style="font-size:11px; color:#999;">요청사항</label><textarea id="edit-requests" style="width:100%; height:80px; padding:8px;">${res.requests || ''}</textarea></div>`;
        } else {
            const newData = { customerKorName: document.getElementById('edit-name').value, pickupDate: document.getElementById('edit-p-date').value, pickupResort: document.getElementById('edit-p-resort').value, sendingDate: document.getElementById('edit-s-date').value, sendingResort: document.getElementById('edit-s-resort').value, totalPrice: parseInt(document.getElementById('edit-price').value) || 0, requests: document.getElementById('edit-requests').value };
            updateDoc(doc(db, "reservations", id), newData).then(() => { alert("저장 완료!"); closeModal(); });
        }
    };

    window.makeQuickVoucher = async () => {
        const inputVal = document.getElementById('quick-voucher-input').value.trim(); if (!inputVal) return;
        
        const parseRobustTSV = (text) => {
            const rows = [];
            let currentRow = [];
            let currentField = "";
            let inQuotes = false;
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                if (char === '"') { inQuotes = !inQuotes; }
                else if (char === '\t' && !inQuotes) { currentRow.push(currentField); currentField = ""; }
                else if (char === '\n' && !inQuotes) { currentRow.push(currentField); rows.push(currentRow); currentRow = []; currentField = ""; }
                else { currentField += char; }
            }
            if (currentField || currentRow.length > 0) { currentRow.push(currentField); rows.push(currentRow); }
            return rows;
        };

        const rows = parseRobustTSV(inputVal);
        const currentYear = new Date().getFullYear();
        
        let combinedKorNames = [];
        let totalAdults = 0, totalChildren = 0, totalInfants = 0;
        let allItems = [];
        let firstResort = '', secondResort = '', firstContact = '', firstExVal = '';
        let firstPickupFlight = '', firstSendingFlight = '';
        let totalExAmount = 0;
        let isExNumeric = true;

        rows.forEach(row => {
            if (row.length < 16) return;
            const p10 = (row[10] || '').trim();
            const p15 = (row[15] || '').trim().replace(/\n/g, ', ');
            const isP10Korean = /[가-힣]/.test(p10);
            let korName = p15; let engName = p10;
            if (isP10Korean && !p10.includes(' ')) { korName = p10; engName = p15.toUpperCase(); }
            else if (p15.includes('맘') || p15.includes('아빠') || p15.includes('네') || p15.length > 5) { if (isP10Korean) { korName = p10; engName = p15.toUpperCase(); } }
            else { engName = p10.toUpperCase(); korName = p15; }
            combinedKorNames.push(engName ? `${engName} (${korName || ''})`.replace(' ()', '') : (korName || '고객'));

            if (!firstPickupFlight) firstPickupFlight = (row[2] || '').trim().toUpperCase();
            if (!firstSendingFlight) firstSendingFlight = (row[3] || '').trim().toUpperCase();

            totalAdults += (parseInt(row[11]) || 0);
            totalChildren += (parseInt(row[12]) || 0);
            totalInfants += (parseInt(row[13]) || 0);

            if (!firstContact) firstContact = (row[14] || '').trim();
            const resortRaw = (row[9] || '').trim();
            const pResort = translateResort(resortRaw.split('/')[0].trim());
            const sResort = translateResort(resortRaw.split('/')[1]?.trim() || pResort);
            if (!firstResort) { firstResort = pResort; secondResort = sResort; }

            let exVal = (row[5] || '').trim();
            if (exVal && !exVal.includes('/') && !exVal.includes('▲') && exVal !== '0') {
                const numericEx = parseInt(exVal.replace(/[^0-9]/g, ''));
                if (!isNaN(numericEx)) totalExAmount += numericEx; else isExNumeric = false;
            } else if (exVal === '0' || !exVal) { } else { isExNumeric = false; }
            if (!firstExVal) firstExVal = exVal;

            const totalPax = (parseInt(row[11]) || 0) + (parseInt(row[12]) || 0) + (parseInt(row[13]) || 0);
            const formatDate = (raw) => { if (!raw || !raw.includes('/')) return null; const [m, d] = raw.split('/').map(v => v.trim().padStart(2,'0')); return `${currentYear}-${m}-${d}`; };
            
            if (row[2] && row[2].match(/[A-Z]{2}\d+/)) { allItems.push({ name: `✈️ 공항 픽업 (${row[2].toUpperCase()})`, date: formatDate(row[0]), time: "14:00", count: totalPax }); }
            if (row[3] && row[3].match(/[A-Z]{2}\d+/)) { 
                const fl = row[3].toUpperCase().trim();
                let sTime = "21:00";
                if (fl === 'TW126') sTime = "08:30";
                else if (fl.startsWith('TW') || fl.startsWith('5J') || fl.startsWith('Z2') || fl.startsWith('DG') || (fl.startsWith('PR') && !['PR469', 'PR489'].includes(fl))) sTime = "전날 재안내";
                allItems.push({ name: `✈️ 공항 샌딩 (${fl})`, date: formatDate(row[1]), time: sTime, count: totalPax }); 
            }

            const remarkRaw = (row[16] || '').trim();
            remarkRaw.split('\n').forEach(line => {
                const dm = line.trim().match(/^(\d{1,2})\/(\d{1,2})/);
                if (dm) {
                    const tDate = formatDate(dm[0]);
                    let itemName = line.replace(dm[0], '').trim(); let itemTime = "09:00"; let itemPax = totalPax;
                    const mCount = line.match(/\d+(?=명|인|태반|성장|스톤|오일|포쉘|진주)/g);
                    if ((line.includes('spa') || line.includes('스파')) && mCount) {
                        const sum = mCount.filter(n => parseInt(n) < 15).reduce((a, b) => parseInt(a) + parseInt(b), 0);
                        if (sum > 0) itemPax = sum;
                    }
                    const timeMatch = line.match(/(\d{1,2})\/(\d{1,2})/); // Prevent re-matching dates
                    const actualTimeMatch = line.match(/(\d{1,2}):(\d{2})/); if (actualTimeMatch) itemTime = `${actualTimeMatch[1].padStart(2,'0')}:${actualTimeMatch[2]}`;
                    const lowerLine = line.toLowerCase();
                    
                    if (lowerLine.includes('meeting') || lowerLine.includes('pickup') || lowerLine.includes('픽업')) itemName = '✈️ 공항 픽업';
                    else if (lowerLine.includes('sending') || lowerLine.includes('샌딩')) itemName = '✈️ 공항 샌딩';
                    else if (lowerLine.includes('sspa') || lowerLine.includes('에스파')) itemName = '에스파(S-SPA)';
                    else if (lowerLine.includes('luna') || lowerLine.includes('루나')) itemName = '루나스파';
                    else if (lowerLine.includes('bora') || lowerLine.includes('보라')) itemName = '보라스파';
                    else if (lowerLine.includes('kabayan') || lowerLine.includes('카바얀')) itemName = '카바얀스파';
                    else if (lowerLine.includes('hilot') || lowerLine.includes('힐롯')) itemName = '힐롯마사지';
                    else if (lowerLine.includes('poseidon') || lowerLine.includes('포세이돈')) itemName = '포세이돈 스파';
                    else if (lowerLine.includes('maris') || lowerLine.includes('마리스')) itemName = '마리스 스파';
                    else if (lowerLine.includes('helios') || lowerLine.includes('헬리오스')) itemName = '헬리오스 스파';
                    else if (lowerLine.includes('land') || lowerLine.includes('랜드')) { itemName = '보라카이 랜드투어'; if(!actualTimeMatch) itemTime = "10:30"; }
                    else if (lowerLine.includes('hopping') || lowerLine.includes('호핑')) { 
                        if (lowerLine.includes('보라아재') || lowerLine.includes('카라바오')) { itemName = '보라아재 호핑투어'; if(!actualTimeMatch) itemTime = "08:00"; }
                        else if (lowerLine.includes('(j)') || lowerLine.includes('점보')) { itemName = '블랙펄 호핑투어 (+점보크랩 점심)'; if(!actualTimeMatch) itemTime = "12:30"; } 
                        else { itemName = '블랙펄 선셋 호핑투어'; if(!actualTimeMatch) itemTime = "13:30"; } 
                    }
                    else if (lowerLine.includes('malum') || lowerLine.includes('말룸')) { itemName = '시크릿가든 말룸파티'; if(!actualTimeMatch) itemTime = "09:40"; }
                    else if (lowerLine.includes('jetski') || lowerLine.includes('zetski') || lowerLine.includes('제트스키')) itemName = '제트스키';
                    else if (lowerLine.includes('helmet') || lowerLine.includes('헬멧')) itemName = '헬멧다이빙';
                    else if (lowerLine.includes('para') || lowerLine.includes('파라')) itemName = '파라세일링';
                    else if (lowerLine.includes('diving') || lowerLine.includes('다이빙')) itemName = '체험다이빙';
                    else if (lowerLine.includes('golf') || lowerLine.includes('골프')) itemName = '페어웨이 골프';
                    else if (lowerLine.includes('sub') || lowerLine.includes('잠수함')) itemName = '잠수함';
                    else if (lowerLine.includes('yacht') || lowerLine.includes('요트')) itemName = '프라이빗 요트';
                    else if (lowerLine.includes('sunset') || lowerLine.includes('선셋')) itemName = '선셋 세일링';
                    
                    if (line.includes('afh') || line.includes('AFH')) itemTime = "18:00";
                    else if (line.includes('afm') || line.includes('AFM')) itemTime = "17:00";
                    allItems.push({ name: itemName, date: tDate, time: itemTime, count: itemPax, details: line });
                }
            });
        });

        if (combinedKorNames.length === 0) return;
        const mergedItemsMap = {};
        allItems.forEach(it => {
            const key = `${it.name}_${it.date}_${it.time}`;
            if (!mergedItemsMap[key]) { mergedItemsMap[key] = { ...it }; }
            else { mergedItemsMap[key].count += it.count; }
        });
        const finalExAmount = (isExNumeric && totalExAmount > 0) ? totalExAmount.toString() : firstExVal;
        const resData = { 
            customerKorName: combinedKorNames.join(', '), 
            contact: firstContact, 
            items: Object.values(mergedItemsMap), 
            status: '예약확정', 
            exchangeAmount: finalExAmount || '-', 
            paxInfo: `성인 ${totalAdults}, 아동 ${totalChildren}, 유아 ${totalInfants}`, 
            pickupResort: firstResort, 
            sendingResort: secondResort, 
            pickupFlight: firstPickupFlight,
            sendingFlight: firstSendingFlight,
            createdAt: new Date() 
        };
        const docRef = await addDoc(collection(db, "quick_vouchers"), resData);
        navigator.clipboard.writeText(`${window.location.origin}/reservation-schedule.html?id=${docRef.id}&type=quick`).then(() => {
            alert('통합 바우처 생성 완료!');
            document.getElementById('quick-voucher-input').value = ''; 
            window.hideInputArea();
        });
    };

    window.openSchedulePopup = (mode) => {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const krTime = new Date(utc + (9 * 3600000));
        const todayStr = krTime.toISOString().split('T')[0];
        const tomorrow = new Date(krTime.getTime() + 86400000);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const targetDate = (currentScheduleDay === 'tomorrow') ? tomorrowStr : todayStr;

        let rawItems = [];
        allSchedules.forEach(s => {
            if (s.date === targetDate) {
                const lines = (s.details || '').split('\n').filter(l => l.trim() !== '');
                const displayLines = lines.length > 0 ? lines : [''];
                displayLines.forEach(line => {
                    const mCount = line.match(/\d+(?=명|인|태반|성장|스톤|오일|포쉘|진주)/g);
                    let displayPax = s.count;
                    if (mCount) displayPax = mCount.reduce((a, b) => a + parseInt(b), 0);
                    rawItems.push({
                        time: s.time || "09:00",
                        name: s.name,
                        customer: s.customerName || "고객",
                        count: displayPax,
                        resort: translateResort(s.resort || "-"),
                        flight: s.flight || "-",
                        details: line || s.name
                    });
                });
            }
        });

        let filtered = [];
        if (mode === 'pickup') {
            filtered = rawItems.filter(i => getCategory(i.name, i.details) === '픽업/샌딩');
        } else {
            filtered = rawItems.filter(i => getCategory(i.name, i.details) !== '픽업/샌딩');
        }

        // 시간순 정렬 + 같은 시간일 경우 리조트순 정렬
        filtered.sort((a, b) => {
            const timeCompare = a.time.localeCompare(b.time);
            if (timeCompare !== 0) return timeCompare;
            return a.resort.localeCompare(b.resort);
        });

        if (filtered.length === 0) { alert('해당 항목이 없습니다.'); return; }

        const popup = window.open('', '_blank', 'width=1000,height=800');
        const title = mode === 'pickup' ? `✈️ 픽업샌딩 명단 (${targetDate})` : `🏖️ 액티비티 명단 (${targetDate})`;
        
        let html = `<html><head><title>${title}</title><style>
            body { font-family: 'Pretendard', sans-serif; padding: 30px; }
            h1 { font-size: 22px; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px 10px; text-align: left; font-size: 13px; }
            th { background: #f8f9fa; font-weight: 800; }
            tr:nth-child(even) { background: #fafafa; }
            .pax { font-weight: 800; color: #ff6a00; }
            .time { font-weight: 900; color: #333; }
            .btn-print { background: #333; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; }
            @media print { .btn-print { display: none; } }
        </style></head><body>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h1>${title}</h1>
                <button class="btn-print" onclick="window.print()">인쇄하기</button>
            </div>
            <table>
                <thead><tr><th>시간</th><th>이름</th><th>인원</th><th>리조트</th><th>항공/상품</th><th>상세내용</th></tr></thead>
                <tbody>
                    ${filtered.map(it => `<tr>
                        <td class="time">${it.time}</td>
                        <td style="font-weight:700;">${it.customer}</td>
                        <td class="pax">${it.count}인</td>
                        <td>${it.resort}</td>
                        <td style="font-weight:bold; color:#1890ff;">${mode === 'pickup' ? it.flight : it.name}</td>
                        <td style="font-size:12px; color:#666;">${it.details}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </body></html>`;
        popup.document.write(html);
        popup.document.close();
    };
});
