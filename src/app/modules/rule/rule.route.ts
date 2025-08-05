import express from 'express';

import { authenticate, authorize } from '../../middlewares/auth';
import { RuleController } from './rule.controller';
import { UserRole } from '../../../types/enums';
const router = express.Router();

//privacy policy
router
  .route('/privacy-policy')
  .post(authenticate, authorize(UserRole.ADMIN), RuleController.createPrivacyPolicy)
  .patch(authenticate, authorize(UserRole.ADMIN), RuleController.updatePrivacyPolicy)
  .get(RuleController.getPrivacyPolicy);

//terms and conditions
router
  .route('/terms-and-conditions')
  .post(authenticate, authorize(UserRole.ADMIN),RuleController.createTermsAndCondition)
  .patch(authenticate, authorize(UserRole.ADMIN), RuleController.updateTermsAndCondition)
  .get(RuleController.getTermsAndCondition);

//privacy policy
router
  .route('/about')
  .post(authenticate, authorize(UserRole.ADMIN), RuleController.createAbout)
  .patch(authenticate, authorize(UserRole.ADMIN),RuleController.updateAbout)
  .get(RuleController.getAbout);

export const RuleRoutes = router;
