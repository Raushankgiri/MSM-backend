// const joi = require("joi");
// // const errorFunction = require("../../services/errorFunction");

// const strongPasswordRegex =
//   /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,18}$/;
// const stringPassswordError = new Error(
//   "Password must be strong. At least one upper case alphabet. At least one lower case alphabet. At least one digit. At least one special character. Minimum eight in length"
// );

// const specialCharacterPattern =
//   /^[a-zA-Z0-9\s!@#$%^&*()_+={}[\]:;"'<>,.?/~-]+$/;

// const validation = joi.object({
//   typeOfCompany: joi.string().required(),
//   // stateOfCompany: joi.string().required(),
//   rcNumber: joi
//     .string()
//     .regex(/^[0-9]{4,13}$/)
//     .required(),
//   comapnyName: joi
//     .string()
//     .max(50)
//     .regex(/^[a-zA-Z0-9\s.&-]*$/)
//     .required(),
//   countrycode: joi.string().min(1).max(6).required(),
//   businessPhoneNumber: joi
//     .string()
//     .length(10)
//     .pattern(/^[0-9]+$/)
//     .required(),
//   businessEmail: joi.string().email().required(),
//   comapnyAddress1: joi
//     .string()
//     .regex(/^[a-zA-Z0-9\s!@#$%^&*()-_=+[\]{}|;:'",.<>/?]*$/)
//     .max(255)
//     .required(),
//   comapnyAddress2: joi
//     .string()
//     .regex(/^[a-zA-Z0-9\s!@#$%^&*()-_=+[\]{}|;:'",.<>/?]*$/)
//     .max(255)
//     .required(),
//   typeOfRepresentative: joi.string().valid("Nigerian", "Foreigner").required(),
//   // designationOfRepresentative: joi.string().regex(/^[a-zA-Z]+$/).trim().required(),
//   designationOfRepresentative: joi.string().required(),
//   nameOfRepresentive: joi
//     .string()
//     .max(50)
//     .regex(/^[a-zA-Z\s.]*$/)
//     .required(),
//   NationalIdentificationNumber: joi.string().min(8).max(20),
//   nationality: joi.string().required(),
//   bankVerificationNumber: joi
//     .string()
//     .regex(/^\d{11}$/)
//     .required(),
//   // passportNumber: joi.string().min(8).max(12).alphanum(),
//   passportNumber: joi.when("typeOfRepresentative", {
//     is: "Nigerian", // Add your specific value here
//     then: joi.string().allow("").optional(),
//     otherwise: joi.string().min(8).max(12).alphanum().required(),
//   }),
//   passportExpiry: joi.string().pattern(new RegExp("^\\d{2}/\\d{2}/\\d{4}$")),
//   cerpacNumber: joi.string().allow("").alphanum().length(8),
//   cerpacExpiry: joi.string().pattern(new RegExp("^\\d{2}/\\d{2}/\\d{4}$")),
//   password: joi.string().regex(strongPasswordRegex).required(),
//   //    confirm_password: joi.string().equal(joi.ref('password')).messages({'any.only': 'password does not match' }).required(),

//   // password:joi.string().trim(true)
//   // .regex(/^[a-zA-Z0-9]{8,30}$/)
//   // .required(),
//   securityQuestion1: joi.string().required(),
//   securityAnswer1: joi
//     .string()
//     .regex(specialCharacterPattern)
//     .min(3)
//     .max(25)
//     .required(),
//   securityQuestion2: joi.string().required(),
//   securityAnswer2: joi
//     .string()
//     .regex(specialCharacterPattern)
//     .min(3)
//     .max(25)
//     .required(),
//   securityQuestion3: joi.string().required(),
//   securityAnswer3: joi
//     .string()
//     .regex(specialCharacterPattern)
//     .min(3)
//     .max(25)
//     .required(),
//   is_moi_verified: joi.boolean().required(),
// });

// const loginvalid = joi.object({
//   businessEmail: joi.string().email().required(),
//   password: joi.string().required(),
// });

// const changerepresentativevalidation = joi.object({
//   // business_email: joi.string().email().required(),

//   new_business_email: joi.string().email().required(),
//   old_business_email: joi.string().email().required(),
//   type_of_representative: joi
//     .string()
//     .valid("Nigerian", "Foreigner")
//     .required(),
//   designation_of_representative: joi.string().required(),
//   name_of_representative: joi
//     .string()
//     .max(50)
//     .regex(/^[a-zA-Z\s.]*$/)
//     .required(),
//   national_identification_number: joi.when("type_of_representative", {
//     is: "Nigerian", // Add your specific value here
//     then: joi.string().min(8).max(20).alphanum().required(),
//     otherwise: joi.string().allow("").optional(),
//   }),
//   nationality_of_representative: joi.string().required(),
//   bank_verification_number: joi
//     .string()
//     .regex(/^\d{11}$/)
//     .required(),
//   passport_number: joi.when("type_of_representative", {
//     is: "Foreigner", // Add your specific value here
//     then: joi.string().min(8).max(12).alphanum().required(),
//     otherwise: joi.string().allow("").optional(),
//   }),
//   passport_expiry: joi.when("type_of_representative", {
//     is: "Foreigner", // Add your specific value here
//     then: joi.date().required(),
//     otherwise: joi.date().allow("").optional(),
//   }),
//   cerpac_number: joi.when("type_of_representative", {
//     is: "Foreigner", // Add your specific value here
//     then: joi.string().required(),
//     otherwise: joi.string().allow("").optional(),
//   }),
//   cerpac_expiry: joi.when("type_of_representative", {
//     is: "Foreigner", // Add your specific value here
//     then: joi.string().required(),
//     otherwise: joi.string().allow("").optional(),
//   }),
//   security_question1: joi.string().required(),
//   security_answer1: joi
//     .string()
//     .regex(specialCharacterPattern)
//     .min(3)
//     .max(25)
//     .required(),
//   security_question2: joi.string().required(),
//   security_answer2: joi
//     .string()
//     .regex(specialCharacterPattern)
//     .min(3)
//     .max(25)
//     .required(),
//   security_question3: joi.string().required(),
//   security_answer3: joi
//     .string()
//     .regex(specialCharacterPattern)
//     .min(3)
//     .max(25)
//     .required(),
//   cac_file_url: joi.string().required(),
//   other_file_url: joi.string().required(),
//   country_code: joi.string().required(),
//   phone_number: joi.string().required(),
// });

// const emailvalid = joi.object({
//   business_email: joi.string().email().required(),
// });

// module.exports = {
//   validation,
//   loginvalid,
//   changerepresentativevalidation,
//   emailvalid,
// };
