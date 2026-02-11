import { Router } from 'express';
import * as PricingModel from '../models/pricing.model';
import { authMiddleware as requireAuth } from '../middleware/auth';
import { adminAuthMiddleware as requireAdmin } from '../middleware/adminAuth';

const router = Router();

// GET /api/pricing - Public endpoint to fetch active plans
router.get('/', async (req, res) => {
    try {
        const plans = await PricingModel.findAll(false); // Only active plans
        res.json(plans);
    } catch (error) {
        console.error('Error fetching pricing plans:', error);
        res.status(500).json({ error: 'Failed to fetch pricing plans' });
    }
});

// GET /api/pricing/admin - Admin only, fetch all plans (including inactive)
router.get('/admin', requireAuth, requireAdmin, async (req, res) => {
    try {
        const plans = await PricingModel.findAll(true); // Include inactive
        res.json(plans);
    } catch (error) {
        console.error('Error fetching admin pricing plans:', error);
        res.status(500).json({ error: 'Failed to fetch pricing plans' });
    }
});

// POST /api/pricing - Admin only, create a new plan
router.post('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const plan = await PricingModel.create(req.body);
        res.status(201).json(plan);
    } catch (error) {
        console.error('Error creating pricing plan:', error);
        res.status(500).json({ error: 'Failed to create pricing plan' });
    }
});

// PUT /api/pricing/:id - Admin only, update a plan
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid plan ID' });
        }

        const plan = await PricingModel.update(id, req.body);
        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        res.json(plan);
    } catch (error) {
        console.error('Error updating pricing plan:', error);
        res.status(500).json({ error: 'Failed to update pricing plan' });
    }
});

// DELETE /api/pricing/:id - Admin only, delete a plan
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid plan ID' });
        }

        await PricingModel.remove(id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting pricing plan:', error);
        res.status(500).json({ error: 'Failed to delete pricing plan' });
    }
});

export default router;
