// DeliveryOffer.ts model

// import mongoose from 'mongoose';

// const deliveryOfferSchema = new mongoose.Schema({
//   requestId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'DeliveryRequest',
//     required: true
//   },
//   delivererId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'accepted', 'rejected'],
//     default: 'pending'
//   }
// }, {
//   timestamps: true
// });

// export const DeliveryOffer = mongoose.model('DeliveryOffer', deliveryOfferSchema);

import mongoose from 'mongoose';

const deliveryOfferSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryRequest', required: true },
  delivererId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, { timestamps: true });

export const DeliveryOffer = mongoose.model('DeliveryOffer', deliveryOfferSchema);
