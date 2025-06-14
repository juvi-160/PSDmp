import User from "../model/userModel.js"
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file


// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    // Get Auth0 user ID from token with proper validation
    const sub = req.auth?.sub || req.auth?.payload?.sub
    if (!sub) {
      console.error("Invalid auth object:", req.auth)
      return res.status(401).json({ message: "Invalid authentication token" })
    }

    // Validate user ID before query
    const userId = String(sub).trim()
    if (!userId) {
      return res.status(400).json({ message: "Invalid user ID" })
    }

    const user = await User.findOne({
      where: { auth0_id: userId },
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Convert snake_case to camelCase for frontend
    const formattedUser = {
      id: user.id,
      auth0Id: user.auth0_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmailVerified: Boolean(user.is_email_verified),
      isPhoneVerified: Boolean(user.is_phone_verified),
      hasPaid: Boolean(user.has_paid),
      ageGroup: user.age_group,
      profession: user.profession,
      city: user.city,
      areasOfInterest: user.areas_of_interest ? JSON.parse(user.areas_of_interest) : [],
      whyPsf: user.why_psf,
      profilePicture: user.profile_picture,
      profileCompleted: Boolean(user.profile_completed),
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }

    res.status(200).json(formattedUser)
  } catch (error) {
    console.error("Error getting user profile:", error)
    res.status(500).json({ message: "Server error" })
  }
}

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    // Get and validate user ID
    const sub = req.auth?.sub || req.auth?.payload?.sub
    if (!sub) {
      return res.status(401).json({ message: "Invalid authentication token" })
    }
    const userId = String(sub).trim()

    // Destructure with default values
    const {
      phone = null,
      ageGroup = null,
      profession = null,
      city = null,
      areasOfInterest = null,
      whyPsf = null,
    } = req.body

    // Validate age group if provided
    const validAgeGroups = ["18-25", "26-35", "36-45", "46-55", "56-65", "65+"]
    if (ageGroup && !validAgeGroups.includes(ageGroup)) {
      return res.status(400).json({ message: "Invalid age group" })
    }

    // Validate areas of interest format
    if (areasOfInterest && !Array.isArray(areasOfInterest)) {
      return res.status(400).json({ message: "Areas of interest must be an array" })
    }

    // Check existing user
    const currentUser = await User.findOne({
      where: { auth0_id: userId },
    })

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" })
    }

    const willBeCompleted = Boolean(
      (phone ?? currentUser.phone) &&
        (ageGroup ?? currentUser.age_group) &&
        (profession ?? currentUser.profession) &&
        (city ?? currentUser.city) &&
        (areasOfInterest ?? currentUser.areas_of_interest) &&
        (whyPsf ?? currentUser.why_psf),
    )

    // Convert undefined to null for SQL
    const safeAreasOfInterest = areasOfInterest ? JSON.stringify(areasOfInterest) : null

    // Update user
    await currentUser.update({
      phone: phone || currentUser.phone,
      age_group: ageGroup || currentUser.age_group,
      profession: profession || currentUser.profession,
      city: city || currentUser.city,
      areas_of_interest: safeAreasOfInterest || currentUser.areas_of_interest,
      why_psf: whyPsf || currentUser.why_psf,
      profile_completed: willBeCompleted,
    })

    // Reload to get updated data
    await currentUser.reload()

    const formattedUser = {
      id: currentUser.id,
      auth0Id: currentUser.auth0_id,
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      role: currentUser.role,
      isEmailVerified: Boolean(currentUser.is_email_verified),
      isPhoneVerified: Boolean(currentUser.is_phone_verified),
      hasPaid: Boolean(currentUser.has_paid),
      ageGroup: currentUser.age_group,
      profession: currentUser.profession,
      city: currentUser.city,
      areasOfInterest: currentUser.areas_of_interest ? JSON.parse(currentUser.areas_of_interest) : [],
      whyPsf: currentUser.why_psf,
      profilePicture: currentUser.profile_picture,
      profileCompleted: Boolean(currentUser.profile_completed),
      createdAt: currentUser.created_at,
      updatedAt: currentUser.updated_at,
    }

    res.status(200).json(formattedUser)
  } catch (error) {
    console.error("Error updating user profile:", error)
    res.status(500).json({ message: "Server error" })
  }
}
