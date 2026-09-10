import Settings from '../models/Settings.js';

// @desc    Get store settings (Delivery fee, thresholds, store name)
// @route   GET /api/settings
// @access  Public
export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve store settings',
      error: error.message
    });
  }
};

// @desc    Update store settings (Admin only)
// @route   PUT /api/settings
// @access  Private/Admin
export const updateSettings = async (req, res) => {
  try {
    const {
      deliveryFee,
      freeDeliveryThreshold,
      deliveryEstimatedMinutes,
      topBannerText,
      storeName
    } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (deliveryFee !== undefined) {
      const parsedFee = Number(deliveryFee);
      if (isNaN(parsedFee) || parsedFee < 0) {
        return res.status(400).json({
          success: false,
          message: 'Delivery fee must be a valid non-negative number'
        });
      }
      settings.deliveryFee = parsedFee;
    }

    if (freeDeliveryThreshold !== undefined) {
      const parsedThreshold = Number(freeDeliveryThreshold);
      if (isNaN(parsedThreshold) || parsedThreshold < 0) {
        return res.status(400).json({
          success: false,
          message: 'Free delivery threshold must be a valid non-negative number'
        });
      }
      settings.freeDeliveryThreshold = parsedThreshold;
    }

    if (deliveryEstimatedMinutes !== undefined) {
      const parsedMin = Number(deliveryEstimatedMinutes);
      if (!isNaN(parsedMin) && parsedMin > 0) {
        settings.deliveryEstimatedMinutes = parsedMin;
      }
    }

    if (topBannerText !== undefined) {
      settings.topBannerText = topBannerText.trim();
    }

    if (storeName !== undefined) {
      settings.storeName = storeName.trim();
    }

    if (req.user && req.user._id) {
      settings.updatedBy = req.user._id;
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Store settings and delivery fee updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update store settings',
      error: error.message
    });
  }
};
