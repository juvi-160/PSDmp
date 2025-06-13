import express from 'express';
import { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent, upload } from '../controllers/eventsController.js';


const router = express.Router();

// Public routes - accessible to all
router.get('/', getAllEvents);
router.get('/:id', getEventById);

// Protected routes - admin only
router.post('/', upload.single('image'), createEvent);
router.put('/:id',  upload.single('image'), updateEvent);
router.delete('/:id',  deleteEvent);

export default router;