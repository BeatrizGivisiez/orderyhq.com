/**
 * Firebase Functions Exemplo.
 * O usuário pediu código de funções serverless em caso de necessidade.
 * Como o Trigger do WhatsApp foi desenvolvido de forma Client-Side (1-click),
 * as funções aqui ficam prontas para rotinas de backend, 
 * como enviar e-mail ao criar conta ou limpar orders antigos.
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");

/**
 * Exemplo de função: Avisar log no console (ou integrar via API de e-mail)
 * Sempre que um tenant for criado.
 */
exports.onTenantCreated = onDocumentCreated("tenants/{tenantId}", (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.log("No data associated with the event");
    return;
  }
  const data = snapshot.data();
  logger.info(`Novo restaurante cadastrado: ${data.name}`);
});

/**
 * Exemplo de função: Auto-cancelamento (Limpeza de BD)
 * Pode ser agendada via pubsub se desejado.
 */
// const { onSchedule } = require("firebase-functions/v2/scheduler");
// exports.cleanupOldOrders = onSchedule("every 24 hours", async (event) => { ... });
