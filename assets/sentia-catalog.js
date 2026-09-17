/* ============================================================
   CATÁLOGO DEL CLUB SENTIA (solo cursos con acceso compartido)
   - Rellenar SENTIA_BUNNY_LIBRARY con el Library ID de Bunny
   - Rellenar videoId de cada sesión al subirla a Bunny Stream
   - Rellenar url de cada material (Drive por enlace o
     assets/materiales/ dentro del repo)
   Un curso/sesión sin videoId se muestra como "Próximamente".
   Para agregar cursos futuros: copiar un bloque y ajustar orden.
   ============================================================ */
window.SENTIA_BUNNY_LIBRARY = "PENDIENTE"; // ej. "123456"

window.SENTIA_CURSOS = [
  {
    id: "guarda-custodia",
    orden: 1,
    titulo: "Evaluación Psicológica en Guardia y Custodia: Entrevista, Integración e Informe",
    instructor: "Mtra. Carla Yanin Martínez Abrego",
    descripcion: "Entrevista, integración de resultados y elaboración del informe pericial en procesos de guarda y custodia.",
    videos: [
      { titulo: "Sesión 1", videoId: "" },
      { titulo: "Sesión 2", videoId: "" },
      { titulo: "Sesión 5", videoId: "" }
    ],
    materiales: [
      { nombre: "Manual de Evaluación Psicológica en Guarda y Custodia", url: "" },
      { nombre: "Checklist para Entrevista, Integración e Informe Pericial", url: "" }
    ]
  },
  {
    id: "pap",
    orden: 2,
    titulo: "Primeros Auxilios Psicológicos: Contención, Detección de Riesgo y Canalización",
    instructor: "",
    descripcion: "Contención emocional en crisis, detección de señales de riesgo y canalización oportuna.",
    videos: [
      { titulo: "Sesión 1", videoId: "" },
      { titulo: "Sesión 2", videoId: "" },
      { titulo: "Sesión 3", videoId: "" }
    ],
    materiales: [
      { nombre: "Manual de Primeros Auxilios Psicológicos", url: "" },
      { nombre: "Checklist de Actuación y Canalización", url: "" }
    ]
  },
  {
    id: "salud-psicologica-laboral",
    orden: 3,
    titulo: "Salud Psicológica Laboral: Riesgos Psicosociales, Liderazgo y Rutas de Apoyo",
    instructor: "Mtra. Margarita Juárez Carrión",
    descripcion: "Detección y prevención de riesgos psicosociales, liderazgo y rutas de apoyo en el entorno laboral.",
    videos: [
      { titulo: "Sesión 1", videoId: "" },
      { titulo: "Sesión 2", videoId: "" },
      { titulo: "Sesión 3", videoId: "" }
    ],
    materiales: [
      { nombre: "Manual de Salud Psicológica Laboral", url: "" },
      { nombre: "Checklist de Riesgos Psicosociales y Rutas de Apoyo", url: "" }
    ]
  }
];

// Configuración general del club
window.SENTIA_CLUB = {
  whatsappVentas: "5212381863904",           // número de ventas (WhatsApp)
  coordinadora: "Arlet Guzmán",              // nombre en certificados
  diasPorCurso: 8,                            // drip: 1 curso cada N días desde fechaVipDesde
  dominio: "https://sentiamx.com"
};
