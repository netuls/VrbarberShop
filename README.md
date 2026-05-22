# ✂️ VR Barber Shop — Sistema Completo

Sistema de agendamento para barbearia com painel administrativo, construído com HTML/CSS/JS puro e Firebase como banco de dados.

---

## 📁 Estrutura do Projeto

```
vr-barbershop/
├── index.html              # Página principal (cliente)
├── css/
│   └── style.css           # Estilos globais
├── js/
│   ├── firebase-config.js  # ⚠️ Configuração do Firebase (editar aqui)
│   └── app.js              # Lógica da página do cliente
├── admin/
│   ├── index.html          # Painel administrativo
│   ├── admin.css           # Estilos do admin
│   └── admin.js            # Lógica do admin
├── assets/
│   └── logo.png            # Logo da barbearia
└── README.md
```

---

## 🔥 Configuração do Firebase (Passo a Passo)

### 1. Criar projeto no Firebase
1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"**
3. Nome: `vr-barbershop` → Continuar
4. Desative o Google Analytics (opcional) → **Criar projeto**

### 2. Ativar Firestore
1. No menu lateral: **Firestore Database** → **Criar banco de dados**
2. Escolha **Modo de produção** → Próximo
3. Selecione a região: `southamerica-east1 (São Paulo)` → **Ativar**

### 3. Configurar regras do Firestore
Vá em **Firestore → Regras** e cole:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Qualquer um pode criar agendamento (formulário público)
    match /agendamentos/{doc} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
  }
}
```
Clique em **Publicar**.

### 4. Ativar Authentication
1. Menu: **Authentication** → **Começar**
2. Aba **Sign-in method** → Ative **E-mail/senha**
3. Aba **Usuários** → **Adicionar usuário**
4. Crie o login do administrador (ex: `admin@vrbarbershop.com`)

### 5. Copiar as credenciais
1. Engrenagem ⚙️ → **Configurações do projeto**
2. Role até "Seus aplicativos" → clique em `</>` (Web)
3. Registre o app com qualquer apelido
4. Copie o objeto `firebaseConfig`

### 6. Colar no projeto
Abra `js/firebase-config.js` e substitua os valores:
```javascript
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "vr-barbershop.firebaseapp.com",
  projectId:         "vr-barbershop",
  storageBucket:     "vr-barbershop.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123"
};
```

---

## 🚀 Deploy no GitHub Pages

### 1. Criar repositório
```bash
git init
git add .
git commit -m "feat: sistema VR Barber Shop"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/vr-barbershop.git
git push -u origin main
```

### 2. Ativar GitHub Pages
1. No repositório → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` → pasta: `/ (root)` → **Save**
4. Seu site estará em: `https://SEU_USUARIO.github.io/vr-barbershop/`

### 3. Adicionar domínio autorizado no Firebase
1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Adicione: `SEU_USUARIO.github.io`

---

## 🔐 Acesso ao Painel Admin

- URL: `https://SEU_USUARIO.github.io/vr-barbershop/admin/`
- Use as credenciais criadas no Firebase Authentication

---

## 💈 Serviços Cadastrados

| Serviço | Preço |
|---|---|
| Corte | R$25,00 |
| Corte + Sobrancelha | R$30,00 |
| Corte + Barba | R$45,00 |
| Corte + Barba + Sobrancelha | R$45,00 |
| Barba | R$20,00 |
| Sobrancelha | R$5,00 |
| Nevou + Corte | R$90,00 |
| Luzes + Corte | R$75,00 |
| Hidratação | R$10,00 |

---

## ⭐ Planos

| Plano | Preço | Benefícios |
|---|---|---|
| Básico | R$80/mês | 4 cortes/mês, prioridade, 5% desconto antecipado |
| Essencial | R$105/mês | Corte + Sobrancelha ilimitado, prioridade, 5% desconto |
| Premium | R$135/mês | Corte + Barba + Sobrancelha ilimitado, brinde lavagem, 10% desconto |

---

## 📱 Funcionalidades

**Site do Cliente:**
- Listagem de todos os serviços e preços
- Cards dos planos com benefícios
- Formulário de agendamento em 4 passos
- Máscara de telefone automática
- Salvamento direto no Firebase

**Painel Admin:**
- Login seguro com Firebase Auth
- Dashboard com estatísticas em tempo real
- Lista de agendamentos com filtros
- Atualização de status (Pendente → Confirmado → Concluído)
- Link direto para WhatsApp do cliente
- Exportação para CSV
- Aba de planos ativos separada
- Tabela de preços dos serviços

---

*VR Barber Shop © 2019. Todos os direitos reservados.*
