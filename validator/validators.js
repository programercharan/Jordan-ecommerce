import { body, validationResult } from "express-validator";

// 1. Define the validation rules array
export const signupRules = [
    
  body("firstName").trim().notEmpty().withMessage("First Name is required").bail().isAlpha().withMessage('First name must contain letters only.'),
  body("lastName").trim().notEmpty().withMessage("Last Name is required").bail().isAlpha().withMessage("Last name must contain letters only."),
  body('email').trim().notEmpty().withMessage('Email is required.').bail().isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
  body('phoneNumber').trim().notEmpty().withMessage('Phone number is required.').bail().isMobilePhone('any').withMessage('Invalid phone number.'),
  body('password').trim().notEmpty().withMessage('Password is required.').bail().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
  body('confirmPassword').trim().notEmpty().withMessage('Confirm password is required.').bail().custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match.');
    return true;
  })
];

// 2. Define the error checking middleware (Fixed your typos!)
export const handleSignupErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (errors.isEmpty()) {
    return next(); // Safe to proceed to the controller
  } else {
    let errorMessages = {}; // Fixed 'lert' to 'let'
    
    // Fixed the loop syntax error: removed the extra ')' after (obj)
    errors.array().forEach((obj) => { 
      errorMessages[obj.path] = obj.msg;
    });
    
    // Render the page and pass both the errors and old input data
    return res.render("signup-page", { 
      errorMessages,
      oldInput: req.body 
    });
  }
};

