const en: Record<string, string> = {
  // --- Auth ---------------------------------------------------------------
  "errors.auth.emailTaken": "An account with that email already exists",
  "errors.auth.invalidCredentials": "Invalid email or password",
  "errors.auth.refreshRequired": "Refresh token is required",
  "errors.auth.invalidRefresh": "Invalid or expired refresh token",
  "errors.auth.authRequired": "Authentication required",
  "errors.auth.invalidSession": "Invalid or expired session",
  "errors.auth.forbiddenRole": "You do not have permission to perform this action",
  "errors.auth.cannotRegisterAdmin": "Admin accounts cannot be self-registered",

  // --- Common -------------------------------------------------------------
  "errors.common.userNotFound": "User not found",
  "errors.common.invalidInput": "Invalid input",
  "errors.common.requestFailed": "Request failed",
  "errors.common.internalServerError": "Internal server error",
  "errors.common.notFound": "Not found",

  // --- Providers ----------------------------------------------------------
  "errors.provider.notFound": "Provider not found",
  "errors.provider.profileRequired": "Create your provider profile first",
  "errors.provider.alreadyExists": "You already have a provider profile",
  "errors.provider.invalidCategories": "One or more selected categories are invalid",
  "errors.provider.categoriesRequired": "Select at least one category",
  "errors.provider.distanceNeedsCoords": "Distance sorting requires a location (lat and lng)",

  // --- Categories ---------------------------------------------------------
  "errors.category.notFound": "Category not found",
  "errors.category.slugTaken": "A category with that slug already exists",
  "errors.category.inUse": "This category is assigned to providers and cannot be deleted",

  // --- Reviews ------------------------------------------------------------
  "errors.review.alreadyReviewed": "You have already reviewed this provider",
  "errors.review.cannotReviewOwn": "You cannot review your own profile",
  "errors.review.providerNotApproved": "You can only review approved providers",

  // --- Favorites ----------------------------------------------------------
  "errors.favorite.notFound": "Favorite not found",

  // --- Uploads ------------------------------------------------------------
  "errors.upload.notConfigured": "Uploads are not configured on this server",
  "errors.upload.noFile": "No file was uploaded",
  "errors.upload.invalidType": "Only image files are allowed",
  "errors.upload.tooLarge": "The file is too large (max 5MB)",
  "errors.upload.failed": "The upload failed, please try again",

  // --- Admin --------------------------------------------------------------
  "errors.admin.reasonRequired": "A rejection reason is required",

  // --- Validation (built-in mappings) -------------------------------------
  "validation.common.required": "This field is required",
  "validation.common.invalidEmail": "Enter a valid email address",
  "validation.common.minLength": "This value is too short",
  "validation.common.maxLength": "This value is too long",
  "validation.common.invalid": "Invalid value",
  "validation.common.invalidNumber": "Enter a valid number",

  // --- Validation (authored) ----------------------------------------------
  "validation.register.nameTooShort": "Name must be at least 2 characters",
  "validation.register.passwordTooShort": "Password must be at least 8 characters",
  "validation.register.invalidRole": "Role must be either client or provider",
  "validation.login.passwordRequired": "Password is required",
  "validation.provider.businessNameRequired": "Business name is required",
  "validation.provider.headlineRequired": "A headline is required",
  "validation.provider.aboutRequired": "Tell clients about your services",
  "validation.provider.cityRequired": "City is required",
  "validation.provider.latRange": "Latitude must be between -90 and 90",
  "validation.provider.lngRange": "Longitude must be between -180 and 180",
  "validation.provider.categoriesRequired": "Select at least one category",
  "validation.provider.invalidAvailability": "Select a valid availability",
  "validation.review.ratingRange": "Rating must be between 1 and 5",
  "validation.review.commentRequired": "A comment is required",
  "validation.category.slugRequired": "A slug is required",
  "validation.category.nameRequired": "All localized names are required",
};
export default en;
