import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth';
import { adminAuthMiddleware } from '../middleware/adminAuth';

const router = Router();

// All admin routes require authentication + admin role
router.use(authMiddleware, adminAuthMiddleware);

// Test CRUD
router.get('/tests', adminController.getAllTests);
router.get('/tests/:testId', adminController.getTestById);
router.post('/tests', adminController.createTest);
router.put('/tests/:testId', adminController.updateTest);
router.delete('/tests/:testId', adminController.deleteTest);
router.post('/tests/:testId/publish', adminController.publishTest);
router.post('/tests/:testId/blueprint', adminController.setToeflIbtBlueprint);
router.get('/tests/:testId/blueprint/validate', adminController.validateToeflIbtBlueprint);
router.get('/tests/:testId/pte-blueprint/validate', adminController.validatePteBlueprint);

// Section CRUD
router.post('/tests/:testId/sections', adminController.createSection);
router.put('/sections/:sectionId', adminController.updateSection);
router.delete('/sections/:sectionId', adminController.deleteSection);

// Question CRUD
router.get('/tests/:testId/sections/:sectionId/questions', adminController.getQuestionsBySection);
router.get('/sections/:sectionId/questions', adminController.getQuestionsBySection);
router.post('/tests/:testId/sections/:sectionId/questions', adminController.createQuestion);
router.post('/sections/:sectionId/questions', adminController.createQuestion);

// Bulk question creation (TOEFL ITP only)
router.post('/sections/:sectionId/questions/bulk', adminController.bulkCreateQuestions);

// Bulk question creation (IELTS only)
router.post('/sections/:sectionId/questions/bulk-ielts', adminController.bulkCreateIELTSQuestions);
// Bulk question creation (TOEFL iBT only)
router.post('/sections/:sectionId/questions/bulk-toefl-ibt', adminController.bulkCreateToeflIbtQuestions);
router.put('/tests/:testId/sections/:sectionId/questions/:questionId', adminController.updateQuestion);
router.put('/questions/:questionId', adminController.updateQuestion);
router.delete('/tests/:testId/sections/:sectionId/questions/:questionId', adminController.deleteQuestion);
router.delete('/questions/:questionId', adminController.deleteQuestion);

// Users
router.get('/users', adminController.getUsers);
router.get('/users/:userId', adminController.getUserById);
router.put('/users/:userId/role', adminController.updateUserRole);
router.get('/users/:userId/attempts', adminController.getUserAttempts);

// Dashboard stats
router.get('/dashboard/stats', adminController.getDashboardStats);

export default router;
