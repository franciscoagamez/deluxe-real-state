# Buenas Prácticas para Aplicaciones Next.js de Bienes Raíces

Guía de referencia con buenas prácticas, recomendaciones e ideas a evaluar al construir o revisar una aplicación Next.js dedicada a la venta/renta de bienes raíces (real estate).

## Arquitectura y Estructura del Proyecto

- Usar el App Router de Next.js con Server Components por defecto; reservar Client Components solo para interactividad (mapas, filtros, carruseles, formularios).
- Separar claramente las capas: `app/` para rutas y páginas, `components/` para UI reutilizable, `lib/` para lógica de negocio y clientes de datos (Supabase, APIs de MLS), `types/` para tipado compartido.
- Definir un tipo `Property` (o similar) centralizado y consistente en toda la app, evitando duplicar shapes de datos entre componentes.
- Utilizar Route Groups y layouts anidados para separar secciones como `(marketing)`, `(dashboard)`, `(listings)` con sus propios layouts y metadata.
- Considerar Server Actions para mutaciones (crear leads, guardar favoritos, contactar agente) en lugar de exponer API routes innecesarias.

## Rendimiento

- Usar `next/image` con dimensiones correctas y `sizes` apropiados para fotos de propiedades, que suelen ser el recurso más pesado de la página.
- Configurar dominios de imágenes remotas (CDN, Unsplash, Supabase Storage) en `next.config.ts` y preferir formatos modernos (WebP/AVIF).
- Aplicar Incremental Static Regeneration (ISR) en páginas de listados y fichas de propiedad que no cambian con cada request, con revalidación acorde a la frecuencia de actualización del inventario.
- Implementar paginación o scroll infinito con carga diferida (lazy loading) para listados extensos de propiedades.
- Usar `loading.tsx` y Suspense boundaries para mostrar skeletons mientras cargan resultados de búsqueda o mapas.
- Evitar cascadas de fetch: paralelizar llamadas a datos independientes (propiedad + agente + propiedades similares).
- Memorizar/cachear resultados de búsquedas y filtros costosos (ej. `unstable_cache` o cache de Supabase/Postgres).

## SEO y Metadata

- Generar metadata dinámica (`generateMetadata`) por cada ficha de propiedad: título, descripción, imagen destacada (Open Graph) y precio.
- Implementar datos estructurados (JSON-LD) con el schema `RealEstateListing` / `Residence` / `Product` de Schema.org para mejorar la aparición en resultados de búsqueda.
- Usar URLs semánticas y amigables (ej. `/propiedades/casa-en-venta-polanco-3-recamaras` en vez de IDs crudos).
- Generar `sitemap.xml` dinámico que incluya todas las propiedades activas y se actualice cuando se publican o eliminan listados.
- Configurar `robots.txt` para evitar indexar páginas de administración, favoritos o resultados de búsqueda con muchos parámetros duplicados.
- Añadir canonical URLs en páginas de listados filtrados para evitar contenido duplicado por combinaciones de filtros.

## Datos y Backend

- Validar filtros y parámetros de búsqueda del lado del servidor (precio, ubicación, tipo de propiedad, recámaras) antes de consultarlos en la base de datos.
- Usar índices en la base de datos (Supabase/Postgres) sobre columnas de búsqueda frecuente: ciudad, precio, tipo, estatus, fecha de publicación.
- Implementar Row Level Security (RLS) en Supabase para proteger datos sensibles de agentes, leads y transacciones.
- Separar el estado de una propiedad (`disponible`, `en proceso`, `vendida`, `rentada`) de forma explícita y reflejarlo consistentemente en la UI y en el SEO (no indexar propiedades vendidas/inactivas).
- Versionar y auditar cambios de precio e historial de la propiedad si el negocio lo requiere (transparencia para el comprador).
- Manejar correctamente zonas horarias y monedas si se opera en múltiples países o regiones.

## UX / UI para Bienes Raíces

- Priorizar galerías de imágenes de alta calidad con zoom y, si es posible, tours virtuales 360° o video.
- Incluir mapas interactivos (Google Maps/Mapbox) con geolocalización de la propiedad y puntos de interés cercanos (escuelas, transporte, comercios).
- Ofrecer filtros de búsqueda robustos: rango de precio, ubicación, tipo de propiedad, número de recámaras/baños, superficie, amenidades.
- Guardar el estado de los filtros en la URL (query params) para permitir compartir/bookmarkear búsquedas y mantener el estado al navegar con el botón "atrás".
- Implementar comparación de propiedades (side-by-side) y lista de favoritos persistente (para usuarios autenticados o vía localStorage).
- Mostrar claramente información clave "above the fold": precio, ubicación, características principales y llamada a la acción (contactar agente/agendar visita).
- Diseñar formularios de contacto/lead simples, con validación en tiempo real y feedback inmediato de envío exitoso.
- Cuidar el diseño responsive: gran parte del tráfico de bienes raíces es móvil, especialmente para búsquedas locales.

## Accesibilidad

- Asegurar contraste de color adecuado (WCAG AA) en tarjetas de propiedades y textos sobre imágenes.
- Añadir texto alternativo (`alt`) descriptivo en fotos de propiedades (ej. "Sala con vista al jardín" en vez de "imagen1.jpg").
- Garantizar navegación completa por teclado en filtros, carruseles de imágenes y mapas.
- Usar landmarks semánticos (`<main>`, `<nav>`, `<section>`) y encabezados jerárquicos correctos para lectores de pantalla.

## Seguridad

- Sanitizar y validar toda entrada de usuario en formularios de contacto/leads para prevenir inyecciones y spam (rate limiting, CAPTCHA/Turnstile).
- Proteger rutas de administración de propiedades y CRM con autenticación y autorización adecuadas (middleware de Next.js).
- No exponer claves de servicio (Supabase service role, APIs de terceros) en el cliente; mantenerlas solo en Server Components/Server Actions.
- Validar y limitar el tamaño/tipo de archivos en subida de imágenes de propiedades.

## Analítica y Conversión

- Instrumentar eventos clave: vista de propiedad, clic en "contactar", guardar favorito, uso de filtros, para entender el embudo de conversión.
- Integrar herramientas de mapas de calor o grabación de sesión con cuidado de la privacidad y cumplimiento (GDPR/LFPDPPP).
- Realizar pruebas A/B en elementos de alto impacto: posición del CTA, formato de precio, orden de galería.

## Testing y Calidad

- Cubrir con pruebas unitarias la lógica de filtrado, cálculo de precios y formateo de datos (moneda, superficie).
- Añadir pruebas end-to-end (Playwright/Cypress) para flujos críticos: búsqueda de propiedades, envío de formulario de contacto, agendar visita.
- Usar TypeScript de forma estricta (`strict: true`) para reducir errores en el manejo de datos de propiedades y evitar campos `undefined` no controlados.
- Configurar ESLint y Prettier consistentes en todo el equipo para mantener calidad de código.

## Ideas Adicionales / Diferenciadores

- Calculadora de hipoteca/financiamiento integrada en la ficha de propiedad.
- Recomendaciones de propiedades similares basadas en ubicación, precio y características (básico: reglas; avanzado: embeddings/ML).
- Alertas de nuevas propiedades vía email/push cuando coinciden con una búsqueda guardada del usuario.
- Integración con WhatsApp Business para contacto directo con agentes, muy relevante en mercados hispanohablantes.
- Panel para agentes/administradores con métricas de desempeño de sus listados (vistas, leads generados, tiempo en mercado).
- Soporte multi-idioma (i18n) si el mercado objetivo incluye compradores extranjeros o zonas turísticas.
