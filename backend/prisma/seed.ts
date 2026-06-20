import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, type Availability, type ProviderStatus } from "@prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Categories (8) — EN/ES/PT names + lucide icon names.
// ---------------------------------------------------------------------------
const CATEGORIES = [
  { slug: "mental-health", nameEn: "Psychology & Mental Health", nameEs: "Psicología y salud mental", namePt: "Psicologia e saúde mental", icon: "brain", sortOrder: 1 },
  { slug: "legal", nameEn: "Legal", nameEs: "Legal", namePt: "Jurídico", icon: "scale", sortOrder: 2 },
  { slug: "real-estate", nameEn: "Real Estate", nameEs: "Bienes raíces", namePt: "Imóveis", icon: "home", sortOrder: 3 },
  { slug: "home-services", nameEn: "Home Services", nameEs: "Servicios para el hogar", namePt: "Serviços domésticos", icon: "wrench", sortOrder: 4 },
  { slug: "agriculture", nameEn: "Agriculture & Agro", nameEs: "Agricultura y agro", namePt: "Agricultura e agro", icon: "sprout", sortOrder: 5 },
  { slug: "education", nameEn: "Education & Tutoring", nameEs: "Educación y tutorías", namePt: "Educação e tutoria", icon: "graduation-cap", sortOrder: 6 },
  { slug: "health-nutrition", nameEn: "Health & Nutrition", nameEs: "Salud y nutrición", namePt: "Saúde e nutrição", icon: "heart-pulse", sortOrder: 7 },
  { slug: "technology", nameEn: "Technology", nameEs: "Tecnología", namePt: "Tecnologia", icon: "laptop", sortOrder: 8 },
] as const;

type CitySpec = { city: string; region: string; country: string; lat: number; lng: number };
const CITIES: Record<string, CitySpec> = {
  BA: { city: "Buenos Aires", region: "Buenos Aires", country: "AR", lat: -34.6037, lng: -58.3816 },
  SP: { city: "São Paulo", region: "São Paulo", country: "BR", lat: -23.5505, lng: -46.6333 },
  MX: { city: "Ciudad de México", region: "CDMX", country: "MX", lat: 19.4326, lng: -99.1332 },
  BG: { city: "Bogotá", region: "Cundinamarca", country: "CO", lat: 4.711, lng: -74.0721 },
  ST: { city: "Santiago", region: "Región Metropolitana", country: "CL", lat: -33.4489, lng: -70.6693 },
  LM: { city: "Lima", region: "Lima", country: "PE", lat: -12.0464, lng: -77.0428 },
};

// Small deterministic jitter so pins don't stack exactly on the city center.
function jitter(base: number, n: number): number {
  return base + ((((n * 9301 + 49297) % 233280) / 233280) - 0.5) * 0.18;
}

const A: Availability = "AVAILABLE";
const APPT: Availability = "BY_APPOINTMENT";

type ProviderSeed = {
  key: string; // unique key for slug/avatar/photo seeds
  name: string; // owner display name
  businessName: string;
  headline: string;
  about: string;
  services: string[];
  categories: string[]; // category slugs (1-2)
  city: keyof typeof CITIES;
  whatsapp: string;
  phone: string;
  addressLine: string;
  availability: Availability;
  featured?: boolean;
  status?: ProviderStatus; // defaults APPROVED
  ratings: number[]; // review ratings to seed (drives ratingAvg/reviewCount)
};

// ---------------------------------------------------------------------------
// Provider catalog: ~24 APPROVED + ~4 PENDING across the 6 cities.
// `pro@localia.app` owns the first APPROVED + featured profile (key "lumen").
// ---------------------------------------------------------------------------
const PROVIDERS: ProviderSeed[] = [
  // --- pro@localia.app demo profile (featured) ---
  {
    key: "lumen", name: "Valentina Ortiz", businessName: "Lumen Psicología",
    headline: "Terapia cognitivo-conductual para adultos y parejas",
    about: "Espacio cálido y profesional para acompañarte en procesos de ansiedad, duelo y relaciones. Sesiones presenciales y online con enfoque basado en evidencia.",
    services: ["Terapia individual", "Terapia de pareja", "Manejo de ansiedad", "Acompañamiento en duelo", "Sesiones online"],
    categories: ["mental-health"], city: "BA", whatsapp: "5491134567890", phone: "+54 11 3456 7890",
    addressLine: "Av. Santa Fe 1234, Recoleta", availability: APPT, featured: true,
    // Note: demo@localia.app adds a 6th review later; keep within the reviewer pool.
    ratings: [5, 5, 4, 5, 5],
  },
  // --- Buenos Aires ---
  {
    key: "pampa-legal", name: "Martín Acosta", businessName: "Pampa Legal",
    headline: "Estudio jurídico en derecho laboral y de familia",
    about: "Asesoramiento claro y cercano en despidos, divorcios y sucesiones. Primera consulta sin cargo y planes de pago accesibles.",
    services: ["Derecho laboral", "Divorcios", "Sucesiones", "Contratos", "Mediación"],
    categories: ["legal"], city: "BA", whatsapp: "5491145678901", phone: "+54 11 4567 8901",
    addressLine: "Av. Corrientes 980, Centro", availability: A, ratings: [4, 5, 4, 4, 5],
  },
  {
    key: "casa-clara", name: "Lucía Fernández", businessName: "Casa Clara Propiedades",
    headline: "Compra, venta y alquiler en CABA y zona norte",
    about: "Más de 12 años conectando familias con su hogar ideal. Tasaciones gratuitas y acompañamiento integral durante toda la operación.",
    services: ["Venta de propiedades", "Alquileres", "Tasaciones", "Asesoría de inversión", "Gestión de documentación"],
    categories: ["real-estate"], city: "BA", whatsapp: "5491156789012", phone: "+54 11 5678 9012",
    addressLine: "Av. Cabildo 2100, Belgrano", availability: A, ratings: [4, 4, 5, 3, 4],
  },
  {
    key: "manos-obra", name: "Diego Romero", businessName: "Manos a la Obra",
    headline: "Plomería, electricidad y reparaciones del hogar",
    about: "Soluciones rápidas y prolijas para tu casa. Presupuestos sin compromiso y garantía en todos los trabajos.",
    services: ["Plomería", "Electricidad", "Pintura", "Albañilería", "Urgencias 24h"],
    categories: ["home-services"], city: "BA", whatsapp: "5491167890123", phone: "+54 11 6789 0123",
    addressLine: "Calle Gascón 450, Almagro", availability: A, ratings: [4, 5, 4, 4],
  },
  // --- São Paulo ---
  {
    key: "mente-sa", name: "Camila Souza", businessName: "Mente Sã Psicologia",
    headline: "Psicoterapia para ansiedade, burnout e autoestima",
    about: "Atendimento humanizado, presencial e online. Abordagem integrativa para te ajudar a recuperar o equilíbrio e o bem-estar.",
    services: ["Psicoterapia individual", "Ansiedade", "Burnout", "Autoestima", "Atendimento online"],
    categories: ["mental-health"], city: "SP", whatsapp: "5511987654321", phone: "+55 11 98765 4321",
    addressLine: "Rua Augusta 1500, Consolação", availability: APPT, featured: true, ratings: [5, 5, 5, 4, 5, 5],
  },
  {
    key: "verde-agro", name: "Rafael Lima", businessName: "Verde Agro Consultoria",
    headline: "Consultoria agronômica e manejo sustentável",
    about: "Apoio técnico para pequenas e médias propriedades: análise de solo, irrigação e culturas de alto rendimento.",
    services: ["Análise de solo", "Irrigação", "Manejo de pragas", "Planejamento de safra", "Certificação"],
    categories: ["agriculture"], city: "SP", whatsapp: "5511976543210", phone: "+55 11 97654 3210",
    addressLine: "Av. Paulista 2000, Bela Vista", availability: A, ratings: [4, 4, 5, 4],
  },
  {
    key: "codigo-vivo", name: "Beatriz Almeida", businessName: "Código Vivo",
    headline: "Desenvolvimento web e apps para pequenos negócios",
    about: "Sites rápidos, lojas virtuais e automações sob medida. Foco em resultado e suporte próximo do começo ao fim.",
    services: ["Sites institucionais", "Lojas virtuais", "Aplicativos", "Automação", "Suporte técnico"],
    categories: ["technology"], city: "SP", whatsapp: "5511965432109", phone: "+55 11 96543 2109",
    addressLine: "Rua dos Pinheiros 300, Pinheiros", availability: A, ratings: [5, 4, 5, 5, 4],
  },
  {
    key: "lar-novo", name: "Tiago Costa", businessName: "Lar Novo Imóveis",
    headline: "Apartamentos e casas em São Paulo capital",
    about: "Atendimento transparente para comprar, vender ou alugar. Conhecimento profundo dos bairros e do mercado local.",
    services: ["Venda", "Locação", "Avaliação", "Financiamento", "Documentação"],
    categories: ["real-estate"], city: "SP", whatsapp: "5511954321098", phone: "+55 11 95432 1098",
    addressLine: "Av. Faria Lima 1200, Itaim", availability: A, ratings: [3, 4, 4, 5],
  },
  // --- Ciudad de México ---
  {
    key: "abogados-cdmx", name: "Fernanda Reyes", businessName: "Reyes & Asociados",
    headline: "Abogados corporativos y derecho mercantil",
    about: "Acompañamos a empresas y emprendedores en contratos, constitución de sociedades y litigios mercantiles.",
    services: ["Derecho corporativo", "Contratos", "Litigios", "Propiedad intelectual", "Compliance"],
    categories: ["legal"], city: "MX", whatsapp: "5215512345678", phone: "+52 55 1234 5678",
    addressLine: "Av. Reforma 250, Cuauhtémoc", availability: A, featured: true, ratings: [5, 4, 5, 4, 5],
  },
  {
    key: "nutre-bien", name: "Andrea Gómez", businessName: "NutreBien",
    headline: "Nutrición clínica y planes personalizados",
    about: "Planes de alimentación reales y sostenibles para tu estilo de vida. Acompañamiento cercano y sin dietas imposibles.",
    services: ["Nutrición clínica", "Control de peso", "Nutrición deportiva", "Planes veganos", "Consultas online"],
    categories: ["health-nutrition"], city: "MX", whatsapp: "5215523456789", phone: "+52 55 2345 6789",
    addressLine: "Calle Durango 110, Roma Norte", availability: APPT, ratings: [5, 5, 4, 5, 4, 5],
  },
  {
    key: "tutores-mx", name: "Pablo Mendoza", businessName: "Tutores MX",
    headline: "Clases de matemáticas, física y preparación a examen",
    about: "Apoyo escolar y preparación para admisión universitaria. Profesores certificados y seguimiento individual.",
    services: ["Matemáticas", "Física", "Química", "Preparación UNAM/IPN", "Clases grupales"],
    categories: ["education"], city: "MX", whatsapp: "5215534567890", phone: "+52 55 3456 7890",
    addressLine: "Av. Universidad 800, Del Valle", availability: A, ratings: [4, 4, 5, 4, 5],
  },
  {
    key: "techlab-mx", name: "Sofía Navarro", businessName: "TechLab",
    headline: "Soporte de TI y ciberseguridad para PYMES",
    about: "Mantenemos tu negocio seguro y en línea: redes, respaldos y soporte remoto con respuesta inmediata.",
    services: ["Soporte de TI", "Ciberseguridad", "Redes", "Respaldos en la nube", "Mantenimiento"],
    categories: ["technology"], city: "MX", whatsapp: "5215545678901", phone: "+52 55 4567 8901",
    addressLine: "Insurgentes Sur 1500, Nápoles", availability: A, ratings: [4, 5, 4, 4],
  },
  // --- Bogotá ---
  {
    key: "raices-agro", name: "Juan Castro", businessName: "Raíces Agro",
    headline: "Asesoría agropecuaria y cultivos de altura",
    about: "Acompañamos a productores de la sabana con planes de fertilización, riego y comercialización de cosechas.",
    services: ["Fertilización", "Riego", "Control de plagas", "Comercialización", "Capacitación"],
    categories: ["agriculture"], city: "BG", whatsapp: "5731012345678", phone: "+57 310 123 4567",
    addressLine: "Calle 100 #15-20, Chicó", availability: A, ratings: [4, 4, 4, 5],
  },
  {
    key: "bienestar-mente", name: "Daniela Ríos", businessName: "Bienestar Mente",
    headline: "Psicología clínica y terapia infantil",
    about: "Atención para niños, adolescentes y adultos. Enfoque empático centrado en herramientas prácticas para el día a día.",
    services: ["Terapia infantil", "Terapia adolescente", "Ansiedad", "Orientación familiar", "Sesiones online"],
    categories: ["mental-health"], city: "BG", whatsapp: "5731023456789", phone: "+57 310 234 5678",
    addressLine: "Carrera 7 #70-30, Chapinero", availability: APPT, ratings: [5, 5, 4, 5, 5],
  },
  {
    key: "hogar-listo", name: "Andrés Patiño", businessName: "Hogar Listo",
    headline: "Remodelaciones, carpintería y mantenimiento",
    about: "Transformamos tu hogar con acabados de calidad. Cumplimiento, limpieza y garantía en cada proyecto.",
    services: ["Remodelaciones", "Carpintería", "Pintura", "Drywall", "Mantenimiento general"],
    categories: ["home-services"], city: "BG", whatsapp: "5731034567890", phone: "+57 310 345 6789",
    addressLine: "Calle 53 #25-10, Galerías", availability: A, ratings: [4, 3, 4, 5, 4],
  },
  {
    key: "lex-bogota", name: "María Velásquez", businessName: "Lex Bogotá",
    headline: "Derecho inmobiliario y civil",
    about: "Asesoría en compraventa de inmuebles, arrendamientos y procesos civiles con trato personalizado.",
    services: ["Derecho inmobiliario", "Arrendamientos", "Procesos civiles", "Contratos", "Conciliación"],
    categories: ["legal", "real-estate"], city: "BG", whatsapp: "5731045678901", phone: "+57 310 456 7890",
    addressLine: "Av. 19 #120-50, Usaquén", availability: A, ratings: [4, 5, 4, 4, 5],
  },
  // --- Santiago ---
  {
    key: "cumbre-edu", name: "Ignacio Fuentes", businessName: "Cumbre Educación",
    headline: "Preparación PAES y reforzamiento escolar",
    about: "Equipo de docentes dedicados a mejorar tus resultados. Diagnóstico inicial y plan de estudio a medida.",
    services: ["Preparación PAES", "Matemáticas", "Lenguaje", "Ciencias", "Clases online"],
    categories: ["education"], city: "ST", whatsapp: "5691234567", phone: "+56 9 1234 5678",
    addressLine: "Av. Providencia 1450, Providencia", availability: A, featured: true, ratings: [5, 4, 5, 5, 4, 5],
  },
  {
    key: "vital-nutri", name: "Constanza Rojas", businessName: "Vital Nutrición",
    headline: "Nutrióloga: salud digestiva y deportiva",
    about: "Te acompaño a alcanzar tus metas con alimentación basada en evidencia y hábitos que sí se sostienen.",
    services: ["Salud digestiva", "Nutrición deportiva", "Control de peso", "Educación alimentaria", "Online"],
    categories: ["health-nutrition"], city: "ST", whatsapp: "5692345678", phone: "+56 9 2345 6789",
    addressLine: "Av. Apoquindo 4500, Las Condes", availability: APPT, ratings: [5, 5, 4, 5],
  },
  {
    key: "andes-prop", name: "Felipe Muñoz", businessName: "Andes Propiedades",
    headline: "Corretaje de propiedades en la Región Metropolitana",
    about: "Asesoría honesta para comprar o arrendar. Conocemos cada comuna y te ayudamos a decidir con tranquilidad.",
    services: ["Venta", "Arriendo", "Tasación", "Asesoría legal", "Gestión bancaria"],
    categories: ["real-estate"], city: "ST", whatsapp: "5693456789", phone: "+56 9 3456 7890",
    addressLine: "Av. Vitacura 3200, Vitacura", availability: A, ratings: [3, 4, 4, 4],
  },
  {
    key: "byte-cl", name: "Javiera Soto", businessName: "Byte Studio",
    headline: "Diseño web y marketing digital",
    about: "Creamos presencia digital que convierte: sitios, branding y campañas medibles para pymes en crecimiento.",
    services: ["Diseño web", "Branding", "SEO", "Redes sociales", "Publicidad"],
    categories: ["technology"], city: "ST", whatsapp: "5694567890", phone: "+56 9 4567 8901",
    addressLine: "Av. Brasil 250, Santiago Centro", availability: A, ratings: [4, 5, 4, 5, 5],
  },
  // --- Lima ---
  {
    key: "equilibrio-pe", name: "Renato Salas", businessName: "Equilibrio Psicología",
    headline: "Terapia para ansiedad, estrés y desarrollo personal",
    about: "Acompañamiento profesional y confidencial. Te ayudo a entender tus emociones y construir bienestar duradero.",
    services: ["Terapia individual", "Manejo del estrés", "Ansiedad", "Desarrollo personal", "Online"],
    categories: ["mental-health"], city: "LM", whatsapp: "51987654321", phone: "+51 987 654 321",
    addressLine: "Av. Larco 1100, Miraflores", availability: APPT, ratings: [5, 4, 5, 5, 4],
  },
  {
    key: "obra-fina", name: "Carmen Huamán", businessName: "Obra Fina",
    headline: "Gasfitería, electricidad y acabados",
    about: "Servicios para el hogar con personal calificado. Atención puntual y trabajo garantizado en toda Lima.",
    services: ["Gasfitería", "Electricidad", "Pintura", "Acabados", "Emergencias"],
    categories: ["home-services"], city: "LM", whatsapp: "51976543210", phone: "+51 976 543 210",
    addressLine: "Av. Arequipa 2300, Lince", availability: A, ratings: [4, 4, 5, 3, 4],
  },
  {
    key: "saber-pe", name: "Gabriel Ramos", businessName: "Saber Más Tutorías",
    headline: "Refuerzo escolar y preparación preuniversitaria",
    about: "Clases personalizadas que se adaptan al ritmo de cada estudiante. Resultados visibles desde el primer mes.",
    services: ["Matemáticas", "Comunicación", "Ciencias", "Preparación admisión", "Clases online"],
    categories: ["education"], city: "LM", whatsapp: "51965432109", phone: "+51 965 432 109",
    addressLine: "Av. Brasil 900, Jesús María", availability: A, ratings: [4, 5, 4, 4, 5],
  },
  {
    key: "tierra-agro", name: "Lucía Vega", businessName: "Tierra Fértil Agro",
    headline: "Asesoría agrícola para la costa peruana",
    about: "Optimizamos tu producción con manejo de suelos, riego tecnificado y asesoría en exportación de cultivos.",
    services: ["Manejo de suelos", "Riego tecnificado", "Cultivos de exportación", "Control fitosanitario", "Capacitación"],
    categories: ["agriculture"], city: "LM", whatsapp: "51954321098", phone: "+51 954 321 098",
    addressLine: "Av. La Marina 500, San Miguel", availability: A, ratings: [4, 4, 5, 4],
  },

  // --- PENDING (admin review queue demo) ---
  {
    key: "nueva-luz", name: "Esteban Páez", businessName: "Nueva Luz Coaching",
    headline: "Coaching de vida y desarrollo profesional",
    about: "Programas de acompañamiento para definir metas, mejorar hábitos y avanzar en tu carrera con claridad.",
    services: ["Coaching de vida", "Coaching ejecutivo", "Hábitos", "Productividad", "Sesiones online"],
    categories: ["mental-health", "education"], city: "BA", whatsapp: "5491178901234", phone: "+54 11 7890 1234",
    addressLine: "Av. Rivadavia 5000, Caballito", availability: APPT, status: "PENDING", ratings: [],
  },
  {
    key: "horta-verde", name: "Marcos Pereira", businessName: "Horta Verde",
    headline: "Hortas urbanas e paisagismo comestível",
    about: "Projetamos e instalamos hortas em casas, escolas e empresas. Sustentabilidade que cabe no seu espaço.",
    services: ["Hortas urbanas", "Paisagismo", "Compostagem", "Manutenção", "Consultoria"],
    categories: ["agriculture", "home-services"], city: "SP", whatsapp: "5511943210987", phone: "+55 11 94321 0987",
    addressLine: "Rua Harmonia 200, Vila Madalena", availability: A, status: "PENDING", ratings: [],
  },
  {
    key: "datos-mx", name: "Ricardo Luna", businessName: "DataMex Analytics",
    headline: "Análisis de datos y dashboards para negocios",
    about: "Convertimos tus datos en decisiones: tableros, reportes automatizados y modelos de predicción a medida.",
    services: ["Dashboards", "Reportes", "Análisis predictivo", "Integraciones", "Capacitación"],
    categories: ["technology"], city: "MX", whatsapp: "5215556789012", phone: "+52 55 5678 9012",
    addressLine: "Av. Chapultepec 480, Juárez", availability: A, status: "PENDING", ratings: [],
  },
  {
    key: "salud-pe", name: "Patricia Flores", businessName: "Salud Integral",
    headline: "Nutrición y bienestar familiar",
    about: "Acompañamiento nutricional para toda la familia, con planes prácticos y educación alimentaria continua.",
    services: ["Nutrición familiar", "Control de peso", "Nutrición infantil", "Educación alimentaria", "Online"],
    categories: ["health-nutrition"], city: "LM", whatsapp: "51943210987", phone: "+51 943 210 987",
    addressLine: "Av. Benavides 1500, Surco", availability: APPT, status: "PENDING", ratings: [],
  },
];

// Reviewer pool (clients that author the seeded reviews).
const REVIEWERS = [
  { email: "sofia.client@localia.app", name: "Sofía Méndez" },
  { email: "mateo.client@localia.app", name: "Mateo Giordano" },
  { email: "valeria.client@localia.app", name: "Valeria Cruz" },
  { email: "nicolas.client@localia.app", name: "Nicolás Duarte" },
  { email: "isabela.client@localia.app", name: "Isabela Ferreira" },
  { email: "thiago.client@localia.app", name: "Thiago Barros" },
];

const REVIEW_COMMENTS = [
  "Excelente atención, muy profesional y puntual. Lo recomiendo totalmente.",
  "Quedé muy conforme con el servicio. Volvería sin dudarlo.",
  "Muito atencioso e dedicado. Superou minhas expectativas.",
  "Gran experiencia, resolvió todo con paciencia y claridad.",
  "Trato cercano y resultados visibles. Cinco estrellas.",
  "Profissional excelente, recomendo de olhos fechados.",
  "Cumplió con los tiempos y la calidad fue impecable.",
  "Muy buena comunicación durante todo el proceso.",
];

// Local slugify (kept in-file so the seed has no src import side effects).
function slugify(input: string): string {
  return (
    input
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "provider"
  );
}

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  // --- Idempotency: clear demo rows (FKs cascade from User/Provider) -------
  const demoEmails = [
    "admin@localia.app",
    "pro@localia.app",
    "demo@localia.app",
    ...REVIEWERS.map((r) => r.email),
    ...PROVIDERS.map((p) => `${p.key}@localia.app`),
  ];
  // Cascades remove Provider, ProviderCategory, Review, Favorite, RefreshToken.
  await prisma.user.deleteMany({ where: { email: { in: demoEmails } } });
  await prisma.category.deleteMany({ where: { slug: { in: CATEGORIES.map((c) => c.slug) } } });
  await prisma.auditLog.deleteMany({ where: { action: { startsWith: "seed." } } });

  // --- Categories ----------------------------------------------------------
  for (const c of CATEGORIES) {
    await prisma.category.create({ data: c });
  }
  const categories = await prisma.category.findMany();
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));

  // --- Demo accounts -------------------------------------------------------
  const admin = await prisma.user.create({
    data: { email: "admin@localia.app", name: "Admin Localia", passwordHash, role: "ADMIN", locale: "en" },
  });
  const proUser = await prisma.user.create({
    data: { email: "pro@localia.app", name: "Valentina Ortiz", passwordHash, role: "PROVIDER", locale: "es" },
  });
  const clientUser = await prisma.user.create({
    data: { email: "demo@localia.app", name: "Demo Client", passwordHash, role: "CLIENT", locale: "en" },
  });

  // --- Reviewer accounts ---------------------------------------------------
  const reviewers = [];
  for (const r of REVIEWERS) {
    reviewers.push(
      await prisma.user.create({
        data: { email: r.email, name: r.name, passwordHash, role: "CLIENT", locale: "es" },
      }),
    );
  }

  // --- Providers -----------------------------------------------------------
  let providerCounter = 0;
  const created: { id: string; key: string; ratings: number[] }[] = [];

  for (const p of PROVIDERS) {
    providerCounter += 1;
    const cityInfo = CITIES[p.city];
    // The "lumen" profile is owned by pro@localia.app; others get their own user.
    const owner =
      p.key === "lumen"
        ? proUser
        : await prisma.user.create({
            data: {
              email: `${p.key}@localia.app`,
              name: p.name,
              passwordHash,
              role: "PROVIDER",
              locale: cityInfo.country === "BR" ? "pt" : "es",
            },
          });

    const catIds = p.categories
      .map((slug) => catBySlug.get(slug)?.id)
      .filter((id): id is string => Boolean(id));

    const provider = await prisma.provider.create({
      data: {
        userId: owner.id,
        slug: `${slugify(p.businessName)}-${p.key.slice(0, 6)}`,
        businessName: p.businessName,
        headline: p.headline,
        about: p.about,
        services: p.services,
        avatarUrl: `https://i.pravatar.cc/300?u=${p.key}`,
        coverUrl: `https://picsum.photos/seed/${p.key}-cover/800/600`,
        photos: [
          `https://picsum.photos/seed/${p.key}-1/800/600`,
          `https://picsum.photos/seed/${p.key}-2/800/600`,
          `https://picsum.photos/seed/${p.key}-3/800/600`,
        ],
        phone: p.phone,
        whatsapp: p.whatsapp,
        addressLine: p.addressLine,
        city: cityInfo.city,
        region: cityInfo.region,
        country: cityInfo.country,
        lat: jitter(cityInfo.lat, providerCounter),
        lng: jitter(cityInfo.lng, providerCounter + 7),
        availability: p.availability,
        status: p.status ?? "APPROVED",
        featured: p.featured ?? false,
        categories: { create: catIds.map((categoryId) => ({ categoryId })) },
      },
    });

    created.push({ id: provider.id, key: p.key, ratings: p.ratings });
  }

  // --- Reviews + rating recompute ------------------------------------------
  // The Review unique constraint is (providerId, clientId), so reviewers within a
  // single provider must be distinct. We rotate a starting offset per provider and
  // cap each provider's review count at the reviewer-pool size.
  let providerIndex = 0;
  for (const c of created) {
    if (c.ratings.length === 0) {
      providerIndex += 1;
      continue;
    }
    const ratings = c.ratings.slice(0, reviewers.length); // guarantee distinctness
    for (let i = 0; i < ratings.length; i++) {
      const reviewer = reviewers[(providerIndex + i) % reviewers.length];
      await prisma.review.create({
        data: {
          providerId: c.id,
          clientId: reviewer.id,
          rating: ratings[i],
          comment: REVIEW_COMMENTS[(providerIndex + i) % REVIEW_COMMENTS.length],
        },
      });
    }
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    await prisma.provider.update({
      where: { id: c.id },
      data: { ratingAvg: Math.round(avg * 10) / 10, reviewCount: ratings.length },
    });
    providerIndex += 1;
  }

  // --- demo@localia.app: a review + favorites ------------------------------
  const lumen = created.find((c) => c.key === "lumen")!;
  const favTargets = created.filter((c) => ["pampa-legal", "nutre-bien", "byte-cl"].includes(c.key));

  // One review by the demo client (recompute that provider's rating after).
  await prisma.review.create({
    data: {
      providerId: lumen.id,
      clientId: clientUser.id,
      rating: 5,
      comment: "La mejor experiencia, muy recomendable. Volvería sin dudarlo.",
    },
  });
  {
    const agg = await prisma.review.aggregate({
      where: { providerId: lumen.id },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.provider.update({
      where: { id: lumen.id },
      data: {
        ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        reviewCount: agg._count.rating,
      },
    });
  }

  for (const t of favTargets) {
    await prisma.favorite.create({ data: { clientId: clientUser.id, providerId: t.id } });
  }

  // Seed an audit entry for the admin demo.
  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "seed.bootstrap", meta: { providers: created.length } },
  });

  // --- Print summary -------------------------------------------------------
  const [users, approvedCount, pendingCount, rejectedCount, categoryCount, reviewCount, favoriteCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.provider.count({ where: { status: "APPROVED" } }),
      prisma.provider.count({ where: { status: "PENDING" } }),
      prisma.provider.count({ where: { status: "REJECTED" } }),
      prisma.category.count(),
      prisma.review.count(),
      prisma.favorite.count(),
    ]);

  console.log("Seed complete.");
  console.log(`  users:               ${users}`);
  console.log(`  providers approved:  ${approvedCount}`);
  console.log(`  providers pending:   ${pendingCount}`);
  console.log(`  providers rejected:  ${rejectedCount}`);
  console.log(`  categories:          ${categoryCount}`);
  console.log(`  reviews:             ${reviewCount}`);
  console.log(`  favorites:           ${favoriteCount}`);
  console.log("Demo logins (password demo1234): admin@localia.app / pro@localia.app / demo@localia.app");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
