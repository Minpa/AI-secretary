import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { UserController } from '../controllers/user.controller';

const router = Router();
const authController = new AuthController();
const userController = new UserController();

// Authentication
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.post('/auth/refresh', authController.refreshToken);

// User management
router.get('/users', userController.getUsers);
router.post('/users', userController.createUser);
router.get('/users/:id', userController.getUser);
router.patch('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

export { router as adminRoutes };