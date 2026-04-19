import { pool } from './src/config/database';
import * as testModel from './src/models/test.model';
import * as testService from './src/services/test.service';

async function run() {
  const targetId = '8cff5ed4-304e-4763-8942-28fcd4cd5b12';
  console.log(`Testing findById for ID: ${targetId}`);
  try {
    const test = await testModel.findById(targetId);
    console.log('Result from model:', test);
    
    console.log('Testing service getTestById:');
    try {
      await testService.getTestById(targetId);
    } catch (err: any) {
      console.log('Caught expected service error:', err.name, err.message, err.statusCode);
    }
  } catch (err) {
    console.error('CRITICAL ERROR:', err);
  } finally {
    await pool.end();
  }
}

run();
