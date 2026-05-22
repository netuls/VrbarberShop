// ================================================
//  VR BARBER SHOP — App Principal (Cliente)
// ================================================

import { db } from './firebase-config.js';
import {
  collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─── Dados dos serviços ───────────────────────────
export const SERVICES = [
  { id: 'corte',              name: 'Corte',                          price: 25 },
  { id: 'corte_sobrancelha',  name: 'Corte + Sobrancelha',           price: 30 },
  { id: 'corte_barba',        name: 'Corte + Barba',                  price: 45 },
  { id: 'corte_barba_sob',    name: 'Corte + Barba + Sobrancelha',   price: 45 },
  { id: 'barba',              name: 'Barba',                          price: 20 },
  { id: 'sobrancelha',        name: 'Sobrancelha',                    price: 5  },
  { id: 'nevou_corte',        name: 'Nevou + Corte',                  price: 90 },
  { id: 'luzes_corte',        name: 'Luzes + Corte',                  price: 75 },
  { id: 'hidratacao',         name: 'Hidratação',                     price: 10 },
];

// ─── Dados dos planos ─────────────────────────────
export const PLANS = [
  {
    id: 'basico',
    name: 'Básico',
    price: 80,
    featured: false,
    features: [
      '4 cortes por mês',
      'Prioridade na marcação de horário',
      '5% de desconto no pagamento antecipado (até 5 dias antes)',
    ]
  },
  {
    id: 'essencial',
    name: 'Essencial',
    price: 105,
    featured: true,
    badge: 'POPULAR',
    features: [
      'Corte + Sobrancelha uso ilimitado',
      'Prioridade na marcação de horário',
      '5% de desconto no pagamento antecipado (até 5 dias antes)',
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 135,
    featured: false,
    features: [
      'Corte + Barba + Sobrancelha uso ilimitado',
      'Prioridade na marcação de horário',
      'Brinde: lavagem inclusa',
      '10% de desconto no pagamento antecipado (até 5 dias antes)',
    ]
  }
];

// ─── Estado global do formulário ──────────────────
let state = {
  type: null,       // 'servico' | 'plano'
  selected: null,   // objeto do serviço ou plano
  name: '',
  phone: '',
  date: '',
  time: '',
  obs: ''
};

// ─── Renderiza serviços ───────────────────────────
function renderServices() {
  const grid = document.getElementById('services-grid');
  if (!grid) return;
  grid.innerHTML = SERVICES.map(s => `
    <div class="service-card" onclick="scrollToBooking('${s.id}')">
      <span class="service-name">${s.name}</span>
      <span class="service-price">R$${s.price.toFixed(2).replace('.', ',')}</span>
    </div>
  `).join('');
}

// ─── Renderiza planos ─────────────────────────────
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
      <button class="btn-plan" onclick="scrollToBookingPlan('${p.id}')">Assinar Agora</button>
    </div>
  `).join('');
}

// ─── Scroll helpers ───────────────────────────────
window.scrollToBooking = function(serviceId) {
  document.getElementById('agendar').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => selectType('servico', serviceId), 600);
};
window.scrollToBookingPlan = function(planId) {
  document.getElementById('agendar').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => selectType('plano', planId), 600);
};

// ─── Controle dos passos ──────────────────────────
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
  document.getElementById('step-' + n).classList.add('active');
}

window.goBack = function(n) { showStep(n); };

// ─── Passo 1: tipo ────────────────────────────────
window.selectType = function(type, preselect) {
  state.type = type;
  const isSvc = type === 'servico';

  document.getElementById('step2-title').textContent = isSvc ? 'Escolha o Serviço' : 'Escolha o Plano';

  const list = document.getElementById('options-list');
  const items = isSvc ? SERVICES : PLANS;

  list.innerHTML = items.map(item => `
    <div class="option-item" id="opt-${item.id}" onclick="selectOption('${item.id}')">
      <span>${item.name}</span>
      <span class="option-price">R$${item.price.toFixed ? item.price.toFixed(2).replace('.', ',') : item.price + ',00'}</span>
    </div>
  `).join('');

  showStep(2);

  if (preselect) {
    setTimeout(() => selectOption(preselect), 50);
  }
};

// ─── Passo 2: escolha ─────────────────────────────
window.selectOption = function(id) {
  const items = state.type === 'servico' ? SERVICES : PLANS;
  state.selected = items.find(i => i.id === id);

  document.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
  document.getElementById('opt-' + id)?.classList.add('selected');

  // Define data mínima como hoje
  const dateInput = document.getElementById('pref-date');
  dateInput.min = new Date().toISOString().split('T')[0];

  setTimeout(() => showStep(3), 300);
};

// ─── Passo 3 → 4: validação ───────────────────────
window.goToConfirm = function() {
  const name  = document.getElementById('client-name').value.trim();
  const phone = document.getElementById('client-phone').value.trim();
  const date  = document.getElementById('pref-date').value;
  const time  = document.getElementById('pref-time').value;

  if (!name || !phone || !date || !time) {
    alert('Por favor, preencha todos os campos obrigatórios (*).');
    return;
  }

  state.name  = name;
  state.phone = phone;
  state.date  = date;
  state.time  = time;
  state.obs   = document.getElementById('obs').value.trim();

  renderConfirm();
  showStep(4);
};

function formatDate(d) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}
function formatPrice(p) {
  return 'R$' + Number(p).toFixed(2).replace('.', ',');
}

function renderConfirm() {
  const sel = state.selected;
  document.getElementById('confirm-summary').innerHTML = `
    <div class="confirm-row">
      <label>Tipo</label>
      <span>${state.type === 'servico' ? 'Serviço Avulso' : 'Plano Mensal'}</span>
    </div>
    <div class="confirm-row">
      <label>${state.type === 'servico' ? 'Serviço' : 'Plano'}</label>
      <span>${sel.name}</span>
    </div>
    <div class="confirm-row">
      <label>Cliente</label>
      <span>${state.name}</span>
    </div>
    <div class="confirm-row">
      <label>WhatsApp</label>
      <span>${state.phone}</span>
    </div>
    <div class="confirm-row">
      <label>Data</label>
      <span>${formatDate(state.date)}</span>
    </div>
    <div class="confirm-row">
      <label>Horário</label>
      <span>${state.time}</span>
    </div>
    ${state.obs ? `<div class="confirm-row"><label>Obs.</label><span>${state.obs}</span></div>` : ''}
    <div class="confirm-row confirm-total">
      <label>Valor</label>
      <span>${formatPrice(sel.price)}</span>
    </div>
  `;
}

// ─── Passo 4: salvar no Firebase ──────────────────
window.submitBooking = async function() {
  const btn = document.querySelector('.btn-confirm');
  btn.textContent = 'Enviando...';
  btn.disabled = true;

  try {
    const docData = {
      tipo:       state.type,
      servico:    state.selected.name,
      preco:      state.selected.price,
      cliente:    state.name,
      telefone:   state.phone,
      data:       state.date,
      horario:    state.time,
      obs:        state.obs,
      status:     'pendente',
      criadoEm:   serverTimestamp()
    };

    await addDoc(collection(db, 'agendamentos'), docData);
    document.getElementById('success-modal').classList.add('open');

    // Reset
    state = { type: null, selected: null, name: '', phone: '', date: '', time: '', obs: '' };
    document.getElementById('client-name').value = '';
    document.getElementById('client-phone').value = '';
    document.getElementById('pref-date').value = '';
    document.getElementById('pref-time').value = '';
    document.getElementById('obs').value = '';
    showStep(1);

  } catch (err) {
    console.error('Erro ao salvar:', err);
    alert('Erro ao enviar. Verifique a conexão e tente novamente.');
  } finally {
    btn.textContent = '✓ Confirmar';
    btn.disabled = false;
  }
};

window.closeModal = function() {
  document.getElementById('success-modal').classList.remove('open');
};

// ─── Máscara de telefone ──────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderServices();
  renderPlans();

  const phoneInput = document.getElementById('client-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function() {
      let v = this.value.replace(/\D/g, '').substring(0, 11);
      if (v.length > 6) v = `(${v.substring(0,2)}) ${v.substring(2,7)}-${v.substring(7)}`;
      else if (v.length > 2) v = `(${v.substring(0,2)}) ${v.substring(2)}`;
      else if (v.length > 0) v = `(${v}`;
      this.value = v;
    });
  }
});
