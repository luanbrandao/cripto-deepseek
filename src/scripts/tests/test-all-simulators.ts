import { UnifiedTestRunner } from '../../shared/services/unified-test-runner';

async function testAllSimulators() {
  await UnifiedTestRunner.runAllSimulatorsTest();
}

testAllSimulators().catch(console.error);