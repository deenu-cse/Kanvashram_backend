exports.generateBookingId = () => {
  return 'B' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
};

exports.calculateTotalPrice = (roomPrice, discount, checkIn, checkOut) => {
  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  const finalPrice = roomPrice - (roomPrice * discount / 100);
  return finalPrice * nights;
};
