/**
 * Everything the game says, in every language it says it in.
 *
 * The strings live here rather than in the site's assets/i18n.js for the same
 * reason the game rules live in a pure engine: Phase 2 has no site.js and no
 * window.wingT, and the app has to be able to speak for itself. The site owns
 * the *choice* of language (see useLanguage.web.ts); the game owns its words.
 *
 * English is the fallback. A missing Spanish key shows the English wording
 * rather than a raw key or an empty label — a half-translated screen is
 * readable, a screen full of `settings.undo.title` is not.
 *
 * `{placeholders}` are substituted by `t(key, vars)`.
 */

export const SUPPORTED = ['en', 'es'] as const;
export type Language = (typeof SUPPORTED)[number];

const en = {
  /* ---- game screen ---- */
  'game.tagline': 'Free · No ads · No tracking',
  'game.hint': 'Swipe to move — or use the arrow keys.',
  'game.howToPlay': 'How to play',
  'game.watch': 'Watch a game',
  'game.newGame': 'New game',
  'game.newGame.confirm': 'Discard and restart',
  'game.newGame.hint': 'This discards your game worth {score} points and cannot be undone',
  'game.undo': 'Undo',
  'game.undo.hint': 'Take back your last move',
  'game.score': 'Score',
  'game.best': 'Best {size}×{size}',

  /* ---- shared navigation ---- */
  'nav.settings': 'Settings',
  'nav.stats': 'Stats',
  'nav.about': 'About',
  'nav.done': 'Done',
  'nav.play': 'Play',
  'nav.back': 'Back',
  'nav.next': 'Next',

  /* ---- win / game over ---- */
  'overlay.won': 'You win!',
  'overlay.won.detail': 'You reached {target} with {score} points.',
  'overlay.over': 'Game over',
  'overlay.over.detail': 'Final score: {score}',
  'overlay.keepPlaying': 'Keep playing',

  /* ---- spoken feedback ---- */
  'a11y.moved': 'Moved {direction}.',
  'a11y.noMove': 'No move {direction}.',
  'a11y.merged': 'Merged to {values}.',
  'a11y.scoreNow': 'Score {score}.',
  'a11y.spawned': 'New tile {value} at row {row}, column {col}.',
  'a11y.cell': 'row {row}, column {col}, {value}',
  'a11y.cellEmpty': 'row {row}, column {col}, empty',
  'a11y.board': '{size} by {size} game board',
  'a11y.and': 'and',
  'dir.up': 'up',
  'dir.down': 'down',
  'dir.left': 'left',
  'dir.right': 'right',

  /* ---- settings ---- */
  'settings.title': 'Settings',
  'settings.size.title': 'Board size',
  'settings.size.help': 'Anything from a quick 3×3 to a sprawling 8×8. Changing size starts a new game.',
  'settings.size.confirm': 'Switching to {size}×{size} starts a new game and discards your current one, worth {score} points. Tap it again to confirm.',
  'settings.theme.title': 'Theme',
  'settings.theme.help': 'Wing is the house look. Pick System to follow your device instead.',
  'settings.theme.system': 'System',
  'settings.undo.title': 'Undo',
  'settings.undo.off': 'Off',
  'settings.undo.one': 'One move',
  'settings.undo.unlimited': 'Unlimited',
  'settings.motion.title': 'Reduce motion',
  'settings.motion.help': 'Turn off tile sliding and pop animations.',
  'settings.haptics.title': 'Haptics',
  'settings.haptics.help': 'Vibrate on merges and game over.',
  'settings.data.title': 'Data',
  'settings.data.help': 'Everything is stored on this device only. Nothing is ever uploaded.',
  'settings.data.reset': 'Reset all data',
  'settings.data.reset.confirm': 'Yes, erase everything',
  'settings.data.reset.warning':
    'This erases your statistics, every best score, all settings and the game in progress. It cannot be undone.',
  'settings.data.reset.hint': 'Permanently erases all saved data',

  /* ---- theme names ---- */
  'theme.wing': 'Wing',
  'theme.classic': 'Classic',
  'theme.dark': 'Dark',
  'theme.contrast': 'High contrast',
  'theme.neon': 'Neon',
  'theme.forest': 'Forest',

  /* ---- stats ---- */
  'stats.title': 'Stats',
  'stats.bestScore': 'Best score',
  'stats.highestTile': 'Highest tile',
  'stats.gamesPlayed': 'Games played',
  'stats.gamesWon': 'Games won',
  'stats.longestStreak': 'Longest win streak',
  'stats.totalMoves': 'Total moves',
  'stats.totalMerges': 'Total merges',
  'stats.lifetimeScore': 'Lifetime score',
  'stats.achievements': 'Achievements ({unlocked}/{total})',
  'stats.unlocked': 'Unlocked',
  'stats.locked': 'Locked',

  /*
    Achievements, keyed by the engine's own ids.

    The six tile goals share one parametric pair rather than getting six
    near-identical entries, because the engine generates them from a list — add
    an 8192 goal there and the translation follows instead of falling through.
  */
  'achv.tile.label': 'Reach {value}',
  'achv.tile.description': 'Merge your way to a {value} tile.',
  'achv.first-win.label': 'First win',
  'achv.first-win.description': 'Reach the 2048 tile.',
  'achv.score-10k.label': 'Ten thousand',
  'achv.score-10k.description': 'Score 10,000 in a single game.',
  'achv.streak-3.label': 'Hat-trick',
  'achv.streak-3.description': 'Win three games in a row.',
  'achv.dedicated.label': 'Dedicated',
  'achv.dedicated.description': 'Play 1,000 moves.',

  /* ---- about ---- */
  'about.title': 'About',
  'about.free.title': 'Free, and free of ads',
  'about.free.body':
    'I built this version because I love 2048 and I hate ads. There are no banners, no interstitials, no “watch a video to continue”, and no paid upgrade. There never will be.',
  'about.privacy.title': 'No tracking, no network',
  'about.privacy.body':
    'This app sends no data anywhere. It contacts no server other than the one it was loaded from, and makes no third-party requests at all — no analytics, no telemetry, no tracking SDKs, no accounts. Your scores, settings and statistics are stored on this device and never leave it.',
  'about.credit.title': 'Credit',
  'about.credit.body':
    'Inspired by the original 2048 by Gabriele Cirulli, released under the MIT licence. This is an independent, freshly written version and is not affiliated with or endorsed by the original author.',
  'about.credit.link': 'View the original project',
  'about.licence.title': 'Licence',
  'about.licence.body': 'This app is MIT licensed. The original 2048 is © 2014 Gabriele Cirulli, also MIT licensed.',
  'about.version': 'Version {version}',

  /* ---- how to play ---- */
  'howto.title': 'How to play',
  'howto.step': 'Step {current} of {total}',
  'howto.pause': 'Pause',
  'howto.resume': 'Play',
  'howto.pause.hint': 'Stop the animation looping',
  'howto.resume.hint': 'Resume the animation',
  'howto.1.title': 'Everything slides',
  'howto.1.body': 'Swipe, or use the arrow keys. Every tile slides as far as it can in that direction, all at once.',
  'howto.2.title': 'Matching tiles merge',
  'howto.2.body': 'When two tiles with the same number meet, they become one tile worth double — and you score that much.',
  'howto.3.title': 'One merge per tile, per move',
  'howto.3.body': 'A tile that has just merged is done for that move. Four 4s become two 8s, not a single 16.',
  'howto.4.title': 'A new tile appears',
  'howto.4.body': 'After every move that changes something, a new 2 or 4 drops into a free square. The board fills up whether you are ready or not.',
  'howto.5.title': 'Keep your biggest in a corner',
  'howto.5.body': 'The one habit that changes everything. Pick a corner, keep your largest tile there, and build a run of decreasing tiles along that edge.',
  'howto.6.title': 'Reach 2048 to win',
  'howto.6.body': 'Two 1024s make it. You can carry on afterwards for a bigger score — plenty of people go for 4096.',

  /* ---- watch ---- */
  'watch.title': 'Watch a game',
  'watch.bestTile': 'Best tile',
  'watch.note.before': 'It keeps its biggest tile in a corner and builds a run along the edge — the same habit from step 5 of ',
  'watch.note.link': 'how to play',
  'watch.note.after': '. Around half its games reach 2048.',
  'watch.speed.slow': 'Slow',
  'watch.speed.normal': 'Normal',
  'watch.speed.fast': 'Fast',
  'watch.pause': 'Pause',
  'watch.resume': 'Resume',
  'watch.takeOver': 'Take over',
  'watch.takeOver.confirm': 'Replace my game',
  'watch.takeOver.hint': 'Continue this exact position yourself',
  'watch.takeOver.hintConfirm': 'This discards your game in progress, worth {score} points',
  'watch.takeOver.warning':
    'You have a game in progress worth {score} points. Taking over replaces it, and that cannot be undone.',

  /* ---- not found ---- */
  'notFound.title': 'Nothing here',
  'notFound.body':
    'That page does not exist. The game itself is fine — this is just a link that points somewhere that never was, or somewhere that has moved.',
  'notFound.back': 'Back to the game',

  /* ---- document titles and descriptions ---- */
  'meta.game.title': '2048 — Free and Ad-Free',
  'meta.game.description':
    'A free, ad-free, tracking-free 2048. Works offline. No accounts, no analytics, no third-party requests. Your data never leaves your device.',
  'meta.settings.title': 'Settings · 2048',
  'meta.stats.title': 'Stats · 2048',
  'meta.about.title': 'About · 2048',
  'meta.howto.title': 'How to play · 2048',
  'meta.watch.title': 'Watch a game · 2048',
  'meta.notFound.title': 'Not found · 2048',
} as const;

export type StringKey = keyof typeof en;

/**
 * Spanish.
 *
 * Written to match the register of the rest of wing.cx — direct, warm, first
 * person where the English is. Note "Ajustes" rather than "Configuración" for
 * brevity on a narrow chip, and the number words kept as numerals throughout
 * because they are read aloud beside actual tiles.
 */
const es: Partial<Record<StringKey, string>> = {
  'game.tagline': 'Gratis · Sin anuncios · Sin rastreo',
  'game.hint': 'Desliza para mover — o usa las flechas del teclado.',
  'game.howToPlay': 'Cómo se juega',
  'game.watch': 'Ver una partida',
  'game.newGame': 'Partida nueva',
  'game.newGame.confirm': 'Descartar y empezar',
  'game.newGame.hint': 'Esto descarta tu partida de {score} puntos y no se puede deshacer',
  'game.undo': 'Deshacer',
  'game.undo.hint': 'Deshace tu último movimiento',
  'game.score': 'Puntos',
  'game.best': 'Récord {size}×{size}',

  'nav.settings': 'Ajustes',
  'nav.stats': 'Estadísticas',
  'nav.about': 'Acerca de',
  'nav.done': 'Listo',
  'nav.play': 'Jugar',
  'nav.back': 'Atrás',
  'nav.next': 'Siguiente',

  'overlay.won': '¡Ganaste!',
  'overlay.won.detail': 'Llegaste a {target} con {score} puntos.',
  'overlay.over': 'Fin de la partida',
  'overlay.over.detail': 'Puntuación final: {score}',
  'overlay.keepPlaying': 'Seguir jugando',

  'a11y.moved': 'Moviste hacia {direction}.',
  'a11y.noMove': 'No hay movimiento hacia {direction}.',
  'a11y.merged': 'Se combinaron en {values}.',
  'a11y.scoreNow': '{score} puntos.',
  'a11y.spawned': 'Nueva ficha {value} en la fila {row}, columna {col}.',
  'a11y.cell': 'fila {row}, columna {col}, {value}',
  'a11y.cellEmpty': 'fila {row}, columna {col}, vacía',
  'a11y.board': 'tablero de juego de {size} por {size}',
  'a11y.and': 'y',
  'dir.up': 'arriba',
  'dir.down': 'abajo',
  'dir.left': 'la izquierda',
  'dir.right': 'la derecha',

  'settings.title': 'Ajustes',
  'settings.size.title': 'Tamaño del tablero',
  'settings.size.help': 'Desde un 3×3 rápido hasta un 8×8 enorme. Cambiar el tamaño empieza una partida nueva.',
  'settings.size.confirm': 'Cambiar a {size}×{size} empieza una partida nueva y descarta la actual, de {score} puntos. Tócalo otra vez para confirmar.',
  'settings.theme.title': 'Tema',
  'settings.theme.help': 'Wing es el aspecto de la casa. Elige Sistema para seguir el de tu dispositivo.',
  'settings.theme.system': 'Sistema',
  'settings.undo.title': 'Deshacer',
  'settings.undo.off': 'Desactivado',
  'settings.undo.one': 'Un movimiento',
  'settings.undo.unlimited': 'Sin límite',
  'settings.motion.title': 'Reducir movimiento',
  'settings.motion.help': 'Desactiva el deslizamiento y las animaciones de las fichas.',
  'settings.haptics.title': 'Vibración',
  'settings.haptics.help': 'Vibra al combinar fichas y al terminar la partida.',
  'settings.data.title': 'Datos',
  'settings.data.help': 'Todo se guarda solo en este dispositivo. Nunca se sube nada.',
  'settings.data.reset': 'Borrar todos los datos',
  'settings.data.reset.confirm': 'Sí, borrarlo todo',
  'settings.data.reset.warning':
    'Esto borra tus estadísticas, todos tus récords, todos los ajustes y la partida en curso. No se puede deshacer.',
  'settings.data.reset.hint': 'Borra permanentemente todos los datos guardados',

  'theme.wing': 'Wing',
  'theme.classic': 'Clásico',
  'theme.dark': 'Oscuro',
  'theme.contrast': 'Alto contraste',
  'theme.neon': 'Neón',
  'theme.forest': 'Bosque',

  'stats.title': 'Estadísticas',
  'stats.bestScore': 'Mejor puntuación',
  'stats.highestTile': 'Ficha más alta',
  'stats.gamesPlayed': 'Partidas jugadas',
  'stats.gamesWon': 'Partidas ganadas',
  'stats.longestStreak': 'Mejor racha de victorias',
  'stats.totalMoves': 'Movimientos totales',
  'stats.totalMerges': 'Combinaciones totales',
  'stats.lifetimeScore': 'Puntuación acumulada',
  'stats.achievements': 'Logros ({unlocked}/{total})',
  'stats.unlocked': 'Desbloqueado',
  'stats.locked': 'Bloqueado',

  'achv.tile.label': 'Llegar a {value}',
  'achv.tile.description': 'Combina fichas hasta conseguir un {value}.',
  'achv.first-win.label': 'Primera victoria',
  'achv.first-win.description': 'Consigue la ficha 2048.',
  'achv.score-10k.label': 'Diez mil',
  'achv.score-10k.description': 'Haz 10.000 puntos en una sola partida.',
  'achv.streak-3.label': 'Triplete',
  'achv.streak-3.description': 'Gana tres partidas seguidas.',
  'achv.dedicated.label': 'Constancia',
  'achv.dedicated.description': 'Juega 1.000 movimientos.',

  'about.title': 'Acerca de',
  'about.free.title': 'Gratis, y sin anuncios',
  'about.free.body':
    'Hice esta versión porque me encanta 2048 y odio los anuncios. No hay banners, ni intersticiales, ni «mira un vídeo para continuar», ni versión de pago. Nunca los habrá.',
  'about.privacy.title': 'Sin rastreo, sin red',
  'about.privacy.body':
    'Esta aplicación no envía datos a ningún sitio. No contacta con más servidor que aquel del que se descargó, y no hace ninguna petición a terceros: sin analítica, sin telemetría, sin SDKs de rastreo, sin cuentas. Tus puntuaciones, ajustes y estadísticas se guardan en este dispositivo y nunca salen de él.',
  'about.credit.title': 'Créditos',
  'about.credit.body':
    'Inspirado en el 2048 original de Gabriele Cirulli, publicado con licencia MIT. Esta es una versión independiente, escrita desde cero, sin relación con el autor original ni respaldada por él.',
  'about.credit.link': 'Ver el proyecto original',
  'about.licence.title': 'Licencia',
  'about.licence.body': 'Esta aplicación tiene licencia MIT. El 2048 original es © 2014 Gabriele Cirulli, también con licencia MIT.',
  'about.version': 'Versión {version}',

  'howto.title': 'Cómo se juega',
  'howto.step': 'Paso {current} de {total}',
  'howto.pause': 'Pausa',
  'howto.resume': 'Reproducir',
  'howto.pause.hint': 'Detiene la animación',
  'howto.resume.hint': 'Reanuda la animación',
  'howto.1.title': 'Todo se desliza',
  'howto.1.body': 'Desliza, o usa las flechas del teclado. Cada ficha se desplaza todo lo que puede en esa dirección, todas a la vez.',
  'howto.2.title': 'Las fichas iguales se combinan',
  'howto.2.body': 'Cuando dos fichas con el mismo número se encuentran, se convierten en una que vale el doble — y sumas esos puntos.',
  'howto.3.title': 'Una combinación por ficha y movimiento',
  'howto.3.body': 'Una ficha que acaba de combinarse ya no vuelve a hacerlo en ese movimiento. Cuatro 4 se convierten en dos 8, no en un 16.',
  'howto.4.title': 'Aparece una ficha nueva',
  'howto.4.body': 'Después de cada movimiento que cambie algo, cae un 2 o un 4 en una casilla libre. El tablero se llena tanto si estás listo como si no.',
  'howto.5.title': 'Guarda la más grande en una esquina',
  'howto.5.body': 'La costumbre que lo cambia todo. Elige una esquina, mantén ahí tu ficha más grande y construye una fila descendente a lo largo de ese borde.',
  'howto.6.title': 'Llega a 2048 para ganar',
  'howto.6.body': 'Dos 1024 lo consiguen. Después puedes seguir para hacer más puntos — mucha gente va a por el 4096.',

  'watch.title': 'Ver una partida',
  'watch.bestTile': 'Mejor ficha',
  'watch.note.before': 'Mantiene su ficha más grande en una esquina y construye una fila a lo largo del borde — la misma costumbre del paso 5 de ',
  'watch.note.link': 'cómo se juega',
  'watch.note.after': '. Alrededor de la mitad de sus partidas llegan a 2048.',
  'watch.speed.slow': 'Lenta',
  'watch.speed.normal': 'Normal',
  'watch.speed.fast': 'Rápida',
  'watch.pause': 'Pausa',
  'watch.resume': 'Reanudar',
  'watch.takeOver': 'Tomar el control',
  'watch.takeOver.confirm': 'Reemplazar mi partida',
  'watch.takeOver.hint': 'Continúa tú mismo desde esta posición exacta',
  'watch.takeOver.hintConfirm': 'Esto descarta tu partida en curso, de {score} puntos',
  'watch.takeOver.warning':
    'Tienes una partida en curso de {score} puntos. Tomar el control la reemplaza, y eso no se puede deshacer.',

  'notFound.title': 'Aquí no hay nada',
  'notFound.body':
    'Esa página no existe. El juego está bien — esto es solo un enlace que apunta a algo que nunca estuvo ahí, o que se ha movido.',
  'notFound.back': 'Volver al juego',

  'meta.game.title': '2048 — Gratis y sin anuncios',
  'meta.game.description':
    'Un 2048 gratis, sin anuncios y sin rastreo. Funciona sin conexión. Sin cuentas, sin analítica, sin peticiones a terceros. Tus datos nunca salen de tu dispositivo.',
  'meta.settings.title': 'Ajustes · 2048',
  'meta.stats.title': 'Estadísticas · 2048',
  'meta.about.title': 'Acerca de · 2048',
  'meta.howto.title': 'Cómo se juega · 2048',
  'meta.watch.title': 'Ver una partida · 2048',
  'meta.notFound.title': 'No encontrado · 2048',
};

const DICTIONARIES: Record<Language, Partial<Record<StringKey, string>>> = { en, es };

/** Substitute {name} placeholders. */
export function translate(
  language: Language,
  key: StringKey,
  vars?: Record<string, string | number>,
): string {
  const value = DICTIONARIES[language]?.[key] ?? en[key];
  if (value === undefined) return key;
  if (!vars) return value;

  return Object.entries(vars).reduce(
    (text, [name, replacement]) => text.split(`{${name}}`).join(String(replacement)),
    value as string,
  );
}

/**
 * Whether a key exists at all.
 *
 * `translate` returns the key itself as a last resort, which is the right
 * behaviour for a lookup that should never fail — but it means a caller
 * building keys from runtime data (achievement ids, say) can print
 * `achv.tile-128.label` to a player. Such callers check first and fall back to
 * something readable.
 */
export function hasKey(key: string): key is StringKey {
  return key in en;
}
