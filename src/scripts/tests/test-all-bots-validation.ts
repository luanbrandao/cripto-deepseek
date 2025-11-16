import { UnifiedTestRunner } from '../../shared/services/unified-test-runner';

async function testAllBotsValidation() {
  await UnifiedTestRunner.runAllBotsTest();
}

testAllBotsValidation().catch(console.error);