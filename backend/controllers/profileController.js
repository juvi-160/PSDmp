import { authAdmin } from "../utils/firebase.js";
import User from "../model/userModel.js";

// Allowed age groups (snake_case backend)
const VALID_AGE_GROUPS = ["18-25", "26-35", "36-45", "46-55", "56-65", "65+"];

function isPhonePresent(p) {
  return typeof p === "string" && p.trim().length >= 10;
}

// Add this helper function at the top of your file
function calculateProfileCompleted(user) {
  // Handle stringified array_of_interests
  let interests = user.area_of_interests;
  if (typeof interests === 'string') {
    try {
      interests = JSON.parse(interests);
    } catch (e) {
      interests = [];
    }
  }

  const baseComplete = Boolean(
    user.phone &&
    user.age_group &&
    user.profession &&
    user.city &&
    (interests?.length > 0) &&  // Now checks parsed array
    user.about_you &&
    user.agreed_to_terms
  );

  if (user.role === 'associate member') {
    return baseComplete && Boolean(user.company && user.position);
  }
  
  return baseComplete;
}

// Add this debugging helper
function logProfileCompletion(user) {
  console.log('Profile completion check:', {
    role: user.role,
    phone: !!user.phone,
    age_group: !!user.age_group,
    profession: !!user.profession,
    city: !!user.city,
    interests: user.area_of_interests?.length > 0,
    about_you: !!user.about_you,
    terms: !!user.agreed_to_terms,
    company: !!user.company,
    position: !!user.position,
    completed: calculateProfileCompleted(user)
  });
}

export const getUserProfile = async (req, res) => {
  const auth0Sub = req.auth?.sub || req.auth?.payload?.sub;
  if (!auth0Sub) {
    console.error("Missing auth0 sub in request:", req.auth);
    return res.status(401).json({ message: "Invalid authentication token" });
  }

  const currentUser = await User.findOne({ where: { auth0_id: String(auth0Sub).trim() } });
  if (!currentUser) {
    return res.status(404).json({ message: "User not found" });
  }

  // Parse area_of_interests if it's a string
  let area_of_interests = currentUser.area_of_interests;
  if (typeof area_of_interests === 'string') {
    try {
      area_of_interests = JSON.parse(area_of_interests);
    } catch (e) {
      area_of_interests = [];
    }
  }

  res.status(200).json({
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
    about_you: currentUser.about_you,
    profilePicture: currentUser.profile_picture,
    area_of_interests: area_of_interests || [],
    profileCompleted: calculateProfileCompleted({
      ...currentUser.toJSON(),
      area_of_interests
    }),
    company: currentUser.company,
    position: currentUser.position,
    agreed_to_contribute: Boolean(currentUser.agreed_to_contribute),
    agreed_to_terms: Boolean(currentUser.agreed_to_terms),
    createdAt: currentUser.created_at,
    updatedAt: currentUser.updated_at,
  });
};

export const verifyPhone = async (req, res) => {
  try {
    const authHeader = req.header("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(400).json({ message: "Missing Firebase ID token" });
    }

    const idToken = authHeader.split("Bearer ")[1].trim();
    const decoded = await authAdmin.verifyIdToken(idToken); // ⚠️ Must pass entire JWT, not UID :contentReference[oaicite:1]{index=1}

    const firebasePhone = decoded.phone_number;
    if (!firebasePhone) {
      return res
        .status(400)
        .json({ message: "Token missing phone_number payload" });
    }

    const auth0Sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!auth0Sub) {
      return res.status(401).json({ message: "Auth0 subject missing" });
    }

    const currentUser = await User.findOne({ where: { auth0_id: auth0Sub } });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const phoneChanged = firebasePhone !== currentUser.phone;

    await currentUser.update({
      phone: firebasePhone, // Fixed this line
      is_phone_verified: true,
      profile_completed: calculateProfileCompleted({
        ...currentUser,
        phone: firebasePhone
      })
    });


    await currentUser.reload();

    res.status(200).json({
      phone: currentUser.phone,
      isPhoneVerified: currentUser.is_phone_verified,
      profileCompleted: currentUser.profile_completed,
    });
  } catch (err) {
    console.error("verifyPhone error:", err);
    return res
      .status(401)
      .json({ message: "Invalid or expired Firebase ID token", error: err.message });
  }
};


export const markPhoneVerified = async (req, res) => {
  try {
    const auth0Sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!auth0Sub) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findOne({ where: { auth0_id: auth0Sub } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.update({
      is_phone_verified: true,
      profile_completed: calculateProfileCompleted(user)
    });

    res.json({
      message: 'Phone marked as verified',
      isPhoneVerified: true,
      profileCompleted: user.profile_completed
    });
  } catch (error) {
    console.error('Error marking phone verified:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const auth0Sub = req.auth?.sub || req.auth?.payload?.sub;
    if (!auth0Sub) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    const {
      phone,
      ageGroup,
      profession,
      city,
      area_of_interests,
      about_you,
      company,
      position,
      agreed_to_contribute,
      agreed_to_terms,
    } = req.body;

    if (ageGroup && !VALID_AGE_GROUPS.includes(ageGroup)) {
      return res.status(400).json({ message: "Invalid age group" });
    }

    if (area_of_interests && !Array.isArray(area_of_interests)) {
      return res.status(400).json({ message: "Areas of interest must be an array" });
    }

    const currentUser = await User.findOne({ where: { auth0_id: String(auth0Sub).trim() } });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const phoneChanged = isPhonePresent(phone) && phone !== currentUser.phone;

    const updatedValues = {
      phone: phone ?? currentUser.phone,
      age_group: ageGroup ?? currentUser.age_group,
      profession: profession ?? currentUser.profession,
      city: city ?? currentUser.city,
      area_of_interests: area_of_interests ?? currentUser.area_of_interests,
      about_you: about_you ?? currentUser.about_you,
      company: company ?? currentUser.company,
      position: position ?? currentUser.position,
      agreed_to_contribute: agreed_to_contribute ?? currentUser.agreed_to_contribute,
      agreed_to_terms: agreed_to_terms ?? currentUser.agreed_to_terms,
      is_phone_verified: phoneChanged ? false : currentUser.is_phone_verified,
    };

    // Use the standardized completion check
    updatedValues.profile_completed = calculateProfileCompleted({
      ...currentUser,
      ...updatedValues
    });
    logProfileCompletion({ ...currentUser, ...updatedValues });

    await currentUser.update(updatedValues);
    await currentUser.reload();

    res.status(200).json({
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
      area_of_interests: currentUser.area_of_interests || [],
      about_you: currentUser.about_you,
      profilePicture: currentUser.profile_picture,
      profileCompleted: currentUser.profile_completed,
      company: currentUser.company,
      position: currentUser.position,
      agreed_to_contribute: Boolean(currentUser.agreed_to_contribute),
      agreed_to_terms: Boolean(currentUser.agreed_to_terms),
      createdAt: currentUser.created_at,
      updatedAt: currentUser.updated_at,
    });
  } catch (err) {
    console.error("updateUserProfile error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
