import { StatusCodes } from "http-status-codes"
import ApiError from "../../../errors/ApiError"
import { IRule } from "./rule.interface"
import { Rule } from "./rule.model"

//privacy policy
const createPrivacyPolicyToDB = async (payload: IRule) => {
  const isExistPrivacy = await Rule.findOne({ type: 'privacy' })
  if (isExistPrivacy) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Privacy policy already exist!')
  }
  
  const result = await Rule.create({ ...payload, type: 'privacy' })
  return result
}

const getPrivacyPolicyFromDB = async () => {
  const result = await Rule.findOne({ type: 'privacy' })
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Privacy policy doesn't exist!")
  }
  return result
}

const updatePrivacyPolicyToDB = async (payload: IRule) => {
  const result = await Rule.findOneAndUpdate({ type: 'privacy' }, payload, {
    new: true,
  })
  
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Privacy policy doesn't exist!")
  }
  
  return result
}

// Terms and Conditions
const createTermsAndConditionToDB = async (payload: IRule) => {
  const isExistTerms = await Rule.findOne({ type: 'terms' })
  if (isExistTerms) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Terms and conditions already exist!')
  }
  
  const result = await Rule.create({ ...payload, type: 'terms' })
  return result
}

const getTermsAndConditionFromDB = async () => {
  const result = await Rule.findOne({ type: 'terms' })
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Terms and conditions doesn't exist!")
  }
  return result
}

const updateTermsAndConditionToDB = async (payload: IRule) => {
  const result = await Rule.findOneAndUpdate({ type: 'terms' }, payload, {
    new: true,
  })
  
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Terms and conditions doesn't exist!")
  }
  
  return result
}

// About
const createAboutToDB = async (payload: IRule) => {
  const isExistAbout = await Rule.findOne({ type: 'about' })
  if (isExistAbout) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'About already exist!')
  }
  
  const result = await Rule.create({ ...payload, type: 'about' })
  return result
}

const getAboutFromDB = async () => {
  const result = await Rule.findOne({ type: 'about' })
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "About doesn't exist!")
  }
  return result
}

const updateAboutToDB = async (payload: IRule) => {
  const result = await Rule.findOneAndUpdate({ type: 'about' }, payload, {
    new: true,
  })
  
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "About doesn't exist!")
  }
  
  return result
}

export const RuleService = {
  createPrivacyPolicyToDB,
  updatePrivacyPolicyToDB,
  getPrivacyPolicyFromDB,
  createTermsAndConditionToDB,
  getTermsAndConditionFromDB,
  updateTermsAndConditionToDB,
  createAboutToDB,
  updateAboutToDB,
  getAboutFromDB,
}