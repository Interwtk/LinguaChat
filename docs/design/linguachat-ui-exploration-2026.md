# LinguaChat — Auditoría y rediseño integral (exploración, 7 noviembre 2026)

## Fuentes de verdad revisadas

- Repositorio conectado: `Interwtk/LinguaChat`, rama `main`, commit `086323c41f5f93ff8af12ee70304c30b1633f2d0`.
- Frontend: `linguachat-frontend/src/App.jsx`, `src/index.css` y componentes de autenticación, navegación, Hoy, Chats, sala de conversación, memoria/palabras, identidad personal, configuración, lecciones, práctica, sesión, audio, archivo y planes.
- Backend: `linguachat-backend/app/routes/chat.py`, `routes/learning.py`, `routes/user.py`, `app/services/memory.py` y el contrato de producto en `.ai/STATE.md` y `README.md`.
- Despliegue: `vercel.json`, Vercel `linguachat`; la rama de diseño es aislada y no reemplaza producción.
- El código del repositorio refleja su estado remoto; no equivale a inspeccionar un servidor con usuarios reales o ejecutar pruebas end-to-end con credenciales.

## Lo que LinguaChat es

Lingua es el tutor y agente de conversación. Chatto es una mascota visual y de acompañamiento, nunca otro profesor autónomo. El idioma objetivo implementado es inglés. Existe un idioma auxiliar de interfaz/apoyo; los ocho locales implementados son `en`, `es`, `pt`, `fr`, `it`, `de`, `ja`, `ar`. Árabe requiere RTL en la interfaz, mientras que las frases en inglés mantienen LTR. La estructura actual de navegación se conserva: **Hoy · Chats · Palabras · Tú**. La experiencia debe ser cálida, atractiva y digna tanto para adultos como para niños, sin verse infantil para unos ni severa para otros.

## Estado funcional: evitar falsas promesas

El endpoint de evaluación guiada `/learning/evaluate` tiene fallback determinista; el historial temporal de `/chat` usa memoria de sesión limitada en proceso, no almacenamiento persistente. La ruta `/user` guarda en un diccionario en memoria; tampoco equivale a una base de datos productiva. El sistema dispone de autenticación pública web con Supabase y flujos UI de registro/inicio/recuperación. Sin embargo, el contrato actual no certifica entrega real de correo en producción ni integración completa de persistencia en la nube. Hay progreso de aprendizaje local, Pre-A1 habilitado y contenido integrado A1–C2 que permanece bloqueado. Existe reproducción TTS vía navegador para actividades de escucha, sin micrófono ni evaluación de pronunciación. Las superficies de llamadas de voz/video son anticipos de interfaz y no llamadas reales. Los planes/pricing que aparecen en el código no deben interpretarse como pasarela de cobro completada. Los prototipos respetan esas distinciones y simulan los eventos sin contactar datos del usuario.

## Cinco direcciones de identidad

| Dirección | Voz visual | Tipografía de cabecera | Formas | Movimiento |
|---|---|---|---|---|
| Atlas Editorial | Encuentro humano, sofisticación informal | Newsreader | Papel y líneas precisas | Entrada tipográfica, subrayado dibujado |
| Signal Studio | Claridad y ritmo digital | Space Grotesk | Módulos rectos, azul/cítrico | Transiciones de plano y barra de progreso |
| Folio Club | Taller personal de aprendizaje | Fraunces | Fichas y anotaciones de libreta | Deslizamiento de fichas, marcas de papel |
| Mosaic Commons | Lenguaje gráfico directo, accesible | Outfit | Bloques cromáticos planos | Revelado modular y foco |
| Nocturne | Conversación inmersiva y calma | Newsreader | Superficies oscuras cálidas | Fundidos contenidos y pulso sutil |

## Cobertura — 27 pantallas por dirección × 2 dispositivos

| Familia | Pantallas |
|---|---|
| Autenticación | Bienvenida; iniciar sesión; crear cuenta; confirmar correo; recuperar cuenta; nueva contraseña |
| Configuración inicial | Diagnóstico; resultado de nivel; intereses personales; preferencias de aprendizaje |
| Aprendizaje | Hoy; Chats; conversación con Lingua; episodio guiado; escucha; corrección; resumen |
| Cuenta | Palabras; detalle de palabra; perfil Tú; configuración; archivo de conversaciones; planes |
| Estados adicionales | Notas del tutor; apariencia del chat; llamada de voz (próximamente); videollamada (próximamente) |

Total de composiciones activas: **5 × 27 × 2 = 270 combinaciones de render**. Se verificó por ejecución del código de renderizado que las 270 producen contenido HTML no vacío. No se ejecutó una auditoría visual de navegador automatizada, debido a una restricción del navegador de pruebas en este entorno. Los 270 estados NO son pantallas Figma nativas ni 270 implementaciones independientes: son cinco sistemas visuales que comparten contenido funcional simulado.

## Componentes y estados transversales que deben conservarse al implementar

- Navegación primaria de cuatro áreas, accesible en ambos formatos. El resto son vistas secundarias o estados de esas áreas.
- Registro, sesión persistente y recuperación, con validación, estados de error, `aria-live` y foco accesible (pendiente conectar en prototipo visual).
- Selección de idioma auxiliar, localización real, subtítulos de apoyo y RTL árabe. Nunca tratar una traducción de respaldo inglés como locale totalmente soportado.
- Chat con historial, práctica guiada, modo enfoque, notas, personalización del tutor, ayudas, corrección, transición a episodio y evaluación del resultado.
- Memoria de vocabulario con estados `Seen/Practicing/CanUse`, actividades y detalle de frases.
- Escucha TTS real en implementación; transcripción y reproducción lenta marcadas como ayudas. Las pistas no equivalen a logro autónomo.
- Personalización, temas claro/oscuro, preferencia de movimiento reducido, meta diaria y sesiones.
- Archivo, pantallas de planes, y medios de voz/video con disponibilidad real claramente indicada.

## Reglas de animación y accesibilidad

- Duraciones: cambios de estado 120–180 ms, entrada de panel 180–300 ms, celebración breve 350–650 ms. No usar animación permanente sobre campos de entrada ni bucles de brillo decorativo.
- Respetar `prefers-reduced-motion`; nunca bloquear una acción hasta completar una animación.
- Contrastes mínimos WCAG AA, foco visible, áreas táctiles recomendadas de al menos 44 × 44 px y tipografía adaptable.
- Los estados son semánticos y significativos: completado, pendiente, bloqueado, próximo, error y fuera de línea. No usar color como única señal.
- Chatto conserva sus artes originales `src/assets/chatto`, sin deformación ni reemplazo por un supuesto segundo tutor. En el prototipo, no se recrean ni suplantan los archivos oficiales de Chatto.

## Estado de implementación y entrega

- Prototipo experimental: `linguachat-design-lab.html`; abre en cualquier navegador moderno y permite cambiar dirección, pantalla, dispositivo y movimiento, con navegación interna básica.
- Rama GitHub aislada: `design-lab/linguachat-five-concepts-2026-11-07`.
- Ruta en la rama: `linguachat-frontend/public/design-lab/index.html`. Vite copia `public/` al artefacto de compilación; un despliegue de preview no cambia producción.
- Archivo Figma nuevo creado como contenedor de trabajo, pero Figma MCP agotó la cuota disponible antes de poder escribir los layouts nativos; está sin pantallas. No se debe presentar como un Figma completo.
- Próximo paso técnico después de elegir una dirección: convertirla en componentes React reutilizables y variantes de Figma, enlazar todos los estados al `AppContext`, verificar escenarios reales en tamaños de 390 y 1440, idiomas es/ja/ar, QA de autenticación, sincronización y progreso, mantener A1–C2 bloqueados, y obtener dos ciclos limpios de validación antes de integrar cambios.

## Observaciones de diseño basadas en el código

El sistema actual usa una paleta crema/terracota/salvia y tipografías Figtree y Bricolage Grotesque, con tokens de dark mode. En escritorio tiene barra izquierda y panel contextual a la derecha; en una conversación la barra izquierda se convierte en lista de chats. En celular usa barra inferior. El rediseño propone cinco direcciones de estructura visual; no es necesario cambiar contratos de aprendizaje ni backend para probarlas. Priorizar una navegación reconocible, objetivos claros al entrar a Hoy, una conversación de Lingua sin ruido visual y una curva de aprendizaje gradual.

## Límites de estos prototipos

Las pantallas usan ejemplos ficticios; no autentican, no guardan resultados, no reproducen audio, no ejecutan el backend ni generan videollamadas. El selector de pantalla, dispositivo y concepto y algunos botones están conectados para evaluación visual. No son producto terminado ni entrega Figma editable. Sirven para comparar composiciones antes de implementar.