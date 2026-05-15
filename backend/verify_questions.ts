import { pool, query } from './src/config/database';
import * as questionModel from './src/models/question.model';

async function verify() {
  console.log('Verifying questions table schema...');
  try {
    // 1. Check if column exists via raw query
    const schemaCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'explanation_ai'
    `);
    
    if (schemaCheck.rows.length > 0) {
      console.log('SUCCESS: explanation_ai column exists.');
    } else {
      console.log('FAILURE: explanation_ai column is MISSING.');
    }

    // 2. Try fetching a few questions using the model (which uses SELECT_COLUMNS)
    console.log('Testing questionModel.findBySectionId...');
    const dummyId = '00000000-0000-0000-0000-000000000000';
    await questionModel.findBySectionId(dummyId);
    console.log('SUCCESS: questionModel query executed without errors.');

  } catch (err: any) {
    console.error('ERROR during verification:', err.message);
    if (err.message.includes('explanation_ai')) {
      console.error('CONFIRMED: The error is related to the missing explanation_ai column.');
    }
  } finally {
    await pool.end();
  }
}

verify();
