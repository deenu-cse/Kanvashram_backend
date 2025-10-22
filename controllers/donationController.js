const Donation = require('../models/Donation');

exports.getDonations = async (req, res) => {
  try {
    const filter = req.admin ? {} : { isActive: true };
    
    const donations = await Donation.find(filter).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: donations.length,
      data: donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

exports.getDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};


exports.createDonation = async (req, res) => {
  try {
    const { title, englishTitle, description, suggested } = req.body;
    
    if (!title || !englishTitle || !description || !suggested) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, englishTitle, description, and suggested amounts'
      });
    }
    
    const donation = await Donation.create({
      title,
      englishTitle,
      description,
      suggested
    });
    
    res.status(201).json({
      success: true,
      message: 'Donation created successfully',
      data: donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

exports.updateDonation = async (req, res) => {
  try {
    const { title, englishTitle, description, suggested } = req.body;
    
    let donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }
    
    donation = await Donation.findByIdAndUpdate(
      req.params.id,
      {
        title,
        englishTitle,
        description,
        suggested,
        updatedAt: Date.now()
      },
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Donation updated successfully',
      data: donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

exports.deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }
    
    await Donation.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Donation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

exports.toggleDonationStatus = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }
    
    donation.isActive = !donation.isActive;
    await donation.save();
    
    res.status(200).json({
      success: true,
      message: `Donation ${donation.isActive ? 'activated' : 'deactivated'} successfully`,
      data: donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

exports.getDonationStats = async (req, res) => {
  try {
    const totalDonations = await Donation.countDocuments();
    const activeDonations = await Donation.countDocuments({ isActive: true });
    const inactiveDonations = await Donation.countDocuments({ isActive: false });
    
    const allDonations = await Donation.find();
    const totalSuggestedAmounts = allDonations.reduce((total, donation) => {
      return total + donation.suggested.length;
    }, 0);
    
    const totalPossibleCombinations = allDonations.reduce((total, donation) => {
      return total + (donation.isActive ? donation.suggested.length : 0);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        totalDonations,
        activeDonations,
        inactiveDonations,
        totalSuggestedAmounts,
        totalPossibleCombinations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};