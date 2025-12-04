let wasm;

function addHeapObject(obj) {
  if (heap_next === heap.length) heap.push(heap.length + 1);
  const idx = heap_next;
  heap_next = heap[idx];

  heap[idx] = obj;
  return idx;
}

function dropObject(idx) {
  if (idx < 132) return;
  heap[idx] = heap_next;
  heap_next = idx;
}

function getArrayJsValueFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  const mem = getDataViewMemory0();
  const result = [];
  for (let i = ptr; i < ptr + 4 * len; i += 4) {
    result.push(takeObject(mem.getUint32(i, true)));
  }
  return result;
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
  if (
    cachedDataViewMemory0 === null ||
    cachedDataViewMemory0.buffer.detached === true ||
    (cachedDataViewMemory0.buffer.detached === undefined &&
      cachedDataViewMemory0.buffer !== wasm.memory.buffer)
  ) {
    cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
  }
  return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
  if (
    cachedUint8ArrayMemory0 === null ||
    cachedUint8ArrayMemory0.byteLength === 0
  ) {
    cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8ArrayMemory0;
}

function getObject(idx) {
  return heap[idx];
}

function handleError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    wasm.__wbindgen_export2(addHeapObject(e));
  }
}

let heap = new Array(128).fill(undefined);
heap.push(undefined, null, true, false);

let heap_next = heap.length;

function passArray8ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 1, 1) >>> 0;
  getUint8ArrayMemory0().set(arg, ptr / 1);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === undefined) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr = malloc(buf.length, 1) >>> 0;
    getUint8ArrayMemory0()
      .subarray(ptr, ptr + buf.length)
      .set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr;
  }

  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;

  const mem = getUint8ArrayMemory0();

  let offset = 0;

  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 0x7f) break;
    mem[ptr + offset] = code;
  }
  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, (len = offset + arg.length * 3), 1) >>> 0;
    const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
    const ret = cachedTextEncoder.encodeInto(arg, view);

    offset += ret.written;
    ptr = realloc(ptr, len, offset, 1) >>> 0;
  }

  WASM_VECTOR_LEN = offset;
  return ptr;
}

function takeObject(idx) {
  const ret = getObject(idx);
  dropObject(idx);
  return ret;
}

let cachedTextDecoder = new TextDecoder("utf-8", {
  ignoreBOM: true,
  fatal: true,
});
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
  numBytesDecoded += len;
  if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
    cachedTextDecoder = new TextDecoder("utf-8", {
      ignoreBOM: true,
      fatal: true,
    });
    cachedTextDecoder.decode();
    numBytesDecoded = len;
  }
  return cachedTextDecoder.decode(
    getUint8ArrayMemory0().subarray(ptr, ptr + len),
  );
}

const cachedTextEncoder = new TextEncoder();

if (!("encodeInto" in cachedTextEncoder)) {
  cachedTextEncoder.encodeInto = function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
      read: arg.length,
      written: buf.length,
    };
  };
}

let WASM_VECTOR_LEN = 0;

const DictionaryFinalization =
  typeof FinalizationRegistry === "undefined"
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
        wasm.__wbg_dictionary_free(ptr >>> 0, 1),
      );

const DictionaryManagerFinalization =
  typeof FinalizationRegistry === "undefined"
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) =>
        wasm.__wbg_dictionarymanager_free(ptr >>> 0, 1),
      );

/**
 * Dictionary wrapper for Wasm
 */
export class Dictionary {
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    DictionaryFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_dictionary_free(ptr, 0);
  }
  /**
   * Look up a word in the dictionary
   * Returns the word's metadata value (frequency/POS) or undefined if not found
   * @param {string} word
   * @returns {number | undefined}
   */
  lookupWord(word) {
    const ptr0 = passStringToWasm0(
      word,
      wasm.__wbindgen_export3,
      wasm.__wbindgen_export4,
    );
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.dictionary_lookupWord(this.__wbg_ptr, ptr0, len0);
    return ret === 0x100000001 ? undefined : ret;
  }
  /**
   * Get the language of this dictionary
   * @returns {string}
   */
  getLanguage() {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.dictionary_getLanguage(retptr, this.__wbg_ptr);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_export(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * Check if a word exists in the dictionary
   * @param {string} word
   * @returns {boolean}
   */
  containsWord(word) {
    const ptr0 = passStringToWasm0(
      word,
      wasm.__wbindgen_export3,
      wasm.__wbindgen_export4,
    );
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.dictionary_containsWord(this.__wbg_ptr, ptr0, len0);
    return ret !== 0;
  }
  /**
   * Get the number of entries in the dictionary
   * @returns {number}
   */
  getEntryCount() {
    const ret = wasm.dictionary_getEntryCount(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * Get memory usage in bytes
   * @returns {number}
   */
  getMemoryUsage() {
    const ret = wasm.dictionary_getMemoryUsage(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * Load a dictionary from binary data
   * @param {Uint8Array} data
   */
  constructor(data) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_export3);
      const len0 = WASM_VECTOR_LEN;
      wasm.dictionary_new(retptr, ptr0, len0);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
      if (r2) {
        throw takeObject(r1);
      }
      this.__wbg_ptr = r0 >>> 0;
      DictionaryFinalization.register(this, this.__wbg_ptr, this);
      return this;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
if (Symbol.dispose)
  Dictionary.prototype[Symbol.dispose] = Dictionary.prototype.free;

/**
 * Dictionary manager that holds multiple dictionaries
 */
export class DictionaryManager {
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    DictionaryManagerFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_dictionarymanager_free(ptr, 0);
  }
  /**
   * Look up a word in a specific language dictionary
   * @param {string} language
   * @param {string} word
   * @returns {number | undefined}
   */
  lookupWord(language, word) {
    const ptr0 = passStringToWasm0(
      language,
      wasm.__wbindgen_export3,
      wasm.__wbindgen_export4,
    );
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(
      word,
      wasm.__wbindgen_export3,
      wasm.__wbindgen_export4,
    );
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.dictionarymanager_lookupWord(
      this.__wbg_ptr,
      ptr0,
      len0,
      ptr1,
      len1,
    );
    return ret === 0x100000001 ? undefined : ret;
  }
  /**
   * Match grammar rules against text for a specific language
   * @param {string} text
   * @param {string} language
   * @returns {any}
   */
  matchRules(text, language) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      const ptr0 = passStringToWasm0(
        text,
        wasm.__wbindgen_export3,
        wasm.__wbindgen_export4,
      );
      const len0 = WASM_VECTOR_LEN;
      const ptr1 = passStringToWasm0(
        language,
        wasm.__wbindgen_export3,
        wasm.__wbindgen_export4,
      );
      const len1 = WASM_VECTOR_LEN;
      wasm.dictionarymanager_matchRules(
        retptr,
        this.__wbg_ptr,
        ptr0,
        len0,
        ptr1,
        len1,
      );
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
      if (r2) {
        throw takeObject(r1);
      }
      return takeObject(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   * Check if a word exists in a specific language dictionary
   * @param {string} language
   * @param {string} word
   * @returns {boolean}
   */
  containsWord(language, word) {
    const ptr0 = passStringToWasm0(
      language,
      wasm.__wbindgen_export3,
      wasm.__wbindgen_export4,
    );
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(
      word,
      wasm.__wbindgen_export3,
      wasm.__wbindgen_export4,
    );
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.dictionarymanager_containsWord(
      this.__wbg_ptr,
      ptr0,
      len0,
      ptr1,
      len1,
    );
    return ret !== 0;
  }
  /**
   * Tokenize Thai text using maximal matching with backtracking
   * @param {string} text
   * @returns {any}
   */
  tokenizeThai(text) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      const ptr0 = passStringToWasm0(
        text,
        wasm.__wbindgen_export3,
        wasm.__wbindgen_export4,
      );
      const len0 = WASM_VECTOR_LEN;
      wasm.dictionarymanager_tokenizeThai(retptr, this.__wbg_ptr, ptr0, len0);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
      if (r2) {
        throw takeObject(r1);
      }
      return takeObject(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   * Load a dictionary for a specific language
   * @param {string} language
   * @param {Uint8Array} data
   */
  loadDictionary(language, data) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      const ptr0 = passStringToWasm0(
        language,
        wasm.__wbindgen_export3,
        wasm.__wbindgen_export4,
      );
      const len0 = WASM_VECTOR_LEN;
      const ptr1 = passArray8ToWasm0(data, wasm.__wbindgen_export3);
      const len1 = WASM_VECTOR_LEN;
      wasm.dictionarymanager_loadDictionary(
        retptr,
        this.__wbg_ptr,
        ptr0,
        len0,
        ptr1,
        len1,
      );
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      if (r1) {
        throw takeObject(r0);
      }
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   * Tokenize English text with POS tagging
   * @param {string} text
   * @returns {any}
   */
  tokenizeEnglish(text) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      const ptr0 = passStringToWasm0(
        text,
        wasm.__wbindgen_export3,
        wasm.__wbindgen_export4,
      );
      const len0 = WASM_VECTOR_LEN;
      wasm.dictionarymanager_tokenizeEnglish(
        retptr,
        this.__wbg_ptr,
        ptr0,
        len0,
      );
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
      if (r2) {
        throw takeObject(r1);
      }
      return takeObject(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   * Check if grammar rules are loaded for a language
   * @param {string} language
   * @returns {boolean}
   */
  hasGrammarRules(language) {
    const ptr0 = passStringToWasm0(
      language,
      wasm.__wbindgen_export3,
      wasm.__wbindgen_export4,
    );
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.dictionarymanager_hasGrammarRules(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
    return ret !== 0;
  }
  /**
   * Tokenize Japanese text using character-type-based segmentation
   * @param {string} text
   * @returns {any}
   */
  tokenizeJapanese(text) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      const ptr0 = passStringToWasm0(
        text,
        wasm.__wbindgen_export3,
        wasm.__wbindgen_export4,
      );
      const len0 = WASM_VECTOR_LEN;
      wasm.dictionarymanager_tokenizeJapanese(
        retptr,
        this.__wbg_ptr,
        ptr0,
        len0,
      );
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
      if (r2) {
        throw takeObject(r1);
      }
      return takeObject(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   * Unload a dictionary to free memory
   * @param {string} language
   * @returns {boolean}
   */
  unloadDictionary(language) {
    const ptr0 = passStringToWasm0(
      language,
      wasm.__wbindgen_export3,
      wasm.__wbindgen_export4,
    );
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.dictionarymanager_unloadDictionary(
      this.__wbg_ptr,
      ptr0,
      len0,
    );
    return ret !== 0;
  }
  /**
   * Load grammar rules for a specific language from JSON string
   * @param {string} language
   * @param {string} json_str
   */
  loadGrammarRules(language, json_str) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      const ptr0 = passStringToWasm0(
        language,
        wasm.__wbindgen_export3,
        wasm.__wbindgen_export4,
      );
      const len0 = WASM_VECTOR_LEN;
      const ptr1 = passStringToWasm0(
        json_str,
        wasm.__wbindgen_export3,
        wasm.__wbindgen_export4,
      );
      const len1 = WASM_VECTOR_LEN;
      wasm.dictionarymanager_loadGrammarRules(
        retptr,
        this.__wbg_ptr,
        ptr0,
        len0,
        ptr1,
        len1,
      );
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      if (r1) {
        throw takeObject(r0);
      }
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   * Get list of loaded languages
   * @returns {any[]}
   */
  getLoadedLanguages() {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.dictionarymanager_getLoadedLanguages(retptr, this.__wbg_ptr);
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      var v1 = getArrayJsValueFromWasm0(r0, r1).slice();
      wasm.__wbindgen_export(r0, r1 * 4, 4);
      return v1;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   * Tokenize Thai text using greedy maximal matching (faster, less accurate)
   * @param {string} text
   * @returns {any}
   */
  tokenizeThaiGreedy(text) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      const ptr0 = passStringToWasm0(
        text,
        wasm.__wbindgen_export3,
        wasm.__wbindgen_export4,
      );
      const len0 = WASM_VECTOR_LEN;
      wasm.dictionarymanager_tokenizeThaiGreedy(
        retptr,
        this.__wbg_ptr,
        ptr0,
        len0,
      );
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
      if (r2) {
        throw takeObject(r1);
      }
      return takeObject(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   * Get total memory usage of all loaded dictionaries
   * @returns {number}
   */
  getTotalMemoryUsage() {
    const ret = wasm.dictionarymanager_getTotalMemoryUsage(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * Create a new dictionary manager
   */
  constructor() {
    const ret = wasm.dictionarymanager_new();
    this.__wbg_ptr = ret >>> 0;
    DictionaryManagerFinalization.register(this, this.__wbg_ptr, this);
    return this;
  }
  /**
   * Main analysis function - tokenizes text based on detected language
   * Returns an object with tokens and language information
   * @param {string} text
   * @param {string} language
   * @returns {any}
   */
  analyze(text, language) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      const ptr0 = passStringToWasm0(
        text,
        wasm.__wbindgen_export3,
        wasm.__wbindgen_export4,
      );
      const len0 = WASM_VECTOR_LEN;
      const ptr1 = passStringToWasm0(
        language,
        wasm.__wbindgen_export3,
        wasm.__wbindgen_export4,
      );
      const len1 = WASM_VECTOR_LEN;
      wasm.dictionarymanager_analyze(
        retptr,
        this.__wbg_ptr,
        ptr0,
        len0,
        ptr1,
        len1,
      );
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
      var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
      if (r2) {
        throw takeObject(r1);
      }
      return takeObject(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   * Check if a dictionary is loaded for a language
   * @param {string} language
   * @returns {boolean}
   */
  isLoaded(language) {
    const ptr0 = passStringToWasm0(
      language,
      wasm.__wbindgen_export3,
      wasm.__wbindgen_export4,
    );
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.dictionarymanager_isLoaded(this.__wbg_ptr, ptr0, len0);
    return ret !== 0;
  }
}
if (Symbol.dispose)
  DictionaryManager.prototype[Symbol.dispose] =
    DictionaryManager.prototype.free;

/**
 * Get the version of the Wasm module
 * @returns {string}
 */
export function getVersion() {
  let deferred1_0;
  let deferred1_1;
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    wasm.getVersion(retptr);
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
    deferred1_0 = r0;
    deferred1_1 = r1;
    return getStringFromWasm0(r0, r1);
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
    wasm.__wbindgen_export(deferred1_0, deferred1_1, 1);
  }
}

export function init() {
  wasm.init();
}

/**
 * Log a message to the console
 * @param {string} message
 */
export function logMessage(message) {
  const ptr0 = passStringToWasm0(
    message,
    wasm.__wbindgen_export3,
    wasm.__wbindgen_export4,
  );
  const len0 = WASM_VECTOR_LEN;
  wasm.logMessage(ptr0, len0);
}

const EXPECTED_RESPONSE_TYPES = new Set(["basic", "cors", "default"]);

async function __wbg_load(module, imports) {
  if (typeof Response === "function" && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === "function") {
      try {
        return await WebAssembly.instantiateStreaming(module, imports);
      } catch (e) {
        const validResponse =
          module.ok && EXPECTED_RESPONSE_TYPES.has(module.type);

        if (
          validResponse &&
          module.headers.get("Content-Type") !== "application/wasm"
        ) {
          console.warn(
            "`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",
            e,
          );
        } else {
          throw e;
        }
      }
    }

    const bytes = await module.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
  } else {
    const instance = await WebAssembly.instantiate(module, imports);

    if (instance instanceof WebAssembly.Instance) {
      return { instance, module };
    } else {
      return instance;
    }
  }
}

function __wbg_get_imports() {
  const imports = {};
  imports.wbg = {};
  imports.wbg.__wbg___wbindgen_throw_dd24417ed36fc46e = function (arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
  };
  imports.wbg.__wbg_error_7534b8e9a36f1ab4 = function (arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
      deferred0_0 = arg0;
      deferred0_1 = arg1;
      console.error(getStringFromWasm0(arg0, arg1));
    } finally {
      wasm.__wbindgen_export(deferred0_0, deferred0_1, 1);
    }
  };
  imports.wbg.__wbg_log_a720b8e551fa05a3 = function (arg0, arg1) {
    console.log(getStringFromWasm0(arg0, arg1));
  };
  imports.wbg.__wbg_new_1ba21ce319a06297 = function () {
    const ret = new Object();
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_new_25f239778d6112b9 = function () {
    const ret = new Array();
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_new_8a6f238a6ece86ea = function () {
    const ret = new Error();
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_now_69d776cd24f5215b = function () {
    const ret = Date.now();
    return ret;
  };
  imports.wbg.__wbg_push_7d9be8f38fc13975 = function (arg0, arg1) {
    const ret = getObject(arg0).push(getObject(arg1));
    return ret;
  };
  imports.wbg.__wbg_set_781438a03c0c3c81 = function () {
    return handleError(function (arg0, arg1, arg2) {
      const ret = Reflect.set(
        getObject(arg0),
        getObject(arg1),
        getObject(arg2),
      );
      return ret;
    }, arguments);
  };
  imports.wbg.__wbg_stack_0ed75d68575b0f3c = function (arg0, arg1) {
    const ret = getObject(arg1).stack;
    const ptr1 = passStringToWasm0(
      ret,
      wasm.__wbindgen_export3,
      wasm.__wbindgen_export4,
    );
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
  };
  imports.wbg.__wbg_warn_6e567d0d926ff881 = function (arg0) {
    console.warn(getObject(arg0));
  };
  imports.wbg.__wbindgen_cast_2241b6af4c4b2941 = function (arg0, arg1) {
    // Cast intrinsic for `Ref(String) -> Externref`.
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
  };
  imports.wbg.__wbindgen_cast_d6cd19b81560fd6e = function (arg0) {
    // Cast intrinsic for `F64 -> Externref`.
    const ret = arg0;
    return addHeapObject(ret);
  };
  imports.wbg.__wbindgen_object_drop_ref = function (arg0) {
    takeObject(arg0);
  };

  return imports;
}

function __wbg_finalize_init(instance, module) {
  wasm = instance.exports;
  __wbg_init.__wbindgen_wasm_module = module;
  cachedDataViewMemory0 = null;
  cachedUint8ArrayMemory0 = null;

  wasm.__wbindgen_start();
  return wasm;
}

function initSync(module) {
  if (wasm !== undefined) return wasm;

  if (typeof module !== "undefined") {
    if (Object.getPrototypeOf(module) === Object.prototype) {
      ({ module } = module);
    } else {
      console.warn(
        "using deprecated parameters for `initSync()`; pass a single object instead",
      );
    }
  }

  const imports = __wbg_get_imports();
  if (!(module instanceof WebAssembly.Module)) {
    module = new WebAssembly.Module(module);
  }
  const instance = new WebAssembly.Instance(module, imports);
  return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
  if (wasm !== undefined) return wasm;

  if (typeof module_or_path !== "undefined") {
    if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
      ({ module_or_path } = module_or_path);
    } else {
      console.warn(
        "using deprecated parameters for the initialization function; pass a single object instead",
      );
    }
  }

  if (typeof module_or_path === "undefined") {
    module_or_path = new URL("grammar_checker_wasm_bg.wasm", import.meta.url);
  }
  const imports = __wbg_get_imports();

  if (
    typeof module_or_path === "string" ||
    (typeof Request === "function" && module_or_path instanceof Request) ||
    (typeof URL === "function" && module_or_path instanceof URL)
  ) {
    module_or_path = fetch(module_or_path);
  }

  const { instance, module } = await __wbg_load(await module_or_path, imports);

  return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
