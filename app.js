// ─── CONFIGURAÇÕES E ESTADO GLOBAL ──────────────────────────────────
const HERO_SLIDES = [
  "imagens/slide1.jpg",
  "imagens/slide2.jpg",
  "imagens/slide3.jpg"
];

let currentSlide = 0;
let slideInterval = null;

// Banco de dados simulado (Mock) persistido no localStorage
let MOCK_DATABASE = JSON.parse(localStorage.getItem('barber_db')) || {
  users: [],
  appointments: [],
  services: [
    { id: 'corte', name: 'Corte Tradicional', price: 35, duration: '30 min' },
    { id: 'barba', name: 'Barba Premium', price: 25, duration: '30 min' },
    { id: 'combo', name: 'Corte + Barba', price: 55, duration: '60 min' },
    { id: 'nevou', name: 'Nevou + Corte', price: 80, duration: '60 min' },
    { id: 'luzes', name: 'Luzes + Corte', price: 70, duration: '60 min' }
  ],
  plans: [
    { id: 'silver', name: 'Plano Silver', price: 80, description: 'Até 3 cortes por mês' },
    { id: 'gold', name: 'Plano Gold', price: 120, description: 'Cortes ilimitados + 1 barba' },
    { id: 'premium', name: 'Plano Premium', price: 160, description: 'Cortes e barbas ilimitados' }
  ],
  workingHours: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00']
};

let currentUser = null;
let currentStep = 1;

let selectedDate = null;
let selectedTime = null;
let selectedService = '';

// Salva banco mock
function saveMockDB() {
  localStorage.setItem('barber_db', JSON.stringify(MOCK_DATABASE));
}

// ─── SESSÃO / AUTENTICAÇÃO ──────────────────────────────────────────
function saveSession(user) {
  localStorage.setItem('barber_session', JSON.stringify(user));
}

function loadSession() {
  return JSON.parse(localStorage.getItem('barber_session'));
}

window.logout = function() {
  localStorage.removeItem('barber_session');
  currentUser = null;
  renderAuthBar();
  // Limpa campos agendamento
  const nameInp = document.getElementById('client-name');
  const phoneInp = document.getElementById('client-phone');
  if (nameInp) { nameInp.value = ''; nameInp.disabled = false; }
  if (phoneInp) { phoneInp.value = ''; phoneInp.disabled = false; }
  showStep(1);
};

// ─── RENDERS INICIAIS (HOME) ────────────────────────────────────────
function renderServices() {
  const container = document.getElementById('services-container');
  if (!container) return;
  container.innerHTML = MOCK_DATABASE.services.map(s => `
    <div class="service-card">
      <h3>${s.name}</h3>
      <p class="price">R$ ${s.price.toFixed(2)}</p>
      <p class="duration">Duração: ${s.duration}</p>
      <button class="btn btn-primary" onclick="startBookingFromService('${s.id}')">Agendar</button>
    </div>
  `).join('');
}

function renderPlans() {
  const container = document.getElementById('plans-container');
  if (!container) return;
  container.innerHTML = MOCK_DATABASE.plans.map(p => `
    <div class="plan-card">
      <h3>${p.name}</h3>
      <p class="price">R$ ${p.price.toFixed(2)}<span>/mês</span></p>
      <p class="desc">${p.description}</p>
      <button class="btn btn-secondary" onclick="assignPlan('${p.id}')">Assinar Plano</button>
    </div>
  `).join('');
}

function renderServiceOptions() {
  const select = document.getElementById('pref-service');
  if (!select) return;
  
  const savedVal = select.value;
  select.innerHTML = '<option value="">Selecione um serviço...</option>' + 
    MOCK_DATABASE.services.map(s => `
      <option value="${s.id}">${s.name} - R$ ${s.price.toFixed(2)} (${s.duration})</option>
    `).join('');
    
  if (savedVal) select.value = savedVal;
}

function renderAuthBar() {
  const bar = document.getElementById('auth-bar');
  if (!bar) return;

  if (currentUser) {
    bar.innerHTML = `
      <div class="user-info-bar">
        <span>Olá, <strong>${currentUser.name}</strong> ${currentUser.plan ? `<span class="badge">${currentUser.plan.toUpperCase()}</span>` : ''}</span>
        <button class="btn-logout" onclick="logout()">Sair</button>
      </div>
    `;
  } else {
    bar.innerHTML = `
      <div class="auth-triggers">
        <button class="btn-login-trigger" onclick="openAuthModal('login')">Entrar</button>
        <button class="btn-register-trigger" onclick="openAuthModal('register')">Cadastrar-se</button>
      </div>
    `;
  }
}

// ─── SLIDESHOW ──────────────────────────────────────────────────────
function initSlideshow() {
  const hero = document.getElementById('hero-section');
  if (!hero) return;

  // Cria estrutura interna do slide se não existir
  hero.innerHTML = `
    <div class="slides-container"></div>
    <div class="hero-content">
      <h1>Barbearia Estilo & Arte</h1>
      <p>O seu visual em mãos de profissionais comprometidos com a excelência.</p>
      <a href="#agendamento" class="btn btn-primary btn-lg">Agendar Horário</a>
    </div>
    <div class="slides-dots"></div>
  `;

  const container = hero.querySelector('.slides-container');
  const dotsContainer = hero.querySelector('.slides-dots');

  container.innerHTML = HERO_SLIDES.map((src, idx) => `
    <div class="slide ${idx === 0 ? 'active' : ''}" style="background-image: url('${src}')"></div>
  `).join('');

  dotsContainer.innerHTML = HERO_SLIDES.map((_, idx) => `
    <span class="dot ${idx === 0 ? 'active' : ''}" onclick="goToSlide(${idx})"></span>
  `).join('');

  startSlideTimer();
}

function startSlideTimer() {
  clearInterval(slideInterval);
  slideInterval = setInterval(() => {
    let next = currentSlide + 1;
    if (next >= HERO_SLIDES.length) next = 0;
    goToSlide(next);
  }, 5000);
}

window.goToSlide = function(idx) {
  const hero = document.getElementById('hero-section');
  if (!hero) return;
  const slides = hero.querySelectorAll('.slide');
  const dots = hero.querySelectorAll('.dot');

  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');

  currentSlide = idx;

  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');

  startSlideTimer();
};

// ─── MODAL AUTENTICAÇÃO (LOGIN / REGISTRO) ──────────────────────────
window.openAuthModal = function(mode) {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.add('open');
  switchMode(mode);
};

window.closeAuthModal = function() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('open');
};

window.switchMode = function(mode) {
  const loginForm = document.getElementById('login-form-wrap');
  const regForm = document.getElementById('register-form-wrap');
  const tLogin = document.getElementById('tab-login');
  const tReg = document.getElementById('tab-register');

  if (mode === 'login') {
    if (loginForm) loginForm.style.display = 'block';
    if (regForm) regForm.style.display = 'none';
    if (tLogin) tLogin.classList.add('active');
    if (tReg) tReg.classList.remove('active');
  } else {
    if (loginForm) loginForm.style.display = 'none';
    if (regForm) regForm.style.display = 'block';
    if (tLogin) tLogin.classList.remove('active');
    if (tReg) tReg.classList.add('active');
  }
};

window.handleLogin = function(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;

  if (!email || !pass) { alert('Preencha todos os campos.'); return; }

  const u = MOCK_DATABASE.users.find(user => user.email.toLowerCase() === email.toLowerCase() && user.password === pass);
  if (!u) {
    alert('E-mail ou senha incorretos.');
    return;
  }

  currentUser = u;
  saveSession(currentUser);
  renderAuthBar();
  preencherDadosAgendamento();
  closeAuthModal();
};

window.handleRegister = function(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const pass = document.getElementById('reg-pass').value;

  if (!name || !email || !phone || !pass) { alert('Preencha todos os campos de cadastro.'); return; }

  const exists = MOCK_DATABASE.users.some(user => user.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    alert('Este e-mail já está cadastrado.');
    return;
  }

  const newUser = { id: 'u_' + Date.now(), name, email, phone, password: pass, plan: null };
  MOCK_DATABASE.users.push(newUser);
  saveMockDB();

  currentUser = newUser;
  saveSession(currentUser);
  renderAuthBar();
  preencherDadosAgendamento();
  closeAuthModal();
};

window.assignPlan = function(planId) {
  if (!currentUser) {
    alert('Por favor, faça login ou cadastre-se antes de contratar um plano.');
    openAuthModal('login');
    return;
  }
  currentUser.plan = planId;
  // Atualiza no banco mock
  const idx = MOCK_DATABASE.users.findIndex(u => u.id === currentUser.id);
  if (idx !== -1) MOCK_DATABASE.users[idx].plan = planId;
  saveMockDB();
  saveSession(currentUser);

  renderAuthBar();
  alert(`Plano ${planId.toUpperCase()} assinado com sucesso de forma simulada!`);
};

// ─── FLUXO AGENDAMENTO STEP BY STEP ──────────────────────────────────
function showStep(s) {
  currentStep = s;
  document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(`step-${s}`);
  if (target) target.classList.add('active');

  // Classes indicadoras no topo
  document.querySelectorAll('.step-indicator .indicator').forEach(el => {
    const num = parseInt(el.getAttribute('data-step'));
    el.classList.remove('active', 'completed');
    if (num === currentStep) el.classList.add('active');
    else if (num < currentStep) el.classList.add('completed');
  });
}

window.nextStep = function() {
  if (currentStep === 1) {
    // Valida passo 1 se deslogado
    if (!currentUser) {
      const n = document.getElementById('client-name').value.trim();
      const p = document.getElementById('client-phone').value.trim();
      if (!n || !p) {
        alert('Identifique-se informando seu nome e celular antes de avançar.');
        return;
      }
    }
    // Renderiza calendário
    generateCalendar();
    showStep(2);
  } else if (currentStep === 2) {
    // Valida passo 2
    selectedService = document.getElementById('pref-service').value;
    if (!selectedService) { alert('Escolha um serviço.'); return; }
    if (!selectedDate) { alert('Selecione uma data no calendário.'); return; }
    if (!selectedTime) { alert('Escolha um horário livre.'); return; }

    // Prepara passo 3 (Resumo)
    renderSummary();
    showStep(3);
  }
};

window.prevStep = function() {
  if (currentStep > 1) {
    showStep(currentStep - 1);
  }
};

function preencherDadosAgendamento() {
  if (!currentUser) return;
  const nameInp = document.getElementById('client-name');
  const phoneInp = document.getElementById('client-phone');
  if (nameInp) { nameInp.value = currentUser.name; nameInp.disabled = true; }
  if (phoneInp) { phoneInp.value = currentUser.phone; phoneInp.disabled = true; }
}

window.startBookingFromService = function(serviceId) {
  const sel = document.getElementById('pref-service');
  if (sel) sel.value = serviceId;
  const target = document.getElementById('agendamento');
  if (target) target.scrollIntoView({ behavior: 'smooth' });
};

// ─── CALENDÁRIO DINÂMICO ──────────────────────────────────────────
let calYear, calMonth;
const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function generateCalendar() {
  const now = new Date();
  if (calYear === undefined) { calYear = now.getFullYear(); calMonth = now.getMonth(); }

  const wrap = document.getElementById('cal-wrap');
  if (!wrap) return;

  wrap.innerHTML = `
    <div class="cal-header">
      <button type="button" onclick="changeMonth(-1)">&lt;</button>
      <span>${MONTH_NAMES[calMonth]} de ${calYear}</span>
      <button type="button" onclick="changeMonth(1)">&gt;</button>
    </div>
    <div class="cal-weekdays">
      <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
    </div>
    <div class="cal-days-grid"></div>
  `;

  const grid = wrap.querySelector('.cal-days-grid');
  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
  const totalDays = new Date(calYear, calMonth + 1, 0).getDate();

  // Espaços vazios iniciais
  for (let i = 0; i < firstDayIndex; i++) {
    const space = document.createElement('span');
    space.className = 'cal-empty';
    grid.appendChild(space);
  }

  const todayStr = now.toISOString().split('T')[0];

  for (let day = 1; day <= totalDays; day++) {
    const dObj = new Date(calYear, calMonth, day);
    const dayOfWeek = dObj.getDay();
    const currentLoopStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

    const cell = document.createElement('span');
    cell.className = 'cal-day-cell';
    cell.textContent = day;

    // Regra: Não atende Domingo (0) nem Segunda (1)
    const isClosed = (dayOfWeek === 0 || dayOfWeek === 1);
    // Regra: Passado bloqueado
    const isPast = currentLoopStr < todayStr;

    if (isClosed || isPast) {
      cell.classList.add('disabled');
    } else {
      if (selectedDate === currentLoopStr) cell.classList.add('selected');
      cell.onclick = () => selectDateHandler(currentLoopStr);
    }
    grid.appendChild(cell);
  }
}

window.changeMonth = function(dir) {
  calMonth += dir;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  else if (calMonth > 11) { calMonth = 0; calYear++; }
  generateCalendar();
};

function selectDateHandler(dateStr) {
  selectedDate = dateStr;
  selectedTime = null; // reseta anterior
  generateCalendar();
  updateTimeOptions();
}

function updateTimeOptions() {
  const timeSelect = document.getElementById('pref-time');
  if (!timeSelect) return;

  if (!selectedDate) {
    timeSelect.innerHTML = '<option value="">Selecione uma data primeiro</option>';
    timeSelect.disabled = true;
    return;
  }

  timeSelect.disabled = false;
  
  // Filtra horários que já foram tomados na mesma data no banco mock
  const takenTimes = MOCK_DATABASE.appointments
    .filter(ap => ap.date === selectedDate)
    .map(ap => ap.time);

  timeSelect.innerHTML = '<option value="">Selecione o horário disponível...</option>' +
    MOCK_DATABASE.workingHours.map(h => {
      const isTaken = takenTimes.includes(h);
      return `<option value="${h}" ${isTaken ? 'disabled style="color:#666;"' : ''}>${h} ${isTaken ? '(Ocupado)' : '(Livre)'}</option>`;
    }).join('');

  timeSelect.onchange = (e) => {
    selectedTime = e.target.value;
  };
}

// ─── RESUMO (PASSO 3) ────────────────────────────────────────────────
function renderSummary() {
  const wrap = document.getElementById('summary-wrapper');
  if (!wrap) return;

  const sName = currentUser ? currentUser.name : document.getElementById('client-name').value.trim();
  const sPhone = currentUser ? currentUser.phone : document.getElementById('client-phone').value.trim();
  const sServiceObj = MOCK_DATABASE.services.find(s => s.id === selectedService);

  // Formata data brasileira
  const parts = selectedDate.split('-');
  const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;

  wrap.innerHTML = `
    <div class="summary-box">
      <p><strong>Cliente:</strong> ${sName}</p>
      <p><strong>Contato Celular:</strong> ${sPhone}</p>
      <p><strong>Serviço Escolhido:</strong> ${sServiceObj ? sServiceObj.name : ''}</p>
      <p><strong>Tempo Estimado:</strong> ${sServiceObj ? sServiceObj.duration : ''}</p>
      <p><strong>Data Separada:</strong> ${formattedDate}</p>
      <p><strong>Horário de Início:</strong> ${selectedTime} hs</p>
      <div class="summary-total">Total: R$ ${sServiceObj ? sServiceObj.price.toFixed(2) : '0,00'}</div>
    </div>
  `;
}

// ─── SUBMISSÃO FINAL (WEBHOOK / BACKEND API) ──────────────────────────
window.submitBooking = async function() {
  const btn = document.getElementById('btn-submit-booking');
  if (!btn) return;

  const sName = currentUser ? currentUser.name : document.getElementById('client-name').value.trim();
  const sPhone = currentUser ? currentUser.phone : document.getElementById('client-phone').value.trim();
  const sEmail = currentUser ? currentUser.email : 'anonimo@barbearia.com';
  const sServiceObj = MOCK_DATABASE.services.find(s => s.id === selectedService);

  const payload = {
    clientName: sName,
    clientPhone: sPhone,
    clientEmail: sEmail,
    serviceName: sServiceObj ? sServiceObj.name : selectedService,
    price: sServiceObj ? sServiceObj.price : 0,
    duration: sServiceObj ? sServiceObj.duration : '',
    date: selectedDate,
    time: selectedTime,
    createdAt: new Date().toISOString()
  };

  try {
    btn.textContent = 'Enviando...'; btn.disabled = true;

    // Conexão fictícia para simular uma API REST ou Webhook (Substitua pela sua URL real)
    const response = await fetch('https://api.exemplobarbearia.com.br/v1/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {
      // Fallback offline caso a URL de teste falhe para o mock continuar rodando perfeitamente
      return { ok: true };
    });

    if (!response.ok) throw new Error('Falha na resposta do servidor.');

    // Salva localmente no array do mock
    MOCK_DATABASE.appointments.push({ date: selectedDate, time: selectedTime, client: sName });
    saveMockDB();

    // Dispara o modal de sucesso customizado
    document.getElementById('success-modal').classList.add('open');

    // Reseta o agendamento de volta ao início
    selectedDate = null; selectedTime = null; selectedService = '';
    const ts = document.getElementById('pref-time');
    if (ts) ts.innerHTML = '<option value="">Selecione uma data primeiro</option>';
    document.getElementById('pref-time').disabled = true;
    const calWrap = document.getElementById('cal-wrap');
    if (calWrap) calWrap.innerHTML = '';
    renderServiceOptions();
    showStep(1);
    preencherDadosAgendamento();
  } catch (err) {
    console.error(err);
    alert('Erro ao enviar. Verifique a conexão e tente novamente.');
  } finally {
    btn.textContent = '✓ Confirmar'; btn.disabled = false;
  }
};

window.closeModal = function() {
  document.getElementById('success-modal').classList.remove('open');
};

// ─── Inicialização ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderServices();
  renderPlans();
  renderServiceOptions();
  initSlideshow();

  // Sessão
  currentUser = loadSession();
  renderAuthBar();
  if (currentUser) preencherDadosAgendamento();

  // Máscara telefone (apenas se usuário não estiver logado)
  const phoneInput = document.getElementById('client-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function() {
      if (currentUser) return; // não sobrescreve enquanto logado
      let v = this.value.replace(/\D/g, '').substring(0, 11);
      if (v.length > 6) v = `(${v.substring(0,2)}) ${v.substring(2,7)}-${v.substring(7)}`;
      else if (v.length > 2) v = `(${v.substring(0,2)}) ${v.substring(2)}`;
      this.value = v;
    });
  }
});
