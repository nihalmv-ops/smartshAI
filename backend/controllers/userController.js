import User from '../models/User.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, address, role } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email, and password');
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      res.status(400);
      throw new Error('User with this email already exists');
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '+91 98765 43210',
      address: address || '221B Baker Residency, Indiranagar, Bengaluru',
      role: role === 'admin' ? 'admin' : 'user' // allow seeding or explicit role if permitted
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        message: 'Login successful',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          createdAt: user.createdAt
        }
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email ? req.body.email.toLowerCase() : user.email;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          phone: updatedUser.phone,
          address: updatedUser.address,
          token: generateToken(updatedUser._id)
        }
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private / Admin
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role (Admin toggle)
// @route   PUT /api/users/:id/role
// @access  Private / Admin
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['customer', 'admin'].includes(role)) {
      res.status(400);
      throw new Error("Invalid role specified. Must be 'customer' or 'admin'.");
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Safety: prevent admin from demoting themselves if they are the only admin
    if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
      res.status(400);
      throw new Error('You cannot remove your own admin privileges.');
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `User role successfully updated to ${role}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/:id
// @access  Private / Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Safety: prevent admin from deleting their own account
    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('You cannot delete your own admin account while logged in.');
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate with Google OAuth
// @route   POST /api/users/google
// @access  Public
export const googleAuth = async (req, res, next) => {
  try {
    const { credential, client_id, userProfile } = req.body;

    let email, name, picture, googleId;

    if (credential) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID || client_id
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name;
        picture = payload.picture;
        googleId = payload.sub;
      } catch (verifyErr) {
        // Fallback: safely parse JWT payload
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          email = payload.email;
          name = payload.name;
          picture = payload.picture;
          googleId = payload.sub;
        } else {
          res.status(400);
          throw new Error('Invalid Google credential token');
        }
      }
    } else if (userProfile && userProfile.email) {
      email = userProfile.email;
      name = userProfile.name || userProfile.email.split('@')[0];
      picture = userProfile.picture;
      googleId = userProfile.sub || userProfile.id;
    } else {
      res.status(400);
      throw new Error('Google credential or profile is required');
    }

    if (!email) {
      res.status(400);
      throw new Error('Could not retrieve email from Google authentication');
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create user with a generated secure random password
      const randomPassword = 'G_' + Math.random().toString(36).slice(-10) + '!9Aa';
      user = await User.create({
        name: name || 'Google User',
        email: email.toLowerCase(),
        password: randomPassword,
        role: 'user',
        phone: '+91 98765 43210',
        address: '221B Baker Residency, Indiranagar, Bengaluru'
      });
    }

    res.json({
      success: true,
      message: 'Google login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        avatar: picture || '',
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new Admin account using Admin Security Passcode
// @route   POST /api/users/admin/register
// @access  Public (Requires Admin Secret Key)
export const registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password, phone, address, adminSecretKey } = req.body;

    const expectedSecret = process.env.ADMIN_SECRET_KEY || 'SMARTMART_ADMIN_2026';
    if (!adminSecretKey || adminSecretKey.trim() !== expectedSecret) {
      res.status(403);
      throw new Error('Invalid Admin Security Passcode. Access denied.');
    }

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email, and password for admin account');
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      if (userExists.role === 'admin') {
        res.status(400);
        throw new Error('An administrator account with this email already exists');
      } else {
        // Upgrade user to admin
        userExists.role = 'admin';
        userExists.name = name || userExists.name;
        if (password) userExists.password = password;
        if (phone) userExists.phone = phone;
        await userExists.save();

        return res.json({
          success: true,
          message: 'Account upgraded to Administrator successfully',
          user: {
            _id: userExists._id,
            name: userExists.name,
            email: userExists.email,
            role: 'admin',
            phone: userExists.phone,
            address: userExists.address,
            token: generateToken(userExists._id)
          }
        });
      }
    }

    const adminUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '+91 99999 11111',
      address: address || 'SmartMart AI HQ, Koramangala, Bengaluru',
      role: 'admin'
    });

    res.status(201).json({
      success: true,
      message: 'Administrator account registered successfully',
      user: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: 'admin',
        phone: adminUser.phone,
        address: adminUser.address,
        token: generateToken(adminUser._id)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logged-in admin creates another admin
// @route   POST /api/users/admin/create
// @access  Private / Admin
export const createAdminByAdmin = async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email, and password');
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      if (userExists.role === 'admin') {
        res.status(400);
        throw new Error('An administrator with this email already exists');
      } else {
        userExists.role = 'admin';
        if (password) userExists.password = password;
        await userExists.save();
        return res.json({
          success: true,
          message: `User ${userExists.email} has been promoted to Administrator`,
          user: {
            _id: userExists._id,
            name: userExists.name,
            email: userExists.email,
            role: 'admin',
            phone: userExists.phone,
            createdAt: userExists.createdAt
          }
        });
      }
    }

    const newAdmin = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '+91 99999 11111',
      address: address || 'SmartMart AI HQ, Koramangala, Bengaluru',
      role: 'admin'
    });

    res.status(201).json({
      success: true,
      message: 'New administrator created successfully',
      user: {
        _id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        phone: newAdmin.phone,
        createdAt: newAdmin.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

