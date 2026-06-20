const es: Record<string, string> = {
  // --- Auth ---------------------------------------------------------------
  "errors.auth.emailTaken": "Ya existe una cuenta con ese correo electrónico",
  "errors.auth.invalidCredentials": "Correo electrónico o contraseña inválidos",
  "errors.auth.refreshRequired": "Se requiere el token de actualización",
  "errors.auth.invalidRefresh": "Token de actualización inválido o expirado",
  "errors.auth.authRequired": "Autenticación requerida",
  "errors.auth.invalidSession": "Sesión inválida o expirada",
  "errors.auth.forbiddenRole": "No tienes permiso para realizar esta acción",
  "errors.auth.cannotRegisterAdmin": "Las cuentas de administrador no se pueden registrar",

  // --- Common -------------------------------------------------------------
  "errors.common.userNotFound": "Usuario no encontrado",
  "errors.common.invalidInput": "Entrada inválida",
  "errors.common.requestFailed": "La solicitud falló",
  "errors.common.internalServerError": "Error interno del servidor",
  "errors.common.notFound": "No encontrado",
  "errors.common.invalidJson": "El cuerpo de la solicitud no es un JSON válido",
  "errors.common.payloadTooLarge": "El cuerpo de la solicitud es demasiado grande",
  "errors.common.tooManyRequests": "Demasiadas solicitudes, inténtalo de nuevo más tarde",

  // --- Providers ----------------------------------------------------------
  "errors.provider.notFound": "Proveedor no encontrado",
  "errors.provider.profileRequired": "Primero crea tu perfil de proveedor",
  "errors.provider.alreadyExists": "Ya tienes un perfil de proveedor",
  "errors.provider.invalidCategories": "Una o más categorías seleccionadas son inválidas",
  "errors.provider.categoriesRequired": "Selecciona al menos una categoría",
  "errors.provider.distanceNeedsCoords": "Ordenar por distancia requiere una ubicación (lat y lng)",

  // --- Categories ---------------------------------------------------------
  "errors.category.notFound": "Categoría no encontrada",
  "errors.category.slugTaken": "Ya existe una categoría con ese identificador",
  "errors.category.inUse": "Esta categoría está asignada a proveedores y no se puede eliminar",

  // --- Reviews ------------------------------------------------------------
  "errors.review.alreadyReviewed": "Ya has reseñado a este proveedor",
  "errors.review.cannotReviewOwn": "No puedes reseñar tu propio perfil",
  "errors.review.providerNotApproved": "Solo puedes reseñar proveedores aprobados",

  // --- Favorites ----------------------------------------------------------
  "errors.favorite.notFound": "Favorito no encontrado",

  // --- Reviews (display) --------------------------------------------------
  "reviews.anonymous": "Anónimo",

  // --- Uploads ------------------------------------------------------------
  "errors.upload.notConfigured": "La carga de archivos no está configurada en este servidor",
  "errors.upload.noFile": "No se subió ningún archivo",
  "errors.upload.invalidType": "Solo se permiten archivos de imagen",
  "errors.upload.tooLarge": "El archivo es demasiado grande (máx. 5MB)",
  "errors.upload.failed": "La carga falló, inténtalo de nuevo",

  // --- Admin --------------------------------------------------------------
  "errors.admin.reasonRequired": "Se requiere un motivo de rechazo",

  // --- Validation (built-in mappings) -------------------------------------
  "validation.common.required": "Este campo es obligatorio",
  "validation.common.invalidEmail": "Ingresa un correo electrónico válido",
  "validation.common.minLength": "Este valor es demasiado corto",
  "validation.common.maxLength": "Este valor es demasiado largo",
  "validation.common.invalid": "Valor inválido",
  "validation.common.invalidNumber": "Ingresa un número válido",

  // --- Validation (authored) ----------------------------------------------
  "validation.register.nameTooShort": "El nombre debe tener al menos 2 caracteres",
  "validation.register.passwordTooShort": "La contraseña debe tener al menos 8 caracteres",
  "validation.register.invalidRole": "El rol debe ser cliente o proveedor",
  "validation.login.passwordRequired": "La contraseña es obligatoria",
  "validation.provider.businessNameRequired": "El nombre del negocio es obligatorio",
  "validation.provider.headlineRequired": "Se requiere un titular",
  "validation.provider.aboutRequired": "Cuéntales a los clientes sobre tus servicios",
  "validation.provider.cityRequired": "La ciudad es obligatoria",
  "validation.provider.latRange": "La latitud debe estar entre -90 y 90",
  "validation.provider.lngRange": "La longitud debe estar entre -180 y 180",
  "validation.provider.categoriesRequired": "Selecciona al menos una categoría",
  "validation.provider.invalidAvailability": "Selecciona una disponibilidad válida",
  "validation.review.ratingRange": "La calificación debe estar entre 1 y 5",
  "validation.review.commentRequired": "Se requiere un comentario",
  "validation.category.slugRequired": "Se requiere un identificador",
  "validation.category.nameRequired": "Todos los nombres localizados son obligatorios",
};
export default es;
