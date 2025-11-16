import { SimulatorFactory } from '../shared/services/simulator-factory';

async function runWorkingSimulators() {
  await SimulatorFactory.runAllSimulators();
}

if (require.main === module) {
  runWorkingSimulators();
}