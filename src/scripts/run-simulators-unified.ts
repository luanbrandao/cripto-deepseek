/**
 * 🚀 UNIFIED SIMULATOR RUNNER
 * Runs simulators using the new SimulatorFactory
 */

import { SimulatorFactory, SimulatorType } from '../shared/services/simulator-factory';

async function runSimulatorsUnified() {
  console.log('🚀 UNIFIED SIMULATOR RUNNER\n');
  
  try {
    // Option 1: Run all simulators
    console.log('📊 Running all available simulators...');
    await SimulatorFactory.runAllSimulators();
    
    console.log('\n' + '='.repeat(50));
    
    // Option 2: Run specific simulators
    console.log('\n📋 Running specific simulators...');
    const specificTypes: SimulatorType[] = ['real-bot', 'smart-bot-buy'];
    const results = await SimulatorFactory.runMultipleSimulators(specificTypes);
    
    console.log('\n📊 Specific Results:');
    for (const [type, result] of results) {
      console.log(`${result.success ? '✅' : '❌'} ${type}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    }
    
    console.log('\n🎉 All simulations completed!');
    
  } catch (error) {
    console.error('❌ Error running simulators:', error);
  }
}

if (require.main === module) {
  runSimulatorsUnified();
}