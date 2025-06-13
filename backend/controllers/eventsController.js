import Event from "../model/eventsModel.js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import multer from "multer"

// Get directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/events")

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, "event-" + uniqueSuffix + ext)
  },
})

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(new Error("Only image files are allowed!"), false)
  }
}

// Set up multer upload
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: fileFilter,
})

// Get all events
export const getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.findAll({
      order: [["date", "DESC"]],
    })

    // Format the response
    const formattedEvents = events.map((event) => ({
      id: event.id,
      name: event.name,
      description: event.description,
      date: event.date,
      image: event.image ? `${req.protocol}://${req.get("host")}/uploads/events/${event.image}` : null,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
    }))

    res.status(200).json(formattedEvents)
  } catch (error) {
    console.error("Error in getAllEvents:", error)
    next(error)
  }
}

// Get event by ID
export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params

    const event = await Event.findByPk(id)

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    // Format the response
    const formattedEvent = {
      id: event.id,
      name: event.name,
      description: event.description,
      date: event.date,
      image: event.image ? `${req.protocol}://${req.get("host")}/uploads/events/${event.image}` : null,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
    }

    res.status(200).json(formattedEvent)
  } catch (error) {
    console.error("Error in getEventById:", error)
    next(error)
  }
}

// Create new event
export const createEvent = async (req, res, next) => {
  try {
    const { name, description, date } = req.body

    // Validate required fields
    if (!name || !description || !date) {
      return res.status(400).json({ message: "Name, description, and date are required" })
    }

    let imagePath = null

    // If file was uploaded
    if (req.file) {
      imagePath = req.file.filename
    }

    // Create event
    const event = await Event.create({
      name,
      description,
      date: new Date(date),
      image: imagePath,
    })

    res.status(201).json({
      id: event.id,
      name: event.name,
      description: event.description,
      date: event.date,
      image: event.image ? `${req.protocol}://${req.get("host")}/uploads/events/${event.image}` : null,
    })
  } catch (error) {
    console.error("Error in createEvent:", error)
    next(error)
  }
}

// Update event
export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, description, date } = req.body

    // Check if event exists
    const event = await Event.findByPk(id)

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    let imagePath = event.image

    // If new file was uploaded
    if (req.file) {
      // Delete old image if exists
      if (event.image) {
        const oldImagePath = path.join(__dirname, "../uploads/events", event.image)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }

      imagePath = req.file.filename
    }

    // Update event
    await event.update({
      name,
      description,
      date: new Date(date),
      image: imagePath,
    })

    res.status(200).json({
      id: event.id,
      name: event.name,
      description: event.description,
      date: event.date,
      image: event.image ? `${req.protocol}://${req.get("host")}/uploads/events/${event.image}` : null,
    })
  } catch (error) {
    console.error("Error in updateEvent:", error)
    next(error)
  }
}

// Delete event
export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params

    // Check if event exists
    const event = await Event.findByPk(id)

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    // Delete image if exists
    if (event.image) {
      const imagePath = path.join(__dirname, "../uploads/events", event.image)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }

    // Delete event
    await event.destroy()

    res.status(200).json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Error in deleteEvent:", error)
    next(error)
  }
}

// Export all functions for use in routes
export default {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  upload, // Export multer upload middleware
}