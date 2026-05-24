// ─── ESTADO GLOBAL ───────────────────────────────────────────────────
let MOCK_DATABASE = JSON.parse(localStorage.getItem('barber_db')) || {
  users: [],
  appointments: [],
  services: [
    { id: 'corte',             name: 'Corte',                        price: 25,  duration: '30 min', icon: '✂️' },
    { id: 'corte_sobrancelha', name: 'Corte + Sobrancelha',          price: 30,  duration: '45 min', icon: '✂️' },
    { id: 'corte_barba',       name: 'Corte + Barba',                price: 45,  duration: '60 min', icon: '💈' },
    { id: 'corte_barba_sob',   name: 'Corte + Barba + Sobrancelha', price: 45,  duration: '75 min', icon: '💈' },
    { id: 'barba',             name: 'Barba',                        price: 20,  duration: '30 min', icon: '🪒' },
    { id: 'sobrancelha',       name: 'Sobrancelha',                  price: 5,   duration: '15 min', icon: '👁️' },
    { id: 'nevou_corte',       name: 'Nevou + Corte',                price: 90,  duration: '60 min', icon: '❄️' },
    { id: 'luzes_corte',       name: 'Luzes + Corte',                price: 75,  duration: '60 min', icon: '✨' },
    { id: 'hidratacao',        name: 'Hidratação',                   price: 10,  duration: '20 min', icon: '💧' }
  ],
  plans: [
    { id: 'basico',    name: 'Plano Básico',    price: 80,  description: '4 cortes por mês',                          perks: ['4 cortes/mês', 'Prioridade na marcação', '5% desconto antecipado'] },
    { id: 'essencial', name: 'Plano Essencial', price: 105, description: 'Corte + Sobrancelha ilimitado',             perks: ['Corte + Sobrancelha ilimitado', 'Prioridade na marcação', '5% desconto antecipado'] },
    { id: 'premium',   name: 'Plano Premium',   price: 135, description: 'Corte + Barba + Sobrancelha ilimitado',    perks: ['Corte + Barba + Sobrancelha ilimitado', 'Prioridade na marcação', 'Brinde: lavagem inclusa', '10% desconto antecipado'] }
  ],
  workingHours: [
    '09:00','09:30','10:00','10:30','11:00','11:30',
    '13:00','13:30','14:00','14:30','15:00','15:30',
    '16:00','16:30','17:00','17:30','18:00','18:30','19:00'
  ]
};

let currentUser   = null;
let currentStep   = 1;
let selectedDate  = null;
let selectedTime  = null;
let selectedService = null; // objeto completo
let calYear, calMonth;

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                     "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const WA_NUMBER = '5585994044941'; // ← troque pelo número real da barbearia

// ─── PERSISTÊNCIA ────────────────────────────────────────────────────
function saveMockDB() {
  localStorage.setItem('barber_db', JSON.stringify(MOCK_DATABASE));
}
function saveSession(user) {
  localStorage.setItem('barber_session', JSON.stringify(user));
}
function loadSession() {
  return JSON.parse(localStorage.getItem('barber_session'));
}

// ─── RENDER: SERVIÇOS ────────────────────────────────────────────────
function renderServices() {
  const grid = document.getElementById('services-grid');
  if (!grid) return;

  grid.innerHTML = MOCK_DATABASE.services.map(s => `
    <div class="service-card" onclick="scrollToBooking('${s.id}')">
      <div class="service-icon">${s.icon}</div>
      <h3>${s.name}</h3>
      <p class="service-duration">${s.duration}</p>
      <p class="service-price">R$ ${s.price.toFixed(2).replace('.',',')}</p>
      <button class="btn-service-cta">Agendar</button>
    </div>
  `).join('');
}

window.scrollToBooking = function(serviceId) {
  // pré-seleciona o serviço e rola até a seção
  const target = MOCK_DATABASE.services.find(s => s.id === serviceId);
  if (target) {
    selectedService = target;
    renderOptionsListHighlight();
  }
  document.getElementById('agendar').scrollIntoView({ behavior: 'smooth' });
};

// ─── RENDER: PLANOS ──────────────────────────────────────────────────
function renderPlans() {
  const grid = document.getElementById('plans-grid');
  if (!grid) return;

  grid.innerHTML = MOCK_DATABASE.plans.map((p, i) => `
    <div class="plan-card ${i === 1 ? 'plan-featured' : ''}">
      ${i === 1 ? '<div class="plan-badge">MAIS POPULAR</div>' : ''}
      <h3>${p.name}</h3>
      <div class="plan-price">
        <span class="plan-currency">R$</span>
        <span class="plan-amount">${p.price}</span>
        <span class="plan-period">/mês</span>
      </div>
      <p class="plan-desc">${p.description}</p>
      <ul class="plan-perks">
        ${p.perks.map(pk => `<li>✓ ${pk}</li>`).join('')}
      </ul>
      <button class="btn-plan" onclick="openPlanModal('${p.id}')">Contratar</button>
    </div>
  `).join('');
}

// ─── RENDER: OPÇÕES DE SERVIÇO NO PASSO 1 ───────────────────────────
function renderOptionsList() {
  const list = document.getElementById('options-list');
  if (!list) return;

  list.innerHTML = MOCK_DATABASE.services.map(s => `
    <div class="option-item ${selectedService && selectedService.id === s.id ? 'selected' : ''}"
         onclick="selectService('${s.id}')">
      <span class="option-icon">${s.icon}</span>
      <div class="option-info">
        <strong>${s.name}</strong>
        <span>${s.duration}</span>
      </div>
      <span class="option-price">R$ ${s.price.toFixed(2).replace('.',',')}</span>
    </div>
  `).join('');
}

function renderOptionsListHighlight() {
  // apenas atualiza as classes sem recriar tudo
  document.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
  if (selectedService) {
    const items = document.querySelectorAll('.option-item');
    MOCK_DATABASE.services.forEach((s, i) => {
      if (s.id === selectedService.id && items[i]) items[i].classList.add('selected');
    });
  }
}

window.selectService = function(serviceId) {
  selectedService = MOCK_DATABASE.services.find(s => s.id === serviceId) || null;
  renderOptionsListHighlight();
};

// ─── RENDER: AUTH BAR ────────────────────────────────────────────────
function renderAuthBar() {
  const bar = document.getElementById('auth-bar');
  if (!bar) return;

  if (currentUser) {
    const planLabel = currentUser.plan
      ? MOCK_DATABASE.plans.find(p => p.id === currentUser.plan)?.name || ''
      : '';
    bar.innerHTML = `
      <div class="user-info-bar">
        <span>Olá, <strong>${currentUser.name.split(' ')[0]}</strong>${planLabel ? ` &nbsp;<span class="badge-plan">${planLabel}</span>` : ''}</span>
        <div class="auth-bar-actions">
          <button class="btn-my-bookings" onclick="openMyBookings()">Meus Agendamentos</button>
          <button class="btn-logout" onclick="logout()">Sair</button>
        </div>
      </div>
    `;
  } else {
    bar.innerHTML = `
      <div class="auth-triggers">
        <span class="auth-hint">Faça login para agilizar seu agendamento</span>
        <button class="btn-login-trigger" onclick="openLoginModal()">Entrar / Cadastrar</button>
      </div>
    `;
  }
}

// ─── LOGOUT ──────────────────────────────────────────────────────────
window.logout = function() {
  localStorage.removeItem('barber_session');
  currentUser = null;
  renderAuthBar();
  limparCamposUsuario();
  showStep(1);
};

function limparCamposUsuario() {
  const n = document.getElementById('client-name');
  const p = document.getElementById('client-phone');
  if (n) { n.value = ''; n.disabled = false; }
  if (p) { p.value = ''; p.disabled = false; }
}

function preencherDadosUsuario() {
  if (!currentUser) return;
  const n = document.getElementById('client-name');
  const p = document.getElementById('client-phone');
  if (n) { n.value = currentUser.name; n.disabled = true; }
  if (p) { p.value = currentUser.phone; p.disabled = true; }
}

// ─── FLUXO DE PASSOS DO AGENDAMENTO ─────────────────────────────────
function showStep(s) {
  currentStep = s;

  document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(`step-${s}`);
  if (target) target.classList.add('active');

  // Indicadores
  for (let i = 1; i <= 3; i++) {
    const ind = document.getElementById(`step-ind-${i}`);
    if (!ind) continue;
    ind.classList.remove('active', 'completed');
    if (i === s) ind.classList.add('active');
    else if (i < s) ind.classList.add('completed');
  }

  // Preenche dados ao entrar no passo 2
  if (s === 2) {
    preencherDadosUsuario();
    generateCalendar();
    updateTimeOptions();
  }

  // Monta resumo ao entrar no passo 3
  if (s === 3) {
    renderConfirmSummary();
  }
}

// Chamado pelo botão "Continuar" do passo 1
window.goToStep2 = function() {
  if (!selectedService) {
    showToast('Selecione um serviço para continuar.');
    return;
  }
  showStep(2);
};

// Chamado pelo botão "Continuar" do passo 2
window.goToConfirm = function() {
  const name  = currentUser ? currentUser.name  : document.getElementById('client-name').value.trim();
  const phone = currentUser ? currentUser.phone : document.getElementById('client-phone').value.trim();

  if (!name)  { showToast('Informe seu nome.'); return; }
  if (!phone) { showToast('Informe seu WhatsApp.'); return; }
  if (!selectedDate) { showToast('Selecione uma data no calendário.'); return; }
  if (!selectedTime) { showToast('Selecione um horário.'); return; }

  showStep(3);
};

window.goBack = function(toStep) {
  showStep(toStep);
};

// ─── RESUMO DO PASSO 3 ───────────────────────────────────────────────
function renderConfirmSummary() {
  const wrap = document.getElementById('confirm-summary');
  if (!wrap) return;

  const name  = currentUser ? currentUser.name  : document.getElementById('client-name').value.trim();
  const phone = currentUser ? currentUser.phone : document.getElementById('client-phone').value.trim();
  const obs   = document.getElementById('obs').value.trim();
  const parts = selectedDate.split('-');
  const dateFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;

  wrap.innerHTML = `
    <div class="summary-row"><span>Cliente</span><strong>${name}</strong></div>
    <div class="summary-row"><span>WhatsApp</span><strong>${phone}</strong></div>
    <div class="summary-row"><span>Serviço</span><strong>${selectedService.name}</strong></div>
    <div class="summary-row"><span>Duração</span><strong>${selectedService.duration}</strong></div>
    <div class="summary-row"><span>Data</span><strong>${dateFormatted}</strong></div>
    <div class="summary-row"><span>Horário</span><strong>${selectedTime}</strong></div>
    ${obs ? `<div class="summary-row"><span>Obs</span><strong>${obs}</strong></div>` : ''}
    <div class="summary-total">Total: R$ ${selectedService.price.toFixed(2).replace('.',',')}</div>
  `;
}

// ─── ENVIO DO AGENDAMENTO ────────────────────────────────────────────
window.submitBooking = async function() {
  const btn = document.querySelector('.btn-confirm');
  if (btn) { btn.textContent = 'Enviando…'; btn.disabled = true; }

  const name  = currentUser ? currentUser.name  : document.getElementById('client-name').value.trim();
  const phone = currentUser ? currentUser.phone : document.getElementById('client-phone').value.trim();
  const obs   = document.getElementById('obs').value.trim();

  const payload = {
    cliente:   name,
    telefone:  phone,
    servico:   selectedService.name,
    preco:     selectedService.price,
    duracao:   selectedService.duration,
    data:      selectedDate,
    horario:   selectedTime,
    obs:       obs,
    status:    'pendente',
    criadoEm:  new Date().toISOString()
  };

  // Salva localmente (mock) e tenta enviar para Firestore
  MOCK_DATABASE.appointments.push({ date: selectedDate, time: selectedTime, client: name, phone });
  saveMockDB();

  try {
    const db = firebase.firestore();
    await db.collection('agendamentos').add(payload);
  } catch (e) {
    console.warn('Firestore indisponível, agendamento salvo localmente.', e);
  }

  // Abre modal de sucesso
  document.getElementById('success-modal').classList.add('open');

  // Reseta estado
  selectedDate = null;
  selectedTime = null;
  selectedService = null;
  if (document.getElementById('obs')) document.getElementById('obs').value = '';

  // Monta link WhatsApp para notificação
  const parts = payload.data.split('-');
  const dateStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
  const msg = encodeURIComponent(
    `Olá! Acabei de agendar pelo site:\n\n` +
    `👤 ${name}\n📞 ${phone}\n✂️ ${payload.servico}\n📅 ${dateStr} às ${payload.horario}\n\nAguardo confirmação!`
  );
  document.getElementById('wa-confirm-link').href = `https://wa.me/${WA_NUMBER}?text=${msg}`;

  if (btn) { btn.textContent = '✓ Confirmar'; btn.disabled = false; }
  showStep(1);
  renderOptionsList();
};

window.closeModal = function() {
  document.getElementById('success-modal').classList.remove('open');
};

// ─── CALENDÁRIO ──────────────────────────────────────────────────────
function generateCalendar() {
  const now = new Date();
  if (calYear === undefined) { calYear = now.getFullYear(); calMonth = now.getMonth(); }

  const wrap = document.getElementById('cal-wrap');
  if (!wrap) return;

  wrap.innerHTML = `
    <div class="cal-header">
      <button type="button" onclick="changeMonth(-1)">&#8249;</button>
      <span>${MONTH_NAMES[calMonth]} ${calYear}</span>
      <button type="button" onclick="changeMonth(1)">&#8250;</button>
    </div>
    <div class="cal-weekdays">
      <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span>
      <span>Qui</span><span>Sex</span><span>Sáb</span>
    </div>
    <div class="cal-days-grid" id="cal-days-grid"></div>
  `;

  const grid = wrap.querySelector('#cal-days-grid');
  const firstDay  = new Date(calYear, calMonth, 1).getDay();
  const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
  const todayStr  = now.toISOString().split('T')[0];

  for (let i = 0; i < firstDay; i++) {
    const sp = document.createElement('span');
    sp.className = 'cal-empty';
    grid.appendChild(sp);
  }

  for (let day = 1; day <= totalDays; day++) {
    const dObj = new Date(calYear, calMonth, day);
    const dow  = dObj.getDay();
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

    const cell = document.createElement('span');
    cell.className = 'cal-day-cell';
    cell.textContent = day;

    const closed = (dow === 0 || dow === 1); // fecha dom e seg
    const past   = dateStr < todayStr;

    if (closed || past) {
      cell.classList.add('disabled');
    } else {
      if (selectedDate === dateStr) cell.classList.add('selected');
      cell.onclick = () => selectDateHandler(dateStr);
    }
    grid.appendChild(cell);
  }
}

window.changeMonth = function(dir) {
  calMonth += dir;
  if (calMonth < 0)  { calMonth = 11; calYear--; }
  if (calMonth > 11) { calMonth = 0;  calYear++; }
  generateCalendar();
};

function selectDateHandler(dateStr) {
  selectedDate = dateStr;
  selectedTime = null;
  generateCalendar();
  updateTimeOptions();
}

function updateTimeOptions() {
  const sel = document.getElementById('pref-time');
  if (!sel) return;

  if (!selectedDate) {
    sel.innerHTML = '<option value="">Selecione uma data primeiro</option>';
    sel.disabled = true;
    return;
  }

  const taken = MOCK_DATABASE.appointments
    .filter(a => a.date === selectedDate)
    .map(a => a.time);

  sel.disabled = false;
  sel.innerHTML = '<option value="">Escolha o horário</option>' +
    MOCK_DATABASE.workingHours.map(h => {
      const busy = taken.includes(h);
      return `<option value="${h}" ${busy ? 'disabled' : ''}>${h} ${busy ? '(Ocupado)' : ''}</option>`;
    }).join('');

  sel.onchange = e => { selectedTime = e.target.value; };
}

// ─── MODAL LOGIN / CADASTRO ──────────────────────────────────────────
window.openLoginModal = function() {
  document.getElementById('login-modal').classList.add('open');
  showLoginStep('phone');
  document.getElementById('login-error').textContent = '';
};

window.closeLoginModal = function() {
  document.getElementById('login-modal').classList.remove('open');
};

function showLoginStep(step) {
  document.querySelectorAll('.login-step').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(`login-step-${step}`);
  if (target) target.classList.add('active');
}

// Formata telefone no modal de login
function setupPhoneMask(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.addEventListener('input', function() {
    let v = this.value.replace(/\D/g, '').substring(0, 11);
    if (v.length > 6) v = `(${v.substring(0,2)}) ${v.substring(2,7)}-${v.substring(7)}`;
    else if (v.length > 2) v = `(${v.substring(0,2)}) ${v.substring(2)}`;
    this.value = v;
  });
}

window.loginCheckPhone = function() {
  const raw = document.getElementById('login-phone-input').value.replace(/\D/g, '');
  if (raw.length < 10) {
    document.getElementById('login-error').textContent = 'Número inválido.';
    return;
  }

  const user = MOCK_DATABASE.users.find(u => u.phone.replace(/\D/g, '') === raw);
  if (user) {
    // Usuário já cadastrado → loga direto
    currentUser = user;
    saveSession(currentUser);
    renderAuthBar();
    preencherDadosUsuario();
    closeLoginModal();
    showToast(`Bem-vindo de volta, ${user.name.split(' ')[0]}! 👋`);
  } else {
    // Novo usuário → pede nome
    document.getElementById('login-error').textContent = '';
    showLoginStep('name');
  }
};

window.loginRegister = function() {
  const name = document.getElementById('login-name-input').value.trim();
  const raw  = document.getElementById('login-phone-input').value.replace(/\D/g, '');
  const birth = document.getElementById('login-birth-input').value;

  if (!name) {
    document.getElementById('login-error').textContent = 'Informe seu nome completo.';
    return;
  }

  const phone = document.getElementById('login-phone-input').value.trim();
  const newUser = {
    id:    'u_' + Date.now(),
    name,
    phone,
    birth: birth || null,
    plan:  null
  };

  MOCK_DATABASE.users.push(newUser);
  saveMockDB();

  currentUser = newUser;
  saveSession(currentUser);
  renderAuthBar();
  preencherDadosUsuario();
  closeLoginModal();
  showToast(`Cadastro realizado! Bem-vindo, ${name.split(' ')[0]}! 🎉`);
};

// ─── MODAL PLANOS ────────────────────────────────────────────────────
window.openPlanModal = function(planId) {
  const plan = MOCK_DATABASE.plans.find(p => p.id === planId);
  if (!plan) return;

  document.getElementById('plan-modal-title').textContent = plan.name;
  document.getElementById('plan-modal-desc').innerHTML =
    `Ótima escolha! Antes de continuar, tem alguma dúvida sobre o <strong>${plan.name}</strong>?
     Escreva abaixo ou clique em <strong>Falar com a Gente</strong> pelo WhatsApp.`;

  document.getElementById('plan-modal-question').value = '';

  const waLink = document.getElementById('plan-modal-wa');
  const msg = encodeURIComponent(`Olá! Tenho interesse no ${plan.name} (R$ ${plan.price}/mês). Podem me dar mais informações?`);
  waLink.href = `https://wa.me/${WA_NUMBER}?text=${msg}`;
  waLink.onclick = () => {
    const q = document.getElementById('plan-modal-question').value.trim();
    if (q) {
      const fullMsg = encodeURIComponent(`Olá! Tenho interesse no ${plan.name} (R$ ${plan.price}/mês).\n\nDúvida: ${q}`);
      waLink.href = `https://wa.me/${WA_NUMBER}?text=${fullMsg}`;
    }
  };

  document.getElementById('plan-modal').classList.add('open');
};

window.closePlanModal = function() {
  document.getElementById('plan-modal').classList.remove('open');
};

// ─── MODAL MEUS AGENDAMENTOS ─────────────────────────────────────────
window.openMyBookings = function() {
  const list = document.getElementById('mybookings-list');
  if (!list) return;

  const mine = MOCK_DATABASE.appointments.filter(a =>
    currentUser && (a.phone === currentUser.phone || a.client === currentUser.name)
  );

  if (!mine.length) {
    list.innerHTML = '<p style="text-align:center;color:#666;padding:20px 0;">Nenhum agendamento encontrado.</p>';
  } else {
    list.innerHTML = mine.map(a => {
      const parts = a.date.split('-');
      const dt = `${parts[2]}/${parts[1]}/${parts[0]}`;
      return `
        <div class="booking-item">
          <span class="booking-date">${dt} às ${a.time}</span>
          <span class="booking-client">${a.client}</span>
        </div>
      `;
    }).reverse().join('');
  }

  document.getElementById('mybookings-modal').classList.add('open');
};

window.closeMyBookings = function() {
  document.getElementById('mybookings-modal').classList.remove('open');
};

// ─── TOAST (NOTIFICAÇÃO RÁPIDA) ───────────────────────────────────────
function showToast(msg) {
  let toast = document.getElementById('vr-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'vr-toast';
    toast.style.cssText = `
      position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(60px);
      background:#c8a96e;color:#000;padding:12px 24px;border-radius:8px;
      font-family:'Oswald',sans-serif;font-size:14px;letter-spacing:.5px;
      z-index:9999;opacity:0;transition:all .3s ease;pointer-events:none;
      box-shadow:0 4px 20px rgba(0,0,0,.4);white-space:nowrap;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(60px)';
  }, 3000);
}

// ─── MÁSCARA DE TELEFONE (CAMPOS DO AGENDAMENTO) ─────────────────────
function setupAllPhoneMasks() {
  const ids = ['client-phone', 'login-phone-input'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function() {
      if (currentUser && id === 'client-phone') return;
      let v = this.value.replace(/\D/g, '').substring(0, 11);
      if (v.length > 6) v = `(${v.substring(0,2)}) ${v.substring(2,7)}-${v.substring(7)}`;
      else if (v.length > 2) v = `(${v.substring(0,2)}) ${v.substring(2)}`;
      this.value = v;
    });
  });
}

// ─── FECHAR MODAIS AO CLICAR NO OVERLAY ─────────────────────────────
function setupModalCloseOnOverlay() {
  ['login-modal', 'mybookings-modal', 'plan-modal', 'success-modal'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', function(e) {
      if (e.target === this) this.classList.remove('open');
    });
  });
}

// ─── STYLES EXTRAS INJETADOS (sem precisar editar o CSS) ─────────────
function injectExtraStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* ── Services Grid ── */
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
      padding: 0 20px 20px;
      max-width: 960px;
      margin: 0 auto;
    }
    .service-card {
      background: #111;
      border: 1px solid #222;
      border-radius: 12px;
      padding: 24px 16px;
      text-align: center;
      cursor: pointer;
      transition: border-color .25s, transform .2s;
    }
    .service-card:hover { border-color: #c8a96e; transform: translateY(-4px); }
    .service-icon { font-size: 32px; margin-bottom: 10px; }
    .service-card h3 { font-family:'Oswald',sans-serif; font-size:16px; margin:0 0 6px; color:#fff; }
    .service-duration { font-size:12px; color:#666; margin:0 0 8px; }
    .service-price { font-family:'Oswald',sans-serif; font-size:20px; color:#c8a96e; margin:0 0 14px; }
    .btn-service-cta {
      background:#c8a96e; color:#000; border:none; padding:8px 20px;
      border-radius:6px; font-family:'Oswald',sans-serif; font-size:13px;
      letter-spacing:1px; cursor:pointer; width:100%;
    }
    .btn-service-cta:hover { background:#e0c080; }

    /* ── Plans Grid ── */
    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
      padding: 0 20px 20px;
      max-width: 900px;
      margin: 0 auto;
    }
    .plan-card {
      background:#111; border:1px solid #222; border-radius:14px;
      padding:28px 22px; text-align:center; position:relative;
      transition:border-color .25s, transform .2s;
    }
    .plan-card:hover { border-color:#c8a96e; transform:translateY(-4px); }
    .plan-featured { border-color:#c8a96e; background:#151510; }
    .plan-badge {
      position:absolute; top:-12px; left:50%; transform:translateX(-50%);
      background:#c8a96e; color:#000; font-family:'Oswald',sans-serif;
      font-size:11px; letter-spacing:2px; padding:4px 14px; border-radius:20px;
    }
    .plan-card h3 { font-family:'Oswald',sans-serif; font-size:20px; color:#fff; margin:8px 0 14px; }
    .plan-price { margin:0 0 8px; }
    .plan-currency { font-size:16px; color:#c8a96e; vertical-align:top; margin-top:6px; display:inline-block; }
    .plan-amount { font-family:'Bebas Neue',sans-serif; font-size:48px; color:#c8a96e; line-height:1; }
    .plan-period { font-size:13px; color:#666; }
    .plan-desc { font-size:13px; color:#888; margin:0 0 16px; }
    .plan-perks { list-style:none; padding:0; margin:0 0 20px; text-align:left; }
    .plan-perks li { font-size:13px; color:#aaa; padding:5px 0; border-bottom:1px solid #1a1a1a; }
    .btn-plan {
      background:transparent; color:#c8a96e; border:1px solid #c8a96e;
      padding:10px 24px; border-radius:6px; font-family:'Oswald',sans-serif;
      font-size:14px; letter-spacing:1px; cursor:pointer; width:100%;
      transition:background .2s, color .2s;
    }
    .btn-plan:hover, .plan-featured .btn-plan { background:#c8a96e; color:#000; }

    /* ── Option Items (Step 1) ── */
    .option-item {
      display:flex; align-items:center; gap:14px;
      background:#111; border:1px solid #222; border-radius:10px;
      padding:14px 16px; cursor:pointer; margin-bottom:10px;
      transition:border-color .2s, background .2s;
    }
    .option-item:hover { border-color:#c8a96e; }
    .option-item.selected { border-color:#c8a96e; background:#151510; }
    .option-icon { font-size:24px; flex-shrink:0; }
    .option-info { flex:1; }
    .option-info strong { display:block; font-family:'Oswald',sans-serif; font-size:15px; color:#fff; }
    .option-info span { font-size:12px; color:#666; }
    .option-price { font-family:'Oswald',sans-serif; font-size:18px; color:#c8a96e; flex-shrink:0; }

    /* ── Confirm Summary ── */
    .summary-row {
      display:flex; justify-content:space-between; align-items:center;
      padding:10px 0; border-bottom:1px solid #1e1e1e; font-size:14px; color:#aaa;
    }
    .summary-row strong { color:#fff; }
    .summary-total {
      text-align:right; font-family:'Oswald',sans-serif; font-size:22px;
      color:#c8a96e; margin-top:16px; letter-spacing:1px;
    }

    /* ── Auth Bar ── */
    .user-info-bar {
      display:flex; align-items:center; justify-content:space-between;
      flex-wrap:wrap; gap:10px;
    }
    .auth-bar-actions { display:flex; gap:10px; }
    .badge-plan {
      background:#c8a96e; color:#000; font-size:11px;
      padding:2px 8px; border-radius:3px; font-family:'Oswald',sans-serif;
      letter-spacing:1px;
    }
    .btn-my-bookings {
      background:transparent; color:#c8a96e; border:1px solid #c8a96e;
      padding:6px 16px; border-radius:5px; font-family:'Oswald',sans-serif;
      font-size:13px; cursor:pointer; letter-spacing:1px;
    }
    .btn-my-bookings:hover { background:#c8a96e; color:#000; }
    .btn-logout {
      background:transparent; color:#666; border:1px solid #333;
      padding:6px 14px; border-radius:5px; font-family:'Oswald',sans-serif;
      font-size:13px; cursor:pointer;
    }
    .btn-logout:hover { border-color:#c00; color:#c00; }
    .auth-triggers {
      display:flex; align-items:center; gap:14px; flex-wrap:wrap;
    }
    .auth-hint { font-size:13px; color:#555; }
    .btn-login-trigger {
      background:#c8a96e; color:#000; border:none; padding:8px 20px;
      border-radius:6px; font-family:'Oswald',sans-serif; font-size:14px;
      letter-spacing:1px; cursor:pointer;
    }
    .btn-login-trigger:hover { background:#e0c080; }

    /* ── Booking item (meus agendamentos) ── */
    .booking-item {
      display:flex; justify-content:space-between; align-items:center;
      padding:12px 0; border-bottom:1px solid #1e1e1e; font-size:14px;
    }
    .booking-date { color:#c8a96e; font-family:'Oswald',sans-serif; }
    .booking-client { color:#888; font-size:13px; }

    /* ── Cal ── */
    .cal-header {
      display:flex; justify-content:space-between; align-items:center;
      margin-bottom:12px; font-family:'Oswald',sans-serif; font-size:15px; color:#ccc;
    }
    .cal-header button {
      background:none; border:1px solid #333; color:#c8a96e;
      width:30px; height:30px; border-radius:5px; cursor:pointer; font-size:18px;
      display:flex; align-items:center; justify-content:center;
    }
    .cal-header button:hover { border-color:#c8a96e; }
    .cal-weekdays {
      display:grid; grid-template-columns:repeat(7,1fr);
      margin-bottom:6px;
    }
    .cal-weekdays span { text-align:center; font-size:11px; color:#555; padding:4px 0; }
    #cal-days-grid {
      display:grid; grid-template-columns:repeat(7,1fr); gap:4px;
    }
    .cal-day-cell, .cal-empty {
      text-align:center; padding:8px 4px; border-radius:6px;
      font-size:13px; cursor:pointer; color:#bbb;
      transition:background .2s, color .2s;
    }
    .cal-day-cell:hover:not(.disabled) { background:#1e1e1e; color:#c8a96e; }
    .cal-day-cell.selected { background:#c8a96e !important; color:#000 !important; font-weight:700; }
    .cal-day-cell.disabled { color:#333; cursor:not-allowed; }

    /* ── Step indicator ── */
    .step.completed span { background:#c8a96e; color:#000; }

    /* ── Passo 1 – botão Continuar ── */
    #step-1 .btn-next-wrap {
      margin-top:16px; text-align:right;
    }
  `;
  document.head.appendChild(style);
}

// ─── INJETAR BOTÃO "CONTINUAR" NO PASSO 1 ───────────────────────────
function injectStep1Button() {
  const step1 = document.getElementById('step-1');
  if (!step1) return;
  if (step1.querySelector('.btn-next')) return; // já existe

  const div = document.createElement('div');
  div.className = 'form-row';
  div.style.marginTop = '16px';
  div.innerHTML = `<button class="btn-next" onclick="goToStep2()">Continuar →</button>`;
  step1.appendChild(div);
}

// ─── INJETAR LINK WA NO MODAL DE SUCESSO ────────────────────────────
function injectWaLinkOnSuccess() {
  const modal = document.getElementById('success-modal');
  if (!modal) return;
  const box = modal.querySelector('.modal-box');
  if (!box || box.querySelector('#wa-confirm-link')) return;

  const link = document.createElement('a');
  link.id = 'wa-confirm-link';
  link.href = '#';
  link.target = '_blank';
  link.style.cssText = `
    display:inline-block;margin-top:12px;background:#25d366;color:#fff;
    padding:10px 22px;border-radius:8px;text-decoration:none;
    font-family:'Oswald',sans-serif;font-size:14px;letter-spacing:1px;
  `;
  link.textContent = '📲 Avisar pelo WhatsApp';

  const closeBtn = box.querySelector('button');
  if (closeBtn) box.insertBefore(link, closeBtn);
  else box.appendChild(link);
}

// ─── INIT ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  injectExtraStyles();

  renderServices();
  renderPlans();
  renderOptionsList();
  injectStep1Button();
  injectWaLinkOnSuccess();

  currentUser = loadSession();
  renderAuthBar();
  if (currentUser) preencherDadosUsuario();

  setupAllPhoneMasks();
  setupModalCloseOnOverlay();

  showStep(1);
});
