// ============================================================================
// KONFIGURÁCIÓ (szerkeszd itt a statikus adatokat)
// ============================================================================

// Ha tudod a dátumot, írd be ISO formátumban:
// pl. '2026-05-15T18:00:00+02:00' — és a countdown automatikusan elindul.
const EVENT_DATE = '2026-05-22T14:00:00+02:00';
const EVENT_DATE_LABEL = '2026. május 22–24.';
const EVENT_PLACE_LABEL = 'Harsány';

// Résztvevők
const PARTICIPANTS = [
    { name: 'Gál Ati', short: 'GA' },
    { name: 'Bálint', short: 'B' },
    { name: 'Leonárd', short: 'L' },
    { name: 'Gábor', short: 'G' },
    { name: 'Jordán', short: 'J' },
    { name: 'Martin', short: 'M' },
    { name: 'Domi', short: 'D' },
    { name: 'Vokány Dani', short: 'VD' },
    { name: 'Matyi', short: 'My' },
    { name: 'Máté', short: 'Mt' },
    { name: 'Weigl Norbi', short: 'WN' },
    { name: 'Kígyósi', short: 'K' },
    { name: 'Radó', short: 'R' },
    { name: 'Ádám', short: 'Á' },
    { name: 'Yilmaz Attila', short: 'YA', celebrant: true },
];

// Menetrend (szerkeszthető)
const SCHEDULE = [
    { time: 'Péntek (máj. 22) — 14:00-tól', title: 'Bejelentkezés, érkezés', icon: '🎒', note: 'Becsekkolás 14:00–22:00 között • szoba-elosztás' },
    { time: 'Péntek este', title: 'Vacsora', icon: '🍖', note: 'Jordán (felelős) + Gábor' },
    { time: 'Péntek — 19:00', title: 'Fröccsváltó', icon: '🍷', note: 'Radó szervezésében' },
    { time: 'Péntek éjszaka', title: 'Szálláson kívüli program', icon: '🌃', note: 'Felelős: még keresve' },
    { time: 'Szombat reggel', title: 'Reggeli — bundáskenyér', icon: '☕', note: 'Domi + Leonárd' },
    { time: 'Szombat délelőtt', title: 'Szabadprogram', icon: '🎯' },
    { time: 'Szombat este', title: 'Ünnepi vacsora + buli', icon: '🎉' },
    { time: 'Vasárnap (máj. 24) — 10:00-ig', title: 'Kijelentkezés, hazaindulás', icon: '🚗' },
];

// Poker idézetek a láblécben
const QUOTES = [
    '"A szerencse mindig a merészek oldalán áll." — Doyle Brunson',
    '"A poker nem kártyajáték — emberi játék, kártyákkal." — ismeretlen',
    '"Ha nem tudod, ki a balek az asztalnál, akkor te vagy az." — Mike McDermott',
    '"A jó játékos a pakliból is mosolyogva jön ki." — régi mondás',
    '"Egy legénybúcsú sose a kártyáról szól. De nálunk igen." — házi bölcsesség',
    '"A rossz osztás is lehet nyerő. Főleg, ha jó a blöff." — ismeretlen',
];

// Bevásárlás — hány főre osztjuk el a közös kasszát
const SHOPPING_HEADCOUNT = 15;

// MC Isti idézetek a tetején forgó szalagban.
const MC_ISTI_QUOTES = [
    'Miért hívsz úgy, hogy Pityesz? Ki az a Pityesz? Ne pityészezzél, mert kitépem a szívedet!',
    'Te engem ne nézzél le, mert én több vagyok, mint te, érted? Én MC Isti vagyok, te meg senki!',
    'Mondom, ne hívjál Pityesznek, mert kijövök a képernyőn keresztül és megfojtollak!',
    'Milyen pizzát küldtél? Hawaii? Hát én utálom az ananászt, te szerencsétlen!',
    'Nézzél a szemembe, ha mersz! De nem mersz, mert egy gyáva féreg vagy!',
    'Olyan pofont kapsz, hogy a takony menetet vág a nyakadon!',
    'Ki az az Arnold? Mit akarsz az Arnolddal?!',
    'Én nem vagyok agresszív, csak hirtelen haragú!',
    'Nekem ne mondd meg, hogy mit csináljak, mert én vagyok az élő legenda!',
    'Aki engem bánt, az saját magát bántja, mert én vagyok a nép hangja!',
];
const QUOTE_ROTATE_MS = 9000;

// ============================================================================
// TÁROLÁS (localStorage cache + közös backend szinkronizáció)
// ============================================================================
const STORAGE_KEY = 'legenybucsu_state_v1';
const ACTIVITY_KEY = 'legenybucsu_activity_v1';
const API_URL = 'api.php';
const POLL_INTERVAL_MS = 8000;
const SAVE_DEBOUNCE_MS = 400;

let serverVersion = 0;
let saveTimer = null;
let savingInFlight = false;
let pendingSave = false;

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return defaultState();
        const def = defaultState();
        const parsed = JSON.parse(raw);
        // Ha korábbi állapotnak még nincs polls mezője, adjuk hozzá a seedelt szavazást
        if (parsed.polls === undefined) parsed.polls = def.polls;
        return { ...def, ...parsed };
    } catch {
        return defaultState();
    }
}

function defaultState() {
    return {
        cars: [],
        shopping: [
            { id: 'seed-jager', item: 'Jägermeister', qty: '2 liter', price: 0, buyer: '', note: 'Közös — Attilának 🍹' },
            { id: 'seed-bor', item: 'Bor', qty: '2 doboz', price: 0, buyer: '', note: 'Közös — Attilának 🍷' },
            { id: 'seed-szoda', item: 'Szóda', qty: '2 doboz', price: 0, buyer: '', note: 'Közös — borhoz' },
        ],
        eszkozok: [],
        meglepetesek: [],
        payments: [],
        polls: [
            {
                id: 'poll-tancos',
                question: 'Legyen exkluzív táncoslány? 💃',
                proposedBy: 'Gábor',
                options: ['Igen 🔥', 'Nem 🙅', 'Talán 🤔'],
                votes: {},
            },
        ],
        kulsoFelelos: null,
        miskolciFelelos: null,
        customCategories: [],
        // Szállás: €1 041 / 15 fő ≈ 27 760 Ft (400 HUF/EUR árfolyamon). A felhasználó felülírhatja.
        costs: { accommodation: 27760, food: 0, poker: 0, gift: 0 },
    };
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderDashboard();
    renderCosts();
    queueServerSave();
}

// ---- Backend sync ----
function setSyncStatus(text, kind) {
    const el = document.getElementById('syncStatus');
    if (!el) return;
    el.textContent = text;
    el.className = 'sync-status' + (kind ? ' sync-' + kind : '');
}

async function syncFromServer({ silent = false } = {}) {
    if (!silent) setSyncStatus('szinkron…', 'pending');
    try {
        const res = await fetch(API_URL + '?action=get', { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (data && data.state && typeof data.version === 'number') {
            if (data.version > serverVersion) {
                serverVersion = data.version;
                state = { ...defaultState(), ...data.state };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                renderAll();
            } else {
                // akár egyenlő akár kisebb — frissítjük a versiont
                serverVersion = Math.max(serverVersion, data.version);
            }
        }
        setSyncStatus('✓ szinkron', 'ok');
        return true;
    } catch (e) {
        console.warn('sync from server failed:', e);
        setSyncStatus('⚠ offline', 'error');
        return false;
    }
}

function queueServerSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(doServerSave, SAVE_DEBOUNCE_MS);
}

async function doServerSave() {
    if (savingInFlight) { pendingSave = true; return; }
    savingInFlight = true;
    setSyncStatus('mentés…', 'pending');
    try {
        const res = await fetch(API_URL + '?action=save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state }),
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (typeof data.version === 'number') serverVersion = data.version;
        setSyncStatus('✓ mentve', 'ok');
    } catch (e) {
        console.warn('sync to server failed:', e);
        setSyncStatus('⚠ offline', 'error');
    } finally {
        savingInFlight = false;
        if (pendingSave) { pendingSave = false; queueServerSave(); }
    }
}

function startBackendSync() {
    setInterval(() => syncFromServer({ silent: true }), POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) syncFromServer({ silent: true });
    });
}

function loadActivity() {
    try {
        return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
    } catch { return []; }
}

function logActivity(text) {
    const activity = loadActivity();
    activity.unshift({ text, at: Date.now() });
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity.slice(0, 15)));
    renderActivity();
}

let state = loadState();

// ============================================================================
// SEGÉD
// ============================================================================
function uid() { return Math.random().toString(36).slice(2, 10); }
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}

function fmtFt(n) {
    n = Math.round(Number(n) || 0);
    return n.toLocaleString('hu-HU') + ' Ft';
}

function fmtRelative(ts) {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'most';
    if (diff < 3600) return `${Math.floor(diff/60)} perce`;
    if (diff < 86400) return `${Math.floor(diff/3600)} órája`;
    return `${Math.floor(diff/86400)} napja`;
}

function assignedNames() {
    const set = new Set();
    for (const c of state.cars) {
        if (c.driver) set.add(c.driver);
        for (const p of c.passengers || []) if (p) set.add(p);
    }
    return set;
}

function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2500);
}

// ============================================================================
// RÉSZTVEVŐK
// ============================================================================
function renderParticipants() {
    $('#participantsList').innerHTML = PARTICIPANTS.map(p => `
        <li class="${p.celebrant ? 'celebrant' : ''}">
            <span class="avatar">${escapeHtml(p.short)}</span>
            <span class="name">${escapeHtml(p.name)}</span>
            ${p.celebrant ? '<span class="crown">👑</span>' : ''}
        </li>
    `).join('');
}

// ============================================================================
// DASHBOARD
// ============================================================================
function renderDashboard() {
    $('#statCars').textContent = state.cars.length;

    const assigned = assignedNames().size;
    $('#statAssigned').textContent = assigned;
    $('#assignedProgress').style.width = (assigned / PARTICIPANTS.length * 100) + '%';

    $('#statShopItems').textContent = state.shopping.length;

    const total = calcTotalPerPerson();
    $('#statCostPerPerson').textContent = Math.round(total).toLocaleString('hu-HU');
}

// ============================================================================
// COUNTDOWN
// ============================================================================
function renderCountdown() {
    if (!EVENT_DATE) return;
    const target = new Date(EVENT_DATE).getTime();
    if (isNaN(target)) return;

    $('#countdown').style.display = 'inline-flex';

    function tick() {
        const diff = Math.max(0, target - Date.now());
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff / 3600000) % 24);
        const mins = Math.floor((diff / 60000) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        $('#cdDays').textContent = days;
        $('#cdHours').textContent = String(hours).padStart(2, '0');
        $('#cdMinutes').textContent = String(mins).padStart(2, '0');
        $('#cdSeconds').textContent = String(secs).padStart(2, '0');
    }
    tick();
    setInterval(tick, 1000);
}

function updateEventLabels() {
    $('#dateLabel').innerHTML = '📅 <strong>Dátum: ' + escapeHtml(EVENT_DATE_LABEL) + '</strong>';
    $('#placeLabel').innerHTML = '📍 <strong>Helyszín: ' + escapeHtml(EVENT_PLACE_LABEL) + '</strong>';
}

// ============================================================================
// MENETREND
// ============================================================================
function renderTimeline() {
    $('#timelineList').innerHTML = SCHEDULE.map(item => `
        <li class="timeline-item" data-icon="${escapeHtml(item.icon || '•')}">
            <span class="timeline-time">${escapeHtml(item.time)}</span>
            <span class="timeline-title">${escapeHtml(item.title)}</span>
            ${item.note ? `<span class="timeline-note">${escapeHtml(item.note)}</span>` : ''}
        </li>
    `).join('');
}

// ============================================================================
// AUTÓK
// ============================================================================
function renderCars() {
    const container = $('#carsContainer');
    const empty = $('#carsEmpty');

    if (state.cars.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
        container.innerHTML = state.cars.map(renderCar).join('');
    }

    renderUnassigned();
    renderDashboard();
}

function renderCar(car) {
    const filledSeats = (car.passengers || []).filter(Boolean).length + 1; // +1 for driver
    const isFull = filledSeats >= car.seats;

    const seats = [];
    seats.push(`<div class="car-seat"><span>👤 ${escapeHtml(car.driver)} <em style="color:var(--text-muted);font-size:0.8em;">(sofőr)</em></span></div>`);

    for (let i = 0; i < car.seats - 1; i++) {
        const occupant = car.passengers[i];
        if (occupant) {
            seats.push(`
                <div class="car-seat">
                    <span>🧍 ${escapeHtml(occupant)}</span>
                    <button class="remove-seat" onclick="removePassenger('${car.id}', ${i})" title="Kiszáll" aria-label="Kiszáll">×</button>
                </div>
            `);
        } else {
            seats.push(`
                <div class="car-seat empty">
                    <select onchange="assignPassenger('${car.id}', ${i}, this.value)" aria-label="Beírom magam">
                        <option value="">+ Beírom magam / valakit...</option>
                        ${availableNamesOptions()}
                    </select>
                </div>
            `);
        }
    }

    const meta = [];
    if (car.from) meta.push(`📍 ${escapeHtml(car.from)}`);
    if (car.departure) meta.push(`🕒 ${escapeHtml(car.departure)}`);

    return `
        <div class="car ${isFull ? 'full' : ''}">
            <div class="car-header">
                <div>
                    <div class="car-driver">🚗 ${escapeHtml(car.driver)}</div>
                    ${meta.length ? `<p class="car-meta">${meta.join(' • ')}</p>` : ''}
                </div>
                <span class="car-capacity ${isFull ? 'full' : ''}">${filledSeats}/${car.seats}</span>
            </div>
            ${car.note ? `<p class="car-note">"${escapeHtml(car.note)}"</p>` : ''}
            <div class="car-seats">${seats.join('')}</div>
            <div class="car-actions">
                <button class="btn btn-ghost btn-sm" onclick="deleteCar('${car.id}')">Törlés</button>
            </div>
        </div>
    `;
}

function availableNamesOptions() {
    const assigned = assignedNames();
    return PARTICIPANTS
        .filter(p => !assigned.has(p.name))
        .map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`)
        .join('');
}

function driverOptions() {
    const assigned = assignedNames();
    return PARTICIPANTS
        .filter(p => !assigned.has(p.name))
        .map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`)
        .join('');
}

function renderUnassigned() {
    const assigned = assignedNames();
    const remaining = PARTICIPANTS.filter(p => !assigned.has(p.name));

    $('#unassignedCount').textContent = remaining.length;

    const box = $('#unassignedList');
    if (remaining.length === 0) {
        box.style.display = 'none';
    } else if (remaining.length < PARTICIPANTS.length) {
        box.style.display = 'block';
        box.innerHTML = `<strong>Még nincs autóban:</strong> ` +
            remaining.map(p => `<span class="unassigned-chip">${escapeHtml(p.name)}</span>`).join('');
    } else {
        box.style.display = 'none';
    }
}

window.assignPassenger = function(carId, seatIdx, name) {
    if (!name) return;
    const car = state.cars.find(c => c.id === carId);
    if (!car) return;
    car.passengers[seatIdx] = name;
    saveState();
    logActivity(`${name} beírta magát ${car.driver} autójába`);
    renderCars();
    toast(`${name} bekerült ${car.driver} autójába ✓`);
};

window.removePassenger = function(carId, seatIdx) {
    const car = state.cars.find(c => c.id === carId);
    if (!car) return;
    const who = car.passengers[seatIdx];
    car.passengers[seatIdx] = null;
    saveState();
    if (who) logActivity(`${who} kiszállt ${car.driver} autójából`);
    renderCars();
};

window.deleteCar = function(carId) {
    const car = state.cars.find(c => c.id === carId);
    if (!car) return;
    if (!confirm(`Biztos törlöd ${car.driver} autóját?`)) return;
    state.cars = state.cars.filter(c => c.id !== carId);
    saveState();
    logActivity(`${car.driver} autója törölve`);
    renderCars();
    rebuildShopBuyerSelect();
    rebuildKulsoSelect();
};

function openCarModal() {
    const modal = $('#modalBackdrop');
    $('#carDriver').innerHTML = '<option value="">— Válassz sofőrt —</option>' + driverOptions();
    $('#carForm').reset();
    $('#carSeats').value = 5;
    modal.classList.add('open');
    setTimeout(() => $('#carDriver').focus(), 50);
}

function closeCarModal() {
    $('#modalBackdrop').classList.remove('open');
}

function onCarSubmit(e) {
    e.preventDefault();
    const driver = $('#carDriver').value;
    const seats = parseInt($('#carSeats').value, 10);
    if (!driver || !seats) return;

    const car = {
        id: uid(),
        driver,
        seats,
        passengers: new Array(seats - 1).fill(null),
        from: $('#carFrom').value.trim(),
        departure: $('#carDeparture').value.trim(),
        note: $('#carNote').value.trim(),
    };
    state.cars.push(car);
    saveState();
    logActivity(`Új autó: ${driver} (${seats} fh)`);
    renderCars();
    closeCarModal();
    toast(`Autó hozzáadva ✓`);
}

// ============================================================================
// BEVÁSÁRLÁS
// ============================================================================
function renderShopping() {
    const tbody = $('#shoppingTbody');
    const tfoot = $('#shoppingTfoot');
    const empty = $('#shoppingEmpty');

    if (state.shopping.length === 0) {
        tbody.innerHTML = '';
        tfoot.innerHTML = '';
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
        tbody.innerHTML = state.shopping.map(item => `
            <tr>
                <td>${escapeHtml(item.item)}</td>
                <td>${escapeHtml(item.qty)}</td>
                <td class="shopping-price">${item.price ? fmtFt(item.price) : '—'}</td>
                <td>${escapeHtml(item.buyer || '—')}</td>
                <td>${escapeHtml(item.note || '')}</td>
                <td><button class="remove-item" onclick="removeShopItem('${item.id}')" title="Törlés" aria-label="Törlés">×</button></td>
            </tr>
        `).join('');

        const total = state.shopping.reduce((s, it) => s + (Number(it.price) || 0), 0);
        tfoot.innerHTML = `
            <tr>
                <td colspan="2">Összesen</td>
                <td class="shopping-price">${fmtFt(total)}</td>
                <td colspan="3" class="shopping-price">~${fmtFt(total / SHOPPING_HEADCOUNT)} / fő</td>
            </tr>
        `;
    }
    renderCosts();
    renderDashboard();
}

function rebuildShopBuyerSelect() {
    $('#shopBuyer').innerHTML = '<option value="">Ki veszi? (opcionális)</option>' +
        PARTICIPANTS.map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join('');
}

window.removeShopItem = function(id) {
    const item = state.shopping.find(s => s.id === id);
    state.shopping = state.shopping.filter(s => s.id !== id);
    saveState();
    if (item) logActivity(`Törölve a listáról: ${item.item}`);
    renderShopping();
};

function onShoppingSubmit(e) {
    e.preventDefault();
    const item = {
        id: uid(),
        item: $('#shopItem').value.trim(),
        qty: $('#shopQty').value.trim(),
        price: parseInt($('#shopPrice').value, 10) || 0,
        buyer: $('#shopBuyer').value,
        note: $('#shopNote').value.trim(),
    };
    if (!item.item || !item.qty) return;
    state.shopping.push(item);
    saveState();
    logActivity(`Bevásárláshoz: ${item.item} (${item.qty})`);
    renderShopping();
    $('#shoppingForm').reset();
    toast(`„${item.item}" hozzáadva ✓`);
}

// ============================================================================
// SZAVAZÁS
// ============================================================================
const VOTER_KEY = 'legenybucsu_current_voter_v1';
function getCurrentVoter() { return sessionStorage.getItem(VOTER_KEY) || ''; }
function setCurrentVoter(name) {
    if (name) sessionStorage.setItem(VOTER_KEY, name);
    else sessionStorage.removeItem(VOTER_KEY);
}

function renderPolls() {
    const container = $('#pollsContainer');
    if (!container) return;
    if (!state.polls.length) {
        container.innerHTML = '<div class="empty-state">Nincs aktív szavazás.</div>';
        return;
    }
    const currentVoter = getCurrentVoter();
    container.innerHTML = state.polls.map(poll => renderPoll(poll, currentVoter)).join('');

    // wire events
    container.querySelectorAll('.poll-voter-select').forEach(sel => {
        sel.addEventListener('change', e => {
            setCurrentVoter(e.target.value);
            renderPolls();
        });
    });
    container.querySelectorAll('.poll-option-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const pollId = btn.dataset.pollId;
            const option = btn.dataset.option;
            castVote(pollId, option);
        });
    });
}

function renderPoll(poll, currentVoter) {
    const myVote = currentVoter ? poll.votes[currentVoter] : null;
    const voterOptions = '<option value="">— ki vagy? —</option>' +
        PARTICIPANTS.map(p => `<option value="${escapeHtml(p.name)}" ${p.name === currentVoter ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('');

    // tally
    const tally = {};
    for (const opt of poll.options) tally[opt] = [];
    for (const [voter, choice] of Object.entries(poll.votes)) {
        if (tally[choice]) tally[choice].push(voter);
    }
    const totalVotes = Object.values(tally).reduce((s, v) => s + v.length, 0);

    const optionsHtml = poll.options.map(opt => {
        const count = tally[opt].length;
        const pct = totalVotes > 0 ? Math.round(count / totalVotes * 100) : 0;
        const isMy = myVote === opt;
        const voters = tally[opt];
        return `
            <div class="poll-option-row">
                <button class="poll-option-btn ${isMy ? 'my-vote' : ''} ${currentVoter ? '' : 'disabled'}"
                        data-poll-id="${escapeHtml(poll.id)}"
                        data-option="${escapeHtml(opt)}"
                        ${currentVoter ? '' : 'disabled'}
                        title="${currentVoter ? 'Szavazz erre' : 'Előbb válaszd ki ki vagy'}">
                    <span class="poll-option-label">${escapeHtml(opt)}${isMy ? ' ✓' : ''}</span>
                    <span class="poll-option-bar"><span class="poll-option-bar-fill" style="width:${pct}%"></span></span>
                    <span class="poll-option-count">${count}</span>
                </button>
                ${voters.length ? `<div class="poll-voter-list">${voters.map(v => `<span class="poll-voter-chip">${escapeHtml(v)}</span>`).join('')}</div>` : ''}
            </div>
        `;
    }).join('');

    return `
        <div class="poll">
            <div class="poll-question">🗳️ ${escapeHtml(poll.question)}</div>
            <div class="poll-proposer">${escapeHtml(poll.proposedBy)} ötlete • ${totalVotes} / ${PARTICIPANTS.length} szavazat</div>
            <div class="poll-vote-widget">
                <select class="poll-voter-select" aria-label="Válaszd ki, ki vagy">${voterOptions}</select>
                <span class="muted" style="font-size:0.85rem;">${currentVoter ? 'szavazhatsz alább 👇' : '← előbb válaszd ki ki vagy'}</span>
            </div>
            <div class="poll-options">${optionsHtml}</div>
        </div>
    `;
}

function castVote(pollId, option) {
    const voter = getCurrentVoter();
    if (!voter) { toast('Előbb válaszd ki, ki vagy'); return; }
    const poll = state.polls.find(p => p.id === pollId);
    if (!poll) return;
    const prev = poll.votes[voter];
    if (prev === option) {
        // unvote
        delete poll.votes[voter];
        saveState();
        logActivity(`${voter} visszavonta a szavazatát: ${poll.question}`);
        toast('Szavazat visszavonva');
    } else {
        poll.votes[voter] = option;
        saveState();
        logActivity(`${voter} szavazott: "${option}" — ${poll.question}`);
        toast(`Szavaztál: ${option}`);
    }
    renderPolls();
}

// ============================================================================
// EGYÉNI SZERVEZÉSI KATEGÓRIÁK
// ============================================================================
function renderCustomCategories() {
    const container = $('#customCategoriesContainer');
    if (!container) return;
    if (!state.customCategories || !state.customCategories.length) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = state.customCategories.map(cat => renderCustomCategory(cat)).join('');
}

function renderCustomCategory(cat) {
    const hasFelelos = !!cat.felelos;
    const resztvevokList = (cat.resztvevok || []).filter(Boolean);
    const icon = cat.icon || '📌';

    const voterOptions = PARTICIPANTS
        .map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join('');

    return `
        <div class="category custom-category" data-cat-id="${escapeHtml(cat.id)}">
            <div class="category-header">
                <h3>${escapeHtml(icon)} ${escapeHtml(cat.name)}</h3>
                <button class="btn btn-ghost btn-sm cc-delete" data-cat-id="${escapeHtml(cat.id)}" title="Kategória törlése" aria-label="Törlés">×</button>
            </div>
            <div class="role-row">
                <span class="role-label">Felelős</span>
                <span class="role-value" style="${hasFelelos ? 'color:var(--gold);font-weight:600;' : 'color:var(--text-muted);'}">
                    ${hasFelelos ? escapeHtml(cat.felelos) : '— (szabad a jelentkezés)'}
                </span>
            </div>
            ${resztvevokList.length ? `
                <div class="role-row">
                    <span class="role-label">Résztvevők</span>
                    <span class="role-value">${resztvevokList.map(escapeHtml).join(', ')}</span>
                </div>
            ` : ''}
            ${cat.note ? `<p class="muted" style="margin:6px 0 0; font-size:0.85rem;">${escapeHtml(cat.note)}</p>` : ''}
            ${hasFelelos ? `
                <button class="btn btn-ghost btn-sm cc-clear" data-cat-id="${escapeHtml(cat.id)}" style="margin-top:10px;">Lemondom</button>
            ` : `
                <div class="volunteer-row" style="margin-top:10px;">
                    <select class="cc-volunteer-select" data-cat-id="${escapeHtml(cat.id)}">
                        <option value="">— Válassz nevet —</option>
                        ${voterOptions}
                    </select>
                    <button class="btn btn-primary cc-volunteer" data-cat-id="${escapeHtml(cat.id)}">Jelentkezem</button>
                </div>
            `}
        </div>
    `;
}

function rebuildCustomCatFelelosSelect() {
    const sel = $('#ccFelelos');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Felelős (üres: szabad jelentkezés) —</option>' +
        PARTICIPANTS.map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join('');
}

function onCustomCatSubmit(e) {
    e.preventDefault();
    const name = $('#ccName').value.trim();
    if (!name) return;
    const resztvevokStr = $('#ccResztvevok').value.trim();
    const resztvevok = resztvevokStr
        ? resztvevokStr.split(',').map(s => s.trim()).filter(Boolean)
        : [];
    const cat = {
        id: uid(),
        name,
        icon: $('#ccIcon').value.trim() || '📌',
        felelos: $('#ccFelelos').value || null,
        resztvevok,
        note: $('#ccNote').value.trim(),
    };
    state.customCategories.push(cat);
    saveState();
    logActivity(`Új kategória: ${cat.icon} ${cat.name}${cat.felelos ? ' — ' + cat.felelos : ''}`);
    renderCustomCategories();
    $('#customCatForm').reset();
    toast(`„${cat.name}" hozzáadva ✓`);
}

function bindCustomCategoriesEvents() {
    const container = $('#customCategoriesContainer');
    if (!container) return;
    container.addEventListener('click', e => {
        const catId = e.target.dataset.catId;
        if (!catId) return;
        const cat = state.customCategories.find(c => c.id === catId);
        if (!cat) return;

        if (e.target.classList.contains('cc-delete')) {
            if (!confirm(`Biztos törlöd? (${cat.name})`)) return;
            state.customCategories = state.customCategories.filter(c => c.id !== catId);
            saveState();
            logActivity(`Kategória törölve: ${cat.name}`);
            renderCustomCategories();
        } else if (e.target.classList.contains('cc-clear')) {
            if (!confirm(`Biztos lemondod? (${cat.felelos} — ${cat.name})`)) return;
            const was = cat.felelos;
            cat.felelos = null;
            saveState();
            logActivity(`${was} lemondta: ${cat.name}`);
            renderCustomCategories();
        } else if (e.target.classList.contains('cc-volunteer')) {
            const sel = container.querySelector(`.cc-volunteer-select[data-cat-id="${catId}"]`);
            const name = sel ? sel.value : '';
            if (!name) { toast('Válassz nevet a listából'); return; }
            cat.felelos = name;
            saveState();
            logActivity(`${name} bevállalta: ${cat.name}`);
            renderCustomCategories();
            toast(`${name} bevállalta ✓`);
        }
    });
}

// ============================================================================
// ESZKÖZÖK
// ============================================================================
function renderEszkozok() {
    const list = $('#eszkozList');
    const empty = $('#eszkozEmpty');
    if (!state.eszkozok.length) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';
    list.innerHTML = state.eszkozok.map(e => `
        <li class="${e.checked ? 'checked' : ''}">
            <button class="eszkoz-check" onclick="toggleEszkoz('${e.id}')" title="${e.checked ? 'Nem hozza' : 'Már csomagolva'}" aria-label="Pipa">
                ${e.checked ? '✅' : '⬜'}
            </button>
            <div class="eszkoz-body">
                <div class="eszkoz-name">${escapeHtml(e.name)}</div>
                <div class="eszkoz-meta">
                    ${e.bringer ? `<span class="eszkoz-bringer">🙋 ${escapeHtml(e.bringer)}</span>` : '<span class="eszkoz-bringer muted">ki hozza?</span>'}
                    ${e.note ? `<span class="eszkoz-note">· ${escapeHtml(e.note)}</span>` : ''}
                </div>
            </div>
            <button class="remove-item" onclick="removeEszkoz('${e.id}')" title="Törlés" aria-label="Törlés">×</button>
        </li>
    `).join('');
}

function rebuildEszkozBringerSelect() {
    $('#eszkozBringer').innerHTML = '<option value="">Ki hozza? (opcionális)</option>' +
        PARTICIPANTS.map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join('');
}

window.removeEszkoz = function(id) {
    const item = state.eszkozok.find(e => e.id === id);
    state.eszkozok = state.eszkozok.filter(e => e.id !== id);
    saveState();
    if (item) logActivity(`Eszköz törölve: ${item.name}`);
    renderEszkozok();
};

window.toggleEszkoz = function(id) {
    const item = state.eszkozok.find(e => e.id === id);
    if (!item) return;
    item.checked = !item.checked;
    saveState();
    logActivity(`Eszköz ${item.checked ? 'kipipálva' : 'visszajelölve'}: ${item.name}`);
    renderEszkozok();
};

function onEszkozSubmit(e) {
    e.preventDefault();
    const item = {
        id: uid(),
        name: $('#eszkozName').value.trim(),
        bringer: $('#eszkozBringer').value,
        note: $('#eszkozNote').value.trim(),
        checked: false,
    };
    if (!item.name) return;
    state.eszkozok.push(item);
    saveState();
    logActivity(`Eszköz hozzáadva: ${item.name}${item.bringer ? ' (' + item.bringer + ')' : ''}`);
    renderEszkozok();
    $('#eszkozForm').reset();
    toast(`„${item.name}" hozzáadva ✓`);
}

// ============================================================================
// MEGLEPETÉS AJÁNDÉK (rejtett alapból)
// ============================================================================
const MEGLEPETES_KEY = 'legenybucsu_meglepetes_unlocked_v1';

function isMeglepetesUnlocked() {
    return sessionStorage.getItem(MEGLEPETES_KEY) === '1';
}
function setMeglepetesUnlocked(val) {
    if (val) sessionStorage.setItem(MEGLEPETES_KEY, '1');
    else sessionStorage.removeItem(MEGLEPETES_KEY);
    applyMeglepetesLock();
}
function applyMeglepetesLock() {
    const card = $('#meglepetes');
    if (isMeglepetesUnlocked()) card.classList.remove('meglepetes-locked');
    else card.classList.add('meglepetes-locked');
}

function renderMeglepetes() {
    const list = $('#meglepetesList');
    const empty = $('#meglepetesEmpty');
    const totalEl = $('#meglepetesTotal');

    if (!state.meglepetesek.length) {
        list.innerHTML = '';
        empty.style.display = 'block';
        totalEl.textContent = '';
        return;
    }
    empty.style.display = 'none';
    list.innerHTML = state.meglepetesek.map(m => `
        <li>
            <div class="meglepetes-body">
                <div class="meglepetes-what">🎁 ${escapeHtml(m.what)}</div>
                <div class="meglepetes-meta">
                    ${m.who ? `<span>🙋 ${escapeHtml(m.who)}</span>` : '<span class="muted">ki vállalja?</span>'}
                    ${m.amount ? `<span>· ${fmtFt(m.amount)}</span>` : ''}
                    ${m.note ? `<span class="muted">· ${escapeHtml(m.note)}</span>` : ''}
                </div>
            </div>
            <button class="remove-item" onclick="removeMeglepetes('${m.id}')" aria-label="Törlés">×</button>
        </li>
    `).join('');

    const total = state.meglepetesek.reduce((s, m) => s + (Number(m.amount) || 0), 0);
    totalEl.textContent = total ? `Összes hozzájárulás: ${fmtFt(total)}` : '';
}

function rebuildMeglepetesSelect() {
    $('#meglepetesWho').innerHTML = '<option value="">Ki hozza / vállalja?</option>' +
        PARTICIPANTS.filter(p => !p.celebrant).map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join('');
}

window.removeMeglepetes = function(id) {
    const m = state.meglepetesek.find(x => x.id === id);
    state.meglepetesek = state.meglepetesek.filter(x => x.id !== id);
    saveState();
    if (m) logActivity(`Meglepetés törölve: ${m.what}`);
    renderMeglepetes();
};

function onMeglepetesSubmit(e) {
    e.preventDefault();
    const item = {
        id: uid(),
        what: $('#meglepetesWhat').value.trim(),
        who: $('#meglepetesWho').value,
        amount: parseInt($('#meglepetesAmount').value, 10) || 0,
        note: $('#meglepetesNote').value.trim(),
    };
    if (!item.what) return;
    state.meglepetesek.push(item);
    saveState();
    logActivity(`Meglepetés hozzáadva: ${item.what}`);
    renderMeglepetes();
    $('#meglepetesForm').reset();
    toast('Meglepetés rögzítve 🤫');
}

// ============================================================================
// ELSZÁMOLÁS
// ============================================================================
function renderPayments() {
    const list = $('#paymentList');
    const empty = $('#paymentEmpty');

    if (!state.payments.length) {
        list.innerHTML = '';
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
        const sorted = [...state.payments].sort((a, b) => b.at - a.at);
        list.innerHTML = sorted.map(p => `
            <li>
                <div class="payment-body">
                    <div class="payment-top">
                        <span class="payment-who">${escapeHtml(p.who)}</span>
                        <span class="payment-amount">${fmtFt(p.amount)}</span>
                    </div>
                    <div class="payment-desc">${escapeHtml(p.desc)} <span class="muted">· ${fmtRelative(p.at)}</span></div>
                </div>
                <button class="remove-item" onclick="removePayment('${p.id}')" aria-label="Törlés">×</button>
            </li>
        `).join('');
    }
    renderPaymentSummary();
}

function renderPaymentSummary() {
    const sumEl = $('#paymentSummary');
    const payments = state.payments;
    if (!payments.length) { sumEl.innerHTML = ''; return; }

    const total = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const headcount = PARTICIPANTS.length;
    const perPerson = total / headcount;

    // per-person paid
    const paidBy = {};
    for (const p of payments) {
        paidBy[p.who] = (paidBy[p.who] || 0) + Number(p.amount || 0);
    }
    // balance for each participant: (paid - fair share). Positive = others owe them.
    const balances = PARTICIPANTS.map(part => ({
        name: part.name,
        paid: paidBy[part.name] || 0,
        balance: (paidBy[part.name] || 0) - perPerson,
    })).sort((a, b) => b.balance - a.balance);

    sumEl.innerHTML = `
        <div class="payment-totals">
            <div class="pt-row"><span>Összesen fizetve</span><strong>${fmtFt(total)}</strong></div>
            <div class="pt-row"><span>Fejenkénti rész (${headcount} fő)</span><strong>${fmtFt(perPerson)}</strong></div>
        </div>
        <div class="balance-grid">
            ${balances.map(b => `
                <div class="balance-row ${b.balance > 1 ? 'plus' : b.balance < -1 ? 'minus' : 'zero'}">
                    <span class="balance-name">${escapeHtml(b.name)}</span>
                    <span class="balance-paid">${fmtFt(b.paid)}</span>
                    <span class="balance-delta">${b.balance >= 0 ? '+' : ''}${fmtFt(b.balance)}</span>
                </div>
            `).join('')}
        </div>
        <p class="muted" style="margin-top:10px; font-size:0.82rem;">
            ⊕ zöld = már túlfizetett (kap vissza) · ⊖ piros = fizetnie kell még · fejszám: ${headcount}
        </p>
    `;
}

function rebuildPaymentSelect() {
    $('#payWho').innerHTML = '<option value="">— Ki fizette? —</option>' +
        PARTICIPANTS.map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join('');
}

window.removePayment = function(id) {
    const p = state.payments.find(x => x.id === id);
    state.payments = state.payments.filter(x => x.id !== id);
    saveState();
    if (p) logActivity(`Kifizetés törölve: ${p.who} — ${fmtFt(p.amount)} (${p.desc})`);
    renderPayments();
};

function onPaymentSubmit(e) {
    e.preventDefault();
    const item = {
        id: uid(),
        who: $('#payWho').value,
        amount: parseInt($('#payAmount').value, 10) || 0,
        desc: $('#payDesc').value.trim(),
        at: Date.now(),
    };
    if (!item.who || !item.amount || !item.desc) return;
    state.payments.push(item);
    saveState();
    logActivity(`${item.who} fizetett: ${fmtFt(item.amount)} (${item.desc})`);
    renderPayments();
    $('#paymentForm').reset();
    toast(`${item.who}: ${fmtFt(item.amount)} rögzítve ✓`);
}

// ============================================================================
// SZÁLLÁSON KÍVÜLI PROGRAM — JELENTKEZÉS
// ============================================================================
function rebuildKulsoSelect() {
    const opts = '<option value="">— Válassz nevet —</option>' +
        PARTICIPANTS.map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join('');
    $('#kulsoVolunteerSelect').innerHTML = opts;
    $('#miskolciVolunteerSelect').innerHTML = opts;
}

function renderKulso() {
    renderVolunteerRole({
        who: state.kulsoFelelos,
        labelId: 'kulsoFelelosLabel',
        rowId: 'kulsoVolunteerRow',
        clearBtnId: 'btnKulsoClear',
    });
    renderVolunteerRole({
        who: state.miskolciFelelos,
        labelId: 'miskolciFelelosLabel',
        rowId: 'miskolciVolunteerRow',
        clearBtnId: 'btnMiskolciClear',
    });
}

function renderVolunteerRole({ who, labelId, rowId, clearBtnId }) {
    const label = document.getElementById(labelId);
    const row = document.getElementById(rowId);
    const clearBtn = document.getElementById(clearBtnId);
    if (!label) return;

    if (who) {
        label.textContent = who;
        label.style.color = 'var(--gold)';
        if (row) row.style.display = 'none';
        if (clearBtn) clearBtn.style.display = 'inline-block';
    } else {
        label.textContent = '— (szabad a jelentkezés)';
        label.style.color = 'var(--text-muted)';
        if (row) row.style.display = 'flex';
        if (clearBtn) clearBtn.style.display = 'none';
    }
}

// ============================================================================
// KÖLTSÉGEK
// ============================================================================
function calcShoppingPerPerson() {
    const total = state.shopping.reduce((s, it) => s + (Number(it.price) || 0), 0);
    return total / SHOPPING_HEADCOUNT;
}

function calcTotalPerPerson() {
    const c = state.costs;
    return (c.accommodation || 0) + (c.food || 0) + (c.poker || 0) + (c.gift || 0) + calcShoppingPerPerson();
}

function renderCosts() {
    const c = state.costs;
    $('#costAccommodation').value = c.accommodation || '';
    $('#costFood').value = c.food || '';
    $('#costPoker').value = c.poker || '';
    $('#costGift').value = c.gift || '';

    $('#cbAccommodation').textContent = fmtFt(c.accommodation);
    $('#cbFood').textContent = fmtFt(c.food);
    $('#cbPoker').textContent = fmtFt(c.poker);
    $('#cbGift').textContent = fmtFt(c.gift);
    $('#cbShopping').textContent = fmtFt(calcShoppingPerPerson());
    $('#cbTotal').textContent = fmtFt(calcTotalPerPerson());
}

function bindCostInputs() {
    const map = {
        costAccommodation: 'accommodation',
        costFood: 'food',
        costPoker: 'poker',
        costGift: 'gift',
    };
    for (const [id, key] of Object.entries(map)) {
        $('#' + id).addEventListener('input', e => {
            state.costs[key] = parseInt(e.target.value, 10) || 0;
            saveState();
        });
    }
}

// ============================================================================
// AKTIVITÁS
// ============================================================================
function renderActivity() {
    const activity = loadActivity();
    const list = $('#activityList');
    const empty = $('#activityEmpty');

    if (activity.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';
    list.innerHTML = activity.map(a => `
        <li>
            <span class="activity-text">${escapeHtml(a.text)}</span>
            <span class="activity-time">${fmtRelative(a.at)}</span>
        </li>
    `).join('');
}

// ============================================================================
// MEGOSZTÁS / EXPORT / RESET
// ============================================================================
async function sharePage() {
    const url = location.href;
    const text = 'Yilmaz Attila legénybúcsúja — részletek:';
    if (navigator.share) {
        try { await navigator.share({ title: document.title, text, url }); return; }
        catch { /* user cancelled */ }
    }
    try {
        await navigator.clipboard.writeText(url);
        toast('Link vágólapra másolva ✓');
    } catch {
        prompt('Másold ki a linket:', url);
    }
}

function exportSummary() {
    const lines = [];
    lines.push('YILMAZ ATTILA LEGÉNYBÚCSÚJA — ÖSSZEGZŐ');
    lines.push('='.repeat(40));
    lines.push('');
    lines.push('AUTÓK:');
    if (state.cars.length === 0) {
        lines.push('  (nincs még autó)');
    } else {
        for (const c of state.cars) {
            const pax = (c.passengers || []).filter(Boolean);
            lines.push(`  🚗 ${c.driver} (${pax.length + 1}/${c.seats})${c.from ? ' — ' + c.from : ''}${c.departure ? ' — ' + c.departure : ''}`);
            pax.forEach(p => lines.push(`     • ${p}`));
        }
    }
    lines.push('');
    const unassigned = PARTICIPANTS.filter(p => !assignedNames().has(p.name)).map(p => p.name);
    if (unassigned.length) lines.push('MÉG NEM AUTÓBAN: ' + unassigned.join(', '));
    lines.push('');
    lines.push('BEVÁSÁRLÁS:');
    if (state.shopping.length === 0) lines.push('  (üres)');
    else state.shopping.forEach(s => lines.push(`  • ${s.item} — ${s.qty}${s.price ? ' (' + fmtFt(s.price) + ')' : ''}${s.buyer ? ' — veszi: ' + s.buyer : ''}`));
    lines.push('');
    lines.push(`SZÁLLÁSON KÍVÜLI PROGRAM FELELŐS: ${state.kulsoFelelos || '— (üres)'}`);
    lines.push('');
    lines.push(`KÖLTSÉG / FŐ: ${fmtFt(calcTotalPerPerson())}`);

    const text = lines.join('\n');
    navigator.clipboard.writeText(text).then(
        () => toast('Összegzés vágólapra másolva ✓'),
        () => prompt('Másold ki:', text)
    );
}

// ============================================================================
// FOOTER QUOTE
// ============================================================================
function pickQuote() {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    $('#pokerQuote').textContent = q;
}

// ============================================================================
// MC ISTI QUOTE TICKER (tetején)
// ============================================================================
const MC_ISTI_AVATARS = ['images/mc-isti-1.jpg', 'images/mc-isti-2.jpg'];

function initMcIstiTicker() {
    const el = $('#quoteTickerText');
    const avatar = $('#quoteTickerAvatar');
    if (!el || !MC_ISTI_QUOTES.length) return;
    let idx = Math.floor(Math.random() * MC_ISTI_QUOTES.length);
    let avatarIdx = 0;
    el.textContent = MC_ISTI_QUOTES[idx];

    if (MC_ISTI_QUOTES.length < 2) return;

    setInterval(() => {
        el.classList.add('fading');
        setTimeout(() => {
            let next;
            do { next = Math.floor(Math.random() * MC_ISTI_QUOTES.length); }
            while (next === idx);
            idx = next;
            el.textContent = MC_ISTI_QUOTES[idx];
            el.classList.remove('fading');

            // rotate avatar too
            avatarIdx = (avatarIdx + 1) % MC_ISTI_AVATARS.length;
            if (avatar) {
                avatar.style.display = '';
                avatar.src = MC_ISTI_AVATARS[avatarIdx];
            }
        }, 400);
    }, QUOTE_ROTATE_MS);
}

// ============================================================================
// SCROLL TO TOP FAB
// ============================================================================
function initScrollTop() {
    const btn = $('#scrollTopBtn');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) btn.classList.add('visible');
        else btn.classList.remove('visible');
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ============================================================================
// INIT
// ============================================================================
function renderAll() {
    renderParticipants();
    renderTimeline();
    renderCars();
    renderShopping();
    renderEszkozok();
    renderCustomCategories();
    renderPolls();
    renderMeglepetes();
    renderPayments();
    rebuildShopBuyerSelect();
    rebuildEszkozBringerSelect();
    rebuildMeglepetesSelect();
    rebuildPaymentSelect();
    rebuildKulsoSelect();
    renderKulso();
    renderCosts();
    renderActivity();
    renderDashboard();
    applyMeglepetesLock();
}

document.addEventListener('DOMContentLoaded', async () => {
    updateEventLabels();
    renderCountdown();
    renderAll();
    pickQuote();
    initMcIstiTicker();
    initScrollTop();
    bindCostInputs();
    // Szerver szinkron: először a legfrissebbet lerántjuk
    await syncFromServer();
    startBackendSync();

    $('#btnAddCar').addEventListener('click', openCarModal);
    $('#carCancel').addEventListener('click', closeCarModal);
    $('#carForm').addEventListener('submit', onCarSubmit);
    $('#modalBackdrop').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeCarModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeCarModal();
    });

    $('#shoppingForm').addEventListener('submit', onShoppingSubmit);
    $('#eszkozForm').addEventListener('submit', onEszkozSubmit);
    $('#customCatForm').addEventListener('submit', onCustomCatSubmit);
    $('#meglepetesForm').addEventListener('submit', onMeglepetesSubmit);
    $('#paymentForm').addEventListener('submit', onPaymentSubmit);
    bindCustomCategoriesEvents();
    rebuildCustomCatFelelosSelect();

    $('#btnMeglepetesUnlock').addEventListener('click', () => {
        if (!confirm('Tényleg nincs most itt Attila a válladnál? 👀\n\nHa megnyitod, ő is láthatja ha nézi a telefonodat.')) return;
        setMeglepetesUnlocked(true);
        toast('Meglepetés szekció megnyitva 🤫');
    });
    $('#btnMeglepetesLock').addEventListener('click', () => {
        setMeglepetesUnlocked(false);
        toast('Meglepetés szekció bezárva 🔒');
    });

    $('#btnKulsoVolunteer').addEventListener('click', () => {
        const name = $('#kulsoVolunteerSelect').value;
        if (!name) { toast('Válassz nevet a listából'); return; }
        state.kulsoFelelos = name;
        saveState();
        logActivity(`${name} bevállalta a szálláson kívüli program szervezést`);
        renderKulso();
        toast(`${name} bevállalta ✓`);
    });

    $('#btnKulsoClear').addEventListener('click', () => {
        if (!confirm(`Biztos lemondod a szerepet? (${state.kulsoFelelos})`)) return;
        const was = state.kulsoFelelos;
        state.kulsoFelelos = null;
        saveState();
        logActivity(`${was} lemondta a szálláson kívüli program szervezést`);
        renderKulso();
    });

    $('#btnMiskolciVolunteer').addEventListener('click', () => {
        const name = $('#miskolciVolunteerSelect').value;
        if (!name) { toast('Válassz nevet a listából'); return; }
        state.miskolciFelelos = name;
        saveState();
        logActivity(`${name} bevállalta a miskolci program szervezést`);
        renderKulso();
        toast(`${name} bevállalta ✓`);
    });

    $('#btnMiskolciClear').addEventListener('click', () => {
        if (!confirm(`Biztos lemondod a szerepet? (${state.miskolciFelelos})`)) return;
        const was = state.miskolciFelelos;
        state.miskolciFelelos = null;
        saveState();
        logActivity(`${was} lemondta a miskolci program szervezést`);
        renderKulso();
    });

    $('#btnShare').addEventListener('click', sharePage);
    $('#btnExport').addEventListener('click', exportSummary);

    // Frissítsd az "X perce" címkéket percenként
    setInterval(renderActivity, 60000);
});
