// ================================================
//  VR BARBER SHOP — App Principal (Cliente)
// ================================================

const WHATSAPP_NUMBER = '5585994044941';
const WHATSAPP_NOTIFY = '5585994044941'; // número que recebe notificações

// ─── Serviços (sem Corte + Barba R$45) ───────────
const SERVICES = [
  { id: 'corte',             name: 'Corte',                        price: 25 },
  { id: 'corte_sobrancelha', name: 'Corte + Sobrancelha',         price: 30 },
  { id: 'corte_barba_sob',   name: 'Corte + Barba + Sobrancelha', price: 45 },
  { id: 'barba',             name: 'Barba',                        price: 20 },
  { id: 'sobrancelha',       name: 'Sobrancelha',                  price: 5  },
  { id: 'nevou_corte',       name: 'Nevou + Corte',                price: 90 },
  { id: 'luzes_corte',       name: 'Luzes + Corte',                price: 75 },
  { id: 'hidratacao',        name: 'Hidratação',                   price: 10 },
];

// ─── Planos ────────────────────────────────────────
const PLANS = [
  {
    id: 'basico', name: 'Básico', price: 80, featured: false,
    features: [
      '4 cortes por mês',
      'Prioridade na marcação de horário',
      '5% de desconto no pagamento antecipado (até 5 dias antes)',
    ]
  },
  {
    id: 'essencial', name: 'Essencial', price: 105, featured: true, badge: 'POPULAR',
    features: [
      'Corte + Sobrancelha uso ilimitado',
      'Prioridade na marcação de horário',
      '5% de desconto no pagamento antecipado (até 5 dias antes)',
    ]
  },
  {
    id: 'premium', name: 'Premium', price: 135, featured: false,
    features: [
      'Corte + Barba + Sobrancelha uso ilimitado',
      'Prioridade na marcação de horário',
      'Brinde: lavagem inclusa',
      '10% de desconto no pagamento antecipado (até 5 dias antes)',
    ]
  }
];

// ─── Estado ────────────────────────────────────────
let state = { selected: null, name: '', phone: '', date: '', time: '', obs: '' };

// ─── Renderiza cards de serviços ───────────────────
function renderServices() {
  const grid = document.getElementById('services-grid');
  if (!grid) return;
  grid.innerHTML = SERVICES.map(s => `
    <div class="service-card" onclick="scrollToBooking('${s.id}')">
      <span class="service-name">${s.name}</span>
      <span class="service-price">R$${s.price.toFixed(2).replace('.', ',')}</span>
    </div>`).join('');
}

// ─── Renderiza planos — "Tenho Interesse" abre modal ─
function renderPlans() {
  const grid = document.getElementById('plans-grid');
  if (!grid) return;
  grid.innerHTML = PLANS.map(p => `
    <div class="plan-card ${p.featured ? 'featured' : ''}">
      ${p.badge ? `<div class="plan-badge">${p.badge}</div>` : ''}
      <div class="plan-name">${p.name}</div>
      <div class="plan-price">R$${p.price}</div>
      <div class="plan-price-sub">/ MÊS</div>
      <div class="plan-divider"></div>
      <ul class="plan-features">
        ${p.features.map(f => `<li>${f}</li>`).join('')}
      </ul>
      <button class="btn-plan" onclick="openPlanModal('${p.id}', '${p.name}', ${p.price})">
        Tenho Interesse
      </button>
    </div>`).join('');
}

// ─── Modal de interesse no plano ──────────────────
window.openPlanModal = function(planId, planName, price) {
  const modal = document.getElementById('plan-modal');
  document.getElementById('plan-modal-title').textContent = `Plano ${planName} — R$${price}/mês`;
  document.getElementById('plan-modal-question').value = '';

  // Atualiza o link do WhatsApp dinamicamente ao clicar em "Falar com a Gente"
  const waBtn = document.getElementById('plan-modal-wa');
  waBtn.onclick = function(e) {
    e.preventDefault();
    const duvida = document.getElementById('plan-modal-question').value.trim();
    let msg = `Olá! Tenho interesse no *Plano ${planName}* da VR Barber Shop (R$${price}/mês).`;
    if (duvida) msg += `\n\nMinha dúvida: ${duvida}`;
    else msg += `\n\nPode me passar mais informações?`;
    window.open(`https://wa.me/${WHATSAPP_NOTIFY}?text=${encodeURIComponent(msg)}`, '_blank');
    closePlanModal();
  };

  modal.classList.add('open');
};

window.closePlanModal = function() {
  document.getElementById('plan-modal').classList.remove('open');
};

// ─── Scroll para agendamento + pré-seleciona ───────
window.scrollToBooking = function(serviceId) {
  document.getElementById('agendar').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => preSelectService(serviceId), 600);
};

function preSelectService(serviceId) {
  const service = SERVICES.find(s => s.id === serviceId);
  if (!service) return;
  state.selected = service;
  renderServiceOptions();
  setTimeout(() => {
    const item = document.getElementById('opt-' + serviceId);
    if (item) { item.classList.add('selected'); item.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    showStep(2);
  }, 50);
}

// ─── Lista de serviços no formulário ───────────────
function renderServiceOptions() {
  const list = document.getElementById('options-list');
  if (!list) return;
  list.innerHTML = SERVICES.map(s => `
    <div class="option-item" id="opt-${s.id}" onclick="selectService('${s.id}')">
      <span>${s.name}</span>
      <span class="option-price">R$${s.price.toFixed(2).replace('.', ',')}</span>
    </div>`).join('');
}

// ─── Gera slots de horário (respeita almoço) ──────
function gerarSlots(inicio, fim, almoco, almoco_inicio, almoco_fim) {
  const slots = [];
  let [h, m] = inicio.split(':').map(Number);
  const [hf, mf] = fim.split(':').map(Number);
  const fimMin = hf * 60 + mf;
  const almocoInicioMin = almoco && almoco_inicio
    ? parseInt(almoco_inicio.split(':')[0]) * 60 + parseInt(almoco_inicio.split(':')[1])
    : -1;
  const almocoFimMin = almoco && almoco_fim
    ? parseInt(almoco_fim.split(':')[0]) * 60 + parseInt(almoco_fim.split(':')[1])
    : -1;

  while (h * 60 + m < fimMin) {
    const cur = h * 60 + m;
    // Pula horários dentro do intervalo de almoço
    if (!almoco || cur < almocoInicioMin || cur >= almocoFimMin) {
      slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    }
    m += 30;
    if (m >= 60) { h++; m -= 60; }
  }
  return slots;
}

const DIAS_KEY = ['domingo','segunda','terca','quarta','quinta','sexta','sabado'];

// ─── Carrega horários disponíveis do Firebase ──────
async function carregarSlotsParaData(dataSelecionada) {
  const select = document.getElementById('pref-time');
  if (!select) return;
  select.innerHTML = '<option value="">Carregando...</option>';
  select.disabled = true;

  try {
    // Busca config de horários e agendamentos já existentes em paralelo
    const [configDoc, agendSnap] = await Promise.all([
      firebase.firestore().collection('config').doc('horarios').get(),
      firebase.firestore().collection('agendamentos')
        .where('data', '==', dataSelecionada)
        .where('status', 'in', ['pendente', 'confirmado'])
        .get()
    ]);

    // Horários já ocupados nesse dia
    const ocupados = new Set(agendSnap.docs.map(d => d.data().horario));

    const config = configDoc.exists ? configDoc.data() : null;
    if (!config) { preencherSelectPadrao(select, dataSelecionada, ocupados); return; }

    const [y, mo, d] = dataSelecionada.split('-').map(Number);
    const diaSemana = new Date(y, mo - 1, d).getDay();
    const diaKey = DIAS_KEY[diaSemana];
    const cfg = config[diaKey];

    if (!cfg || !cfg.ativo) {
      select.innerHTML = '<option value="">Sem atendimento neste dia</option>';
      select.disabled = false;
      return;
    }

    // Se for hoje, filtra horários que já passaram
    const hoje = new Date().toISOString().split('T')[0];
    const agora = new Date();
    const agoraMin = dataSelecionada === hoje ? agora.getHours() * 60 + agora.getMinutes() : -1;

    const slots = gerarSlots(cfg.inicio, cfg.fim, cfg.almoco, cfg.almoco_inicio, cfg.almoco_fim)
      .filter(s => {
        const [sh, sm] = s.split(':').map(Number);
        const slotMin = sh * 60 + sm;
        return slotMin > agoraMin && !ocupados.has(s);
      });

    if (!slots.length) {
      select.innerHTML = '<option value="">Nenhum horário disponível</option>';
      select.disabled = false;
      return;
    }

    select.innerHTML = '<option value="">Selecione...</option>' +
      slots.map(s => `<option>${s}</option>`).join('');
    select.disabled = false;
  } catch(e) {
    preencherSelectPadrao(select, dataSelecionada, new Set());
  }
}

function preencherSelectPadrao(select, data, ocupados) {
  const hoje = new Date().toISOString().split('T')[0];
  const agora = new Date();
  const agoraMin = data === hoje ? agora.getHours() * 60 + agora.getMinutes() : -1;
  const horarios = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
    '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30',
    '17:00','17:30','18:00','18:30'];
  const filtrados = horarios.filter(h => {
    const [hh, mm] = h.split(':').map(Number);
    return hh * 60 + mm > agoraMin && !(ocupados && ocupados.has(h));
  });
  select.innerHTML = '<option value="">Selecione...</option>' +
    filtrados.map(h => `<option>${h}</option>`).join('');
  select.disabled = false;
}


window.selectService = function(id) {
  state.selected = SERVICES.find(s => s.id === id);
  document.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
  const item = document.getElementById('opt-' + id);
  if (item) item.classList.add('selected');
  const dateInput = document.getElementById('pref-date');
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
    dateInput.addEventListener('change', function() {
      if (this.value) carregarSlotsParaData(this.value);
    });
  }
  setTimeout(() => showStep(2), 300);
};

// ─── Controle de passos ────────────────────────────
function showStep(n) {
  document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.step').forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i + 1 < n) el.classList.add('done');
    if (i + 1 === n) el.classList.add('active');
  });
  document.querySelectorAll('.step-line').forEach((el, i) => {
    el.classList.toggle('active', i + 1 < n);
  });
  const stepEl = document.getElementById('step-' + n);
  if (stepEl) stepEl.classList.add('active');
}

window.goBack = function(n) { showStep(n); };

// ─── Valida dados e mostra resumo ──────────────────
window.goToConfirm = function() {
  const name  = document.getElementById('client-name').value.trim();
  const phone = document.getElementById('client-phone').value.trim();
  const date  = document.getElementById('pref-date').value;
  const time  = document.getElementById('pref-time').value;
  if (!name || !phone || !date || !time) {
    alert('Por favor, preencha todos os campos obrigatórios (*).');
    return;
  }
  state.name = name; state.phone = phone; state.date = date; state.time = time;
  state.obs = document.getElementById('obs').value.trim();
  renderConfirm();
  showStep(3);
};

function formatDate(d) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function renderConfirm() {
  const sel = state.selected;
  document.getElementById('confirm-summary').innerHTML = `
    <div class="confirm-row"><label>Serviço</label><span>${sel.name}</span></div>
    <div class="confirm-row"><label>Cliente</label><span>${state.name}</span></div>
    <div class="confirm-row"><label>WhatsApp</label><span>${state.phone}</span></div>
    <div class="confirm-row"><label>Data</label><span>${formatDate(state.date)}</span></div>
    <div class="confirm-row"><label>Horário</label><span>${state.time}</span></div>
    ${state.obs ? `<div class="confirm-row"><label>Obs.</label><span>${state.obs}</span></div>` : ''}
    <div class="confirm-row confirm-total"><label>Valor</label>
      <span>R$${Number(sel.price).toFixed(2).replace('.', ',')}</span>
    </div>`;
}

// ─── Envia notificação WhatsApp ao dono ───────────
function sendWhatsAppNotification() {
  const sel = state.selected;
  const lines = [
    '*Novo Agendamento!*',
    '',
    '*Cliente:* ' + state.name,
    '*WhatsApp:* ' + state.phone,
    '*Servico:* ' + sel.name,
    '*Data:* ' + formatDate(state.date),
    '*Horario:* ' + state.time,
    '*Valor:* R$' + Number(sel.price).toFixed(2).replace('.', ','),
  ];
  if (state.obs) lines.push('*Obs:* ' + state.obs);
  const msg = encodeURIComponent(lines.join('\n'));
  window.open(`https://wa.me/${WHATSAPP_NOTIFY}?text=${msg}`, '_blank');
}

// ─── Salva no Firebase ─────────────────────────────
window.submitBooking = async function() {
  const btn = document.querySelector('.btn-confirm');
  btn.textContent = 'Enviando...';
  btn.disabled = true;
  try {
    await firebase.firestore().collection('agendamentos').add({
      tipo:     'servico',
      servico:  state.selected.name,
      preco:    state.selected.price,
      cliente:  state.name,
      telefone: state.phone,
      data:     state.date,
      horario:  state.time,
      obs:      state.obs,
      status:   'pendente',
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Abre WhatsApp com notificação para o dono
    sendWhatsAppNotification();

    document.getElementById('success-modal').classList.add('open');
    state = { selected: null, name: '', phone: '', date: '', time: '', obs: '' };
    ['client-name','client-phone','pref-date','obs'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('pref-time').value = '';
    renderServiceOptions();
    showStep(1);
  } catch (err) {
    console.error(err);
    alert('Erro ao enviar. Verifique a conexão e tente novamente.');
  } finally {
    btn.textContent = '✓ Confirmar';
    btn.disabled = false;
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

  const phoneInput = document.getElementById('client-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function() {
      let v = this.value.replace(/\D/g, '').substring(0, 11);
      if (v.length > 6)      v = `(${v.substring(0,2)}) ${v.substring(2,7)}-${v.substring(7)}`;
      else if (v.length > 2) v = `(${v.substring(0,2)}) ${v.substring(2)}`;
      else if (v.length > 0) v = `(${v}`;
      this.value = v;
    });
  }
});
