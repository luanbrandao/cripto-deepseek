// Consolidação dos gerenciadores de fluxo
export { BotFlowManager } from './execution/bot-flow-manager';
export { executeAndSaveTradeWithValidation, handleBotError } from './execution/bot-executor';
export { initializeBotClients, validateTradingConditions } from './execution/bot-initializer';
export { saveTradeHistory } from './execution/trade-history-saver';