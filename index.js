const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

// ─── Configurações da Evolution API ───────────────────────────────────────────
// Troque pelos seus valores reais após instalar a Evolution API
const EVOLUTION_API_URL = "https://SEU_SERVIDOR:8080"; // Ex: https://api.vrbarber.com.br:8080
const EVOLUTION_API_KEY = "SUA_API_KEY_AQUI";          // A apikey que você definiu na instalação
const EVOLUTION_INSTANCE = "VRBarberShop";             // Nome da sua instância criada

// ─── Roda a cada 10 minutos ───────────────────────────────────────────────────
exports.lembreteAgendamento = functions
  .region("southamerica-east1")       // Servidor em São Paulo (menor latência)
  .pubsub.schedule("every 10 minutes")
  .timeZone("America/Fortaleza")
  .onRun(async () => {
    const agora = new Date();

    // Janela de 30 min: de agora+25min até agora+35min (evita disparar 2x)
    const inicio = new Date(agora.getTime() + 25 * 60 * 1000);
    const fim    = new Date(agora.getTime() + 35 * 60 * 1000);

    const dataHoje = agora.toISOString().split("T")[0]; // "2026-05-23"

    // Formata como "HH:MM" para comparar com o campo horario do Firestore
    const horaInicio = formatHora(inicio);
    const horaFim    = formatHora(fim);

    console.log(`Verificando agendamentos entre ${horaInicio} e ${horaFim} para ${dataHoje}`);

    try {
      // Busca agendamentos de hoje que ainda não foram cancelados
      const snap = await db.collection("agendamentos")
        .where("data",   "==", dataHoje)
        .where("status", "in", ["pendente", "confirmado"])
        .get();

      if (snap.empty) {
        console.log("Nenhum agendamento hoje.");
        return null;
      }

      const promessas = [];

      snap.forEach((doc) => {
        const ag = doc.data();
        if (!ag.horario || !ag.telefone) return;

        // Verifica se o horário do agendamento cai na janela de 25-35 min
        if (ag.horario >= horaInicio && ag.horario <= horaFim) {
          // Verifica se o lembrete ainda não foi enviado (evita reenvio)
          if (ag.lembreteEnviado) {
            console.log(`Lembrete já enviado para agendamento ${doc.id}`);
            return;
          }

          console.log(`Enviando lembrete para ${ag.cliente || ag.nome} - ${ag.horario}`);
          promessas.push(enviarLembrete(doc.id, ag));
        }
      });

      await Promise.allSettled(promessas);
      console.log(`Processados ${promessas.length} lembretes.`);
    } catch (err) {
      console.error("Erro ao buscar agendamentos:", err);
    }

    return null;
  });

// ─── Envia a mensagem via Evolution API e marca como enviado ─────────────────
async function enviarLembrete(docId, ag) {
  const nome      = ag.cliente || ag.nome || "Cliente";
  const primeiroNome = nome.split(" ")[0];
  const servico   = ag.servico || "serviço";
  const horario   = ag.horario;
  const telefone  = limparTelefone(ag.telefone);

  if (!telefone) {
    console.warn(`Telefone inválido para agendamento ${docId}: ${ag.telefone}`);
    return;
  }

  const mensagem =
    `Olá, ${primeiroNome}! 💈\n\n` +
    `Seu horário na *VR Barber Shop* está chegando!\n\n` +
    `⏰ *${horario}* — ${servico}\n\n` +
    `Te esperamos em breve. Até logo! ✂️`;

  try {
    await axios.post(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        number:  `55${telefone}`,
        text:    mensagem,
        options: { delay: 1200 },
      },
      {
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        timeout: 10000,
      }
    );

    // Marca lembrete como enviado no Firestore para não reenviar
    await db.collection("agendamentos").doc(docId).update({
      lembreteEnviado:   true,
      lembreteEnviadoEm: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Lembrete enviado para ${telefone} (${primeiroNome})`);
  } catch (err) {
    const status = err.response?.status;
    const body   = JSON.stringify(err.response?.data || err.message);
    console.error(`❌ Erro ao enviar para ${telefone}: HTTP ${status} — ${body}`);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatHora(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function limparTelefone(tel) {
  if (!tel) return null;
  const limpo = tel.replace(/\D/g, "");
  // Aceita 10 ou 11 dígitos (com ou sem o 9 do celular)
  return limpo.length >= 10 && limpo.length <= 11 ? limpo : null;
}
