import WhatsAppContact from '../models/WhatsAppContact.js';

// @desc    Get WhatsApp contacts (Public: active only, Admin: all)
// @route   GET /api/whatsapp-contacts
// @access  Public / Admin
export const getWhatsAppContacts = async (req, res, next) => {
  try {
    // Seed defaults if collection is empty
    await WhatsAppContact.seedDefaultContacts();

    // If request contains admin token, req.user will be populated by optionalProtect or protect
    const isAdmin = req.user && req.user.role === 'admin';
    const filter = isAdmin ? {} : { isActive: true };

    const contacts = await WhatsAppContact.find(filter)
      .sort({ displayOrder: 1, createdAt: 1 });

    res.json({
      success: true,
      count: contacts.length,
      contacts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new WhatsApp contact
// @route   POST /api/whatsapp-contacts
// @access  Private / Admin
export const createWhatsAppContact = async (req, res, next) => {
  try {
    const { name, phoneNumber, purpose, isActive, isDefault, displayOrder } = req.body;

    if (!name || !name.trim()) {
      res.status(400);
      throw new Error('Contact name is required');
    }

    if (!phoneNumber) {
      res.status(400);
      throw new Error('WhatsApp phone number is required');
    }

    const cleanNumber = WhatsAppContact.sanitizePhoneNumber(phoneNumber);
    if (!cleanNumber || cleanNumber.length < 10 || cleanNumber.length > 15) {
      res.status(400);
      throw new Error('Please provide a valid 10-15 digit phone number (e.g., 919876543210)');
    }

    // If marked as default, clear default status from all others
    if (isDefault) {
      await WhatsAppContact.updateMany({}, { isDefault: false });
    }

    const contact = new WhatsAppContact({
      name: name.trim(),
      phoneNumber: cleanNumber,
      purpose: purpose ? purpose.trim() : 'Order Processing',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      isDefault: Boolean(isDefault),
      displayOrder: Number(displayOrder) || 0
    });

    const createdContact = await contact.save();

    res.status(201).json({
      success: true,
      message: 'WhatsApp contact created successfully',
      contact: createdContact
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update WhatsApp contact
// @route   PUT /api/whatsapp-contacts/:id
// @access  Private / Admin
export const updateWhatsAppContact = async (req, res, next) => {
  try {
    const contact = await WhatsAppContact.findById(req.params.id);

    if (!contact) {
      res.status(404);
      throw new Error('WhatsApp contact not found');
    }

    const { name, phoneNumber, purpose, isActive, isDefault, displayOrder } = req.body;

    if (name !== undefined) {
      contact.name = name.trim();
    }

    if (phoneNumber !== undefined) {
      const cleanNumber = WhatsAppContact.sanitizePhoneNumber(phoneNumber);
      if (!cleanNumber || cleanNumber.length < 10 || cleanNumber.length > 15) {
        res.status(400);
        throw new Error('Please provide a valid 10-15 digit phone number (e.g., 919876543210)');
      }
      contact.phoneNumber = cleanNumber;
    }

    if (purpose !== undefined) {
      contact.purpose = purpose.trim();
    }

    if (isActive !== undefined) {
      contact.isActive = Boolean(isActive);
    }

    if (displayOrder !== undefined) {
      contact.displayOrder = Number(displayOrder) || 0;
    }

    if (isDefault) {
      await WhatsAppContact.updateMany({ _id: { $ne: contact._id } }, { isDefault: false });
      contact.isDefault = true;
    } else if (isDefault === false) {
      contact.isDefault = false;
    }

    const updatedContact = await contact.save();

    res.json({
      success: true,
      message: 'WhatsApp contact updated successfully',
      contact: updatedContact
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete WhatsApp contact
// @route   DELETE /api/whatsapp-contacts/:id
// @access  Private / Admin
export const deleteWhatsAppContact = async (req, res, next) => {
  try {
    const totalCount = await WhatsAppContact.countDocuments();
    if (totalCount <= 1) {
      res.status(400);
      throw new Error('Cannot delete the last WhatsApp contact. At least one contact must be kept.');
    }

    const contact = await WhatsAppContact.findById(req.params.id);

    if (!contact) {
      res.status(404);
      throw new Error('WhatsApp contact not found');
    }

    const wasDefault = contact.isDefault;
    await contact.deleteOne();

    // If deleted contact was default, assign default to the first available contact
    if (wasDefault) {
      const nextContact = await WhatsAppContact.findOne();
      if (nextContact) {
        nextContact.isDefault = true;
        await nextContact.save();
      }
    }

    res.json({
      success: true,
      message: 'WhatsApp contact deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

