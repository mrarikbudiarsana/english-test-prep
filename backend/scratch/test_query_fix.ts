import * as userModel from '../src/models/user.model';
import * as attemptModel from '../src/models/attempt.model';
import { query } from '../src/config/database';
import dotenv from 'dotenv';

dotenv.config();

async function runTest() {
  console.log('--- Testing userModel.findAll with search parameter ---');
  try {
    const userResult = await userModel.findAll(0, 50, 'ri:1');
    console.log('✅ userModel.findAll succeeded!');
    console.log(`Returned rows: ${userResult.rows.length}, Total count: ${userResult.total}`);
  } catch (error) {
    console.error('❌ userModel.findAll failed:', error);
  }

  console.log('\n--- Testing attemptModel.findAllCompleted with search parameter ---');
  try {
    const attemptResult = await attemptModel.findAllCompleted(0, 50, 'ri:1');
    console.log('✅ attemptModel.findAllCompleted succeeded!');
    console.log(`Returned rows: ${attemptResult.rows.length}, Total count: ${attemptResult.total}`);
  } catch (error) {
    console.error('❌ attemptModel.findAllCompleted failed:', error);
  }

  process.exit(0);
}

runTest();
