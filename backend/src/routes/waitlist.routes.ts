import { Router } from 'express';
import * as WaitlistModel from '../models/waitlist.model';
import { firebaseAuth } from '../config/firebase-admin';
import { query } from '../config/database';

const router = Router();

// Optional authentication middleware to associate user if logged in
async function optionalAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await firebaseAuth.verifyIdToken(token);
      
      const { rows } = await query(
        'SELECT id, firebase_uid, email, display_name, role FROM users WHERE firebase_uid = $1',
        [decodedToken.uid]
      );
      
      if (rows.length > 0) {
        req.user = {
          id: rows[0].id,
          firebaseUid: rows[0].firebase_uid,
          email: rows[0].email,
          displayName: rows[0].display_name,
          role: rows[0].role,

        };
      }
    }
    next();
  } catch (error) {
    // If invalid token, just continue as guest
    next();
  }
}

// POST /api/v1/waitlist/join
router.post('/join', optionalAuth, async (req, res) => {
  try {
    const { email, planId } = req.body;
    
    if (!email || !planId) {
      return res.status(400).json({ error: 'Email and Plan ID are required' });
    }
    
    const userId = req.user?.id || null;
    const finalEmail = req.user?.email || email;

    // Check if already on the waitlist
    const alreadyJoined = await WaitlistModel.checkWaitlistStatus(finalEmail, planId, userId);
    if (alreadyJoined) {
      return res.status(400).json({ error: 'You have already joined the waitlist for this plan' });
    }

    const entry = await WaitlistModel.joinWaitlist({
      userId,
      email: finalEmail,
      planId,
    });

    res.status(201).json({ message: 'Successfully joined the waitlist', entry });
  } catch (error: any) {
    console.error('Error joining waitlist:', error);
    
    // Handle unique constraint violation gracefully if duplicate request runs in parallel
    if (error.code === '23505') {
      return res.status(400).json({ error: 'You have already joined the waitlist for this plan' });
    }

    res.status(500).json({ error: 'Failed to join waitlist. Please try again later.' });
  }
});

export default router;
