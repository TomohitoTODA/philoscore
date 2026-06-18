let pdfjsLib = null;
let pdfjsLoadPromise = null;

async function ensurePdfJs() {
  if (pdfjsLib) {
    return pdfjsLib;
  }

  if (!pdfjsLoadPromise) {
    pdfjsLoadPromise = new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          './vendor/pdf.worker.min.js';
        pdfjsLib = window.pdfjsLib;
        resolve(pdfjsLib);
        return;
      }

      const script = document.createElement('script');
      script.src = './vendor/pdf.min.js';
      script.async = true;
      script.onload = () => {
        if (!window.pdfjsLib) {
          reject(new Error('pdfjsLib is not available on window.'));
          return;
        }

        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          './vendor/pdf.worker.min.js';
        pdfjsLib = window.pdfjsLib;
        resolve(pdfjsLib);
      };
      script.onerror = () => {
        reject(new Error('Failed to load pdf.js script.'));
      };
      document.head.appendChild(script);
    })
      .catch((error) => {
        pdfjsLoadPromise = null;
        throw error;
      });
  }

  return pdfjsLoadPromise;
}

const fileInput = document.getElementById('fileInput');
const emptyState = document.getElementById('emptyState');
const scoreList = document.getElementById('scoreList');
const composerIndex = document.getElementById('composerIndex');
const listArea = document.getElementById('listArea');
const folderTabs = document.getElementById('folderTabs');
const headerAddButton = document.getElementById('headerAddButton');

const backdrop = document.getElementById('backdrop');
const previewSheet = document.getElementById('previewSheet');
const previewTitle = document.getElementById('previewTitle');
const previewStage = document.getElementById('previewStage');
const previewPageLabel = document.getElementById('previewPageLabel');
const openReaderButton = document.getElementById('openReaderButton');
const closePreviewButton = document.getElementById('closePreviewButton');
const editSheet = document.getElementById('editSheet');
const closeEditButton = document.getElementById('closeEditButton');
const editTitleInput = document.getElementById('editTitleInput');
const editComposerInput = document.getElementById('editComposerInput');
const saveEditButton = document.getElementById('saveEditButton');
const composerSuggestions = document.getElementById('composerSuggestions');
const moveFolderSheet = document.getElementById('moveFolderSheet');
const moveFolderSheetTitle = document.getElementById('moveFolderSheetTitle');
const closeMoveFolderButton = document.getElementById('closeMoveFolderButton');
const moveFolderList = document.getElementById('moveFolderList');
const folderPickerSummary = document.getElementById('folderPickerSummary');
const moveFolderConfirmButton = document.getElementById('moveFolderConfirmButton');

const reader = document.getElementById('reader');
const readerTabsList = document.getElementById('readerTabsList');
const readerTabAddButton = document.getElementById('readerTabAddButton');
const readerTitle = document.getElementById('readerTitle');
const readerStage = document.getElementById('readerStage');
const readerPrevButton = document.getElementById('readerPrevButton');
const readerNextButton = document.getElementById('readerNextButton');
const focusPrevButton = document.getElementById('focusPrevButton');
const focusNextButton = document.getElementById('focusNextButton');
const readerPageLabel = document.getElementById('readerPageLabel');
const closeReaderButton = document.getElementById('closeReaderButton');
const focusModeExitButton = document.getElementById('focusModeExitButton');
const focusModeCloseButton = document.getElementById('focusModeCloseButton');
const toolRedPenButton = document.getElementById('toolRedPenButton');
const toolMarkerButton = document.getElementById('toolMarkerButton');
const toolEraserButton = document.getElementById('toolEraserButton');
const toolFingerButton = document.getElementById('toolFingerButton');
const toolAccidentalButton = document.getElementById('toolAccidentalButton');
const toolBowingButton = document.getElementById('toolBowingButton');
const toolTextButton = document.getElementById('toolTextButton');
const toolRedCircleButton = document.getElementById('toolRedCircleButton');
const abPenBtn = document.getElementById('abPenBtn');
const abMarkerBtn = document.getElementById('abMarkerBtn');
const abEraserBtn = document.getElementById('abEraserBtn');
const abTextBtn = document.getElementById('abTextBtn');
const clearAnnotationButton = document.getElementById('clearAnnotationButton');
const exportAnnotatedPdfButton = document.getElementById('exportAnnotatedPdfButton');
const zoomOutButton = document.getElementById('zoomOutButton');
const zoomInButton = document.getElementById('zoomInButton');
const zoomResetButton = document.getElementById('zoomResetButton');
const zoomLabel = document.getElementById('zoomLabel');
const layoutSingleButton = document.getElementById('layoutSingleButton');
const layoutSpreadABtn = document.getElementById('layoutSpreadABtn');
const layoutSpreadBBtn = document.getElementById('layoutSpreadBBtn');
const layoutScrollVBtn = document.getElementById('layoutScrollVBtn');
const layoutScrollHBtn = document.getElementById('layoutScrollHBtn');
const fullscreenToggleButton = document.getElementById('fullscreenToggleButton');
const metronomeWindowToggle = document.getElementById('metronomeWindowToggle');
const metronomeBeatIndicator = document.getElementById('metronomeBeatIndicator');
const focusMetronomeBeatIndicator = document.getElementById('focusMetronomeBeatIndicator');
const tunerWindowToggle = document.getElementById('tunerWindowToggle');
const metronomePanel = document.getElementById('metronomePanel');
const tunerPanel = document.getElementById('tunerPanel');
const metronomeArm = document.getElementById('metronomeArm');
const metronomeRail = document.querySelector('.metro-rail');
const metronomeWeight = document.getElementById('metronomeWeight');
const metronomeMinusButton = document.getElementById('metronomeMinusButton');
const metronomePlusButton = document.getElementById('metronomePlusButton');
const metronomeBpmValue = document.getElementById('metronomeBpmValue');
const metronomeMarking = document.getElementById('metronomeMarking');
const metronomeToggleButton = document.getElementById('metronomeToggleButton');
const timeSignatureButtons = document.querySelectorAll('[data-time-signature]');
const rhythmButtons = document.querySelectorAll('[data-rhythm]');
const tunerGButton = document.getElementById('tunerGButton');
const tunerDButton = document.getElementById('tunerDButton');
const tunerAButton = document.getElementById('tunerAButton');
const tunerEButton = document.getElementById('tunerEButton');
const tunerTargetLabel = document.getElementById('tunerTargetLabel');
const micTunerToggleButton = document.getElementById('micTunerToggleButton');
const tunerNeedle = document.getElementById('tunerNeedle');
const tunerReadout = document.getElementById('tunerReadout');
const tunerThresholdSlider = document.getElementById('tunerThresholdSlider');
const tunerThresholdValue = document.getElementById('tunerThresholdValue');

const library = [];
const pdfCache = new Map();
const pdfThumbCache = new Map(); // item.id → data URL
const annotationStrokes = new Map(); // key → { version, ops: [] }
const annotationRedoStacks = new Map(); // key → op[] (undoで取り除いたop)
let currentStroke = null;
let annotationDb = null;
const persistentAnnotationCanvases = new Map();
const folders = [
  { id: 'favorites', name: 'お気に入り', kind: 'special', parentId: null, system: true },
  { id: 'inbox', name: '未分類', kind: 'leaf', parentId: null, system: true },
  { id: 'orchestra', name: 'オーケストラ', kind: 'section', parentId: null, system: true },
  { id: 'orchestra-practice', name: '練習中の曲', kind: 'group', parentId: 'orchestra', system: true },
  { id: 'orchestra-practice-part', name: 'パート譜', kind: 'leaf', parentId: 'orchestra-practice', system: true },
  { id: 'orchestra-practice-score', name: 'スコア', kind: 'leaf', parentId: 'orchestra-practice', system: true },
  { id: 'orchestra-past', name: '過去の曲', kind: 'group', parentId: 'orchestra', system: true },
  { id: 'orchestra-past-part', name: 'パート譜', kind: 'leaf', parentId: 'orchestra-past', system: true },
  { id: 'orchestra-past-score', name: 'スコア', kind: 'leaf', parentId: 'orchestra-past', system: true },
  { id: 'chamber', name: '室内楽', kind: 'section', parentId: null, system: true },
  { id: 'chamber-practice', name: '練習中の曲', kind: 'leaf', parentId: 'chamber', system: true },
  { id: 'chamber-past', name: '過去の曲', kind: 'leaf', parentId: 'chamber', system: true },
  { id: 'solo', name: 'ソロ曲', kind: 'section', parentId: null, system: true },
  { id: 'solo-practice', name: '練習中の曲', kind: 'leaf', parentId: 'solo', system: true },
  { id: 'solo-past', name: '過去の曲', kind: 'leaf', parentId: 'solo', system: true },
  { id: 'composer', name: '作曲家', kind: 'section', parentId: null, system: true },
];
const favoriteItemIds = [];

const COMPOSER_DB = [
  { name: 'Johann Sebastian Bach', ja: ['バッハ', 'ばっは', 'bach'] },
  { name: 'Georg Friedrich Handel', ja: ['ヘンデル', 'へんでる', 'handel'] },
  { name: 'Antonio Vivaldi', ja: ['ヴィヴァルディ', 'ビバルディ', 'びばるでぃ', 'vivaldi'] },
  { name: 'Henry Purcell', ja: ['パーセル', 'ぱーせる', 'purcell'] },
  { name: 'Claudio Monteverdi', ja: ['モンテヴェルディ', 'もんてべるでぃ', 'monteverdi'] },
  { name: 'Wolfgang Amadeus Mozart', ja: ['モーツァルト', 'もーつぁると', 'もーつあると', 'mozart'] },
  { name: 'Ludwig van Beethoven', ja: ['ベートーヴェン', 'ベートーベン', 'べーとーべん', 'べと', 'beethoven'] },
  { name: 'Franz Joseph Haydn', ja: ['ハイドン', 'はいどん', 'haydn'] },
  { name: 'Luigi Boccherini', ja: ['ボッケリーニ', 'ぼっけりーに', 'boccherini'] },
  { name: 'Muzio Clementi', ja: ['クレメンティ', 'くれめんてぃ', 'clementi'] },
  { name: 'Franz Schubert', ja: ['シューベルト', 'しゅーべると', 'schubert'] },
  { name: 'Robert Schumann', ja: ['シューマン', 'しゅーまん', 'schumann'] },
  { name: 'Clara Schumann', ja: ['クララ・シューマン', 'くらら', 'clara schumann'] },
  { name: 'Frédéric Chopin', ja: ['ショパン', 'しょぱん', 'chopin'] },
  { name: 'Franz Liszt', ja: ['リスト', 'りすと', 'liszt'] },
  { name: 'Felix Mendelssohn', ja: ['メンデルスゾーン', 'めんでるすぞーん', 'mendelssohn'] },
  { name: 'Hector Berlioz', ja: ['ベルリオーズ', 'べるりおーず', 'berlioz'] },
  { name: 'Johannes Brahms', ja: ['ブラームス', 'ぶらーむす', 'brahms'] },
  { name: 'Anton Bruckner', ja: ['ブルックナー', 'ぶるっくなー', 'bruckner'] },
  { name: 'Peter Ilyich Tchaikovsky', ja: ['チャイコフスキー', 'ちゃいこふすきー', 'ちゃい', 'tchaikovsky'] },
  { name: 'Antonín Dvořák', ja: ['ドヴォルザーク', 'どぼるざーく', 'どぼ', 'dvorak'] },
  { name: 'Richard Wagner', ja: ['ワーグナー', 'わーぐなー', 'wagner'] },
  { name: 'Giuseppe Verdi', ja: ['ヴェルディ', 'べるでぃ', 'verdi'] },
  { name: 'Giacomo Puccini', ja: ['プッチーニ', 'ぷっちーに', 'puccini'] },
  { name: 'Edvard Grieg', ja: ['グリーグ', 'ぐりーぐ', 'grieg'] },
  { name: 'Camille Saint-Saëns', ja: ['サン＝サーンス', 'サンサーンス', 'さんさんす', 'saint-saens'] },
  { name: 'Gabriel Fauré', ja: ['フォーレ', 'ふぉーれ', 'faure'] },
  { name: 'Georges Bizet', ja: ['ビゼー', 'びぜー', 'bizet'] },
  { name: 'César Franck', ja: ['フランク', 'ふらんく', 'franck'] },
  { name: 'Nikolai Rimsky-Korsakov', ja: ['リムスキー＝コルサコフ', 'リムスキーコルサコフ', 'りむすきー', 'rimsky-korsakov', 'rimsky'] },
  { name: 'Modest Mussorgsky', ja: ['ムソルグスキー', 'むそるぐすきー', 'mussorgsky'] },
  { name: 'Alexander Borodin', ja: ['ボロディン', 'ぼろでぃん', 'borodin'] },
  { name: 'Mikhail Glinka', ja: ['グリンカ', 'ぐりんか', 'glinka'] },
  { name: 'Gustav Mahler', ja: ['マーラー', 'まーらー', 'mahler'] },
  { name: 'Richard Strauss', ja: ['リヒャルト・シュトラウス', 'シュトラウス', 'しゅとらうす', 'richard strauss', 'r.strauss'] },
  { name: 'Claude Debussy', ja: ['ドビュッシー', 'どびゅっしー', 'どびゅ', 'debussy'] },
  { name: 'Maurice Ravel', ja: ['ラヴェル', 'らべる', 'ravel'] },
  { name: 'Jean Sibelius', ja: ['シベリウス', 'しべりうす', 'sibelius'] },
  { name: 'Edward Elgar', ja: ['エルガー', 'えるがー', 'elgar'] },
  { name: 'Sergei Rachmaninoff', ja: ['ラフマニノフ', 'らふまにのふ', 'らふ', 'rachmaninoff', 'rachmaninov'] },
  { name: 'Alexander Scriabin', ja: ['スクリャービン', 'すくりゃーびん', 'scriabin'] },
  { name: 'Sergei Prokofiev', ja: ['プロコフィエフ', 'ぷろこふぃえふ', 'プロコ', 'prokofiev'] },
  { name: 'Dmitri Shostakovich', ja: ['ショスタコーヴィチ', 'しょすたこーびち', 'ショスタコ', 'しょすたこ', 'shostakovich'] },
  { name: 'Igor Stravinsky', ja: ['ストラヴィンスキー', 'ストラビンスキー', 'すとらびんすきー', 'stravinsky'] },
  { name: 'Béla Bartók', ja: ['バルトーク', 'ばるとーく', 'bartok'] },
  { name: 'Zoltán Kodály', ja: ['コダーイ', 'こだーい', 'kodaly'] },
  { name: 'Manuel de Falla', ja: ['ファリャ', 'ふぁりゃ', 'falla', 'de falla'] },
  { name: 'Benjamin Britten', ja: ['ブリテン', 'ぶりてん', 'britten'] },
  { name: 'Aaron Copland', ja: ['コープランド', 'こーぷらんど', 'copland'] },
  { name: 'Carl Orff', ja: ['オルフ', 'おるふ', 'orff'] },
  { name: 'Francis Poulenc', ja: ['プーランク', 'ぷーらんく', 'poulenc'] },
  { name: 'Olivier Messiaen', ja: ['メシアン', 'めしあん', 'messiaen'] },
  { name: 'György Ligeti', ja: ['リゲティ', 'りげてぃ', 'ligeti'] },
  { name: 'Karlheinz Stockhausen', ja: ['シュトックハウゼン', 'しゅとっくはうぜん', 'stockhausen'] },
  { name: 'Arvo Pärt', ja: ['アルヴォ・ペルト', 'ペルト', 'ぺると', 'part', 'pärt'] },
  { name: 'Philip Glass', ja: ['フィリップ・グラス', 'グラス', 'philip glass', 'glass'] },
  { name: 'John Adams', ja: ['ジョン・アダムズ', 'アダムズ', 'john adams', 'adams'] },
  { name: 'Leoš Janáček', ja: ['ヤナーチェク', 'やなーちぇく', 'janacek'] },
  { name: 'Eugène-Auguste Ysaÿe', ja: ['イザイ', 'いざい', 'ysaye', 'ysaÿe'] },
  { name: 'Erich Wolfgang Korngold', ja: ['コルンゴルト', 'こるんごると', 'korngold'] },
  { name: 'Igor Frolov', ja: ['イーゴリ・フロロフ', 'いーごりふろろふ', 'frolov'] },
  { name: 'Heinrich Wilhelm Ernst', ja: ['エルンスト', 'えるんすと', 'ernst'] },
  { name: 'Bedřich Smetana', ja: ['スメタナ', 'すめたな', 'smetana'] },
  { name: 'Arnold Bax', ja: ['バックス', 'ばっくす', 'bax'] },
  { name: 'Toru Takemitsu', ja: ['武満徹', 'たけみつとおる', 'たけみつ', 'takemitsu'] },
  { name: 'Ikuma Dan', ja: ['団伊玖磨', 'だんいくま', 'dan ikuma'] },
  { name: 'Rentaro Taki', ja: ['滝廉太郎', 'たきれんたろう', 'taki'] },
  { name: 'Kosaku Yamada', ja: ['山田耕筰', 'やまだこうさく', 'yamada'] },
];

function kataToHira(str) {
  return str.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

function searchComposers(query) {
  if (!query || query.trim().length === 0) return [];
  const q = kataToHira(query.toLowerCase().trim());
  return COMPOSER_DB.filter(({ name, ja }) => {
    if (kataToHira(name.toLowerCase()).includes(q)) return true;
    return ja.some((alias) => kataToHira(alias.toLowerCase()).includes(q));
  }).slice(0, 6);
}

let activeItem = null;
let openReaderTabIds = [];
let openLibraryMenuId = null;
let openFolderMenuId = null;
let openMoveFolderItemId = null;
let previewScrollRafId = null;
let previewTrackingLoopId = null;
let previewRenderVersion = 0;
let editingLibraryItemId = null;
let isDrawing = false;
let lastPoint = null;
let lastAnnotationPoint = null;
let annotationCanvas = null;
let annotationContext = null;
let activeAnnotationPage = 1;
let audioContext = null;
let metronomeTimerId = null;
let metronomeSwingTimerId = null;
let isMetronomeRunning = false;
let metronomeSwingDirection = 1;
let isMetronomeDragging = false;
let metronomeBeatIndex = 0;
let metronomeSubIndex = 0;
let tunerOscillator = null;
let tunerGainNode = null;
let micTunerStream = null;
let micTunerSource = null;
let micTunerAnalyser = null;
let micTunerAnimationId = null;
let isMicTunerRunning = false;
let tunerTargetNote = 'A';
let tunerThresholdPercent = 100;
let activeTool = 'redPen';
let stampSizeMultiplier = 1.0;
let stampSizeLevelIndex = 2;
let readerZoom = 1;
let wheelZoomTimer = null;
let wheelBaseZoom = null;
let wheelBaseRect = null;
let wheelOriginX = 0;
let wheelOriginY = 0;
let wheelScrollTop = 0;
let wheelScrollLeft = 0;
let metronomeBpm = 100;
let metronomeTimeSignature = '4/4';
let metronomeRhythm = '1x';
let readerLayoutMode = 'single';
let readerPendingAnchorPage = null;
let isReaderFocusMode = false;
let activeFolderId = 'all';
let activeStatusFilter = 'all';
let activeTypeFilter = 'all';
let activeComposerFilter = null;
let expandedFolderIds = new Set();
let folderPickerCallback = null;
let folderPickerSelectedIds = new Set();
let folderPickerExpandedIds = new Set();
let folderPickerMultiple = true;
let folderPickerSelectableParents = false;
let folderPickerAllowEmptySelection = false;
let isRenderingList = false;

const toolMap = {
  redPen: { mode: 'draw', color: '#d32f2f', width: 2.4, alpha: 1 },
  marker: { mode: 'draw', color: '#f4d400', width: 12, alpha: 0.32 },
  eraser: { mode: 'erase', color: '#000000', width: 28, alpha: 1 },
  finger: { mode: 'stamp', type: 'number', color: '#111111', size: 0.0168 },
  accidental: { mode: 'stamp', type: 'accidental', color: '#111111', size: 0.0286 },
  bowing: { mode: 'stamp', type: 'bowing', color: '#111111', size: 0.0286 },
  textStamp: { mode: 'stamp', type: 'freeText', color: '#111111', size: 0.0215 },
  redCircle: { mode: 'stamp', type: 'circle', color: '#d32f2f' },
};

const stampImageSources = {
  sharp: '',
  flat: '',
  natural: '',
  upBow: '',
  downBow: '',
  redCircle: '',
};
const stampImageCache = new Map();
const symbolImageCache = new Map();
const processedPngCache = new Map();

const zoomConfig = {
  min: 0.3,
  max: 2.0,
};

function getZoomStepForZoom(currentZoom) {
  return currentZoom <= 1 ? 0.05 : 0.1;
}

function getZoomOutStep(currentZoom) {
  return getZoomStepForZoom(currentZoom);
}

function getZoomInStep(currentZoom) {
  if (Math.abs(currentZoom - 1) < 0.001) {
    return 0.1;
  }
  return getZoomStepForZoom(currentZoom);
}

function snapZoomUp(zoom) {
  const snapped = Math.ceil((zoom + 0.001) / 0.05) * 0.05;
  return Math.round(snapped * 1000) / 1000;
}

function snapZoomDown(zoom) {
  const snapped = Math.floor((zoom - 0.001) / 0.05) * 0.05;
  return Math.round(snapped * 1000) / 1000;
}

const violinTuningFrequencies = {
  G: 196.0,
  D: 293.66,
  A: 440.0,
  E: 659.25,
};

const chromaticNoteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const tunerNoteButtons = {
  G: tunerGButton,
  D: tunerDButton,
  A: tunerAButton,
  E: tunerEButton,
};

const rhythmProfiles = {
  '1x': { subdivisions: 1, pattern: [1.0], swing: false },
  '2x': { subdivisions: 2, pattern: [1.0, 0.55], swing: false },
  '3x': { subdivisions: 3, pattern: [1.0, 0.7, 0.55], swing: false },
  '4x': { subdivisions: 4, pattern: [1.0, 0.6, 0.45, 0.6], swing: false },
};

const previewState = {
  page: 1,
  pageCount: 1,
};

const previewScale = 0.8;

const tunerThresholdBase = {
  rms: 0.007,
  correlation: 0.8,
  level: 0.002,
};

const readerState = {
  page: 1,
  pageCount: 1,
  viewGroups: [],
};

function baseTitle(fileName) {
  return fileName.replace(/\.[^.]+$/, '');
}

function isSameLibraryFile(item, file) {
  return (
    item.file &&
    item.file.name === file.name &&
    item.file.size === file.size &&
    item.file.type === file.type &&
    item.file.lastModified === file.lastModified
  );
}

function createUniqueLibraryTitle(baseName) {
  const usedTitles = new Set(library.map((item) => item.title));
  if (!usedTitles.has(baseName)) {
    return baseName;
  }

  let suffix = 2;
  while (usedTitles.has(`${baseName} (${suffix})`)) {
    suffix += 1;
  }

  return `${baseName} (${suffix})`;
}

function createLocalId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `local-${timePart}-${randomPart}`;
}

function updateListVisibility(visibleItems = null) {
  let hasItems = false;
  try {
    hasItems = Array.isArray(visibleItems) ? visibleItems.length > 0 : getVisibleLibraryItems().length > 0;
  } catch (error) {
    throw new Error(`updateListVisibility:getVisibleLibraryItems: ${error && error.message ? error.message : error}`);
  }

  try {
    setEmptyStateMessage();
  } catch (error) {
    throw new Error(`updateListVisibility:setEmptyStateMessage: ${error && error.message ? error.message : error}`);
  }

  emptyState.hidden = hasItems;
  scoreList.hidden = !hasItems;
}

function closeLibraryMenu() {
  openLibraryMenuId = null;
  renderList();
}

function isSheetOpen(sheet) {
  return !!sheet && sheet.style.display !== 'none' && sheet.getAttribute('aria-hidden') !== 'true';
}

function syncBackdropVisibility() {
  const shouldShow = isSheetOpen(previewSheet) || isSheetOpen(editSheet) || isSheetOpen(moveFolderSheet);
  backdrop.style.display = shouldShow ? 'block' : 'none';
  backdrop.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
}

function renderSidebar() {
  if (!folderTabs) return;
  folderTabs.innerHTML = '';
  const navItems = [
    { id: 'all', label: 'すべて' },
    { id: 'favorites', label: 'お気に入り' },
    { id: 'orchestra', label: 'オーケストラ' },
    { id: 'chamber', label: '室内楽' },
    { id: 'solo', label: 'ソロ曲' },
    { separator: true },
    { id: 'composer', label: '作曲家' },
  ];
  navItems.forEach((navItem) => {
    if (navItem.separator) {
      const sep = document.createElement('div');
      sep.className = 'filter-separator';
      folderTabs.appendChild(sep);
      return;
    }
    const { id, label } = navItem;
    const btn = document.createElement('button');
    btn.className = 'folder-tab';
    btn.classList.toggle('active', activeFolderId === id);
    btn.type = 'button';
    btn.textContent = label;
    btn.addEventListener('click', () => setActiveFolder(id));
    folderTabs.appendChild(btn);
  });

  // 作曲家タブは閲覧専用 — 追加ボタンを隠す
  if (headerAddButton) headerAddButton.hidden = activeFolderId === 'composer';
}

function renderSubFilter() {
  if (!folderTabs) return;
  const showSub = activeFolderId !== 'all' && activeFolderId !== 'favorites';
  if (!showSub) return;

  if (activeFolderId === 'composer') {
    // Navigation handled by left-side index; no chip filter needed here
    return;
  }

  const sep = document.createElement('div');
  sep.className = 'filter-separator';
  folderTabs.appendChild(sep);

  const statusGroup = document.createElement('div');
  statusGroup.className = 'sub-filter-group';
  [
    { id: 'all', label: 'すべて' },
    { id: 'practice', label: '練習中' },
    { id: 'past', label: '過去の曲' },
  ].forEach(({ id, label }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sub-filter-btn';
    btn.classList.toggle('active', activeStatusFilter === id);
    btn.textContent = label;
    btn.addEventListener('click', () => {
      activeStatusFilter = id;
      if (id === 'all') activeTypeFilter = 'all';
      renderSidebar();
      renderSubFilter();
      renderList();
    });
    statusGroup.appendChild(btn);
  });
  folderTabs.appendChild(statusGroup);

  const hasTypeFilter = activeFolderId === 'orchestra';
  if (hasTypeFilter) {
    const typeGroup = document.createElement('div');
    typeGroup.className = 'sub-filter-group';
    [
      { id: 'part', label: 'パート譜' },
      { id: 'score', label: 'スコア' },
    ].forEach(({ id, label }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sub-filter-btn';
      btn.classList.toggle('active', activeTypeFilter === id);
      btn.textContent = label;
      btn.addEventListener('click', () => {
        // 同じボタンを再クリックで解除（すべて表示に戻る）
        activeTypeFilter = activeTypeFilter === id ? 'all' : id;
        renderSidebar();
        renderSubFilter();
        renderList();
      });
      typeGroup.appendChild(btn);
    });
    folderTabs.appendChild(typeGroup);
  } else {
    if (activeFolderId !== 'orchestra') activeTypeFilter = 'all';
  }
}

function getEffectiveFolderId() {
  if (activeFolderId === 'all' || activeFolderId === 'favorites') return activeFolderId;
  if (activeStatusFilter === 'all') return activeFolderId;
  const statusId = `${activeFolderId}-${activeStatusFilter}`;
  if (!getFolderById(statusId)) return activeFolderId;
  if (activeTypeFilter !== 'all') {
    const typeId = `${statusId}-${activeTypeFilter}`;
    if (getFolderById(typeId)) return typeId;
  }
  return statusId;
}

function moveItemToStatus(item, targetStatus) {
  const fromStatus = targetStatus === 'past' ? 'practice' : 'past';
  const folderIds = Array.isArray(item.folderIds) ? [...item.folderIds] : [item.folderId || 'inbox'];
  const newIds = folderIds.map((id) =>
    id.includes(`-${fromStatus}`) ? id.replace(`-${fromStatus}`, `-${targetStatus}`) : id
  );
  setItemFolderIds(item, newIds);
  openLibraryMenuId = null;
  renderSidebar();
  renderList();
  saveLibraryMetadata().catch((err) => console.error('Drive metadata save failed:', err));
}

function openEditSheet(item) {
  if (!item) {
    return;
  }

  editingLibraryItemId = item.id;
  editTitleInput.value = item.title || '';
  editComposerInput.value = item.composer || '';
  composerSuggestions.hidden = true;
  composerSuggestions.innerHTML = '';

  backdrop.style.display = 'block';
  editSheet.style.display = 'block';
  editSheet.setAttribute('aria-hidden', 'false');
  syncBackdropVisibility();

  requestAnimationFrame(() => {
    editSheet.classList.add('open');
    editTitleInput.focus();
    editTitleInput.select();
  });
}

function closeEditSheet() {
  editingLibraryItemId = null;
  composerSuggestions.hidden = true;
  composerSuggestions.innerHTML = '';
  editSheet.classList.remove('open');
  editSheet.setAttribute('aria-hidden', 'true');

  setTimeout(() => {
    editSheet.style.display = 'none';
    syncBackdropVisibility();
  }, 220);
}

function applyLibraryItemMetadata(item, nextTitle, nextComposer) {
  if (!item) {
    return;
  }

  const trimmedTitle = (nextTitle || '').trim();
  const trimmedComposer = (nextComposer || '').trim();

  if (trimmedTitle) {
    item.title = trimmedTitle;
  }
  item.composer = trimmedComposer;

  if (activeItem && activeItem.id === item.id) {
    activeItem.title = item.title;
    activeItem.composer = item.composer;
  }

  if (previewSheet.style.display !== 'none' && previewSheet.getAttribute('aria-hidden') !== 'true' && activeItem && activeItem.id === item.id) {
    previewTitle.textContent = `プレビュー: ${item.title}`;
  }

  if (isReaderOpen() && activeItem && activeItem.id === item.id) {
    readerTitle.textContent = `楽譜リーダー: ${item.title}`;
  }

  saveItemMetaToDb(item);
  renderReaderTabs();
  renderList();
}

function saveEditSheet() {
  const item = getLibraryItemById(editingLibraryItemId);
  if (!item) {
    closeEditSheet();
    return;
  }

  applyLibraryItemMetadata(item, editTitleInput.value, editComposerInput.value);
  closeEditSheet();
}

function cleanupLibraryItem(item) {
  if (!item) {
    return;
  }

  if (item.url) {
    URL.revokeObjectURL(item.url);
  }
  pdfCache.delete(item.id);

  Array.from(annotationStrokes.keys()).forEach((key) => {
    if (key.startsWith(`${item.id}:`)) {
      annotationStrokes.delete(key);
    }
  });
  deleteAnnotationsForItemFromDb(item.id);
  scheduleDriveAnnotationSync();

  Array.from(persistentAnnotationCanvases.keys()).forEach((key) => {
    if (key.startsWith(`${item.id}:`)) {
      persistentAnnotationCanvases.delete(key);
    }
  });

  if (item.driveFileId && isSignedIn()) {
    driveApiFetch('DELETE', `/drive/v3/files/${item.driveFileId}`)
      .catch((err) => console.error('Drive file delete failed:', err));
  }
}

function getLibraryItemById(itemId) {
  return library.find((entry) => entry.id === itemId) || null;
}

function getItemComposerLabel(item) {
  if (!item || !item.composer) {
    return '作曲者不明';
  }
  return item.composer;
}

function getFolderById(folderId) {
  return folders.find((folder) => folder.id === folderId) || null;
}

function getFolderName(folderId) {
  if (folderId === 'all') {
    return 'すべて';
  }
  if (folderId === 'favorites') {
    return 'お気に入り';
  }
  return getFolderById(folderId)?.name || '未分類';
}

function getFolderPath(folderId) {
  const node = getFolderById(folderId);
  if (!node) {
    return getFolderName(folderId);
  }

  const parts = [node.name];
  let currentParent = node.parentId;
  const visited = new Set([node.id]);
  while (currentParent) {
    if (visited.has(currentParent)) {
      parts.unshift('…');
      break;
    }
    const parent = getFolderById(currentParent);
    if (!parent) {
      break;
    }
    parts.unshift(parent.name);
    visited.add(parent.id);
    currentParent = parent.parentId;
  }

  return parts.join(' / ');
}

function getFolderDepth(folderId) {
  if (folderId === 'all' || folderId === 'favorites') {
    return 0;
  }

  let depth = 0;
  let current = getFolderById(folderId);
  const visited = new Set();
  while (current) {
    if (visited.has(current.id)) {
      break;
    }
    visited.add(current.id);
    depth += 1;
    if (!current.parentId) {
      break;
    }
    current = getFolderById(current.parentId);
  }
  return depth;
}

function getFolderChildren(parentId) {
  return folders.filter((folder) => folder.parentId === parentId);
}

function getItemFolderIds(item) {
  if (!item) {
    return ['inbox'];
  }

  const ids = Array.isArray(item.folderIds) && item.folderIds.length > 0
    ? item.folderIds
    : [item.folderId || 'inbox'];

  const uniqueIds = [];
  ids.forEach((id) => {
    if (!id || uniqueIds.includes(id)) {
      return;
    }
    if (id === 'favorites' || id === 'all' || getFolderById(id) || id === 'inbox') {
      uniqueIds.push(id === 'all' ? 'inbox' : id);
    }
  });

  return uniqueIds.length > 0 ? uniqueIds : ['inbox'];
}

function setItemFolderIds(item, folderIds) {
  if (!item) {
    return;
  }

  let normalized = Array.isArray(folderIds)
    ? folderIds.filter((id) => id && id !== 'favorites' && (id === 'inbox' || getFolderById(id))).filter((id, index, self) => self.indexOf(id) === index)
    : [];

  // Single-folder mode: if any non-inbox folder is assigned, drop inbox
  const nonInbox = normalized.filter((id) => id !== 'inbox');
  if (nonInbox.length > 0) normalized = nonInbox;
  // Keep only the first (most recently chosen) folder
  if (normalized.length > 1) normalized = [normalized[0]];

  const nextIds = normalized.length > 0 ? normalized : ['inbox'];
  item.folderIds = nextIds;
  item.folderId = nextIds[0];
  saveItemMetaToDb(item);
}

function itemMatchesFolderTree(item, folderId) {
  if (!item) {
    return false;
  }

  const descendantIds = new Set([folderId, ...getDescendantFolderIds(folderId)]);
  return getItemFolderIds(item).some((itemFolderId) => descendantIds.has(itemFolderId));
}

function getItemFolderDisplayLabel(item) {
  const ids = getItemFolderIds(item);
  const paths = ids.map((id) => getFolderPath(id));
  if (paths.length === 0) {
    return '未分類';
  }

  if (paths.length === 1) {
    return paths[0];
  }

  return `${paths[0]} 他${paths.length - 1}`;
}

function addScoreToFolder(folderId, scoreObject) {
  if (!scoreObject) {
    return null;
  }

  const targetFolderId = folderId === 'all' || folderId === 'favorites' || !getFolderById(folderId)
    ? 'inbox'
    : folderId;

  const existingItem = scoreObject.id ? getLibraryItemById(scoreObject.id) : null;
  const item = existingItem || scoreObject;
  setItemFolderIds(item, [targetFolderId]);

  if (!existingItem) {
    if (!item.id) {
      item.id = createLocalId();
    }
    if (!item.title) {
      item.title = item.name || '無題';
    }
    if (!item.type) {
      item.type = 'pdf';
    }
    library.unshift(item);
  }

  renderSidebar();
  renderList();
  return item;
}

function getScoresInFolder(folderId) {
  if (folderId === 'all') {
    return [...library];
  }

  if (folderId === 'favorites') {
    return library.filter((item) => favoriteItemIds.includes(item.id));
  }

  return library.filter((item) => itemMatchesFolderTree(item, folderId));
}

function expandFolderPath(folderId) {
  let current = getFolderById(folderId);
  const visited = new Set();
  while (current) {
    if (visited.has(current.id)) {
      break;
    }
    visited.add(current.id);
    expandedFolderIds.add(current.id);
    if (!current.parentId) {
      break;
    }
    current = getFolderById(current.parentId);
  }
}

function getDescendantFolderIds(folderId) {
  const result = [];
  const queue = [folderId];
  const visited = new Set([folderId]);

  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = getFolderChildren(currentId);
    children.forEach((child) => {
      if (visited.has(child.id)) {
        return;
      }
      visited.add(child.id);
      result.push(child.id);
      queue.push(child.id);
    });
  }

  return result;
}

function isLeafFolder(folderId) {
  if (folderId === 'inbox') {
    return true;
  }
  const node = getFolderById(folderId);
  if (!node) {
    return false;
  }
  return getFolderChildren(folderId).length === 0;
}

function canAddChildFolder(folderId) {
  const depth = getFolderDepth(folderId);
  const node = getFolderById(folderId);
  return folderId !== 'favorites' && folderId !== 'all' && depth > 0 && depth < 3 && node?.kind !== 'leaf';
}

function isSystemFolder(folderId) {
  return !!getFolderById(folderId)?.system;
}

function getVisibleLibraryItems() {
  const effectiveId = getEffectiveFolderId();
  if (effectiveId === 'all') {
    return library;
  }

  if (effectiveId === 'favorites') {
    return library.filter((item) => favoriteItemIds.includes(item.id));
  }

  if (activeFolderId === 'composer') {
    return library.filter((item) => item.composer && item.composer.trim() !== '');
  }

  // orchestra + 全て + パート譜/スコアフィルタ
  if (activeFolderId === 'orchestra' && activeStatusFilter === 'all' && activeTypeFilter !== 'all') {
    return library.filter(
      (item) =>
        itemMatchesFolderTree(item, 'orchestra') &&
        getItemFolderIds(item).some((id) => id.endsWith(`-${activeTypeFilter}`)),
    );
  }

  return library.filter((item) => itemMatchesFolderTree(item, effectiveId));
}

function getFolderItemCount(folderId) {
  if (folderId === 'all') {
    return library.length;
  }

  if (folderId === 'favorites') {
    return favoriteItemIds.length;
  }

  return library.filter((item) => itemMatchesFolderTree(item, folderId)).length;
}

function setEmptyStateMessage() {
  const message = activeFolderId === 'all'
    ? 'まだ楽譜がありません。最初の1冊を追加しましょう。'
    : activeFolderId === 'favorites'
      ? 'お気に入りはまだありません。'
      : `${getFolderName(activeFolderId)} に楽譜がありません。`;
  const paragraph = emptyState.querySelector('p');
  if (paragraph) {
    paragraph.textContent = message;
  }
}

function setActiveFolder(folderId) {
  if (folderId !== 'all' && folderId !== 'favorites' && !getFolderById(folderId)) {
    return;
  }

  if (folderId !== 'all' && folderId !== 'favorites') {
    expandFolderPath(folderId);
  }
  if (folderId !== activeFolderId) {
    activeStatusFilter = 'all';
    activeTypeFilter = folderId === 'orchestra' ? 'part' : 'all';
    activeComposerFilter = null;
  }
  activeFolderId = folderId;
  renderList();
}

function closeFolderMenu() {
  openFolderMenuId = null;
  renderSidebar();
}

function toggleFolderExpanded(folderId) {
  if (expandedFolderIds.has(folderId)) {
    expandedFolderIds.delete(folderId);
  } else {
    expandedFolderIds.add(folderId);
  }
  renderSidebar();
}

function toggleFavoriteItem(itemId, forceState = null) {
  const index = favoriteItemIds.indexOf(itemId);
  const shouldFavorite = forceState === null ? index < 0 : forceState;

  if (shouldFavorite && index < 0) {
    favoriteItemIds.push(itemId);
  } else if (!shouldFavorite && index >= 0) {
    favoriteItemIds.splice(index, 1);
  }

  saveFavoritesToStorage();
  renderSidebar();
  renderList();
}

function saveFavoritesToStorage() {
  try { localStorage.setItem('gakufu-favorites', JSON.stringify(favoriteItemIds)); } catch {}
  saveLibraryMetadata().catch((err) => console.error('Drive favorites save failed:', err));
}

function loadFavoritesFromStorage() {
  try {
    const raw = localStorage.getItem('gakufu-favorites');
    if (raw) {
      const ids = JSON.parse(raw);
      if (Array.isArray(ids)) {
        favoriteItemIds.length = 0;
        ids.forEach((id) => favoriteItemIds.push(id));
      }
    }
  } catch {}
}

function renameFolderNode(folderId, nextName) {
  const node = getFolderById(folderId);
  if (!node || node.system) {
    return;
  }

  const trimmed = (nextName || '').trim();
  if (!trimmed) {
    return;
  }

  node.name = trimmed.replace(/\s+/g, ' ');
  closeFolderMenu();
  renderSidebar();
  renderList();
}

function deleteFolderNode(folderId) {
  const node = getFolderById(folderId);
  if (!node || node.system) {
    return;
  }

  const descendantIds = [folderId, ...getDescendantFolderIds(folderId)];
  const descendantSet = new Set(descendantIds);

  library.forEach((item) => {
    const nextFolderIds = getItemFolderIds(item).filter((id) => !descendantSet.has(id));
    setItemFolderIds(item, nextFolderIds);
    if (nextFolderIds.length === 0) {
      setItemFolderIds(item, ['inbox']);
    }
  });

  descendantIds.forEach((id) => {
    const index = folders.findIndex((folder) => folder.id === id);
    if (index >= 0) {
      folders.splice(index, 1);
    }
  });

  if (activeFolderId === folderId || descendantSet.has(activeFolderId)) {
    activeFolderId = 'all';
  }

  if (openFolderMenuId && descendantSet.has(openFolderMenuId)) {
    openFolderMenuId = null;
  }

  renderSidebar();
  renderList();
}


function getDefaultTargetFolderId() {
  if (activeFolderId === 'all' || activeFolderId === 'favorites') {
    return 'inbox';
  }

  const node = getFolderById(activeFolderId);
  if (!node) {
    return 'inbox';
  }

  return activeFolderId;
}

function updateFolderPickerFooter() {
  if (folderPickerSummary) {
    const selectedIds = Array.from(folderPickerSelectedIds);
    const selectedPaths = selectedIds.map((id) => getFolderPath(id));
    folderPickerSummary.textContent = selectedPaths.length > 0
      ? `選択中: ${selectedPaths.join('、')}`
      : folderPickerAllowEmptySelection
        ? '選択中: ルート'
        : '未選択';
  }

  if (moveFolderConfirmButton) {
    moveFolderConfirmButton.disabled = folderPickerSelectedIds.size === 0 && !folderPickerAllowEmptySelection;
  }
}

function renderFolderPickerTree() {
  if (!moveFolderList) {
    return;
  }

  moveFolderList.innerHTML = '';

  const rootNodes = folders.filter((folder) => folder.parentId === null && folder.id !== 'favorites');

  const renderNode = (node, depth) => {
    const children = getFolderChildren(node.id);
    const hasChildren = children.length > 0;
    const isLeaf = !hasChildren;
    const row = document.createElement('div');
    row.className = 'folder-picker-row';
    row.style.paddingLeft = `${depth * 14}px`;
    row.classList.toggle('expanded', folderPickerExpandedIds.has(node.id));
    row.classList.toggle('selected', folderPickerSelectedIds.has(node.id));
    row.setAttribute('aria-expanded', hasChildren ? (folderPickerExpandedIds.has(node.id) ? 'true' : 'false') : 'false');

    const chevron = document.createElement('button');
    chevron.type = 'button';
    chevron.className = 'folder-picker-chevron';
    chevron.textContent = hasChildren ? '›' : ' ';
    chevron.disabled = !hasChildren;
    chevron.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!hasChildren) {
        return;
      }
      if (folderPickerExpandedIds.has(node.id)) {
        folderPickerExpandedIds.delete(node.id);
      } else {
        folderPickerExpandedIds.add(node.id);
      }
      renderFolderPickerTree();
    });

    const icon = document.createElement('span');
    icon.className = 'folder-picker-icon';
    icon.textContent = hasChildren ? '◉' : '▤';

    const label = document.createElement('span');
    label.className = 'folder-picker-label';
    label.textContent = node.name;

    const check = document.createElement('span');
    check.className = 'folder-picker-check';
    check.textContent = folderPickerSelectedIds.has(node.id) ? '✓' : '';

    row.append(chevron, icon, label, check);

    row.addEventListener('click', () => {
      if (hasChildren && !folderPickerSelectableParents) {
        if (folderPickerExpandedIds.has(node.id)) {
          folderPickerExpandedIds.delete(node.id);
        } else {
          folderPickerExpandedIds.add(node.id);
        }
        renderFolderPickerTree();
        return;
      }

      if (folderPickerMultiple) {
        if (folderPickerSelectedIds.has(node.id)) {
          folderPickerSelectedIds.delete(node.id);
        } else {
          folderPickerSelectedIds.add(node.id);
          expandFolderPath(node.id);
        }
      } else {
        folderPickerSelectedIds = new Set([node.id]);
        expandFolderPath(node.id);
      }
      renderFolderPickerTree();
    });

    moveFolderList.appendChild(row);

    if (hasChildren && folderPickerExpandedIds.has(node.id)) {
      children.forEach((child) => renderNode(child, depth + 1));
    }
  };

  if (rootNodes.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'folder-empty';
    empty.textContent = 'フォルダがありません。';
    moveFolderList.appendChild(empty);
  } else {
    rootNodes.forEach((node) => renderNode(node, 0));
  }

  updateFolderPickerFooter();
}

function openFolderPickerInternal(callback, options = {}) {
  closeFolderMenu();
  folderPickerCallback = typeof callback === 'function' ? callback : null;
  folderPickerMultiple = options.multiple !== false;
  folderPickerSelectableParents = options.selectableParents === true;
  folderPickerAllowEmptySelection = options.allowEmptySelection === true;
  folderPickerSelectedIds = new Set(
    (options.selectedIds || [])
      .map((id) => (id === 'all' ? 'inbox' : id))
      .filter((id) => id && id !== 'favorites' && (id === 'inbox' || getFolderById(id)))
  );
  if (!folderPickerMultiple && folderPickerSelectedIds.size > 1) {
    folderPickerSelectedIds = new Set([folderPickerSelectedIds.values().next().value]);
  }
  folderPickerExpandedIds = new Set(options.expandedIds || []);

  if (folderPickerExpandedIds.size === 0) {
    folders.forEach((folder) => {
      if (getFolderChildren(folder.id).length > 0 && folder.parentId === null && folder.id !== 'favorites') {
        folderPickerExpandedIds.add(folder.id);
      }
    });
  }

  folderPickerSelectedIds.forEach((folderId) => {
    let current = getFolderById(folderId);
    while (current) {
      folderPickerExpandedIds.add(current.id);
      if (!current.parentId) {
        break;
      }
      current = getFolderById(current.parentId);
    }
  });

  if (moveFolderSheetTitle) {
    moveFolderSheetTitle.textContent = options.title || 'フォルダを選択';
  }

  if (moveFolderConfirmButton) {
    moveFolderConfirmButton.textContent = options.confirmLabel || '決定';
  }

  renderFolderPickerTree();
  moveFolderSheet.style.display = 'block';
  moveFolderSheet.setAttribute('aria-hidden', 'false');
  moveFolderSheet.classList.add('open');
  moveFolderSheet.style.transform = 'translateY(0)';
  moveFolderSheet.style.zIndex = '120';
  syncBackdropVisibility();
}

function openMoveFolderSheet(item) {
  if (!item) {
    return;
  }

  openMoveFolderItemId = item.id;
  openFolderPickerInternal((selectedIds) => {
    setItemFolderIds(item, selectedIds);
    if (activeItem && activeItem.id === item.id) {
      setItemFolderIds(activeItem, selectedIds);
    }
    renderReaderTabs();
    renderSidebar();
    renderList();
    closeMoveFolderSheet();
    saveLibraryMetadata().catch((err) => console.error('Drive metadata save failed:', err));
  }, {
    title: 'フォルダを変更',
    selectedIds: getItemFolderIds(item),
    multiple: false,
    selectableParents: false,
  });
}

function openFolderParentSelectionSheet() {
  closeFolderMenu();
  openMoveFolderItemId = null;
  openFolderPickerInternal((selectedIds) => {
    const parentId = selectedIds[0] || null;
    const folderName = window.prompt('フォルダ名を入力してください');
    if (!folderName) {
      return;
    }
    const folder = addFolder(folderName, parentId);
    if (folder) {
      setActiveFolder(folder.id);
    }
  }, {
    title: 'フォルダの追加先を選択',
    selectedIds: [],
    multiple: false,
    selectableParents: true,
    allowEmptySelection: true,
  });
}

function closeMoveFolderSheet() {
  openMoveFolderItemId = null;
  folderPickerCallback = null;
  folderPickerSelectedIds = new Set();
  folderPickerExpandedIds = new Set();
  folderPickerMultiple = true;
  folderPickerSelectableParents = false;
  folderPickerAllowEmptySelection = false;
  moveFolderSheet.classList.remove('open');
  moveFolderSheet.setAttribute('aria-hidden', 'true');
  moveFolderSheet.style.transform = '';
  moveFolderSheet.style.zIndex = '';

  moveFolderSheet.style.display = 'none';
  syncBackdropVisibility();
}

function confirmFolderPickerSelection() {
  if (folderPickerSelectedIds.size === 0 && !folderPickerAllowEmptySelection) {
    return;
  }

  const callback = folderPickerCallback;
  const selectedIds = Array.from(folderPickerSelectedIds);
  closeMoveFolderSheet();

  if (typeof callback === 'function') {
    callback(selectedIds);
  }
}

function addFolder(name, parentId = activeFolderId) {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replace(/\s+/g, ' ');
  const parentNode = parentId && parentId !== 'all' && parentId !== 'favorites'
    ? getFolderById(parentId)
    : null;
  const targetParentId = parentNode ? parentNode.id : null;
  const targetDepth = targetParentId ? getFolderDepth(targetParentId) + 1 : 1;
  if (targetDepth > 3) {
    alert('フォルダは3階層までです。');
    return null;
  }

  const siblingNames = folders
    .filter((folder) => folder.parentId === targetParentId)
    .map((folder) => folder.name);
  if (siblingNames.includes(normalized)) {
    alert('同じ名前のフォルダがすでにあります。');
    return null;
  }

  const folder = {
    id: createLocalId(),
    name: normalized,
    kind: targetDepth === 1 ? 'section' : targetDepth === 2 ? 'group' : 'song',
    parentId: targetParentId,
    system: false,
  };
  folders.push(folder);
  if (folder.parentId) {
    expandFolderPath(folder.parentId);
  }
  renderSidebar();
  return folder;
}

function isReaderOpen() {
  return reader.style.display !== 'none' && reader.getAttribute('aria-hidden') !== 'true';
}

function setReaderPageLock(isLocked) {
  document.body.classList.toggle('reader-open', isLocked);
}

async function closeReaderTab(itemId) {
  const currentIndex = openReaderTabIds.indexOf(itemId);
  if (currentIndex < 0) {
    return;
  }

  Array.from(persistentAnnotationCanvases.keys()).forEach((key) => {
    if (key.startsWith(`${itemId}:`)) persistentAnnotationCanvases.delete(key);
  });

  const wasActive = activeItem && activeItem.id === itemId;
  openReaderTabIds = openReaderTabIds.filter((id) => id !== itemId);

  if (!wasActive) {
    renderReaderTabs();
    return;
  }

  const nextItemId = openReaderTabIds[currentIndex] || openReaderTabIds[currentIndex - 1] || null;
  if (!nextItemId) {
    activeItem = null;
    closeReader();
    renderReaderTabs();
    return;
  }

  const nextItem = getLibraryItemById(nextItemId);
  if (!nextItem) {
    activeItem = null;
    closeReader();
    renderReaderTabs();
    return;
  }

  await openReaderItem(nextItem, {
    anchorPage: nextItem.lastPage || 1,
    resetZoom: false,
  });
}

function renderReaderTabs() {
  if (!readerTabsList) {
    return;
  }

  readerTabsList.innerHTML = '';

  openReaderTabIds
    .map((itemId) => getLibraryItemById(itemId))
    .filter(Boolean)
    .forEach((item) => {
      const button = document.createElement('button');
      button.className = 'reader-tab';
      if (isReaderOpen() && activeItem && activeItem.id === item.id) {
        button.classList.add('active');
      }
      button.type = 'button';
      button.title = item.title;
      button.addEventListener('click', async () => {
        if (isReaderOpen() && activeItem && activeItem.id === item.id) {
          return;
        }

        await openReaderItem(item, {
          anchorPage: item.lastPage || 1,
          resetZoom: false,
        });
      });

      const label = document.createElement('span');
      label.className = 'reader-tab-label';
      label.textContent = item.title;

      const closeButton = document.createElement('button');
      closeButton.className = 'reader-tab-close';
      closeButton.type = 'button';
      closeButton.textContent = '×';
      closeButton.setAttribute('aria-label', `${item.title} タブを閉じる`);
      closeButton.addEventListener('click', async (event) => {
        event.stopPropagation();
        await closeReaderTab(item.id);
      });

      button.append(label, closeButton);
      readerTabsList.appendChild(button);
    });
}

function ensureReaderTab(item) {
  if (!item) {
    return;
  }

  if (!openReaderTabIds.includes(item.id)) {
    openReaderTabIds.push(item.id);
  }
}

function openLibraryHomeFromTabs() {
  closeReader();
}

async function openReaderItem(item, options = {}) {
  if (!item) {
    return;
  }

  const { anchorPage = item.lastPage || 1, resetZoom = false } = options;

  persistCurrentAnnotation();
  activeItem = item;
  ensureReaderTab(item);
  readerTitle.textContent = `楽譜リーダー: ${activeItem.title}`;
  if (resetZoom) {
    readerZoom = 0.7;
  }
  readerState.page = 1;
  readerState.pageCount = 1;
  readerPendingAnchorPage = anchorPage;

  if (activeItem.type === 'pdf' && !pdfjsLib) {
    try {
      await ensurePdfJs();
    } catch (error) {
      alert('PDF.js の読み込みに失敗したため、PDFを開けません。');
      return;
    }
  }

  reader.style.display = 'flex';
  reader.setAttribute('aria-hidden', 'false');
  setReaderPageLock(true);
  applyActiveToolButtonState();
  applyLayoutButtonState();
  updateZoomLabel();
  renderReaderTabs();
  await renderReaderPage();
}

function deleteLibraryItem(itemId) {
  const index = library.findIndex((entry) => entry.id === itemId);
  if (index < 0) {
    return;
  }

  const [removedItem] = library.splice(index, 1);
  openReaderTabIds = openReaderTabIds.filter((id) => id !== itemId);
  const favoriteIndex = favoriteItemIds.indexOf(itemId);
  if (favoriteIndex >= 0) {
    favoriteItemIds.splice(favoriteIndex, 1);
  }

  if (activeItem && activeItem.id === itemId) {
    closePreviewSheet();
    closeReader();
    activeItem = null;
  }

  deleteItemFromDb(removedItem.id);
  cleanupLibraryItem(removedItem);
  openLibraryMenuId = null;
  renderReaderTabs();
  renderList();
  saveLibraryMetadata().catch((err) => console.error('Drive metadata save failed:', err));
}

function updatePagerButtons(state, prevButton, nextButton, label) {
  label.textContent = `${state.page} / ${state.pageCount}`;
  prevButton.disabled = state.page <= 1;
  nextButton.disabled = state.page >= state.pageCount;
}

async function getPdfDocument(item) {
  const lib = await ensurePdfJs();

  if (pdfCache.has(item.id)) {
    return pdfCache.get(item.id);
  }

  const buffer = await item.file.arrayBuffer();
  const pdf = await lib.getDocument({ data: buffer }).promise;
  pdfCache.set(item.id, pdf);
  return pdf;
}

async function renderPdfPageToCanvas(pdf, pageNumber, container, scale = 1.5) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  container.innerHTML = '';
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  container.appendChild(canvas);

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  return canvas;
}

function renderImageToContainer(item, container) {
  container.innerHTML = '';
  const image = document.createElement('img');
  image.src = item.url;
  image.alt = item.title;
  image.style.width = `${Math.round(previewScale * 100)}%`;
  image.style.height = 'auto';
  image.style.display = 'block';
  image.style.margin = '0 auto';
  container.appendChild(image);
}

function setPageLabel(state, label) {
  label.textContent = `${state.page} / ${state.pageCount}`;
}

function getAnnotationKey(pageNumber = null) {
  if (!activeItem) {
    return null;
  }

  const page = pageNumber || activeAnnotationPage || 1;
  return `${activeItem.id}:${page}`;
}

function persistCurrentAnnotation() {
  const key = getAnnotationKey();
  if (!key) return;
  const data = annotationStrokes.get(key);
  if (data) {
    saveAnnotationOpsToDb(key, data);
    scheduleDriveAnnotationSync();
  }
}

function getCanvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  const safeWidth = rect.width || 1;
  const safeHeight = rect.height || 1;
  const scaleX = canvas.width / safeWidth;
  const scaleY = canvas.height / safeHeight;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function hexToRgba(hex, alpha) {
  const value = hex.replace('#', '');
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getActiveToolConfig() {
  return toolMap[activeTool] || toolMap.redPen;
}

function isStampTool(toolName = activeTool) {
  const tool = toolMap[toolName];
  return tool && tool.mode === 'stamp';
}

function applyActiveToolButtonState() {
  toolRedPenButton.classList.toggle('active', activeTool === 'redPen');
  toolMarkerButton.classList.toggle('active', activeTool === 'marker');
  toolEraserButton.classList.toggle('active', activeTool === 'eraser');
  toolFingerButton.classList.toggle('active', activeTool === 'finger');
  toolAccidentalButton.classList.toggle('active', activeTool === 'accidental');
  toolBowingButton.classList.toggle('active', activeTool === 'bowing');
  toolTextButton.classList.toggle('active', activeTool === 'textStamp');
  toolRedCircleButton.classList.toggle('active', activeTool === 'redCircle');
  if (abPenBtn) abPenBtn.classList.toggle('active', activeTool === 'redPen');
  if (abMarkerBtn) abMarkerBtn.classList.toggle('active', activeTool === 'marker');
  if (abEraserBtn) abEraserBtn.classList.toggle('active', activeTool === 'eraser');
  if (abTextBtn) abTextBtn.classList.toggle('active', activeTool === 'textStamp');
}

function setActiveTool(toolName) {
  if (!toolMap[toolName]) {
    return;
  }

  activeTool = toolName;
  applyActiveToolButtonState();
}

function setActiveAnnotationCanvas(canvas, pageNumber) {
  annotationCanvas = canvas;
  annotationContext = canvas.getContext('2d');
  activeAnnotationPage = pageNumber;
}

function setLastAnnotationPoint(event, canvas) {
  lastAnnotationPoint = getCanvasPoint(event, canvas);
  return lastAnnotationPoint;
}

function getStampFontSize(canvas, multiplier = 1, ratio = 0.032) {
  const base = Math.min(canvas.width, canvas.height);
  return Math.max(6, Math.round(base * ratio * multiplier * stampSizeMultiplier));
}

function getStampImage(name) {
  const source = stampImageSources[name];
  if (!source) {
    return null;
  }

  if (stampImageCache.has(name)) {
    return stampImageCache.get(name);
  }

  const image = new Image();
  image.src = source;
  stampImageCache.set(name, image);
  return image;
}

function drawImageStamp(imageName, point, size, fallbackDraw) {
  const image = getStampImage(imageName);

  if (!image) {
    fallbackDraw();
    return;
  }

  const draw = () => {
    const ratio = image.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : 1;
    const width = size * ratio;
    const height = size;
    annotationContext.drawImage(image, point.x - width / 2, point.y - height / 2, width, height);
    persistCurrentAnnotation();
  };

  if (image.complete && image.naturalWidth) {
    draw();
    return;
  }

  image.addEventListener('load', draw, { once: true });
  fallbackDraw();
}

function drawOutlinedText(text, point, fontSize, color, weight = 700) {
  const fontFamily = '"Bravura", "Noto Music", "Apple Symbols", "Hiragino Sans", "Yu Gothic", sans-serif';
  annotationContext.font = `${weight} ${fontSize}px ${fontFamily}`;
  annotationContext.lineWidth = Math.max(2, fontSize * 0.1);
  annotationContext.strokeStyle = 'rgba(255, 255, 255, 0.88)';
  annotationContext.fillStyle = color;
  annotationContext.strokeText(text, point.x, point.y);
  annotationContext.fillText(text, point.x, point.y);
}

function drawMusicSymbolText(char, point, fontSize, color) {
  const fontFamily = '"Noto Music", "Bravura", "Apple Symbols", serif';
  annotationContext.font = `${fontSize}px ${fontFamily}`;
  annotationContext.lineWidth = Math.max(2, fontSize * 0.08);
  annotationContext.strokeStyle = 'rgba(255, 255, 255, 0.88)';
  annotationContext.fillStyle = color;
  annotationContext.strokeText(char, point.x, point.y);
  annotationContext.fillText(char, point.x, point.y);
}

function drawSharpSymbol(cx, cy, size, color) {
  const lw = Math.max(1.5, size * 0.10);
  const hw = size * 0.18;
  const hb = size * 0.34;
  const vs = size * 0.18;
  const sh = size * 0.45;
  const tilt = size * 0.04;

  const pass = (strokeColor, lineWidth) => {
    annotationContext.save();
    annotationContext.strokeStyle = strokeColor;
    annotationContext.lineWidth = lineWidth;
    annotationContext.lineCap = 'round';
    annotationContext.beginPath(); annotationContext.moveTo(cx - hw, cy - sh); annotationContext.lineTo(cx - hw, cy + sh); annotationContext.stroke();
    annotationContext.beginPath(); annotationContext.moveTo(cx + hw, cy - sh); annotationContext.lineTo(cx + hw, cy + sh); annotationContext.stroke();
    annotationContext.beginPath(); annotationContext.moveTo(cx - hb, cy - vs + tilt); annotationContext.lineTo(cx + hb, cy - vs - tilt); annotationContext.stroke();
    annotationContext.beginPath(); annotationContext.moveTo(cx - hb, cy + vs + tilt); annotationContext.lineTo(cx + hb, cy + vs - tilt); annotationContext.stroke();
    annotationContext.restore();
  };
  pass('rgba(255,255,255,0.85)', lw * 2.8);
  pass(color, lw);
}

function drawFlatSymbol(cx, cy, size, color) {
  const lw = Math.max(1.5, size * 0.10);
  const x0 = cx - size * 0.06;
  const stemTop = cy - size * 0.50;
  const blobTop = cy - size * 0.02;
  const blobBottom = cy + size * 0.38;
  const cpX = cx + size * 0.36;

  const passStroke = (strokeColor, lineWidth) => {
    annotationContext.save();
    annotationContext.strokeStyle = strokeColor;
    annotationContext.lineWidth = lineWidth;
    annotationContext.lineCap = 'round';
    annotationContext.beginPath(); annotationContext.moveTo(x0, stemTop); annotationContext.lineTo(x0, blobBottom); annotationContext.stroke();
    annotationContext.beginPath(); annotationContext.moveTo(x0, blobTop); annotationContext.bezierCurveTo(cpX, blobTop, cpX, blobBottom, x0, blobBottom); annotationContext.stroke();
    annotationContext.restore();
  };

  passStroke('rgba(255,255,255,0.85)', lw * 2.8);

  annotationContext.save();
  annotationContext.fillStyle = color;
  annotationContext.strokeStyle = color;
  annotationContext.lineWidth = lw;
  annotationContext.lineCap = 'round';
  annotationContext.beginPath(); annotationContext.moveTo(x0, stemTop); annotationContext.lineTo(x0, blobBottom); annotationContext.stroke();
  annotationContext.beginPath(); annotationContext.moveTo(x0, blobTop); annotationContext.bezierCurveTo(cpX, blobTop, cpX, blobBottom, x0, blobBottom); annotationContext.fill();
  annotationContext.restore();
}

function drawNaturalSymbol(cx, cy, size, color) {
  const lw = Math.max(1.5, size * 0.10);
  const hw = size * 0.15;
  const topBarY = cy - size * 0.20;
  const botBarY = cy + size * 0.20;

  const pass = (strokeColor, lineWidth) => {
    annotationContext.save();
    annotationContext.strokeStyle = strokeColor;
    annotationContext.lineWidth = lineWidth;
    annotationContext.lineCap = 'butt';
    annotationContext.beginPath(); annotationContext.moveTo(cx - hw, cy - size * 0.50); annotationContext.lineTo(cx - hw, botBarY); annotationContext.stroke();
    annotationContext.beginPath(); annotationContext.moveTo(cx + hw, topBarY); annotationContext.lineTo(cx + hw, cy + size * 0.50); annotationContext.stroke();
    annotationContext.beginPath(); annotationContext.moveTo(cx - hw, topBarY); annotationContext.lineTo(cx + hw, topBarY); annotationContext.stroke();
    annotationContext.beginPath(); annotationContext.moveTo(cx - hw, botBarY); annotationContext.lineTo(cx + hw, botBarY); annotationContext.stroke();
    annotationContext.restore();
  };
  pass('rgba(255,255,255,0.85)', lw * 2.8);
  pass(color, lw);
}

function drawUpBowSymbol(cx, cy, size, color) {
  const lw = Math.max(1.5, size * 0.11);
  const hw = size * 0.34;
  const topY = cy - size * 0.34;
  const botY = cy + size * 0.28;

  const pass = (strokeColor, lineWidth) => {
    annotationContext.save();
    annotationContext.strokeStyle = strokeColor;
    annotationContext.lineWidth = lineWidth;
    annotationContext.lineCap = 'round';
    annotationContext.lineJoin = 'round';
    annotationContext.beginPath();
    annotationContext.moveTo(cx - hw, topY);
    annotationContext.lineTo(cx, botY);
    annotationContext.lineTo(cx + hw, topY);
    annotationContext.stroke();
    annotationContext.restore();
  };
  pass('rgba(255,255,255,0.85)', lw * 2.8);
  pass(color, lw);
}

function drawDownBowSymbol(cx, cy, size, color) {
  const lw = Math.max(1.5, size * 0.11);
  const hw = size * 0.34;
  const topY = cy - size * 0.28;
  const botY = cy + size * 0.30;

  const pass = (strokeColor, lineWidth) => {
    annotationContext.save();
    annotationContext.strokeStyle = strokeColor;
    annotationContext.lineWidth = lineWidth;
    annotationContext.lineCap = 'round';
    annotationContext.lineJoin = 'round';
    annotationContext.beginPath();
    annotationContext.moveTo(cx - hw, botY);
    annotationContext.lineTo(cx - hw, topY);
    annotationContext.lineTo(cx + hw, topY);
    annotationContext.lineTo(cx + hw, botY);
    annotationContext.stroke();
    annotationContext.restore();
  };
  pass('rgba(255,255,255,0.85)', lw * 2.8);
  pass(color, lw);
}

function promptAnnotationText() {
  const value = window.prompt('追加する文字を入力');
  if (value === null) {
    return '';
  }
  return value.trim();
}

function buildSymbolSvg(type, color) {
  const c = (color || '#111111').replace(/#/g, '%23');
  switch (type) {
    case 'sharp':
      return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><line x1='8' y1='2' x2='8' y2='22' stroke='${c}' stroke-width='2.2' stroke-linecap='round'/><line x1='16' y1='2' x2='16' y2='22' stroke='${c}' stroke-width='2.2' stroke-linecap='round'/><line x1='4' y1='9' x2='20' y2='7' stroke='${c}' stroke-width='2.2' stroke-linecap='round'/><line x1='4' y1='17' x2='20' y2='15' stroke='${c}' stroke-width='2.2' stroke-linecap='round'/></svg>`;
    case 'flat':
      return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><line x1='7' y1='1' x2='7' y2='23' stroke='${c}' stroke-width='2.2' stroke-linecap='round'/><path d='M7 10 C20 8 20 22 7 23' fill='${c}'/></svg>`;
    case 'natural':
      return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><line x1='7' y1='2' x2='7' y2='17' stroke='${c}' stroke-width='2.2' stroke-linecap='butt'/><line x1='17' y1='7' x2='17' y2='22' stroke='${c}' stroke-width='2.2' stroke-linecap='butt'/><line x1='7' y1='7' x2='17' y2='7' stroke='${c}' stroke-width='2.2' stroke-linecap='butt'/><line x1='7' y1='17' x2='17' y2='17' stroke='${c}' stroke-width='2.2' stroke-linecap='butt'/></svg>`;
    case 'upBow':
      return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><polyline points='2,4 12,20 22,4' fill='none' stroke='${c}' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/></svg>`;
    case 'downBow':
      return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><polyline points='2,20 2,4 22,4 22,20' fill='none' stroke='${c}' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/></svg>`;
    case 'circle':
      return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><circle cx='12' cy='12' r='10' fill='none' stroke='${c}' stroke-width='2.5'/></svg>`;
    default:
      return null;
  }
}

function getOrCreateSymbolImage(type, color) {
  const key = `${type}|${color || '#111111'}`;
  let img = symbolImageCache.get(key);
  if (!img) {
    const svg = buildSymbolSvg(type, color);
    if (!svg) return null;
    img = new Image();
    img.src = `data:image/svg+xml,${svg}`;
    symbolImageCache.set(key, img);
  }
  return img;
}

function drawSymbolOnCanvas(type, color, cx, cy, size) {
  const img = getOrCreateSymbolImage(type, color);
  if (!img) return false;
  const half = size / 2;
  if (img.complete && img.naturalWidth) {
    annotationContext.drawImage(img, cx - half, cy - half, size, size);
    return true;
  }
  img.onload = () => {
    if (!annotationContext || !annotationCanvas) return;
    annotationContext.save();
    annotationContext.globalCompositeOperation = 'source-over';
    annotationContext.drawImage(img, cx - half, cy - half, size, size);
    annotationContext.restore();
  };
  return false;
}

function getPngImage(src) {
  if (processedPngCache.has(src)) return processedPngCache.get(src);
  const img = new Image();
  img.src = src;
  processedPngCache.set(src, img);
  return img;
}

function drawPngSymbolOnCanvas(src, cx, cy, size) {
  const img = getPngImage(src);
  if (!img.complete || !img.naturalWidth) {
    img.onload = () => {
      if (!annotationContext || !annotationCanvas) return;
      annotationContext.save();
      annotationContext.globalCompositeOperation = 'source-over';
      const half = size / 2;
      annotationContext.drawImage(img, cx - half, cy - half, size, size);
      annotationContext.restore();
    };
    return false;
  }
  const half = size / 2;
  annotationContext.drawImage(img, cx - half, cy - half, size, size);
  return true;
}

function getAnnotationDrawScale() {
  return annotationCanvas ? (annotationCanvas._imgDpr || 1) : 1;
}

function setAnnotationStampImages(sources = {}) {
  Object.entries(sources).forEach(([name, source]) => {
    if (!Object.prototype.hasOwnProperty.call(stampImageSources, name)) {
      return;
    }
    stampImageSources[name] = source || '';
    stampImageCache.delete(name);
  });
}

function placeAnnotationStamp(value = null) {
  if (!annotationContext || !annotationCanvas) {
    return false;
  }

  const tool = getActiveToolConfig();
  if (tool.mode !== 'stamp') {
    return false;
  }

  const point = lastAnnotationPoint || {
    x: annotationCanvas.width / 2,
    y: annotationCanvas.height / 2,
  };
  annotationContext.save();
  annotationContext.globalCompositeOperation = 'source-over';
  annotationContext.textAlign = 'center';
  annotationContext.textBaseline = 'middle';

  if (tool.type === 'number') {
    const text = String(value ?? '');
    if (!text) {
      annotationContext.restore();
      return false;
    }
    const fontSize = getStampFontSize(annotationCanvas, 1, tool.size);
    drawOutlinedText(text, point, fontSize, tool.color, 700);
  }

  if (tool.type === 'accidental') {
    const accidentalTypeMap = { '#': 'sharp', sharp: 'sharp', b: 'flat', flat: 'flat', n: 'natural', natural: 'natural' };
    const accType = accidentalTypeMap[value] || 'sharp';
    const charMap = { sharp: '♯', flat: '♭', natural: '♮' };
    const fontSize = getStampFontSize(annotationCanvas, 1, tool.size);
    drawMusicSymbolText(charMap[accType], point, fontSize, tool.color);
  }

  if (tool.type === 'bowing') {
    const bowTypeMap = { u: 'up', up: 'up', d: 'down', down: 'down' };
    const bowType = bowTypeMap[value] || 'up';
    const size = getStampFontSize(annotationCanvas, 1, tool.size);
    const src = bowType === 'up' ? './assets/Up-bow.svg' : './assets/Down-bow.svg';
    if (!drawPngSymbolOnCanvas(src, point.x, point.y, size * (2 / 3))) {
      if (bowType === 'up') drawUpBowSymbol(point.x, point.y, size, tool.color);
      else drawDownBowSymbol(point.x, point.y, size, tool.color);
    }
  }

  if (tool.type === 'freeText') {
    const text = String(value ?? promptAnnotationText());
    if (!text) {
      annotationContext.restore();
      return false;
    }
    const fontSize = getStampFontSize(annotationCanvas, 1, tool.size);
    drawOutlinedText(text, point, fontSize, tool.color, 300);
  }

  if (tool.type === 'circle') {
    const radius = getStampFontSize(annotationCanvas, 0.56);
    const size = radius * 2.1;
    if (!drawSymbolOnCanvas('circle', tool.color, point.x, point.y, size)) {
      annotationContext.strokeStyle = tool.color;
      annotationContext.lineWidth = Math.max(2, radius * 0.16);
      annotationContext.beginPath();
      annotationContext.arc(point.x, point.y, radius, 0, Math.PI * 2);
      annotationContext.stroke();
    }
  }

  annotationContext.restore();
  pushAnnotationOp({ op: 'stamp', tt: tool.type, v: value, x: point.x / annotationCanvas.width, y: point.y / annotationCanvas.height, c: tool.color, size: tool.size });
  persistCurrentAnnotation();
  return true;
}

function handleAnnotationShortcut(event) {
  if (!isStampTool()) {
    return false;
  }

  if (activeTool === 'finger' && /^[0-5]$/.test(event.key)) {
    return placeAnnotationStamp(event.key);
  }

  if (activeTool === 'accidental') {
    const key = event.key.toLowerCase();
    if (event.key === '#' || key === 'b' || key === 'n' || event.key === 'Enter' || event.key === ' ') {
      return placeAnnotationStamp(event.key === 'Enter' || event.key === ' ' ? 'sharp' : key === 'b' ? 'flat' : key === 'n' ? 'natural' : '#');
    }
  }

  if (activeTool === 'bowing') {
    const key = event.key.toLowerCase();
    if (key === 'u' || key === 'd') {
      return placeAnnotationStamp(key === 'd' ? 'down' : 'up');
    }
  }

  if (activeTool === 'textStamp' && (event.key === 'Enter' || event.key === ' ')) {
    return placeAnnotationStamp();
  }

  if (activeTool === 'redCircle' && (event.key === 'Enter' || event.key === ' ' || event.key.toLowerCase() === 'o')) {
    return placeAnnotationStamp();
  }

  return false;
}

function drawDot(point) {
  if (!annotationContext) {
    return;
  }

  const tool = getActiveToolConfig();
  annotationContext.save();
  annotationContext.globalCompositeOperation = tool.mode === 'erase' ? 'destination-out' : 'source-over';
  annotationContext.fillStyle = tool.mode === 'erase' ? 'rgba(0, 0, 0, 1)' : hexToRgba(tool.color, tool.alpha);
  const drawScale = getAnnotationDrawScale();
  annotationContext.beginPath();
  annotationContext.arc(point.x, point.y, Math.max(1, (tool.width / 2) * drawScale), 0, Math.PI * 2);
  annotationContext.fill();
  annotationContext.restore();
}

function beginDrawing(event) {
  if (!annotationContext || !annotationCanvas) {
    return;
  }

  if (event.button !== undefined && event.button !== 0) {
    return;
  }

  if (typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
  lastAnnotationPoint = getCanvasPoint(event, annotationCanvas);

  if (isStampTool()) {
    if (activeTool !== 'finger' && activeTool !== 'bowing') {
      placeAnnotationStamp();
    }
    return;
  }

  isDrawing = true;
  lastPoint = lastAnnotationPoint;
  const tool = getActiveToolConfig();
  currentStroke = {
    op: 'stroke',
    mode: tool.mode,
    color: tool.color,
    width: tool.width,
    alpha: tool.alpha,
    pts: [normPt(lastPoint, annotationCanvas)],
  };
  drawDot(lastPoint);
}

function drawLine(event) {
  if (!isDrawing || !annotationContext || !annotationCanvas || !lastPoint) {
    return;
  }

  if (typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
  const nextPoint = getCanvasPoint(event, annotationCanvas);
  lastAnnotationPoint = nextPoint;
  const tool = getActiveToolConfig();
  annotationContext.save();
  annotationContext.globalCompositeOperation = tool.mode === 'erase' ? 'destination-out' : 'source-over';
  annotationContext.strokeStyle = tool.mode === 'erase' ? 'rgba(0, 0, 0, 1)' : hexToRgba(tool.color, tool.alpha);
  annotationContext.lineWidth = tool.width * getAnnotationDrawScale();
  annotationContext.lineCap = tool.mode === 'erase' ? 'round' : 'butt';
  annotationContext.lineJoin = tool.mode === 'erase' ? 'round' : 'miter';
  annotationContext.miterLimit = 2;
  annotationContext.beginPath();
  annotationContext.moveTo(lastPoint.x, lastPoint.y);
  annotationContext.lineTo(nextPoint.x, nextPoint.y);
  annotationContext.stroke();
  annotationContext.restore();
  if (currentStroke) currentStroke.pts.push(normPt(nextPoint, annotationCanvas));
  lastPoint = nextPoint;
}

function stopDrawing() {
  if (!isDrawing) {
    return;
  }

  isDrawing = false;
  lastPoint = null;
  if (currentStroke && currentStroke.pts.length > 0) {
    pushAnnotationOp(currentStroke);
    currentStroke = null;
  }
  persistCurrentAnnotation();
}

function bindDrawingEvents(canvas) {
  const pageNumber = Number(canvas.dataset.page || '1');
  const activateCanvas = () => { setActiveAnnotationCanvas(canvas, pageNumber); };

  // touch-action: none — ペンも指もブラウザのスクロールを完全に無効化。
  // 指スクロールは pointerType==='touch' を検知して手動で readerStage に転送する。
  canvas.style.touchAction = 'none';

  const activeTouchIds = new Set();
  let fingerLastX = 0;
  let fingerLastY = 0;
  let swipeStartX = 0;
  let swipeStartY = 0;
  let swipeDir = null; // 'h' (horizontal/swipe) | 'v' (vertical/scroll) | null

  const resetSwipe = () => { swipeDir = null; };

  canvas.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') {
      activeTouchIds.add(event.pointerId);
      fingerLastX = event.clientX;
      fingerLastY = event.clientY;
      if (activeTouchIds.size === 1) {
        swipeStartX = event.clientX;
        swipeStartY = event.clientY;
        swipeDir = null;
      } else {
        // 2本指になったらスワイプ判定をキャンセル
        swipeDir = 'v';
      }
      return;
    }
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    activateCanvas();
    beginDrawing(event);
  }, { passive: false });

  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') {
      if (activeTouchIds.size === 1 && activeTouchIds.has(event.pointerId)) {
        const dx = event.clientX - fingerLastX;
        const dy = event.clientY - fingerLastY;
        const totalDx = event.clientX - swipeStartX;
        const totalDy = event.clientY - swipeStartY;

        // 12px 動いた時点で横か縦かを確定
        if (swipeDir === null && Math.abs(totalDx) + Math.abs(totalDy) > 12) {
          swipeDir = Math.abs(totalDx) > Math.abs(totalDy) ? 'h' : 'v';
        }

        if (swipeDir !== 'h') {
          // 縦スクロール (または未確定時も仮スクロール)
          readerStage.scrollLeft -= dx;
          readerStage.scrollTop -= dy;
        }
      }
      fingerLastX = event.clientX;
      fingerLastY = event.clientY;
      return;
    }
    event.preventDefault();
    activateCanvas();
    setLastAnnotationPoint(event, canvas);
    drawLine(event);
  }, { passive: false });

  canvas.addEventListener('pointerup', (event) => {
    if (event.pointerType === 'touch') {
      if (
        activeTouchIds.size === 1 &&
        activeTouchIds.has(event.pointerId) &&
        swipeDir === 'h' &&
        readerLayoutMode === 'single'
      ) {
        const totalDx = event.clientX - swipeStartX;
        const threshold = Math.min(readerStage.clientWidth * 0.25, 100);
        if (Math.abs(totalDx) >= threshold) {
          // 右スワイプ → 次ページ、左スワイプ → 前ページ
          moveReaderPage(totalDx > 0 ? 1 : -1);
        }
      }
      activeTouchIds.delete(event.pointerId);
      resetSwipe();
      return;
    }
    stopDrawing();
  });

  canvas.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'touch') {
      activeTouchIds.delete(event.pointerId);
      resetSwipe();
      return;
    }
    stopDrawing();
  });

  canvas.addEventListener('pointercancel', (event) => {
    if (event.pointerType === 'touch') {
      activeTouchIds.delete(event.pointerId);
      resetSwipe();
      return;
    }
    stopDrawing();
  });
}

function getTempoMarking(bpm) {
  if (bpm < 60) return 'Largo';
  if (bpm < 76) return 'Adagio';
  if (bpm < 108) return 'Andante';
  if (bpm < 120) return 'Moderato';
  if (bpm < 156) return 'Allegro';
  return 'Presto';
}

function updateMetronomeUI() {
  metronomeBpmValue.textContent = String(metronomeBpm);
  metronomeMarking.textContent = getTempoMarking(metronomeBpm);
  updateMetronomeWeightPositionFromBpm();
}

function applyMetronomeOptionButtonState() {
  timeSignatureButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.timeSignature === metronomeTimeSignature);
  });
  rhythmButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.rhythm === metronomeRhythm);
  });
}

function updateZoomLabel() {
  zoomLabel.textContent = `${Math.round(readerZoom * 100)}%`;
  zoomOutButton.disabled = readerZoom <= zoomConfig.min + 0.001;
  zoomInButton.disabled = readerZoom >= zoomConfig.max - 0.001;
}

const STAMP_SIZE_LEVELS = [0.5, 0.7, 1.0, 1.4, 1.9];
const STAMP_SIZE_LABELS = ['XS', 'S', 'M', 'L', 'XL'];

function updateStampSizeUI() {
  const label = document.getElementById('stampSizeLabel');
  const decBtn = document.getElementById('stampSizeDecButton');
  const incBtn = document.getElementById('stampSizeIncButton');
  if (label) label.textContent = STAMP_SIZE_LABELS[stampSizeLevelIndex];
  if (decBtn) decBtn.disabled = stampSizeLevelIndex <= 0;
  if (incBtn) incBtn.disabled = stampSizeLevelIndex >= STAMP_SIZE_LEVELS.length - 1;
}

function adjustStampSize(delta) {
  const next = Math.max(0, Math.min(STAMP_SIZE_LEVELS.length - 1, stampSizeLevelIndex + delta));
  if (next === stampSizeLevelIndex) return;
  stampSizeLevelIndex = next;
  stampSizeMultiplier = STAMP_SIZE_LEVELS[stampSizeLevelIndex];
  updateStampSizeUI();
}

function applyLayoutButtonState() {
  layoutSingleButton.classList.toggle('active', readerLayoutMode === 'single');
  layoutSpreadABtn.classList.toggle('active', readerLayoutMode === 'spreadA');
  layoutSpreadBBtn.classList.toggle('active', readerLayoutMode === 'spreadB');
  if (layoutScrollVBtn) layoutScrollVBtn.classList.toggle('active', readerLayoutMode === 'scrollV');
  if (layoutScrollHBtn) layoutScrollHBtn.classList.toggle('active', readerLayoutMode === 'scrollH');
}

function updateFullscreenButtonState() {
  if (!fullscreenToggleButton) {
    return;
  }

  fullscreenToggleButton.classList.toggle('active', isReaderFocusMode);
  fullscreenToggleButton.textContent = isReaderFocusMode ? '通常表示' : '全画面';
}

function setReaderFocusMode(nextValue) {
  isReaderFocusMode = Boolean(nextValue);

  if (isReaderFocusMode) {
    setFloatingWindowVisible(metronomePanel, metronomeWindowToggle, false, 'メトロノーム');
    setFloatingWindowVisible(tunerPanel, tunerWindowToggle, false, 'チューナー');
    reader.classList.add('focus-mode');
  } else {
    reader.classList.remove('focus-mode');
  }

  updateFullscreenButtonState();
}

async function toggleReaderFullscreen() {
  if (!reader) {
    return;
  }

  setReaderFocusMode(!isReaderFocusMode);
}

function buildViewGroups(totalPages, mode) {
  const groups = [];
  if (totalPages <= 0) {
    return groups;
  }

  if (mode === 'scrollV' || mode === 'scrollH') {
    const all = [];
    for (let page = 1; page <= totalPages; page += 1) all.push(page);
    return [all];
  }

  if (mode === 'single') {
    for (let page = 1; page <= totalPages; page += 1) {
      groups.push([page]);
    }
    return groups;
  }

  if (mode === 'spreadA') {
    for (let page = 1; page <= totalPages; page += 2) {
      const group = [page];
      if (page + 1 <= totalPages) {
        group.push(page + 1);
      }
      groups.push(group);
    }
    return groups;
  }

  // spreadB: 1 | 2,3 | 4,5 | ...
  groups.push([1]);
  for (let page = 2; page <= totalPages; page += 2) {
    const group = [page];
    if (page + 1 <= totalPages) {
      group.push(page + 1);
    }
    groups.push(group);
  }
  return groups;
}

function findViewIndexByPage(viewGroups, pageNumber) {
  const index = viewGroups.findIndex((group) => group.includes(pageNumber));
  return index >= 0 ? index + 1 : 1;
}

function getCurrentReaderAnchorPage() {
  const group = readerState.viewGroups[readerState.page - 1];
  return group && group.length > 0 ? group[0] : 1;
}

function updateReaderPagerLabel(totalPages) {
  const currentGroup = readerState.viewGroups[readerState.page - 1] || [1];
  readerPrevButton.disabled = readerState.page <= 1;
  readerNextButton.disabled = readerState.page >= readerState.pageCount;
  if (focusPrevButton) {
    focusPrevButton.disabled = readerPrevButton.disabled;
  }
  if (focusNextButton) {
    focusNextButton.disabled = readerNextButton.disabled;
  }

  if (currentGroup.length === 1) {
    readerPageLabel.textContent = `${currentGroup[0]} / ${totalPages}`;
  } else {
    readerPageLabel.textContent = `${currentGroup[0]},${currentGroup[1]} / ${totalPages}`;
  }
}

function clampZoom(value) {
  return Math.min(zoomConfig.max, Math.max(zoomConfig.min, value));
}

// ── Library IndexedDB (local persistence without Drive login) ─────────────────

let libraryDb = null;

function openLibraryDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('gakufu-library', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('library')) db.createObjectStore('library');
      if (!db.objectStoreNames.contains('pdfs')) db.createObjectStore('pdfs');
    };
    req.onsuccess = (e) => { libraryDb = e.target.result; resolve(); };
    req.onerror = () => reject(req.error);
  });
}

function saveItemMetaToDb(item) {
  if (!libraryDb || !item) return;
  const meta = {
    id: item.id,
    title: item.title,
    composer: item.composer || '',
    type: item.type,
    folderIds: item.folderIds || [item.folderId || 'inbox'],
    folderId: item.folderId || (item.folderIds || ['inbox'])[0],
    lastPage: item.lastPage || 1,
    driveFileId: item.driveFileId || null,
    fileName: item.file?.name || `${item.title}.pdf`,
    fileLastModified: item.file?.lastModified || 0,
  };
  libraryDb.transaction('library', 'readwrite').objectStore('library').put(meta, item.id);
}

function savePdfToDb(itemId, file) {
  if (!libraryDb || !file) return;
  file.arrayBuffer().then((buffer) => {
    libraryDb.transaction('pdfs', 'readwrite').objectStore('pdfs').put(buffer, itemId);
  }).catch((err) => console.warn('PDF save to local DB failed:', err));
}

function deleteItemFromDb(itemId) {
  if (!libraryDb) return;
  const tx = libraryDb.transaction(['library', 'pdfs'], 'readwrite');
  tx.objectStore('library').delete(itemId);
  tx.objectStore('pdfs').delete(itemId);
}

async function loadLibraryFromDb() {
  if (!libraryDb) return;
  const metas = await new Promise((resolve) => {
    const items = [];
    const tx = libraryDb.transaction('library', 'readonly');
    tx.objectStore('library').openCursor().onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) { items.push(cursor.value); cursor.continue(); }
    };
    tx.oncomplete = () => resolve(items);
    tx.onerror = () => resolve([]);
  });

  await Promise.all(metas.map((meta) => new Promise((resolve) => {
    const req = libraryDb.transaction('pdfs', 'readonly').objectStore('pdfs').get(meta.id);
    req.onsuccess = () => {
      const buffer = req.result;
      const base = {
        id: meta.id,
        title: meta.title,
        composer: meta.composer || '',
        type: meta.type || 'pdf',
        lastPage: meta.lastPage || 1,
        folderIds: meta.folderIds || ['inbox'],
        folderId: meta.folderId || (meta.folderIds || ['inbox'])[0],
        driveFileId: meta.driveFileId || null,
      };
      if (!buffer) {
        // PDF not in local storage — add as stub so loadFromDrive fills the file
        // without overwriting the locally-stored folder assignment.
        library.push({ ...base, file: null, url: null });
      } else {
        const file = new File([buffer], meta.fileName || `${meta.title}.pdf`, {
          type: 'application/pdf',
          lastModified: meta.fileLastModified || 0,
        });
        library.push({ ...base, file, url: URL.createObjectURL(file) });
      }
      resolve();
    };
    req.onerror = () => resolve();
  })));
}

// ── IndexedDB (annotations) ───────────────────────────────────────────────────

function openAnnotationDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('gakufu-annotations', 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('ops');
    };
    req.onsuccess = (e) => { annotationDb = e.target.result; resolve(); };
    req.onerror = () => reject(req.error);
  });
}

function saveAnnotationOpsToDb(key, data) {
  if (!annotationDb) return;
  const tx = annotationDb.transaction('ops', 'readwrite');
  tx.objectStore('ops').put(data, key);
}

function deleteAnnotationFromDb(key) {
  if (!annotationDb) return;
  const tx = annotationDb.transaction('ops', 'readwrite');
  tx.objectStore('ops').delete(key);
}

function deleteAnnotationsForItemFromDb(itemId) {
  if (!annotationDb) return;
  const tx = annotationDb.transaction('ops', 'readwrite');
  const store = tx.objectStore('ops');
  const range = IDBKeyRange.bound(`${itemId}:`, `${itemId}:~`);
  store.openCursor(range).onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) { cursor.delete(); cursor.continue(); }
  };
}

function loadAllAnnotationsFromDb() {
  if (!annotationDb) return Promise.resolve();
  return new Promise((resolve) => {
    const tx = annotationDb.transaction('ops', 'readonly');
    const req = tx.objectStore('ops').openCursor();
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        annotationStrokes.set(cursor.key, cursor.value);
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => resolve();
  });
}

// ── Stroke helpers ───────────────────────────────────────────────────────────

function normPt(pt, canvas) {
  return [pt.x / canvas.width, pt.y / canvas.height];
}

function denormPt(npt, canvas) {
  return { x: npt[0] * canvas.width, y: npt[1] * canvas.height };
}

function getPageStrokes(key) {
  if (!annotationStrokes.has(key)) {
    annotationStrokes.set(key, { version: 1, ops: [] });
  }
  return annotationStrokes.get(key);
}

function pushAnnotationOp(op) {
  const key = getAnnotationKey();
  if (!key) return;
  getPageStrokes(key).ops.push(op);
  annotationRedoStacks.delete(key); // 新規描画でredoスタックをクリア
}

// ── Replay ───────────────────────────────────────────────────────────────────

function replayStrokeOp(ctx, canvas, op) {
  if (!op.pts || op.pts.length === 0) return;
  const scale = canvas._imgDpr || 1;
  ctx.globalCompositeOperation = op.mode === 'erase' ? 'destination-out' : 'source-over';
  ctx.strokeStyle = op.mode === 'erase' ? 'rgba(0,0,0,1)' : hexToRgba(op.color, op.alpha);
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = op.width * scale;
  ctx.lineCap = op.mode === 'erase' ? 'round' : 'butt';
  ctx.lineJoin = op.mode === 'erase' ? 'round' : 'miter';
  ctx.miterLimit = 2;
  const pts = op.pts.map((p) => denormPt(p, canvas));
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, Math.max(1, (op.width / 2) * scale), 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }
}

function replayStampOp(ctx, canvas, op) {
  const pt = denormPt([op.x, op.y], canvas);
  const savedCanvas = annotationCanvas;
  const savedCtx = annotationContext;
  const savedPoint = lastAnnotationPoint;
  annotationCanvas = canvas;
  annotationContext = ctx;
  lastAnnotationPoint = pt;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const fontSize = getStampFontSize(canvas, 1, op.size);
  if (op.tt === 'number') {
    drawOutlinedText(String(op.v ?? ''), pt, fontSize, op.c, 700);
  } else if (op.tt === 'accidental') {
    const charMap = { sharp: '♯', flat: '♭', natural: '♮' };
    const accTypeMap = { '#': 'sharp', sharp: 'sharp', b: 'flat', flat: 'flat', n: 'natural', natural: 'natural' };
    drawMusicSymbolText(charMap[accTypeMap[op.v] || 'sharp'], pt, fontSize, op.c);
  } else if (op.tt === 'bowing') {
    const src = (op.v === 'down') ? './assets/Down-bow.svg' : './assets/Up-bow.svg';
    drawPngSymbolOnCanvas(src, pt.x, pt.y, fontSize * (2 / 3));
  } else if (op.tt === 'freeText') {
    drawOutlinedText(String(op.v ?? ''), pt, fontSize, op.c, 300);
  } else if (op.tt === 'circle') {
    const radius = getStampFontSize(canvas, 0.56);
    const sz = radius * 2.1;
    if (!drawSymbolOnCanvas('circle', op.c, pt.x, pt.y, sz)) {
      ctx.strokeStyle = op.c;
      ctx.lineWidth = Math.max(2, radius * 0.16);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
  annotationCanvas = savedCanvas;
  annotationContext = savedCtx;
  lastAnnotationPoint = savedPoint;
}

function replayAnnotationOps(ctx, canvas, ops) {
  ctx.save();
  try {
    for (const op of ops) {
      if (op.op === 'stroke') replayStrokeOp(ctx, canvas, op);
      else if (op.op === 'stamp') replayStampOp(ctx, canvas, op);
    }
  } finally {
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────────────────────

function getBeatIntervalMs() {
  if (metronomeTimeSignature === '3/8' || metronomeTimeSignature === '6/8') {
    return (60000 / metronomeBpm) / 3;
  }
  return 60000 / metronomeBpm;
}

function getMetronomeSwingIntervalMs() {
  return 60000 / metronomeBpm;
}

function getMetronomeBeatsPerMeasure() {
  const beats = Number.parseInt(metronomeTimeSignature.split('/')[0], 10);
  return Number.isFinite(beats) && beats > 0 ? beats : 4;
}

function getActiveRhythmProfile() {
  return rhythmProfiles[metronomeRhythm] || rhythmProfiles['1x'];
}

async function getAudioContext() {
  if (!audioContext) {
    audioContext = new window.AudioContext();
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  return audioContext;
}

async function playMetronomeClick(level = 1, highAccent = false) {
  const context = await getAudioContext();
  const now = context.currentTime;

  const oscillator = context.createOscillator();
  oscillator.type = 'square';
  oscillator.frequency.value = highAccent ? 1500 : 1080;

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.24 * Math.max(0.15, level), now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.06);
}

function animateMetronomeSwing() {
  if (isMetronomeDragging) {
    return;
  }
  const beatMs = getMetronomeSwingIntervalMs();
  metronomeArm.style.transition = `transform ${Math.max(120, Math.round(beatMs * 0.72))}ms cubic-bezier(0.22, 0.8, 0.22, 1)`;
  metronomeWeight.style.transition = `box-shadow ${Math.max(120, Math.round(beatMs * 0.72))}ms cubic-bezier(0.22, 0.8, 0.22, 1)`;
  const angle = 14 * metronomeSwingDirection;
  metronomeArm.style.transform = `translateX(-2px) rotate(${angle}deg)`;
  metronomeWeight.style.boxShadow = metronomeSwingDirection > 0
    ? '-4px 6px 0 rgba(0, 0, 0, 0.2)'
    : '4px 6px 0 rgba(0, 0, 0, 0.2)';
  metronomeSwingDirection *= -1;
}

function stopMetronomeSwingTimer() {
  if (metronomeSwingTimerId !== null) {
    window.clearTimeout(metronomeSwingTimerId);
    metronomeSwingTimerId = null;
  }
}

function scheduleMetronomeSwing() {
  if (!isMetronomeRunning) {
    return;
  }

  animateMetronomeSwing();

  metronomeSwingTimerId = window.setTimeout(() => {
    scheduleMetronomeSwing();
  }, getMetronomeSwingIntervalMs());
}

function resetMetronomeSwing() {
  if (isMetronomeDragging) {
    return;
  }
  metronomeArm.style.transform = 'translateX(-2px) rotate(0deg)';
  metronomeWeight.style.boxShadow = '-4px 6px 0 rgba(0, 0, 0, 0.2)';
}

function getMetronomeWeightRange() {
  const railHeight = metronomeRail ? (metronomeRail.clientHeight || 98) : 98;
  const weightHeight = metronomeWeight ? metronomeWeight.clientHeight : 28;
  const minTop = 4;
  const maxTop = Math.max(minTop, railHeight - weightHeight - 4);
  return { minTop, maxTop };
}

function updateMetronomeWeightPositionFromBpm() {
  if (!metronomeWeight) {
    return;
  }
  const { minTop, maxTop } = getMetronomeWeightRange();
  const ratio = (metronomeBpm - 40) / 200;
  const clamped = Math.max(0, Math.min(1, ratio));
  const top = Math.round(minTop + (maxTop - minTop) * clamped);
  metronomeWeight.style.top = `${top}px`;
}

function setMetronomeBpmFromPointer(clientY) {
  if (!metronomeRail) {
    return;
  }
  const rect = metronomeRail.getBoundingClientRect();
  const y = Math.max(rect.top, Math.min(rect.bottom, clientY));
  const { minTop, maxTop } = getMetronomeWeightRange();
  const top = Math.max(minTop, Math.min(maxTop, y - rect.top - (metronomeWeight.clientHeight / 2)));
  const ratio = (top - minTop) / Math.max(1, (maxTop - minTop));
  const bpm = 40 + ratio * 200;
  setMetronomeBpm(bpm);
}

function updateMetronomeBeatIndicator(activeBeat = 0) {
  if (!metronomeBeatIndicator && !focusMetronomeBeatIndicator) {
    return;
  }
  const beatsPerMeasure = getMetronomeBeatsPerMeasure();
  const normalized = Math.max(0, Math.min(beatsPerMeasure - 1, activeBeat));
  let text = '';
  for (let i = 0; i < beatsPerMeasure; i += 1) {
    text += i === normalized ? '●' : '○';
  }
  if (metronomeBeatIndicator) {
    metronomeBeatIndicator.textContent = text;
  }
  if (focusMetronomeBeatIndicator) {
    focusMetronomeBeatIndicator.textContent = text;
  }
}

function setMetronomeBpm(nextBpm) {
  metronomeBpm = Math.max(40, Math.min(240, Math.round(nextBpm)));
  updateMetronomeUI();

  if (isMetronomeRunning) {
    startMetronome().catch((error) => {
      console.error('Failed to update metronome BPM.', error);
      stopMetronome();
    });
  }
}

function setMetronomeTimeSignature(signature) {
  if (!signature) {
    return;
  }
  metronomeTimeSignature = signature;
  applyMetronomeOptionButtonState();
  metronomeBeatIndex = 0;
  metronomeSubIndex = 0;
  updateMetronomeBeatIndicator(0);

  if (isMetronomeRunning) {
    startMetronome().catch((error) => {
      console.error('Failed to update metronome time signature.', error);
      stopMetronome();
    });
  }
}

function setMetronomeRhythm(name) {
  if (!rhythmProfiles[name]) {
    return;
  }
  metronomeRhythm = name;
  applyMetronomeOptionButtonState();
  metronomeBeatIndex = 0;
  metronomeSubIndex = 0;
  if (isMetronomeRunning) {
    startMetronome().catch((error) => {
      console.error('Failed to update metronome rhythm.', error);
      stopMetronome();
    });
  }
}

function setReaderLayoutMode(mode) {
  if (!['single', 'spreadA', 'spreadB', 'scrollV', 'scrollH'].includes(mode)) {
    return;
  }

  if (readerLayoutMode === mode) {
    return;
  }

  readerLayoutMode = mode;
  applyLayoutButtonState();
  readerPendingAnchorPage = getCurrentReaderAnchorPage();

  if (reader.style.display !== 'none' && activeItem && activeItem.type === 'pdf') {
    renderReaderPage();
  }
}

function setFloatingWindowVisible(panel, button, visible, label) {
  panel.hidden = !visible;
  button.classList.toggle('active', visible);
  button.textContent = visible ? `${label}を閉じる` : label;
}

function toggleMetronomeWindow() {
  setFloatingWindowVisible(
    metronomePanel,
    metronomeWindowToggle,
    metronomePanel.hidden,
    'メトロノーム',
  );
}

function toggleTunerWindow() {
  setFloatingWindowVisible(
    tunerPanel,
    tunerWindowToggle,
    tunerPanel.hidden,
    'チューナー',
  );
}

function stopTunerTone() {
  if (tunerOscillator) {
    try {
      tunerOscillator.stop();
    } catch (error) {
      // Oscillator might already be stopped.
    }
    tunerOscillator.disconnect();
    tunerOscillator = null;
  }

  if (tunerGainNode) {
    tunerGainNode.disconnect();
    tunerGainNode = null;
  }
}

function setTunerTargetNote(noteName) {
  if (!violinTuningFrequencies[noteName]) {
    return;
  }

  tunerTargetNote = noteName;

  Object.entries(tunerNoteButtons).forEach(([name, button]) => {
    button.classList.toggle('active', name === noteName);
  });

  const freq = violinTuningFrequencies[noteName];
  tunerTargetLabel.textContent = `基準: ${noteName} (${freq.toFixed(2)}Hz)`;
}

function getTunerThresholdFactor() {
  return tunerThresholdPercent / 100;
}

function updateTunerThresholdUI() {
  if (!tunerThresholdSlider || !tunerThresholdValue) {
    return;
  }

  tunerThresholdSlider.value = String(tunerThresholdPercent);
  tunerThresholdValue.textContent = `${tunerThresholdPercent}%`;
}

function getNearestNoteInfo(frequency) {
  const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
  const noteName = chromaticNoteNames[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  const targetHz = 440 * (2 ** ((midi - 69) / 12));
  const cents = 1200 * Math.log2(frequency / targetHz);

  return {
    label: `${noteName}${octave}`,
    targetHz,
    cents,
  };
}

function updateTunerNeedle(cents, detectedHz = null, noteInfo = null) {
  const clampedCents = Math.max(-50, Math.min(50, cents));
  const meterWidth = tunerNeedle.parentElement
    ? Math.max(0, tunerNeedle.parentElement.clientWidth - 16)
    : 0;
  const maxOffset = meterWidth / 2;
  const offset = (clampedCents / 50) * maxOffset;
  tunerNeedle.style.transform = `translateX(calc(-50% + ${offset}px))`;

  const absCents = Math.abs(cents);
  let indicatorColor = '#c84337';
  if (absCents < 5) {
    indicatorColor = '#2a9d62';
  } else if (absCents < 15) {
    indicatorColor = '#e7b14d';
  }
  tunerNeedle.style.background = indicatorColor;

  const direction = cents < -1 ? '低い' : cents > 1 ? '高い' : 'OK';
  if (detectedHz) {
    if (noteInfo) {
      tunerTargetLabel.textContent = `検出: ${noteInfo.label} (${noteInfo.targetHz.toFixed(2)}Hz)`;
      tunerReadout.textContent = `${detectedHz.toFixed(2)}Hz / ${noteInfo.label} (${cents >= 0 ? '+' : ''}${cents.toFixed(1)} cent, ${direction})`;
    } else {
      tunerReadout.textContent = `${detectedHz.toFixed(2)}Hz (${cents >= 0 ? '+' : ''}${cents.toFixed(1)} cent, ${direction})`;
    }
  } else {
    tunerReadout.textContent = `入力待ち (${tunerTargetNote} ${violinTuningFrequencies[tunerTargetNote].toFixed(2)}Hz)`;
  }
}

function autoCorrelatePitch(buffer, sampleRate) {
  const thresholdFactor = getTunerThresholdFactor();
  let rms = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / buffer.length);
  if (rms < tunerThresholdBase.rms * thresholdFactor) {
    return -1;
  }

  let bestOffset = -1;
  let bestCorrelation = 0;
  const maxSamples = Math.floor(buffer.length / 2);
  const minOffset = Math.floor(sampleRate / 1000); // ~1000Hz
  const maxOffset = Math.floor(sampleRate / 70); // ~70Hz

  for (let offset = minOffset; offset <= maxOffset && offset < maxSamples; offset += 1) {
    let correlation = 0;
    for (let i = 0; i < maxSamples; i += 1) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }
    correlation = 1 - correlation / maxSamples;

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if (bestCorrelation < Math.min(0.95, tunerThresholdBase.correlation * thresholdFactor) || bestOffset === -1) {
    return -1;
  }

  return sampleRate / bestOffset;
}

function stopMicTuner() {
  isMicTunerRunning = false;
  micTunerToggleButton.textContent = 'マイクチューナー開始';

  if (micTunerAnimationId !== null) {
    cancelAnimationFrame(micTunerAnimationId);
    micTunerAnimationId = null;
  }

  if (micTunerSource) {
    micTunerSource.disconnect();
    micTunerSource = null;
  }

  if (micTunerAnalyser) {
    micTunerAnalyser.disconnect();
    micTunerAnalyser = null;
  }

  if (micTunerStream) {
    micTunerStream.getTracks().forEach((track) => track.stop());
    micTunerStream = null;
  }

  updateTunerNeedle(0, null);
  tunerReadout.textContent = `待機中 (${tunerTargetNote} ${violinTuningFrequencies[tunerTargetNote].toFixed(2)}Hz)`;
}

function runMicTunerLoop() {
  if (!isMicTunerRunning || !micTunerAnalyser || !audioContext) {
    return;
  }

  const sampleBuffer = new Float32Array(micTunerAnalyser.fftSize);
  micTunerAnalyser.getFloatTimeDomainData(sampleBuffer);
  let rms = 0;
  for (let i = 0; i < sampleBuffer.length; i += 1) {
    rms += sampleBuffer[i] * sampleBuffer[i];
  }
  rms = Math.sqrt(rms / sampleBuffer.length);
  const frequency = autoCorrelatePitch(sampleBuffer, audioContext.sampleRate);

  if (frequency > 0) {
    const noteInfo = getNearestNoteInfo(frequency);
    updateTunerNeedle(noteInfo.cents, frequency, noteInfo);
  } else {
    updateTunerNeedle(0, null);
    const levelText = rms > tunerThresholdBase.level * getTunerThresholdFactor()
      ? `入力あり: レベル ${(rms * 100).toFixed(1)}%`
      : '入力待ち';
    tunerReadout.textContent = `${levelText} (${tunerTargetNote} ${violinTuningFrequencies[tunerTargetNote].toFixed(2)}Hz)`;
  }

  micTunerAnimationId = requestAnimationFrame(runMicTunerLoop);
}

async function startMicTuner() {
  stopMicTuner();

  if (!window.isSecureContext) {
    alert('このページは安全なコンテキストではないため、マイクが使えません。https または localhost で開いてください。');
    tunerReadout.textContent = 'マイク不可: 安全でないページ';
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('このブラウザではマイク入力が利用できません。');
    tunerReadout.textContent = 'マイク不可: getUserMedia未対応';
    return;
  }

  const context = await getAudioContext();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });

  micTunerStream = stream;
  micTunerSource = context.createMediaStreamSource(stream);
  micTunerAnalyser = context.createAnalyser();
  micTunerAnalyser.fftSize = 4096;
  micTunerAnalyser.smoothingTimeConstant = 0.15;
  micTunerSource.connect(micTunerAnalyser);

  isMicTunerRunning = true;
  micTunerToggleButton.textContent = 'マイクチューナー停止';
  tunerReadout.textContent = 'マイク入力を解析中...';
  runMicTunerLoop();
}

async function toggleMicTuner() {
  if (isMicTunerRunning) {
    stopMicTuner();
    return;
  }

  try {
    await startMicTuner();
  } catch (error) {
    console.error('Failed to start mic tuner.', error);
    const message = error && error.message ? error.message : 'unknown error';
    alert(`マイクチューナーを開始できませんでした。マイク権限またはブラウザ設定を確認してください。\n(${message})`);
    tunerReadout.textContent = `マイク開始失敗: ${message}`;
    stopMicTuner();
  }
}

async function playTunerTone(noteName) {
  const frequency = violinTuningFrequencies[noteName];
  if (!frequency) {
    return;
  }

  setTunerTargetNote(noteName);

  const context = await getAudioContext();
  const now = context.currentTime;

  stopTunerTone();

  tunerOscillator = context.createOscillator();
  tunerGainNode = context.createGain();

  tunerOscillator.type = 'sine';
  tunerOscillator.frequency.setValueAtTime(frequency, now);

  tunerGainNode.gain.setValueAtTime(0.0001, now);
  tunerGainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.03);
  tunerGainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

  tunerOscillator.connect(tunerGainNode);
  tunerGainNode.connect(context.destination);

  tunerOscillator.start(now);
  tunerOscillator.stop(now + 1.25);
  tunerOscillator.onended = () => {
    stopTunerTone();
  };
}

function triggerTunerTone(noteName) {
  playTunerTone(noteName).catch((error) => {
    console.error('Failed to play tuner tone.', error);
    alert('チューナー音の再生に失敗しました。');
  });
}

function stopMetronome() {
  if (metronomeTimerId !== null) {
    window.clearTimeout(metronomeTimerId);
    metronomeTimerId = null;
  }
  stopMetronomeSwingTimer();

  isMetronomeRunning = false;
  metronomeBeatIndex = 0;
  metronomeSubIndex = 0;
  metronomeToggleButton.textContent = 'START';
  metronomeToggleButton.classList.remove('running');
  resetMetronomeSwing();
  updateMetronomeBeatIndicator(0);
}

function getNextMetronomeIntervalMs() {
  const beatMs = getBeatIntervalMs();
  const rhythm = getActiveRhythmProfile();
  if (rhythm.swing && rhythm.subdivisions === 2) {
    return metronomeSubIndex === 0 ? beatMs * (2 / 3) : beatMs * (1 / 3);
  }
  return beatMs / rhythm.subdivisions;
}

async function tickMetronome() {
  if (!isMetronomeRunning) {
    return;
  }

  const beatsPerMeasure = getMetronomeBeatsPerMeasure();
  const rhythm = getActiveRhythmProfile();
  const beatInMeasure = metronomeBeatIndex % beatsPerMeasure;
  const isFirstBeat = beatInMeasure === 0 && metronomeSubIndex === 0;
  const patternLevel = rhythm.pattern[metronomeSubIndex % rhythm.pattern.length] ?? 0.5;

  if (metronomeSubIndex === 0) {
    updateMetronomeBeatIndicator(beatInMeasure);
  }

  await playMetronomeClick(isFirstBeat ? 1.15 : patternLevel, isFirstBeat);

  metronomeSubIndex += 1;
  if (metronomeSubIndex >= rhythm.subdivisions) {
    metronomeSubIndex = 0;
    metronomeBeatIndex += 1;
  }

  metronomeTimerId = window.setTimeout(() => {
    tickMetronome().catch((error) => {
      console.error('Failed during metronome tick.', error);
      stopMetronome();
    });
  }, getNextMetronomeIntervalMs());
}

async function startMetronome() {
  stopMetronome();
  isMetronomeRunning = true;
  metronomeToggleButton.textContent = 'STOP';
  metronomeToggleButton.classList.add('running');

  scheduleMetronomeSwing();
  await tickMetronome();
}

async function toggleMetronome() {
  if (isMetronomeRunning) {
    stopMetronome();
    return;
  }

  try {
    await startMetronome();
  } catch (error) {
    console.error('Failed to start metronome.', error);
    alert('メトロノームの開始に失敗しました。');
  }
}

async function setReaderZoom(nextZoom) {
  const clamped = clampZoom(nextZoom);
  if (Math.abs(clamped - readerZoom) < 0.001) {
    return;
  }

  persistCurrentAnnotation();
  readerZoom = clamped;
  updateZoomLabel();

  if (reader.style.display !== 'none' && activeItem) {
    await renderReaderPage();
  }
}

reader.addEventListener('wheel', (event) => {
  if (!event.ctrlKey || reader.style.display === 'none' || !activeItem) return;
  event.preventDefault();

  if (wheelBaseZoom === null) {
    wheelBaseZoom = readerZoom;
    wheelBaseRect = readerStage.getBoundingClientRect();
    wheelOriginX = event.clientX - wheelBaseRect.left;
    wheelOriginY = event.clientY - wheelBaseRect.top;
    wheelScrollTop = readerStage.scrollTop;
    wheelScrollLeft = readerStage.scrollLeft;
  }

  const delta = -event.deltaY * 0.004;
  readerZoom = clampZoom(readerZoom + delta);
  updateZoomLabel();

  readerStage.style.transformOrigin = `${wheelOriginX}px ${wheelOriginY}px`;
  readerStage.style.transform = `scale(${readerZoom / wheelBaseZoom})`;

  clearTimeout(wheelZoomTimer);
  wheelZoomTimer = setTimeout(async () => {
    const s = readerZoom / wheelBaseZoom;
    const ox = wheelOriginX;
    const oy = wheelOriginY;
    const baseScrollTop = wheelScrollTop;
    const baseScrollLeft = wheelScrollLeft;

    wheelBaseZoom = null;
    wheelBaseRect = null;
    readerStage.style.transform = '';
    readerStage.style.transformOrigin = '';
    persistCurrentAnnotation();
    await renderReaderPage();
    requestAnimationFrame(() => {
      readerStage.scrollTop = (baseScrollTop + oy) * s - oy;
      readerStage.scrollLeft = (baseScrollLeft + ox) * s - ox;
    });
  }, 200);
}, { passive: false });

// ── ピンチズーム (iPad / タッチデバイス) ─────────────────────────────────────
// Safari の gesturechange でブラウザレベルのズームをブロックし、
// 2本指ピンチを readerZoom に適用する
let pinchStartDist = null;
let pinchStartZoom = null;
let pinchOriginX = 0;
let pinchOriginY = 0;
let pinchScrollTop = 0;
let pinchScrollLeft = 0;
let pinchCommitTimer = null;

function getPinchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Safari 独自イベントでブラウザズームを完全にブロック
['gesturestart', 'gesturechange', 'gestureend'].forEach((name) => {
  reader.addEventListener(name, (e) => e.preventDefault(), { passive: false });
});

readerStage.addEventListener('touchstart', (event) => {
  if (event.touches.length === 2) {
    pinchStartDist = getPinchDist(event.touches);
    pinchStartZoom = readerZoom;
    // ピンチ中心をスクロールコンテナ座標で記録（wheel zoom と同じ方式）
    const rect = readerStage.getBoundingClientRect();
    const mx = (event.touches[0].clientX + event.touches[1].clientX) / 2;
    const my = (event.touches[0].clientY + event.touches[1].clientY) / 2;
    pinchOriginX = mx - rect.left;
    pinchOriginY = my - rect.top;
    pinchScrollTop = readerStage.scrollTop;
    pinchScrollLeft = readerStage.scrollLeft;
    event.preventDefault();
  }
}, { passive: false });

readerStage.addEventListener('touchmove', (event) => {
  if (event.touches.length === 2 && pinchStartDist !== null) {
    const dist = getPinchDist(event.touches);
    const next = clampZoom(pinchStartZoom * (dist / pinchStartDist));
    if (Math.abs(next - readerZoom) > 0.005) {
      readerZoom = next;
      updateZoomLabel();
      // 固定した中心点で scale プレビュー
      readerStage.style.transformOrigin = `${pinchOriginX}px ${pinchOriginY}px`;
      readerStage.style.transform = `scale(${readerZoom / pinchStartZoom})`;
    }
    event.preventDefault();
  }
}, { passive: false });

readerStage.addEventListener('touchend', (event) => {
  if (pinchStartDist !== null && event.touches.length < 2) {
    const s = readerZoom / pinchStartZoom;
    const ox = pinchOriginX;
    const oy = pinchOriginY;
    const baseScrollTop = pinchScrollTop;
    const baseScrollLeft = pinchScrollLeft;
    pinchStartDist = null;
    pinchStartZoom = null;
    readerStage.style.transform = '';
    readerStage.style.transformOrigin = '';
    clearTimeout(pinchCommitTimer);
    pinchCommitTimer = setTimeout(async () => {
      persistCurrentAnnotation();
      await renderReaderPage();
      // wheel zoom と同じ式でスクロール位置を復元
      requestAnimationFrame(() => {
        readerStage.scrollTop = (baseScrollTop + oy) * s - oy;
        readerStage.scrollLeft = (baseScrollLeft + ox) * s - ox;
      });
    }, 150);
  }
}, { passive: false });

function setupAnnotationCanvas() {
  const cells = Array.from(readerStage.querySelectorAll('.reader-page-cell[data-page]'));
  if (cells.length === 0) {
    annotationCanvas = null;
    annotationContext = null;
    return;
  }

  cells.forEach((cell, index) => {
    const pageNumber = Number(cell.dataset.page || '1');
    const baseElement = cell.firstElementChild;
    if (!baseElement) {
      return;
    }

    const cacheKey = activeItem ? `${activeItem.id}:${pageNumber}` : null;
    const cachedCanvas = cacheKey ? persistentAnnotationCanvases.get(cacheKey) : null;

    const layer = document.createElement('div');
    layer.className = 'page-layer';
    const drawCanvas = cachedCanvas || document.createElement('canvas');
    if (!cachedCanvas) {
      drawCanvas.className = 'annotation-canvas';
      drawCanvas.dataset.page = String(pageNumber);
    }

    cell.innerHTML = '';
    layer.appendChild(baseElement);
    layer.appendChild(drawCanvas);
    cell.appendChild(layer);

    const initializeCanvas = () => {
      let cssWidth, cssHeight;
      if (baseElement.tagName === 'CANVAS') {
        const cssW = parseInt(baseElement.style.width, 10);
        const cssH = parseInt(baseElement.style.height, 10);
        cssWidth = cssW > 0 ? cssW : Math.max(1, Math.round(baseElement.clientWidth));
        cssHeight = cssH > 0 ? cssH : Math.max(1, Math.round(baseElement.clientHeight));
      } else {
        cssWidth = Math.max(1, Math.round(baseElement.clientWidth));
        cssHeight = Math.max(1, Math.round(baseElement.clientHeight));
      }

      if (cachedCanvas) {
        // ズームが変わってもピクセルデータは維持し、CSS表示サイズだけ更新する
        cachedCanvas.style.width = `${cssWidth}px`;
        cachedCanvas.style.height = `${cssHeight}px`;
        if (index === 0) {
          annotationCanvas = cachedCanvas;
          annotationContext = cachedCanvas.getContext('2d');
          activeAnnotationPage = pageNumber;
        }
        return;
      }

      let width, height;
      if (baseElement.tagName === 'CANVAS') {
        width = baseElement.width;
        height = baseElement.height;
        drawCanvas._imgDpr = null;
      } else {
        const dpr = window.devicePixelRatio || 1;
        width = Math.round(cssWidth * dpr);
        height = Math.round(cssHeight * dpr);
        drawCanvas._imgDpr = dpr;
      }
      drawCanvas.width = Math.max(1, width);
      drawCanvas.height = Math.max(1, height);
      drawCanvas.style.width = `${cssWidth}px`;
      drawCanvas.style.height = `${cssHeight}px`;

      const ctx = drawCanvas.getContext('2d');
      ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
      const key = getAnnotationKey(pageNumber);
      const pageData = key ? annotationStrokes.get(key) : null;
      if (pageData && pageData.ops.length > 0) {
        replayAnnotationOps(ctx, drawCanvas, pageData.ops);
      }

      bindDrawingEvents(drawCanvas);

      if (cacheKey) {
        persistentAnnotationCanvases.set(cacheKey, drawCanvas);
      }

      if (index === 0) {
        annotationCanvas = drawCanvas;
        annotationContext = ctx;
        activeAnnotationPage = pageNumber;
      }
    };

    if (baseElement.tagName === 'IMG' && !baseElement.complete) {
      baseElement.addEventListener('load', () => {
        requestAnimationFrame(initializeCanvas);
      }, { once: true });
      return;
    }

    requestAnimationFrame(initializeCanvas);
  });
}

function clearCurrentAnnotation() {
  if (!annotationCanvas || !annotationContext) {
    return;
  }

  annotationContext.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
  const key = getAnnotationKey(activeAnnotationPage);
  if (key) {
    annotationStrokes.delete(key);
    annotationRedoStacks.delete(key);
    deleteAnnotationFromDb(key);
    scheduleDriveAnnotationSync();
  }
}

function undoLastAnnotation() {
  const key = getAnnotationKey();
  if (!key) return;
  const data = annotationStrokes.get(key);
  if (!data || data.ops.length === 0) return;

  const removed = data.ops.pop();
  if (!annotationRedoStacks.has(key)) annotationRedoStacks.set(key, []);
  annotationRedoStacks.get(key).push(removed);

  if (annotationCanvas && annotationContext) {
    annotationContext.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
    if (data.ops.length > 0) {
      replayAnnotationOps(annotationContext, annotationCanvas, data.ops);
    }
    annotationContext.globalCompositeOperation = 'source-over';
  }

  saveAnnotationOpsToDb(key, data);
  scheduleDriveAnnotationSync();
}

function redoLastAnnotation() {
  const key = getAnnotationKey();
  if (!key) return;
  const redoStack = annotationRedoStacks.get(key);
  if (!redoStack || redoStack.length === 0) return;

  const op = redoStack.pop();
  getPageStrokes(key).ops.push(op);

  if (annotationCanvas && annotationContext) {
    annotationContext.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
    replayAnnotationOps(annotationContext, annotationCanvas, annotationStrokes.get(key).ops);
    annotationContext.globalCompositeOperation = 'source-over';
  }

  saveAnnotationOpsToDb(key, annotationStrokes.get(key));
  scheduleDriveAnnotationSync();
}

async function exportAnnotatedPdf() {
  if (!activeItem) return;
  if (!window.PDFLib) {
    alert('PDFライブラリが読み込まれていません。ページを再読み込みして再試行してください。');
    return;
  }
  if (exportAnnotatedPdfButton) exportAnnotatedPdfButton.disabled = true;
  try {
    const pdfDoc = await PDFLib.PDFDocument.create();

    if (activeItem.type === 'pdf') {
      const pdf = await getPdfDocument(activeItem);
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const container = document.createElement('div');
        container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
        document.body.appendChild(container);
        try {
          const canvas = await renderPdfPageToCanvas(pdf, pageNum, container, 2.0);
          const pageData = annotationStrokes.get(`${activeItem.id}:${pageNum}`);
          if (pageData && pageData.ops.length > 0) {
            replayAnnotationOps(canvas.getContext('2d'), canvas, pageData.ops);
          }
          const pngBytes = await new Promise((resolve) => {
            canvas.toBlob(async (blob) => resolve(new Uint8Array(await blob.arrayBuffer())), 'image/png');
          });
          const img = await pdfDoc.embedPng(pngBytes);
          const { width, height } = img.scale(0.5);
          const page = pdfDoc.addPage([width, height]);
          page.drawImage(img, { x: 0, y: 0, width, height });
        } finally {
          document.body.removeChild(container);
        }
      }
    } else {
      const imgEl = new Image();
      await new Promise((resolve) => { imgEl.onload = resolve; imgEl.src = activeItem.url; });
      const canvas = document.createElement('canvas');
      canvas.width = imgEl.naturalWidth;
      canvas.height = imgEl.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgEl, 0, 0);
      const pageData = annotationStrokes.get(`${activeItem.id}:1`);
      if (pageData && pageData.ops.length > 0) {
        replayAnnotationOps(ctx, canvas, pageData.ops);
      }
      const pngBytes = await new Promise((resolve) => {
        canvas.toBlob(async (blob) => resolve(new Uint8Array(await blob.arrayBuffer())), 'image/png');
      });
      const img = await pdfDoc.embedPng(pngBytes);
      const { width, height } = img.scale(1);
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(img, { x: 0, y: 0, width, height });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeItem.title}_注釈付き.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (err) {
    console.error('Export failed:', err);
    alert(`エクスポートに失敗しました: ${err.message}`);
  } finally {
    if (exportAnnotatedPdfButton) exportAnnotatedPdfButton.disabled = false;
  }
}

function updatePreviewCenterPage() {
  if (!activeItem || activeItem.type !== 'pdf') {
    return;
  }

  const pageElements = previewStage.querySelectorAll('.preview-page[data-page]');
  if (pageElements.length === 0) {
    return;
  }

  const stageRect = previewStage.getBoundingClientRect();
  const centerX = stageRect.left + stageRect.width / 2;
  const centerY = stageRect.top + stageRect.height / 2;
  let closestPage = null;

  const centerElement = document.elementFromPoint(centerX, centerY);
  if (centerElement) {
    const pageElement = centerElement.closest('.preview-page[data-page]');
    if (pageElement) {
      closestPage = Number(pageElement.dataset.page);
    }
  }

  if (!closestPage) {
    let closestDistance = Number.POSITIVE_INFINITY;
    const stageCenter = stageRect.top + stageRect.height / 2;
    pageElements.forEach((element) => {
      const pageNumber = Number(element.dataset.page);
      const rect = element.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const distance = Math.abs(elementCenter - stageCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestPage = pageNumber;
      }
    });
  }

  previewState.page = closestPage || 1;
  activeItem.lastPage = previewState.page;
  setPageLabel(previewState, previewPageLabel);
}

function schedulePreviewCenterPageUpdate() {
  if (previewScrollRafId !== null) {
    return;
  }

  previewScrollRafId = requestAnimationFrame(() => {
    previewScrollRafId = null;
    updatePreviewCenterPage();
  });
}

function bindPreviewTrackingEvents() {
  previewStage.addEventListener('scroll', schedulePreviewCenterPageUpdate);
  previewStage.addEventListener('touchmove', schedulePreviewCenterPageUpdate, { passive: true });
  previewSheet.addEventListener('scroll', schedulePreviewCenterPageUpdate, { passive: true });
  window.addEventListener('scroll', schedulePreviewCenterPageUpdate, { passive: true });
}

function startPreviewTrackingLoop() {
  if (previewTrackingLoopId !== null) {
    return;
  }

  const tick = () => {
    if (
      previewSheet.style.display === 'none' ||
      previewSheet.getAttribute('aria-hidden') === 'true' ||
      !activeItem ||
      activeItem.type !== 'pdf'
    ) {
      previewTrackingLoopId = null;
      return;
    }

    updatePreviewCenterPage();
    previewTrackingLoopId = requestAnimationFrame(tick);
  };

  previewTrackingLoopId = requestAnimationFrame(tick);
}

function stopPreviewTrackingLoop() {
  if (previewTrackingLoopId !== null) {
    cancelAnimationFrame(previewTrackingLoopId);
    previewTrackingLoopId = null;
  }
}

function scrollPreviewToPage(pageNumber) {
  const target = previewStage.querySelector(`.preview-page[data-page=\"${pageNumber}\"]`);
  if (!target) {
    return;
  }

  const targetCenter = target.offsetTop + target.offsetHeight / 2;
  const top = targetCenter - previewStage.clientHeight / 2;
  previewStage.scrollTop = Math.max(0, top);
}

async function renderPreviewPage() {
  if (!activeItem) {
    return;
  }

  if (activeItem.type === 'image') {
    previewState.page = 1;
    previewState.pageCount = 1;
    setPageLabel(previewState, previewPageLabel);
    renderImageToContainer(activeItem, previewStage);
    return;
  }

  const currentRenderVersion = ++previewRenderVersion;

  try {
    const pdf = await getPdfDocument(activeItem);
    previewState.pageCount = pdf.numPages;
    previewState.page = Math.max(1, Math.min(previewState.page, previewState.pageCount));
    setPageLabel(previewState, previewPageLabel);

    previewStage.innerHTML = '';

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      if (currentRenderVersion !== previewRenderVersion) {
        return;
      }

      const pageContainer = document.createElement('div');
      pageContainer.className = 'preview-page';
      pageContainer.dataset.page = String(pageNumber);
      previewStage.appendChild(pageContainer);
      await renderPdfPageToCanvas(pdf, pageNumber, pageContainer, 1.5 * previewScale);
    }

    scrollPreviewToPage(previewState.page);
    setTimeout(() => {
      updatePreviewCenterPage();
    }, 0);
  } catch (error) {
    console.error('Failed to render preview PDF.', error);
    previewStage.textContent = 'PDFプレビューを読み込めませんでした。';
    previewPageLabel.textContent = '- / -';
  }
}

async function renderReaderPage() {
  if (!activeItem) {
    return;
  }

  if (activeItem.type === 'image') {
    readerState.viewGroups = [[1]];
    readerState.page = 1;
    readerState.pageCount = 1;
    updateReaderPagerLabel(1);
    readerStage.innerHTML = '';
    const readerGroup = document.createElement('div');
    readerGroup.className = 'reader-group';
    const cell = document.createElement('div');
    cell.className = 'reader-page-cell';
    cell.dataset.page = '1';
    const image = document.createElement('img');
    image.src = activeItem.url;
    image.alt = activeItem.title;
    if (image) {
      image.style.maxHeight = 'none';
      image.style.width = `${Math.max(240, Math.round(860 * readerZoom))}px`;
      image.style.height = 'auto';
    }
    cell.appendChild(image);
    readerGroup.appendChild(cell);
    readerStage.appendChild(readerGroup);
    setupAnnotationCanvas();
    return;
  }

  try {
    const pdf = await getPdfDocument(activeItem);
    const viewGroups = buildViewGroups(pdf.numPages, readerLayoutMode);
    readerState.viewGroups = viewGroups;
    readerState.pageCount = viewGroups.length;

    if (readerPendingAnchorPage !== null) {
      readerState.page = findViewIndexByPage(viewGroups, readerPendingAnchorPage);
      readerPendingAnchorPage = null;
    } else {
      readerState.page = Math.max(1, Math.min(readerState.page, readerState.pageCount));
    }

    updateReaderPagerLabel(pdf.numPages);

    const currentGroup = viewGroups[readerState.page - 1] || [1];
    readerStage.innerHTML = '';
    const readerGroup = document.createElement('div');
    readerGroup.className = readerLayoutMode === 'scrollV'
      ? 'reader-group reader-group--vertical'
      : 'reader-group';

    for (const pageNumber of currentGroup) {
      const cell = document.createElement('div');
      cell.className = 'reader-page-cell';
      cell.dataset.page = String(pageNumber);
      const targetScale = 1.5 * readerZoom;
      const renderScale = Math.max(1.8, targetScale);
      const canvas = await renderPdfPageToCanvas(pdf, pageNumber, cell, renderScale);
      if (canvas) {
        // Keep render resolution high for clarity, but size by target zoom.
        const ratio = targetScale / renderScale;
        canvas.style.width = `${Math.max(1, Math.round(canvas.width * ratio))}px`;
        canvas.style.height = `${Math.max(1, Math.round(canvas.height * ratio))}px`;
      }
      readerGroup.appendChild(cell);
    }

    readerStage.appendChild(readerGroup);
    setupAnnotationCanvas();
  } catch (error) {
    console.error('Failed to render reader PDF.', error);
    readerStage.textContent = 'PDF表示を読み込めませんでした。';
    readerPrevButton.disabled = true;
    readerNextButton.disabled = true;
    readerPageLabel.textContent = '- / -';
  }
}

function openPreviewSheet(item) {
  activeItem = item;
  previewTitle.textContent = `プレビュー: ${item.title}`;

  previewState.page = item.lastPage || 1;
  previewState.pageCount = 1;

  backdrop.style.display = 'block';
  previewSheet.style.display = 'block';
  previewSheet.setAttribute('aria-hidden', 'false');

  requestAnimationFrame(() => {
    previewSheet.classList.add('open');
  });

  renderPreviewPage();
  startPreviewTrackingLoop();
}

function closePreviewSheet() {
  previewRenderVersion += 1;
  stopPreviewTrackingLoop();
  previewSheet.classList.remove('open');
  previewSheet.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    previewSheet.style.display = 'none';
    if (reader.style.display === 'none') {
      backdrop.style.display = 'none';
    }
  }, 220);
}

async function openReaderFromPreview() {
  if (!activeItem) {
    return;
  }

  activeItem.lastPage = previewState.page;
  await openReaderItem(activeItem, {
    anchorPage: previewState.page,
    resetZoom: true,
  });
}

function closeReader() {
  persistCurrentAnnotation();
  isDrawing = false;
  lastPoint = null;
  stopMetronome();
  stopTunerTone();
  stopMicTuner();
  setFloatingWindowVisible(metronomePanel, metronomeWindowToggle, false, 'メトロノーム');
  setFloatingWindowVisible(tunerPanel, tunerWindowToggle, false, 'チューナー');
  setReaderFocusMode(false);
  reader.style.display = 'none';
  reader.setAttribute('aria-hidden', 'true');
  setReaderPageLock(false);
  closePreviewSheet();
  renderReaderTabs();
}

async function renderPdfThumbnail(item, thumbEl) {
  if (pdfThumbCache.has(item.id)) {
    const img = document.createElement('img');
    img.src = pdfThumbCache.get(item.id);
    img.alt = item.title;
    thumbEl.innerHTML = '';
    thumbEl.appendChild(img);
    return;
  }
  try {
    const lib = await ensurePdfJs();
    let pdf = pdfCache.get(item.id);
    if (!pdf) {
      const buffer = await item.file.arrayBuffer();
      pdf = await lib.getDocument({ data: buffer }).promise;
      pdfCache.set(item.id, pdf);
    }
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.22 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    pdfThumbCache.set(item.id, dataUrl);
    if (thumbEl.isConnected) {
      const img = document.createElement('img');
      img.src = dataUrl;
      img.alt = item.title;
      thumbEl.innerHTML = '';
      thumbEl.appendChild(img);
    }
  } catch {
    // サムネイル生成失敗時は PDF マークのまま
  }
}

function composerSortKey(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 1] || parts[0] || '').toLowerCase();
}

function composerInitial(name) {
  const key = composerSortKey(name);
  if (!key) return '#';
  const ch = key[0].toUpperCase();
  return /[A-Z]/.test(ch) ? ch : '#';
}

function buildListRow(item) {
  const row = document.createElement('li');
  row.className = 'row';
  row.addEventListener('click', () => openPreviewSheet(item));

  const thumb = document.createElement('div');
  thumb.className = 'thumb';
  if (item.type === 'image') {
    const image = document.createElement('img');
    image.src = item.url;
    image.alt = `${item.title} サムネイル`;
    thumb.appendChild(image);
  } else {
    const mark = document.createElement('span');
    mark.className = 'pdf-mark';
    mark.textContent = 'PDF';
    thumb.appendChild(mark);
    renderPdfThumbnail(item, thumb);
  }

  const meta = document.createElement('div');
  meta.className = 'meta';

  const title = document.createElement('p');
  title.className = 'song-title';
  title.textContent = item.title;

  const author = document.createElement('p');
  author.className = 'author';
  author.textContent = getItemComposerLabel(item);

  const tag = document.createElement('span');
  tag.className = 'tag';
  try {
    tag.textContent = getItemFolderDisplayLabel(item);
  } catch {
    tag.textContent = '未分類';
  }

  meta.append(title, author, tag);

  const more = document.createElement('button');
  more.className = 'more';
  more.type = 'button';
  more.textContent = '…';
  more.setAttribute('aria-label', `${item.title} のメニュー`);
  more.setAttribute('aria-expanded', openLibraryMenuId === item.id ? 'true' : 'false');
  more.addEventListener('click', (event) => {
    event.stopPropagation();
    openLibraryMenuId = openLibraryMenuId === item.id ? null : item.id;
    renderList();
  });

  const menu = document.createElement('div');
  menu.className = 'library-menu';
  menu.hidden = openLibraryMenuId !== item.id;
  menu.addEventListener('click', (event) => { event.stopPropagation(); });

  const previewAction = document.createElement('button');
  previewAction.className = 'library-menu-button';
  previewAction.type = 'button';
  previewAction.textContent = 'プレビュー';
  previewAction.addEventListener('click', () => {
    openLibraryMenuId = null;
    renderList();
    openPreviewSheet(item);
  });

  const editAction = document.createElement('button');
  editAction.className = 'library-menu-button edit';
  editAction.type = 'button';
  editAction.textContent = '編集';
  editAction.addEventListener('click', () => {
    openLibraryMenuId = null;
    renderList();
    openEditSheet(item);
  });

  const favoriteAction = document.createElement('button');
  favoriteAction.className = 'library-menu-button';
  favoriteAction.type = 'button';
  favoriteAction.textContent = favoriteItemIds.includes(item.id) ? 'お気に入りから外す' : 'お気に入りに追加';
  favoriteAction.addEventListener('click', () => {
    toggleFavoriteItem(item.id, !favoriteItemIds.includes(item.id));
    openLibraryMenuId = null;
    renderList();
  });

  const moveFolderAction = document.createElement('button');
  moveFolderAction.className = 'library-menu-button';
  moveFolderAction.type = 'button';
  moveFolderAction.textContent = 'フォルダを変更';
  bindTap(moveFolderAction, () => {
    try {
      openLibraryMenuId = null;
      menu.hidden = true;
      openMoveFolderSheet(item);
    } catch (error) {
      console.error('Failed to open folder mover.', error);
      const detail = error?.stack || error?.message || 'unknown error';
      alert(`フォルダ変更画面を開けませんでした。\n${detail}`);
    }
  });

  const itemFolderIds = Array.isArray(item.folderIds) ? item.folderIds : [item.folderId || 'inbox'];
  const isInPractice = itemFolderIds.some((id) => id.includes('-practice'));
  const isInPast = itemFolderIds.some((id) => id.includes('-past'));

  const deleteAction = document.createElement('button');
  deleteAction.className = 'library-menu-button danger';
  deleteAction.type = 'button';
  deleteAction.textContent = '削除';
  deleteAction.addEventListener('click', () => {
    if (!window.confirm(`「${item.title}」を削除しますか？`)) return;
    deleteLibraryItem(item.id);
  });

  const menuItems = [previewAction, editAction, favoriteAction];
  if (isInPractice || isInPast) {
    const moveStatusAction = document.createElement('button');
    moveStatusAction.className = 'library-menu-button';
    moveStatusAction.type = 'button';
    moveStatusAction.textContent = isInPractice ? '過去の曲に移動' : '練習中に戻す';
    moveStatusAction.addEventListener('click', () => {
      moveItemToStatus(item, isInPractice ? 'past' : 'practice');
    });
    menuItems.push(moveStatusAction);
  }
  menuItems.push(moveFolderAction, deleteAction);
  menu.append(...menuItems);

  const isFav = favoriteItemIds.includes(item.id);
  const star = document.createElement('button');
  star.className = 'star-btn';
  star.type = 'button';
  star.textContent = isFav ? '★' : '☆';
  star.setAttribute('aria-label', isFav ? 'お気に入りから外す' : 'お気に入りに追加');
  star.classList.toggle('active', isFav);
  star.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavoriteItem(item.id);
  });

  row.append(thumb, meta, star, more, menu);
  return row;
}

function renderList() {
  if (isRenderingList) {
    return;
  }
  isRenderingList = true;
  try {
    scoreList.innerHTML = '';

    let visibleItems;
    try {
      visibleItems = getVisibleLibraryItems();
    } catch (error) {
      throw new Error(`renderList:getVisibleLibraryItems: ${error && error.message ? error.message : error}`);
    }

    try {
      const inComposerMode = activeFolderId === 'composer';
      scoreList.classList.toggle('composer-mode', inComposerMode);
      if (listArea) listArea.classList.toggle('has-index', inComposerMode);
      if (composerIndex) composerIndex.hidden = !inComposerMode;

      if (inComposerMode) {
        // Sort by composer last name, then title
        const sorted = [...visibleItems].sort((a, b) => {
          const ka = composerSortKey(a.composer);
          const kb = composerSortKey(b.composer);
          if (ka !== kb) return ka.localeCompare(kb, 'en');
          return (a.title || '').localeCompare(b.title || '', 'ja');
        });

        // Group by first letter of last name
        const groups = [];
        sorted.forEach((item) => {
          const letter = composerInitial(item.composer);
          const last = groups[groups.length - 1];
          if (!last || last.letter !== letter) {
            groups.push({ letter, items: [item] });
          } else {
            last.items.push(item);
          }
        });

        groups.forEach(({ letter, items: groupItems }) => {
          const header = document.createElement('li');
          header.className = 'section-header';
          header.id = `ci-${letter}`;
          header.textContent = letter;
          scoreList.appendChild(header);
          groupItems.forEach((item) => scoreList.appendChild(buildListRow(item)));
        });

        // Build index
        if (composerIndex) {
          composerIndex.innerHTML = '';
          groups.forEach(({ letter }) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ci-btn';
            btn.textContent = letter;
            btn.addEventListener('click', () => {
              const target = document.getElementById(`ci-${letter}`);
              if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            composerIndex.appendChild(btn);
          });
        }
      } else {
        visibleItems.forEach((item) => scoreList.appendChild(buildListRow(item)));
      }
    } catch (error) {
      throw new Error(`renderList:row-build: ${error && error.message ? error.message : error}`);
    }

    try {
      renderSidebar();
      renderSubFilter();
    } catch (error) {
      throw new Error(`renderList:renderSidebar: ${error && error.message ? error.message : error}`);
    }

    try {
      updateListVisibility(visibleItems);
    } catch (error) {
      throw new Error(`renderList:updateListVisibility: ${error && error.message ? error.message : error}`);
    }
  } finally {
    isRenderingList = false;
  }
}

function addFile(file) {
  if (!file) {
    return;
  }

  let stage = 'initial';
  try {
    stage = 'type-check';
    const fileName = file.name || '';
    const lowerName = fileName.toLowerCase();
    const fileType = file.type || '';
    const isPdf = fileType === 'application/pdf' || lowerName.endsWith('.pdf');
    const isImage =
      fileType.startsWith('image/') ||
      /\.(png|jpe?g|gif|webp|bmp|heic|heif)$/i.test(lowerName);

    if (!isPdf && !isImage) {
      stage = 'unsupported-file';
      alert('PDFまたは画像ファイルのみ追加できます。');
      return;
    }

    stage = 'duplicate-check';
    const duplicateItem = library.find((item) => isSameLibraryFile(item, file));
    if (duplicateItem) {
      stage = 'duplicate-found';
      alert(`「${duplicateItem.title}」はすでに追加されています。`);
      return;
    }

    stage = 'prepare-item';
    const title = createUniqueLibraryTitle(baseTitle(file.name));
    // Use effective folder (respects current category + sub-filter state)
    const rawTarget = getEffectiveFolderId();
    let targetFolderId;
    if (rawTarget === 'all' || rawTarget === 'favorites' || !getFolderById(rawTarget)) {
      targetFolderId = 'inbox';
    } else {
      const node = getFolderById(rawTarget);
      // セクション/グループフォルダ（すべて選択中など）は練習中サブフォルダへ
      if (node && (node.kind === 'section' || node.kind === 'group')) {
        const practiceId = `${rawTarget}-practice`;
        targetFolderId = getFolderById(practiceId) ? practiceId : rawTarget;
      } else {
        targetFolderId = rawTarget;
      }
    }

    const item = {
      id: createLocalId(),
      title,
      composer: '',
      type: isPdf ? 'pdf' : 'image',
      file,
      url: URL.createObjectURL(file),
      lastPage: 1,
      folderIds: [targetFolderId],
      folderId: targetFolderId,
    };

    stage = 'create-object-url';
    library.unshift(item);
    saveItemMetaToDb(item);
    savePdfToDb(item.id, file);

    stage = 'render-list';
    // お気に入りタブ中はアイテムが見えないので全体表示へ
    if (activeFolderId === 'favorites') {
      activeFolderId = 'all';
      activeStatusFilter = 'all';
      activeTypeFilter = 'all';
    }
    renderList();

    // Drive同期（未ログインの場合は何もしない）
    uploadPdfToDrive(item).catch((err) => console.error('Drive upload failed:', err));
  } catch (error) {
    console.error('Failed to add file.', error);
    const reason = error && error.message ? `\n(${error.message})` : '';
    alert(`楽譜の追加に失敗しました。\n(stage: ${stage})${reason}`);
    renderList();
  }
}

async function moveReaderPage(offset) {
  if (!activeItem || activeItem.type !== 'pdf') {
    return;
  }

  const next = readerState.page + offset;
  if (next < 1 || next > readerState.pageCount) {
    return;
  }

  const previousScrollableHeight = Math.max(1, readerStage.scrollHeight - readerStage.clientHeight);
  const previousScrollRatio = previousScrollableHeight > 0
    ? readerStage.scrollTop / previousScrollableHeight
    : 0;

  persistCurrentAnnotation();
  readerState.page = next;
  const group = readerState.viewGroups[readerState.page - 1] || [1];
  previewState.page = group[0];
  activeItem.lastPage = group[0];
  saveItemMetaToDb(activeItem);
  await renderReaderPage();

  requestAnimationFrame(() => {
    const nextScrollableHeight = Math.max(0, readerStage.scrollHeight - readerStage.clientHeight);
    readerStage.scrollTop = nextScrollableHeight * previousScrollRatio;
  });
}

function bindTap(button, handler) {
  if (!button) {
    return;
  }

  let touched = false;
  button.addEventListener('touchend', (event) => {
    event.preventDefault();
    touched = true;
    handler();
  }, { passive: false });
  button.addEventListener('click', () => {
    if (touched) {
      touched = false;
      return;
    }
    handler();
  });
}

fileInput.addEventListener('change', (event) => {
  const [file] = event.target.files;
  addFile(file);
  fileInput.value = '';
});

bindTap(readerPrevButton, () => moveReaderPage(-1));
bindTap(readerNextButton, () => moveReaderPage(1));
bindTap(focusPrevButton, () => moveReaderPage(-1));
bindTap(focusNextButton, () => moveReaderPage(1));
bindTap(openReaderButton, openReaderFromPreview);
bindTap(closePreviewButton, closePreviewSheet);
bindTap(closeEditButton, closeEditSheet);
bindTap(saveEditButton, saveEditSheet);

function positionComposerSuggestions() {
  const rect = editComposerInput.getBoundingClientRect();
  composerSuggestions.style.left = rect.left + 'px';
  composerSuggestions.style.width = rect.width + 'px';
  composerSuggestions.style.top = (rect.bottom + 4) + 'px';
  composerSuggestions.style.maxHeight = Math.min(240, Math.max(80, window.innerHeight - rect.bottom - 12)) + 'px';
}

let composerInputIsComposing = false;
let composerCompositionJustEnded = false;
let composerCompositionEndTimer = null;

editComposerInput.addEventListener('compositionstart', () => {
  composerInputIsComposing = true;
  composerCompositionJustEnded = false;
  clearTimeout(composerCompositionEndTimer);
});
editComposerInput.addEventListener('compositionend', () => {
  composerInputIsComposing = false;
  composerCompositionJustEnded = true;
  clearTimeout(composerCompositionEndTimer);
  // setTimeout(0) で次のイベントループ後にフラグを解除
  // Safari では compositionend → keydown の順で発火するため、
  // keydown が終わってからフラグを下げる
  composerCompositionEndTimer = setTimeout(() => { composerCompositionJustEnded = false; }, 0);
  showComposerSuggestions();
});

function showComposerSuggestions() {
  const results = searchComposers(editComposerInput.value);
  if (results.length === 0) {
    composerSuggestions.hidden = true;
    composerSuggestions.innerHTML = '';
    return;
  }
  composerSuggestions.innerHTML = '';
  results.forEach(({ name }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'composer-suggestion-item';
    btn.textContent = name;
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      editComposerInput.value = name;
      composerSuggestions.hidden = true;
      composerSuggestions.innerHTML = '';
      editComposerInput.focus();
    });
    composerSuggestions.appendChild(btn);
  });
  positionComposerSuggestions();
  composerSuggestions.hidden = false;
}

editComposerInput.addEventListener('input', () => {
  if (composerInputIsComposing) return;
  showComposerSuggestions();
});

editComposerInput.addEventListener('blur', () => {
  setTimeout(() => {
    composerSuggestions.hidden = true;
    composerSuggestions.innerHTML = '';
  }, 150);
});

editComposerInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    composerSuggestions.hidden = true;
    composerSuggestions.innerHTML = '';
  }
  // IME確定のEnterがdocumentレベルのsaveハンドラに届かないようにする
  // Safari: compositionend → keydown の順なので isComposing は既に false だが
  // composerCompositionJustEnded フラグで検知する
  if (e.key === 'Enter' && (e.isComposing || composerInputIsComposing || composerCompositionJustEnded)) {
    e.stopPropagation();
  }
});

bindTap(closeMoveFolderButton, closeMoveFolderSheet);
bindTap(moveFolderConfirmButton, confirmFolderPickerSelection);
bindTap(closeReaderButton, closeReader);
bindTap(readerTabAddButton, openLibraryHomeFromTabs);
bindTap(focusModeExitButton, toggleReaderFullscreen);
bindTap(focusModeCloseButton, closeReader);
bindTap(clearAnnotationButton, clearCurrentAnnotation);
bindTap(exportAnnotatedPdfButton, exportAnnotatedPdf);
bindTap(document.getElementById('stampSizeDecButton'), () => adjustStampSize(-1));
bindTap(document.getElementById('stampSizeIncButton'), () => adjustStampSize(1));
bindTap(toolRedPenButton, () => setActiveTool('redPen'));
bindTap(toolMarkerButton, () => setActiveTool('marker'));
bindTap(toolEraserButton, () => setActiveTool('eraser'));
bindTap(toolFingerButton, () => setActiveTool('finger'));
bindTap(toolAccidentalButton, () => setActiveTool('accidental'));
bindTap(toolBowingButton, () => setActiveTool('bowing'));
bindTap(toolTextButton, () => setActiveTool('textStamp'));
bindTap(toolRedCircleButton, () => setActiveTool('redCircle'));
bindTap(zoomOutButton, () => {
  setReaderZoom(snapZoomDown(readerZoom));
});
bindTap(zoomInButton, () => {
  setReaderZoom(snapZoomUp(readerZoom));
});
bindTap(zoomResetButton, () => {
  setReaderZoom(1);
});
bindTap(fullscreenToggleButton, toggleReaderFullscreen);
bindTap(metronomeMinusButton, () => {
  setMetronomeBpm(metronomeBpm - 1);
});
bindTap(metronomePlusButton, () => {
  setMetronomeBpm(metronomeBpm + 1);
});
bindTap(metronomeToggleButton, toggleMetronome);
bindTap(tunerGButton, () => {
  triggerTunerTone('G');
});
bindTap(tunerDButton, () => {
  triggerTunerTone('D');
});
bindTap(tunerAButton, () => {
  triggerTunerTone('A');
});
bindTap(tunerEButton, () => {
  triggerTunerTone('E');
});
bindTap(micTunerToggleButton, toggleMicTuner);

if (tunerThresholdSlider) {
  tunerThresholdSlider.addEventListener('input', (event) => {
    tunerThresholdPercent = Number(event.target.value) || 100;
    updateTunerThresholdUI();
  });
}
timeSignatureButtons.forEach((button) => {
  bindTap(button, () => {
    setMetronomeTimeSignature(button.dataset.timeSignature);
  });
});
rhythmButtons.forEach((button) => {
  bindTap(button, () => {
    setMetronomeRhythm(button.dataset.rhythm);
  });
});

backdrop.addEventListener('click', () => {
  openLibraryMenuId = null;
  closeFolderMenu();
  if (editSheet.style.display !== 'none' && editSheet.getAttribute('aria-hidden') !== 'true') {
    closeEditSheet();
    return;
  }
  if (moveFolderSheet.style.display !== 'none' && moveFolderSheet.getAttribute('aria-hidden') !== 'true') {
    closeMoveFolderSheet();
    return;
  }
  closePreviewSheet();
  closeReader();
});


document.addEventListener('click', (event) => {
  if (!scoreList.contains(event.target)) {
    if (openLibraryMenuId !== null) {
      openLibraryMenuId = null;
      renderList();
    }
  }

  if (openFolderMenuId !== null) {
    closeFolderMenu();
  }
});

document.addEventListener('keydown', (event) => {
  if (
    event.key === 'Enter' &&
    previewSheet.style.display !== 'none' &&
    previewSheet.getAttribute('aria-hidden') !== 'true'
  ) {
    event.preventDefault();
    openReaderFromPreview();
    return;
  }

  if (
    event.key === 'Enter' &&
    editSheet.style.display !== 'none' &&
    editSheet.getAttribute('aria-hidden') !== 'true'
  ) {
    const target = event.target;
    if (
      target instanceof HTMLInputElement &&
      (target === editTitleInput || target === editComposerInput)
    ) {
      if (event.isComposing) return; // IME確定のEnterは保存しない
      event.preventDefault();
      saveEditSheet();
      return;
    }
  }

  if (event.key === 'Escape') {
    if (moveFolderSheet.style.display !== 'none' && moveFolderSheet.getAttribute('aria-hidden') !== 'true') {
      event.preventDefault();
      closeMoveFolderSheet();
      return;
    }

    if (editSheet.style.display !== 'none' && editSheet.getAttribute('aria-hidden') !== 'true') {
      event.preventDefault();
      closeEditSheet();
      return;
    }


  }

  const readerHidden = reader.style.display === 'none' || reader.getAttribute('aria-hidden') === 'true';

  if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
    const t = event.target;
    const inTextField = t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement ||
      (t instanceof HTMLElement && t.isContentEditable);
    if (!inTextField) {
      event.preventDefault();
      if (!readerHidden) undoLastAnnotation();
      return;
    }
  }

  if (
    (event.ctrlKey || event.metaKey) && event.key === 'y' ||
    (event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z'
  ) {
    const t = event.target;
    const inTextField = t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement ||
      (t instanceof HTMLElement && t.isContentEditable);
    if (!inTextField) {
      event.preventDefault();
      if (!readerHidden) redoLastAnnotation();
      return;
    }
  }

  if (readerHidden) {
    return;
  }

  if (event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }

  const target = event.target;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  ) {
    return;
  }

  if (handleAnnotationShortcut(event)) {
    event.preventDefault();
    return;
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    moveReaderPage(-1);
    return;
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    moveReaderPage(1);
  }
});

bindPreviewTrackingEvents();
window.addEventListener('mouseup', stopDrawing);
window.addEventListener('touchend', stopDrawing);

applyActiveToolButtonState();
applyLayoutButtonState();
updateStampSizeUI();
setTunerTargetNote('A');
updateTunerNeedle(0, null);
updateMetronomeUI();
applyMetronomeOptionButtonState();
updateMetronomeBeatIndicator(0);
updateZoomLabel();
updateFullscreenButtonState();
updateTunerThresholdUI();
setFloatingWindowVisible(metronomePanel, metronomeWindowToggle, false, 'メトロノーム');
setFloatingWindowVisible(tunerPanel, tunerWindowToggle, false, 'チューナー');

// Fallback hooks for inline handlers in IAB environments.
const exposedOpenFolderPicker = openFolderPickerInternal;
const exposedGetFolderPath = getFolderPath;
const exposedAddScoreToFolder = addScoreToFolder;
const exposedGetScoresInFolder = getScoresInFolder;

window.setAnnotationStampImages = (sources) => {
  setAnnotationStampImages(sources);
};
window.setReaderLayoutModeFallback = (mode) => {
  setReaderLayoutMode(mode);
};
window.toggleMetronomeWindowFallback = () => {
  toggleMetronomeWindow();
};
window.toggleTunerWindowFallback = () => {
  toggleTunerWindow();
};
window.openFolderPicker = (callback, options) => {
  exposedOpenFolderPicker(callback, options);
};
window.getFolderPath = (folderId) => exposedGetFolderPath(folderId);
window.addScoreToFolder = (folderId, scoreObject) => exposedAddScoreToFolder(folderId, scoreObject);
window.getScoresInFolder = (folderId) => exposedGetScoresInFolder(folderId);

bindTap(layoutSingleButton, () => {
  setReaderLayoutMode('single');
});
bindTap(layoutSpreadABtn, () => {
  setReaderLayoutMode('spreadA');
});
bindTap(layoutSpreadBBtn, () => {
  setReaderLayoutMode('spreadB');
});
if (layoutScrollVBtn) {
  bindTap(layoutScrollVBtn, () => { setReaderLayoutMode('scrollV'); });
}
if (layoutScrollHBtn) {
  bindTap(layoutScrollHBtn, () => { setReaderLayoutMode('scrollH'); });
}
if (abPenBtn) bindTap(abPenBtn, () => setActiveTool('redPen'));
if (abMarkerBtn) bindTap(abMarkerBtn, () => setActiveTool('marker'));
if (abEraserBtn) bindTap(abEraserBtn, () => setActiveTool('eraser'));
if (abTextBtn) bindTap(abTextBtn, () => setActiveTool('textStamp'));
bindTap(metronomeWindowToggle, toggleMetronomeWindow);
bindTap(tunerWindowToggle, toggleTunerWindow);

if (metronomeRail && metronomeWeight) {
  const startDrag = (event) => {
    isMetronomeDragging = true;
    setMetronomeBpmFromPointer(event.clientY);
  };
  const moveDrag = (event) => {
    if (!isMetronomeDragging) {
      return;
    }
    event.preventDefault();
    setMetronomeBpmFromPointer(event.clientY);
  };
  const endDrag = () => {
    if (!isMetronomeDragging) {
      return;
    }
    isMetronomeDragging = false;
    resetMetronomeSwing();
  };

  metronomeWeight.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    startDrag(event);
  });
  metronomeRail.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    startDrag(event);
  });
  window.addEventListener('pointermove', moveDrag, { passive: false });
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
}

// iPad/IAB fallback: unify to pointerup to avoid touchend+click double-toggle.
function bindSingleToggle(button, handler) {
  if (!button) {
    return;
  }
  button.onclick = null;
  button.ontouchend = null;
  button.onpointerup = (event) => {
    event.preventDefault();
    handler();
  };
}

// metronomeWindowToggle / tunerWindowToggle は bindTap で処理済み。
// bindSingleToggle を重ねると pointerup + touchend の二重発火で即閉じる。

const mobileToolsToggle = document.getElementById('mobileToolsToggle');
const leftRail = document.querySelector('.left-rail');
if (mobileToolsToggle && leftRail) {
  mobileToolsToggle.addEventListener('click', () => {
    const isOpen = leftRail.classList.toggle('tools-open');
    mobileToolsToggle.textContent = isOpen ? 'ツール ▴' : 'ツール ▾';
  });
}

// Noto Music を事前ロードし、臨時記号の初回描画でフォールバックが出ないようにする
document.fonts.load('48px "Noto Music"', '♯♭♮').catch(() => {});

(async () => {
  try {
    await openLibraryDb();
    await loadLibraryFromDb();
  } catch (err) {
    console.warn('Library DB unavailable:', err);
  }
  loadFavoritesFromStorage();
  openAnnotationDb().then(loadAllAnnotationsFromDb).catch((err) => {
    console.warn('IndexedDB unavailable (private browsing?), annotations will not be persisted locally:', err);
  });
  renderSidebar();
  renderList();
})();

// --- Google Auth & Drive ---

const GOOGLE_CLIENT_ID = '514333808352-p9433pdp4dcd85u4ctoh1cfdibj6jsec.apps.googleusercontent.com';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_APP_FOLDER_NAME = 'PhiloScore';

let googleAccessToken = null;
let googleTokenExpiry = 0;
let googleTokenClient = null;
let driveAppFolderId = null;
let driveMetadataFileId = null;
let driveAnnotationFileId = null;
let driveAnnotationSyncTimer = null;

const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
const driveStatus = document.getElementById('driveStatus');

function isSignedIn() {
  return Boolean(googleAccessToken && Date.now() < googleTokenExpiry);
}

function renderAuthUI(statusText) {
  if (isSignedIn()) {
    loginButton.hidden = true;
    logoutButton.hidden = false;
    driveStatus.textContent = statusText ?? 'Drive同期済み';
  } else {
    loginButton.hidden = false;
    logoutButton.hidden = true;
    driveStatus.textContent = '';
  }
}

function handleTokenResponse(response) {
  if (response.error) {
    console.error('Auth error:', response.error);
    return;
  }
  googleAccessToken = response.access_token;
  googleTokenExpiry = Date.now() + (response.expires_in - 60) * 1000;
  renderAuthUI('読み込み中…');
  loadFromDrive();
}

function initGoogleAuth() {
  if (!window.google?.accounts?.oauth2) {
    return;
  }
  googleTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: handleTokenResponse,
  });
  bindTap(loginButton, () => googleTokenClient.requestAccessToken());
  bindTap(logoutButton, () => {
    google.accounts.oauth2.revoke(googleAccessToken, () => {});
    googleAccessToken = null;
    googleTokenExpiry = 0;
    driveAppFolderId = null;
    driveMetadataFileId = null;
    driveAnnotationFileId = null;
    renderAuthUI();
  });
}

async function driveApiFetch(method, path, options = {}) {
  if (!googleAccessToken) throw new Error('Not signed in');
  const res = await fetch(`https://www.googleapis.com${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${googleAccessToken}`,
      ...options.headers,
    },
    body: options.body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive API ${res.status}: ${text}`);
  }
  return res;
}

async function getOrCreateDriveAppFolder() {
  if (driveAppFolderId) return driveAppFolderId;

  const q = encodeURIComponent(`name='${DRIVE_APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const res = await driveApiFetch('GET', `/drive/v3/files?q=${q}&fields=files(id)&spaces=drive`);
  const data = await res.json();

  if (data.files?.length > 0) {
    driveAppFolderId = data.files[0].id;
    return driveAppFolderId;
  }

  const createRes = await driveApiFetch('POST', '/drive/v3/files', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: DRIVE_APP_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  const createData = await createRes.json();
  driveAppFolderId = createData.id;
  return driveAppFolderId;
}

async function uploadPdfToDrive(item) {
  if (!isSignedIn() || !item.file) return;
  try {
    const folderId = await getOrCreateDriveAppFolder();
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify({ name: item.file.name, parents: [folderId] })], { type: 'application/json' }));
    form.append('file', item.file);

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${googleAccessToken}` },
      body: form,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    const data = await res.json();
    item.driveFileId = data.id;
    await saveLibraryMetadata();
  } catch (err) {
    console.error('Drive upload failed:', err);
  }
}

async function saveLibraryMetadata() {
  if (!isSignedIn()) return;
  try {
    const folderId = await getOrCreateDriveAppFolder();
    const payload = JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      favoriteIds: favoriteItemIds.slice(),
      items: library.map(item => ({
        id: item.id,
        title: item.title,
        composer: item.composer || '',
        type: item.type,
        folderIds: item.folderIds || [item.folderId || 'inbox'],
        driveFileId: item.driveFileId || null,
        fileName: item.file?.name || `${item.title}.pdf`,
        fileLastModified: item.file?.lastModified || 0,
      })),
    });
    const blob = new Blob([payload], { type: 'application/json' });

    if (driveMetadataFileId) {
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${driveMetadataFileId}?uploadType=media`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${googleAccessToken}`, 'Content-Type': 'application/json' },
        body: blob,
      });
      return;
    }

    const q = encodeURIComponent(`name='_library.json' and '${folderId}' in parents and trashed=false`);
    const searchRes = await driveApiFetch('GET', `/drive/v3/files?q=${q}&fields=files(id)`);
    const searchData = await searchRes.json();

    if (searchData.files?.length > 0) {
      driveMetadataFileId = searchData.files[0].id;
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${driveMetadataFileId}?uploadType=media`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${googleAccessToken}`, 'Content-Type': 'application/json' },
        body: blob,
      });
    } else {
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify({ name: '_library.json', parents: [folderId] })], { type: 'application/json' }));
      form.append('file', blob);
      const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${googleAccessToken}` },
        body: form,
      });
      const createData = await createRes.json();
      driveMetadataFileId = createData.id;
    }
  } catch (err) {
    console.error('Save metadata failed:', err);
  }
}

async function loadFromDrive() {
  if (!isSignedIn()) return;
  try {
    renderAuthUI('読み込み中…');
    const folderId = await getOrCreateDriveAppFolder();

    const q = encodeURIComponent(`name='_library.json' and '${folderId}' in parents and trashed=false`);
    const searchRes = await driveApiFetch('GET', `/drive/v3/files?q=${q}&fields=files(id)`);
    const searchData = await searchRes.json();

    if (!searchData.files?.length) {
      renderAuthUI('データなし');
      return;
    }

    driveMetadataFileId = searchData.files[0].id;
    const metaRes = await driveApiFetch('GET', `/drive/v3/files/${driveMetadataFileId}?alt=media`);
    const meta = await metaRes.json();

    if (!meta.items?.length) {
      renderAuthUI('データなし');
      return;
    }

    // Restore favorites from Drive (authoritative source)
    if (Array.isArray(meta.favoriteIds)) {
      favoriteItemIds.length = 0;
      meta.favoriteIds.forEach((id) => favoriteItemIds.push(id));
      try { localStorage.setItem('gakufu-favorites', JSON.stringify(favoriteItemIds)); } catch {}
    }

    for (const saved of meta.items) {
      if (!saved.driveFileId) continue;
      const existingItem = library.find(i => i.id === saved.id);

      if (existingItem) {
        // Item is already in local library. Only fetch its file from Drive if
        // the local PDF is missing (e.g. the item predates the local-DB feature).
        // We intentionally keep the local folderIds — they are the source of truth.
        if (!existingItem.file) {
          try {
            const fileRes = await driveApiFetch('GET', `/drive/v3/files/${saved.driveFileId}?alt=media`);
            const blob = await fileRes.blob();
            const file = new File([blob], saved.fileName || `${saved.title}.pdf`, { type: blob.type || 'application/pdf', lastModified: saved.fileLastModified || 0 });
            existingItem.file = file;
            existingItem.url = URL.createObjectURL(file);
            if (!existingItem.driveFileId) existingItem.driveFileId = saved.driveFileId;
            saveItemMetaToDb(existingItem);
            savePdfToDb(existingItem.id, file);
          } catch (err) {
            console.error(`Failed to restore file for "${existingItem.title}":`, err);
          }
        }
        continue;
      }

      try {
        const fileRes = await driveApiFetch('GET', `/drive/v3/files/${saved.driveFileId}?alt=media`);
        const blob = await fileRes.blob();
        const file = new File([blob], saved.fileName || `${saved.title}.pdf`, { type: blob.type || 'application/pdf', lastModified: saved.fileLastModified || 0 });

        const newItem = {
          id: saved.id,
          title: saved.title,
          composer: saved.composer || '',
          type: saved.type || 'pdf',
          file,
          url: URL.createObjectURL(file),
          lastPage: 1,
          folderIds: saved.folderIds || ['inbox'],
          folderId: (saved.folderIds || ['inbox'])[0],
          driveFileId: saved.driveFileId,
        };
        library.push(newItem);
        saveItemMetaToDb(newItem);
        savePdfToDb(newItem.id, file);
      } catch (err) {
        console.error(`Failed to load "${saved.title}":`, err);
      }
    }

    await loadAnnotationsFromDrive(folderId);
    renderSidebar();
    renderList();
    renderAuthUI(`同期済み（${library.length}件）`);
  } catch (err) {
    console.error('Load from Drive failed:', err);
    renderAuthUI('同期失敗');
  }
}

function scheduleDriveAnnotationSync() {
  if (!isSignedIn()) return;
  if (driveAnnotationSyncTimer) clearTimeout(driveAnnotationSyncTimer);
  driveAnnotationSyncTimer = setTimeout(() => {
    saveAnnotationsToDrive().catch((err) => {
      console.error('Annotation Drive sync failed:', err);
      if (driveStatus) driveStatus.textContent = '同期失敗';
    });
  }, 5000);
}

async function saveAnnotationsToDrive() {
  if (!isSignedIn()) return;
  const folderId = await getOrCreateDriveAppFolder();
  const payload = JSON.stringify({
    version: 1,
    savedAt: new Date().toISOString(),
    annotations: Object.fromEntries(annotationStrokes),
  });
  const blob = new Blob([payload], { type: 'application/json' });

  const patch = async (fileId) => {
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${googleAccessToken}`, 'Content-Type': 'application/json' },
      body: blob,
    });
  };

  if (driveAnnotationFileId) {
    await patch(driveAnnotationFileId);
    return;
  }

  const q = encodeURIComponent(`name='_annotations.json' and '${folderId}' in parents and trashed=false`);
  const searchRes = await driveApiFetch('GET', `/drive/v3/files?q=${q}&fields=files(id)`);
  const searchData = await searchRes.json();

  if (searchData.files?.length > 0) {
    driveAnnotationFileId = searchData.files[0].id;
    await patch(driveAnnotationFileId);
  } else {
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify({ name: '_annotations.json', parents: [folderId] })], { type: 'application/json' }));
    form.append('file', blob);
    const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${googleAccessToken}` },
      body: form,
    });
    const createData = await createRes.json();
    driveAnnotationFileId = createData.id;
  }
}

async function loadAnnotationsFromDrive(folderId) {
  try {
    const q = encodeURIComponent(`name='_annotations.json' and '${folderId}' in parents and trashed=false`);
    const searchRes = await driveApiFetch('GET', `/drive/v3/files?q=${q}&fields=files(id)`);
    const searchData = await searchRes.json();
    if (!searchData.files?.length) return;

    driveAnnotationFileId = searchData.files[0].id;
    const res = await driveApiFetch('GET', `/drive/v3/files/${driveAnnotationFileId}?alt=media`);
    const data = await res.json();

    if (data.annotations) {
      for (const [key, value] of Object.entries(data.annotations)) {
        annotationStrokes.set(key, value);
        saveAnnotationOpsToDb(key, value);
      }
    }
  } catch (err) {
    console.error('Load annotations from Drive failed:', err);
  }
}

window.addEventListener('load', () => {
  initGoogleAuth();
});

(function preloadSymbolImages() {
  const svgEntries = [['circle', '#d32f2f']];
  svgEntries.forEach(([type, color]) => getOrCreateSymbolImage(type, color));

  const pngSrcs = ['./assets/Up-bow.svg', './assets/Down-bow.svg'];
  pngSrcs.forEach((src) => getPngImage(src));

  document.fonts.load('24px "Noto Music"').catch(() => {});
}());
