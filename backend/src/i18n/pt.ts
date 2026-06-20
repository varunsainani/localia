const pt: Record<string, string> = {
  // --- Auth ---------------------------------------------------------------
  "errors.auth.emailTaken": "Já existe uma conta com esse e-mail",
  "errors.auth.invalidCredentials": "E-mail ou senha inválidos",
  "errors.auth.refreshRequired": "O token de atualização é obrigatório",
  "errors.auth.invalidRefresh": "Token de atualização inválido ou expirado",
  "errors.auth.authRequired": "Autenticação necessária",
  "errors.auth.invalidSession": "Sessão inválida ou expirada",
  "errors.auth.forbiddenRole": "Você não tem permissão para realizar esta ação",
  "errors.auth.cannotRegisterAdmin": "Contas de administrador não podem ser registradas",

  // --- Common -------------------------------------------------------------
  "errors.common.userNotFound": "Usuário não encontrado",
  "errors.common.invalidInput": "Entrada inválida",
  "errors.common.requestFailed": "A solicitação falhou",
  "errors.common.internalServerError": "Erro interno do servidor",
  "errors.common.notFound": "Não encontrado",
  "errors.common.invalidJson": "O corpo da solicitação não é um JSON válido",
  "errors.common.payloadTooLarge": "O corpo da solicitação é muito grande",

  // --- Providers ----------------------------------------------------------
  "errors.provider.notFound": "Prestador não encontrado",
  "errors.provider.profileRequired": "Crie primeiro o seu perfil de prestador",
  "errors.provider.alreadyExists": "Você já possui um perfil de prestador",
  "errors.provider.invalidCategories": "Uma ou mais categorias selecionadas são inválidas",
  "errors.provider.categoriesRequired": "Selecione pelo menos uma categoria",
  "errors.provider.distanceNeedsCoords": "Ordenar por distância requer uma localização (lat e lng)",

  // --- Categories ---------------------------------------------------------
  "errors.category.notFound": "Categoria não encontrada",
  "errors.category.slugTaken": "Já existe uma categoria com esse identificador",
  "errors.category.inUse": "Esta categoria está atribuída a prestadores e não pode ser excluída",

  // --- Reviews ------------------------------------------------------------
  "errors.review.alreadyReviewed": "Você já avaliou este prestador",
  "errors.review.cannotReviewOwn": "Você não pode avaliar o seu próprio perfil",
  "errors.review.providerNotApproved": "Você só pode avaliar prestadores aprovados",

  // --- Favorites ----------------------------------------------------------
  "errors.favorite.notFound": "Favorito não encontrado",

  // --- Reviews (display) --------------------------------------------------
  "reviews.anonymous": "Anônimo",

  // --- Uploads ------------------------------------------------------------
  "errors.upload.notConfigured": "O envio de arquivos não está configurado neste servidor",
  "errors.upload.noFile": "Nenhum arquivo foi enviado",
  "errors.upload.invalidType": "Somente arquivos de imagem são permitidos",
  "errors.upload.tooLarge": "O arquivo é muito grande (máx. 5MB)",
  "errors.upload.failed": "O envio falhou, tente novamente",

  // --- Admin --------------------------------------------------------------
  "errors.admin.reasonRequired": "É necessário informar um motivo de rejeição",

  // --- Validation (built-in mappings) -------------------------------------
  "validation.common.required": "Este campo é obrigatório",
  "validation.common.invalidEmail": "Digite um e-mail válido",
  "validation.common.minLength": "Este valor é muito curto",
  "validation.common.maxLength": "Este valor é muito longo",
  "validation.common.invalid": "Valor inválido",
  "validation.common.invalidNumber": "Digite um número válido",

  // --- Validation (authored) ----------------------------------------------
  "validation.register.nameTooShort": "O nome deve ter pelo menos 2 caracteres",
  "validation.register.passwordTooShort": "A senha deve ter pelo menos 8 caracteres",
  "validation.register.invalidRole": "A função deve ser cliente ou prestador",
  "validation.login.passwordRequired": "A senha é obrigatória",
  "validation.provider.businessNameRequired": "O nome do negócio é obrigatório",
  "validation.provider.headlineRequired": "Um título é obrigatório",
  "validation.provider.aboutRequired": "Conte aos clientes sobre os seus serviços",
  "validation.provider.cityRequired": "A cidade é obrigatória",
  "validation.provider.latRange": "A latitude deve estar entre -90 e 90",
  "validation.provider.lngRange": "A longitude deve estar entre -180 e 180",
  "validation.provider.categoriesRequired": "Selecione pelo menos uma categoria",
  "validation.provider.invalidAvailability": "Selecione uma disponibilidade válida",
  "validation.review.ratingRange": "A avaliação deve estar entre 1 e 5",
  "validation.review.commentRequired": "Um comentário é obrigatório",
  "validation.category.slugRequired": "Um identificador é obrigatório",
  "validation.category.nameRequired": "Todos os nomes localizados são obrigatórios",
};
export default pt;
