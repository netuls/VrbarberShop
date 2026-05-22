// ================================================
//  VR BARBER SHOP — Admin Panel JS
// ================================================

import { db, auth } from '../js/firebase-config.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, where, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { SERVICES, PLANS } from '../js/app.js';

// ─── Estado ───────────────────────────────────────
let allAgendamentos = [];
let unsubscribe = null;

// ─── Auth ─────────────────────────────────────────
window.doLogin = async function() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';

  if (!email || !pass) {
    errEl.textContent = 'Preencha e-mail e senha.';
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch(e) {
    const msgs = {
      'auth/invalid-credential': 'E-mail ou senha incorretos.',
      'auth/user-not-found':     'Usuário não encontrado.',
      'auth/wrong-password':     'Senha incorreta.',
      'auth/too-many-requests':  'Muitas tentativas. Aguarde.',
    };
    errEl.textContent = msgs[e.code] || 'Erro ao fazer login.';
  }
};

window.doLogout = async function() {
  if (unsubscribe) unsubscribe();
  await signOut(auth);
};

onAuthStateChanged(auth, user => {
  if (user) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'flex';
    initAdmin();
  } else {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-panel').style.display = 'none';
  }
});

// ─── Init ──────────────────────────────────────────
function initAdmin() {
  updateDate();
  renderServicesTab();
  loadAgendamentos();
}

function updateDate() {
  const el = document.getElementById('admin-date');
  if (el) {
    el.textContent = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}

// ─── Tabs ──────────────────────────────────────────
window.showTab = function(tab, el) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  el.classList.add('active');

  const titles = {
    dashboard: 'Dashboard',
    agendamentos: 'Agendamentos',
    planos: 'Planos Ativos',
    servicos: 'Tabela de Serviços'
  };
  document.getElementById('page-title').textContent = titles[tab];
};

// ─── Firestore: escuta em tempo real ──────────────
function loadAgendamentos() {
  const q = query(collection(db, 'agendamentos'), orderBy('criadoEm', 'desc'));

  unsubscribe = onSnapshot(q, snapshot => {
    allAgendamentos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderDashboard();
    renderAgendamentosTable(allAgendamentos);
    renderPlanosTab();
  });
}

// ─── Dashboard ─────────────────────────────────────
function renderDashboard() {
  const hoje = new Date().toISOString().split('T')[0];
  const deHoje    = allAgendamentos.filter(a => a.data === hoje);
  const pendentes = allAgendamentos.filter(a => a.status === 'pendente');
  const confirmados = allAgendamentos.filter(a => a.status === 'confirmado');

  // Receita do mês (concluídos)
  const mesAtual = new Date().toISOString().slice(0, 7);
  const receitaMes = allAgendamentos
    .filter(a => a.status === 'concluido' && a.data?.startsWith(mesAtual))
    .reduce((acc, a) => acc + (a.preco || 0), 0);

  document.getElementById('stat-hoje').textContent       = deHoje.length;
  document.getElementById('stat-pendentes').textContent  = pendentes.length;
  document.getElementById('stat-confirmados').textContent= confirmados.length;
  document.getElementById('stat-receita').textContent    = 'R$' + receitaMes.toFixed(2).replace('.', ',');

  // Recentes (últimos 8)
  const recent = allAgendamentos.slice(0, 8);
  const el = document.getElementById('recent-list');
  if (!recent.length) {
    el.innerHTML = '<p style="color:var(--gray);padding:20px;font-family:var(--font-head);letter-spacing:1px;">Nenhum agendamento ainda.</p>';
    return;
  }
  el.innerHTML = `
    <table class="admin-table">
      <thead><tr>
        <th>Cliente</th><th>Serviço</th><th>Data</th><th>Horário</th><th>Valor</th><th>Status</th>
      </tr></thead>
      <tbody>
        ${recent.map(a => `
          <tr>
            <td>${a.cliente || '—'}</td>
            <td>${a.servico || '—'}</td>
            <td>${a.data ? formatDate(a.data) : '—'}</td>
            <td>${a.horario || '—'}</td>
            <td style="color:var(--gold);font-family:var(--font-display);font-size:16px;">R$${(a.preco||0).toFixed(2).replace('.', ',')}</td>
            <td>${badgeHTML(a.status)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ─── Agendamentos ─────────────────────────────────
function renderAgendamentosTable(data) {
  const tbody = document.getElementById('agendamentos-body');
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--gray);padding:32px;">Nenhum agendamento encontrado.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(a => `
    <tr>
      <td><strong style="color:var(--white)">${a.cliente || '—'}</strong></td>
      <td>
        <a href="https://wa.me/55${(a.telefone||'').replace(/\D/g,'')}" target="_blank"
           style="color:var(--gold);text-decoration:none;">${a.telefone || '—'}</a>
      </td>
      <td>${a.servico || '—'}</td>
      <td><span style="font-size:11px;letter-spacing:1px;color:var(--gray);font-family:var(--font-head)">
        ${a.tipo === 'plano' ? 'PLANO' : 'SERVIÇO'}
      </span></td>
      <td>${a.data ? formatDate(a.data) : '—'}</td>
      <td>${a.horario || '—'}</td>
      <td style="color:var(--gold);font-family:var(--font-display);font-size:18px;">
        R$${(a.preco||0).toFixed(2).replace('.', ',')}
      </td>
      <td>${badgeHTML(a.status)}</td>
      <td>
        <div class="action-btns">
          ${a.status === 'pendente' ? `
            <button class="btn-action btn-confirmar" onclick="updateStatus('${a.id}','confirmado')">Confirmar</button>
          ` : ''}
          ${a.status === 'confirmado' ? `
            <button class="btn-action btn-concluir" onclick="updateStatus('${a.id}','concluido')">Concluir</button>
          ` : ''}
          ${['pendente','confirmado'].includes(a.status) ? `
            <button class="btn-action btn-cancelar" onclick="updateStatus('${a.id}','cancelado')">Cancelar</button>
          ` : ''}
          <a class="btn-action btn-whats"
             href="https://wa.me/55${(a.telefone||'').replace(/\D/g,'')}" target="_blank">WhatsApp</a>
        </div>
      </td>
    </tr>
  `).join('');
}

// ─── Filtros ───────────────────────────────────────
window.applyFilters = function() {
  const status = document.getElementById('filter-status').value;
  const date   = document.getElementById('filter-date').value;
  const search = document.getElementById('filter-search').value.toLowerCase();

  let filtered = allAgendamentos;
  if (status) filtered = filtered.filter(a => a.status === status);
  if (date)   filtered = filtered.filter(a => a.data === date);
  if (search) filtered = filtered.filter(a =>
    (a.cliente || '').toLowerCase().includes(search) ||
    (a.servico  || '').toLowerCase().includes(search)
  );

  renderAgendamentosTable(filtered);
};

// ─── Update status ────────────────────────────────
window.updateStatus = async function(id, status) {
  try {
    await updateDoc(doc(db, 'agendamentos', id), { status, atualizadoEm: serverTimestamp() });
  } catch(e) {
    alert('Erro ao atualizar status.');
  }
};

// ─── Planos tab ───────────────────────────────────
function renderPlanosTab() {
  const planos = allAgendamentos.filter(a => a.tipo === 'plano');
  const tbody = document.getElementById('planos-body');
  if (!tbody) return;

  if (!planos.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray);padding:32px;">Nenhum plano ativo.</td></tr>';
    return;
  }

  tbody.innerHTML = planos.map(a => `
    <tr>
      <td><strong style="color:var(--white)">${a.cliente || '—'}</strong></td>
      <td><a href="https://wa.me/55${(a.telefone||'').replace(/\D/g,'')}" target="_blank"
         style="color:var(--gold);text-decoration:none;">${a.telefone || '—'}</a></td>
      <td>${a.servico || '—'}</td>
      <td style="color:var(--gold);font-family:var(--font-display);font-size:18px;">
        R$${(a.preco||0).toFixed(2).replace('.', ',')}
      </td>
      <td>${a.data ? formatDate(a.data) : '—'}</td>
      <td>${badgeHTML(a.status)}</td>
      <td>
        <a class="btn-action btn-whats"
           href="https://wa.me/55${(a.telefone||'').replace(/\D/g,'')}" target="_blank">WhatsApp</a>
      </td>
    </tr>
  `).join('');
}

// ─── Serviços tab ─────────────────────────────────
function renderServicesTab() {
  const grid = document.getElementById('services-admin-grid');
  if (!grid) return;
  const all = [...SERVICES, ...PLANS.map(p => ({ ...p, fromPlan: true }))];
  grid.innerHTML = SERVICES.map(s => `
    <div class="service-admin-card">
      <span class="service-admin-name">${s.name}</span>
      <span class="service-admin-price">R$${s.price.toFixed(2).replace('.', ',')}</span>
    </div>
  `).join('') + `
    <div style="grid-column:1/-1;margin-top:16px;">
      <h3 style="font-family:var(--font-head);letter-spacing:2px;color:var(--gold);text-transform:uppercase;margin-bottom:16px;">Planos</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
        ${PLANS.map(p => `
          <div class="service-admin-card" style="flex-direction:column;align-items:flex-start;gap:8px;">
            <span class="service-admin-name">${p.name}</span>
            <span class="service-admin-price">R$${p.price},00<span style="font-size:14px;color:var(--gray);font-family:var(--font-head)">/mês</span></span>
            <ul style="list-style:none;margin-top:4px;">
              ${p.features.map(f=>`<li style="font-size:12px;color:var(--gray);padding:2px 0;">• ${f}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ─── CSV Export ───────────────────────────────────
window.exportCSV = function() {
  const rows = [
    ['Cliente','WhatsApp','Serviço/Plano','Tipo','Data','Horário','Valor (R$)','Status','Observações']
  ];
  allAgendamentos.forEach(a => {
    rows.push([
      a.cliente || '',
      a.telefone || '',
      a.servico  || '',
      a.tipo === 'plano' ? 'Plano' : 'Serviço',
      a.data    || '',
      a.horario || '',
      (a.preco  || 0).toFixed(2).replace('.', ','),
      a.status  || '',
      a.obs     || ''
    ]);
  });

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `agendamentos_vr_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Helpers ──────────────────────────────────────
function formatDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function badgeHTML(status) {
  const labels = {
    pendente:   'Pendente',
    confirmado: 'Confirmado',
    concluido:  'Concluído',
    cancelado:  'Cancelado'
  };
  return `<span class="badge badge-${status||'pendente'}">${labels[status] || status}</span>`;
}
