// ================================================
//  VR BARBER SHOP — App Principal (Cliente)
// ================================================

import { db } from './firebase-config.js';
import {
  collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const WHATSAPP_NUMBER = '5585994044941';

// ─── Serviços ─────────────────────────────────────
export const SERVICES = [
  { id: 'corte',             name: 'Corte',                        price: 25 },
  { id: 'corte_sobrancelha', name: 'Corte + Sobrancelha',         price: 30 },
  { id: 'corte_barba',       name: 'Corte + Barba',                price: 45 },
  { id: 'corte_barba_sob',   name: 'Corte + Barba + Sobrancelha', price: 45 },
  { id: 'barba',             name: 'Barba',                        price: 20 },
  { id: 'sobrancelha',       name: 'Sobrancelha',                  price: 5  },
  { id: 'nevou_corte',       name: 'Nevou + Corte',                price: 90 },
  { id: 'luzes_corte',       name: 'Luzes + Corte',                price: 75 },
  { id: 'hidratacao',        name: 'Hidratação',                   price: 10 },
];

// ─── Planos ────────────────────────────────────────
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

// ─── Estado ────────────────────────────────────────
let state = {
  selected: null,
  name: '',
  phone: '',
  date: '',
  time: '',
  obs: ''
};

// ─── Renderiza cards de serviços (seção visual) ────
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

// ─── Renderiza planos — botão "Assinar Agora" abre WhatsApp ─
function renderPlans() {
  const grid = document.getElementById('plans-grid');
  if (!grid) return;
  grid.innerHTML = PLANS.map(p => {
    const msg = encodeURIComponent(
      `Olá! Quero assinar o Plano ${p.name} da VR Barber Shop por R$${p.price}/mês. Pode me ajudar?`
    );
    return `
    <div class="plan-card ${p.featured ? 'featured' : ''}">
      ${p.badge ? `<div class="plan-badge">${p.badge}</div>` : ''}
      <div class="plan-name">${p.name}</div>
      <div class="plan-price">R$${p.price}</div>
      <div class="plan-price-sub">/ MÊS</div>
      <div class="plan-divider"></div>
      <ul class="plan-features">
        ${p.features.map(f => `<li>${f}</li>`).join('')}
      </ul>
      <a class="btn-plan"
         href="https://wa.me/${WHATSAPP_NUMBER}?text=${msg}"
         target="_blank">
        Assinar Agora
      </a>
    </div>
  `}).join('');
}

// ─── Scroll para agendamento + pré-seleciona serviço ─
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
    if (item) {
      item.classList.add('selected');
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    showStep(2);
  }, 50);
}

// ─── Renderiza lista de serviços no formulário ─────
function renderServiceOptions() {
  const list = document.getElementById('options-list');
  if (!list) return;
  list.innerHTML = SERVICES.map(s => `
    <div class="option-item" id="opt-${s.id}" onclick="selectService('${s.id}')">
      <span>${s.name}</span>
      <span class="option-price">R$${s.price.toFixed(2).replace('.', ',')}</span>
    </div>
  `).join('');
}

// ─── Seleciona serviço e avança para Dados ─────────
window.selectService = function(id) {
  state.selected = SERVICES.find(s => s.id === id);
  document.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
  const item = document.getElementById('opt-' + id);
  if (item) item.classList.add('selected');

  const dateInput = document.getElementById('pref-date');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

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

// ─── Passo 2 → 3: valida dados e mostra resumo ─────
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
    </div>
  `;
}

// ─── Passo 3: salva no Firebase e exibe modal ──────
window.submitBooking = async function() {
  const btn = document.querySelector('.btn-confirm');
  btn.textContent = 'Enviando...';
  btn.disabled = true;

  try {
    await addDoc(collection(db, 'agendamentos'), {
      tipo:     'servico',
      servico:  state.selected.name,
      preco:    state.selected.price,
      cliente:  state.name,
      telefone: state.phone,
      data:     state.date,
      horario:  state.time,
      obs:      state.obs,
      status:   'pendente',
      criadoEm: serverTimestamp()
    });

    document.getElementById('success-modal').classList.add('open');

    // Reset
    state = { selected: null, name: '', phone: '', date: '', time: '', obs: '' };
    document.getElementById('client-name').value = '';
    document.getElementById('client-phone').value = '';
    document.getElementById('pref-date').value = '';
    document.getElementById('pref-time').value = '';
    document.getElementById('obs').value = '';
    renderServiceOptions();
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

// ─── Máscara de telefone ───────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderServices();
  renderPlans();
  renderServiceOptions();

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
