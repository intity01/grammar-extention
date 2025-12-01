use wasm_bindgen::prelude::*;
use std::collections::HashMap;

pub mod dat;
pub mod dict_builder;
pub mod thai_tokenizer;
pub mod japanese_tokenizer;
pub mod english_tokenizer;
pub mod rule_matcher;

use dat::DAT;
use thai_tokenizer::{tokenize_thai, tokenize_thai_greedy};
use japanese_tokenizer::{tokenize_japanese, tokenize_japanese_with_dict};
use english_tokenizer::tokenize_and_tag_english;
use rule_matcher::{RuleMatcher, load_rules_from_json};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Set panic hook for better error messages in the browser
#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
    log("Grammar Checker WebAssembly module initialized");
}

/// Log a message to the console
#[wasm_bindgen(js_name = logMessage)]
pub fn log_message(message: &str) {
    log(message);
}

/// Get the version of the Wasm module
#[wasm_bindgen(js_name = getVersion)]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Dictionary wrapper for Wasm
#[wasm_bindgen]
pub struct Dictionary {
    dat: DAT,
}

#[wasm_bindgen]
impl Dictionary {
    /// Load a dictionary from binary data
    #[wasm_bindgen(constructor)]
    pub fn new(data: &[u8]) -> Result<Dictionary, JsValue> {
        let mut cursor = std::io::Cursor::new(data);
        let dat = DAT::deserialize(&mut cursor)
            .map_err(|e| JsValue::from_str(&format!("Failed to load dictionary: {}", e)))?;
        
        log(&format!("Loaded dictionary: {} ({} entries)", dat.language, dat.entry_count));
        
        Ok(Dictionary { dat })
    }
    
    /// Look up a word in the dictionary
    /// Returns the word's metadata value (frequency/POS) or undefined if not found
    #[wasm_bindgen(js_name = lookupWord)]
    pub fn lookup_word(&self, word: &str) -> Option<u32> {
        self.dat.lookup(word)
    }
    
    /// Check if a word exists in the dictionary
    #[wasm_bindgen(js_name = containsWord)]
    pub fn contains_word(&self, word: &str) -> bool {
        self.dat.contains(word)
    }
    
    /// Get the language of this dictionary
    #[wasm_bindgen(js_name = getLanguage)]
    pub fn get_language(&self) -> String {
        self.dat.language.clone()
    }
    
    /// Get the number of entries in the dictionary
    #[wasm_bindgen(js_name = getEntryCount)]
    pub fn get_entry_count(&self) -> u32 {
        self.dat.entry_count
    }
    
    /// Get memory usage in bytes
    #[wasm_bindgen(js_name = getMemoryUsage)]
    pub fn get_memory_usage(&self) -> usize {
        self.dat.memory_usage()
    }
}

/// Dictionary manager that holds multiple dictionaries
#[wasm_bindgen]
pub struct DictionaryManager {
    dictionaries: HashMap<String, DAT>,
    rule_matchers: HashMap<String, RuleMatcher>,
}

#[wasm_bindgen]
impl DictionaryManager {
    /// Create a new dictionary manager
    #[wasm_bindgen(constructor)]
    pub fn new() -> DictionaryManager {
        log("Dictionary manager created");
        DictionaryManager {
            dictionaries: HashMap::new(),
            rule_matchers: HashMap::new(),
        }
    }
    
    /// Load a dictionary for a specific language
    #[wasm_bindgen(js_name = loadDictionary)]
    pub fn load_dictionary(&mut self, language: &str, data: &[u8]) -> Result<(), JsValue> {
        let mut cursor = std::io::Cursor::new(data);
        let dat = DAT::deserialize(&mut cursor)
            .map_err(|e| JsValue::from_str(&format!("Failed to load dictionary: {}", e)))?;
        
        log(&format!("Loaded {} dictionary ({} entries)", language, dat.entry_count));
        self.dictionaries.insert(language.to_string(), dat);
        
        Ok(())
    }
    
    /// Unload a dictionary to free memory
    #[wasm_bindgen(js_name = unloadDictionary)]
    pub fn unload_dictionary(&mut self, language: &str) -> bool {
        if self.dictionaries.remove(language).is_some() {
            log(&format!("Unloaded {} dictionary", language));
            true
        } else {
            false
        }
    }
    
    /// Look up a word in a specific language dictionary
    #[wasm_bindgen(js_name = lookupWord)]
    pub fn lookup_word(&self, language: &str, word: &str) -> Option<u32> {
        self.dictionaries.get(language)?.lookup(word)
    }
    
    /// Check if a word exists in a specific language dictionary
    #[wasm_bindgen(js_name = containsWord)]
    pub fn contains_word(&self, language: &str, word: &str) -> bool {
        self.dictionaries.get(language)
            .map(|dat| dat.contains(word))
            .unwrap_or(false)
    }
    
    /// Check if a dictionary is loaded for a language
    #[wasm_bindgen(js_name = isLoaded)]
    pub fn is_loaded(&self, language: &str) -> bool {
        self.dictionaries.contains_key(language)
    }
    
    /// Get total memory usage of all loaded dictionaries
    #[wasm_bindgen(js_name = getTotalMemoryUsage)]
    pub fn get_total_memory_usage(&self) -> usize {
        self.dictionaries.values()
            .map(|dat| dat.memory_usage())
            .sum()
    }
    
    /// Get list of loaded languages
    #[wasm_bindgen(js_name = getLoadedLanguages)]
    pub fn get_loaded_languages(&self) -> Vec<JsValue> {
        self.dictionaries.keys()
            .map(|lang| JsValue::from_str(lang))
            .collect()
    }
    
    /// Load grammar rules for a specific language from JSON string
    #[wasm_bindgen(js_name = loadGrammarRules)]
    pub fn load_grammar_rules(&mut self, language: &str, json_str: &str) -> Result<(), JsValue> {
        let rules = load_rules_from_json(json_str)
            .map_err(|e| JsValue::from_str(&e))?;
        
        let matcher = RuleMatcher::new(rules)
            .map_err(|e| JsValue::from_str(&e))?;
        
        let rule_count = matcher.rule_count();
        self.rule_matchers.insert(language.to_string(), matcher);
        
        log(&format!("Loaded {} grammar rules for {}", rule_count, language));
        Ok(())
    }
    
    /// Check if grammar rules are loaded for a language
    #[wasm_bindgen(js_name = hasGrammarRules)]
    pub fn has_grammar_rules(&self, language: &str) -> bool {
        self.rule_matchers.contains_key(language)
    }
    
    /// Match grammar rules against text for a specific language
    #[wasm_bindgen(js_name = matchRules)]
    pub fn match_rules(&self, text: &str, language: &str) -> Result<JsValue, JsValue> {
        let matcher = self.rule_matchers.get(language)
            .ok_or_else(|| JsValue::from_str(&format!("Grammar rules not loaded for {}", language)))?;
        
        let errors = matcher.match_rules(text, language);
        
        // Convert errors to JS array
        let js_errors = js_sys::Array::new();
        for error in errors {
            let obj = js_sys::Object::new();
            js_sys::Reflect::set(&obj, &"start".into(), &(error.start as u32).into())?;
            js_sys::Reflect::set(&obj, &"end".into(), &(error.end as u32).into())?;
            js_sys::Reflect::set(&obj, &"type".into(), &error.error_type.into())?;
            js_sys::Reflect::set(&obj, &"message".into(), &error.message.into())?;
            js_sys::Reflect::set(&obj, &"language".into(), &error.language.into())?;
            js_sys::Reflect::set(&obj, &"ruleId".into(), &error.rule_id.into())?;
            js_sys::Reflect::set(&obj, &"original".into(), &error.original.into())?;
            js_sys::Reflect::set(&obj, &"correction".into(), &error.correction.into())?;
            js_errors.push(&obj);
        }
        
        Ok(js_errors.into())
    }
    
    /// Tokenize Thai text using maximal matching with backtracking
    #[wasm_bindgen(js_name = tokenizeThai)]
    pub fn tokenize_thai(&self, text: &str) -> Result<JsValue, JsValue> {
        let dict = self.dictionaries.get("th")
            .ok_or_else(|| JsValue::from_str("Thai dictionary not loaded"))?;
        
        let tokens = tokenize_thai(text, dict);
        
        // Convert tokens to JS array
        let js_tokens = js_sys::Array::new();
        for token in tokens {
            let obj = js_sys::Object::new();
            js_sys::Reflect::set(&obj, &"text".into(), &token.text.into())?;
            js_sys::Reflect::set(&obj, &"start".into(), &(token.start as u32).into())?;
            js_sys::Reflect::set(&obj, &"end".into(), &(token.end as u32).into())?;
            js_sys::Reflect::set(&obj, &"isKnown".into(), &token.is_known.into())?;
            js_tokens.push(&obj);
        }
        
        Ok(js_tokens.into())
    }
    
    /// Tokenize Thai text using greedy maximal matching (faster, less accurate)
    #[wasm_bindgen(js_name = tokenizeThaiGreedy)]
    pub fn tokenize_thai_greedy(&self, text: &str) -> Result<JsValue, JsValue> {
        let dict = self.dictionaries.get("th")
            .ok_or_else(|| JsValue::from_str("Thai dictionary not loaded"))?;
        
        let tokens = tokenize_thai_greedy(text, dict);
        
        // Convert tokens to JS array
        let js_tokens = js_sys::Array::new();
        for token in tokens {
            let obj = js_sys::Object::new();
            js_sys::Reflect::set(&obj, &"text".into(), &token.text.into())?;
            js_sys::Reflect::set(&obj, &"start".into(), &(token.start as u32).into())?;
            js_sys::Reflect::set(&obj, &"end".into(), &(token.end as u32).into())?;
            js_sys::Reflect::set(&obj, &"isKnown".into(), &token.is_known.into())?;
            js_tokens.push(&obj);
        }
        
        Ok(js_tokens.into())
    }
    
    /// Tokenize Japanese text using character-type-based segmentation
    #[wasm_bindgen(js_name = tokenizeJapanese)]
    pub fn tokenize_japanese(&self, text: &str) -> Result<JsValue, JsValue> {
        // Try dictionary-based tokenization if Japanese dictionary is loaded
        let tokens = if let Some(dict) = self.dictionaries.get("ja") {
            tokenize_japanese_with_dict(text, dict)
                .map_err(|e| JsValue::from_str(&e))?
        } else {
            // Fall back to character-type-based tokenization
            tokenize_japanese(text)
                .map_err(|e| JsValue::from_str(&e))?
        };
        
        // Convert tokens to JS array
        let js_tokens = js_sys::Array::new();
        for token in tokens {
            let obj = js_sys::Object::new();
            js_sys::Reflect::set(&obj, &"text".into(), &token.text.into())?;
            js_sys::Reflect::set(&obj, &"start".into(), &(token.start as u32).into())?;
            js_sys::Reflect::set(&obj, &"end".into(), &(token.end as u32).into())?;
            js_sys::Reflect::set(&obj, &"pos".into(), &token.pos.into())?;
            
            // Convert features to JS array
            let js_features = js_sys::Array::new();
            for feature in token.features {
                js_features.push(&feature.into());
            }
            js_sys::Reflect::set(&obj, &"features".into(), &js_features)?;
            
            js_tokens.push(&obj);
        }
        
        Ok(js_tokens.into())
    }
    
    /// Tokenize English text with POS tagging
    #[wasm_bindgen(js_name = tokenizeEnglish)]
    pub fn tokenize_english(&self, text: &str) -> Result<JsValue, JsValue> {
        let dict = self.dictionaries.get("en");
        let tokens = tokenize_and_tag_english(text, dict);
        
        // Convert tokens to JS array
        let js_tokens = js_sys::Array::new();
        for token in tokens {
            let obj = js_sys::Object::new();
            js_sys::Reflect::set(&obj, &"text".into(), &token.text.into())?;
            js_sys::Reflect::set(&obj, &"start".into(), &(token.start as u32).into())?;
            js_sys::Reflect::set(&obj, &"end".into(), &(token.end as u32).into())?;
            js_sys::Reflect::set(&obj, &"pos".into(), &token.pos.into())?;
            js_tokens.push(&obj);
        }
        
        Ok(js_tokens.into())
    }
    
    /// Main analysis function - tokenizes text based on detected language
    /// Returns an object with tokens and language information
    #[wasm_bindgen(js_name = analyze)]
    pub fn analyze(&self, text: &str, language: &str) -> Result<JsValue, JsValue> {
        let start_time = js_sys::Date::now();
        
        let tokens = match language {
            "th" => {
                if !self.is_loaded("th") {
                    return Err(JsValue::from_str("Thai dictionary not loaded"));
                }
                let dict = self.dictionaries.get("th").unwrap();
                let thai_tokens = tokenize_thai(text, dict);
                
                // Convert to generic format
                let js_tokens = js_sys::Array::new();
                for token in thai_tokens {
                    let obj = js_sys::Object::new();
                    js_sys::Reflect::set(&obj, &"text".into(), &token.text.into())?;
                    js_sys::Reflect::set(&obj, &"start".into(), &(token.start as u32).into())?;
                    js_sys::Reflect::set(&obj, &"end".into(), &(token.end as u32).into())?;
                    js_sys::Reflect::set(&obj, &"isKnown".into(), &token.is_known.into())?;
                    js_tokens.push(&obj);
                }
                js_tokens
            },
            "ja" => {
                let dict = self.dictionaries.get("ja");
                let ja_tokens = if let Some(dict) = dict {
                    tokenize_japanese_with_dict(text, dict)
                        .map_err(|e| JsValue::from_str(&e))?
                } else {
                    tokenize_japanese(text)
                        .map_err(|e| JsValue::from_str(&e))?
                };
                
                let js_tokens = js_sys::Array::new();
                for token in ja_tokens {
                    let obj = js_sys::Object::new();
                    js_sys::Reflect::set(&obj, &"text".into(), &token.text.into())?;
                    js_sys::Reflect::set(&obj, &"start".into(), &(token.start as u32).into())?;
                    js_sys::Reflect::set(&obj, &"end".into(), &(token.end as u32).into())?;
                    js_sys::Reflect::set(&obj, &"pos".into(), &token.pos.into())?;
                    js_tokens.push(&obj);
                }
                js_tokens
            },
            "en" => {
                let dict = self.dictionaries.get("en");
                let en_tokens = tokenize_and_tag_english(text, dict);
                
                let js_tokens = js_sys::Array::new();
                for token in en_tokens {
                    let obj = js_sys::Object::new();
                    js_sys::Reflect::set(&obj, &"text".into(), &token.text.into())?;
                    js_sys::Reflect::set(&obj, &"start".into(), &(token.start as u32).into())?;
                    js_sys::Reflect::set(&obj, &"end".into(), &(token.end as u32).into())?;
                    js_sys::Reflect::set(&obj, &"pos".into(), &token.pos.into())?;
                    js_tokens.push(&obj);
                }
                js_tokens
            },
            _ => {
                return Err(JsValue::from_str(&format!("Unsupported language: {}", language)));
            }
        };
        
        // Apply grammar rules if loaded
        let js_errors = js_sys::Array::new();
        if let Some(matcher) = self.rule_matchers.get(language) {
            let errors = matcher.match_rules(text, language);
            
            for error in errors {
                let obj = js_sys::Object::new();
                js_sys::Reflect::set(&obj, &"start".into(), &(error.start as u32).into())?;
                js_sys::Reflect::set(&obj, &"end".into(), &(error.end as u32).into())?;
                js_sys::Reflect::set(&obj, &"type".into(), &error.error_type.into())?;
                js_sys::Reflect::set(&obj, &"message".into(), &error.message.into())?;
                js_sys::Reflect::set(&obj, &"language".into(), &error.language.into())?;
                js_sys::Reflect::set(&obj, &"ruleId".into(), &error.rule_id.into())?;
                js_sys::Reflect::set(&obj, &"original".into(), &error.original.into())?;
                js_sys::Reflect::set(&obj, &"correction".into(), &error.correction.into())?;
                js_errors.push(&obj);
            }
        }
        
        let end_time = js_sys::Date::now();
        let processing_time = end_time - start_time;
        
        // Create result object
        let result = js_sys::Object::new();
        js_sys::Reflect::set(&result, &"tokens".into(), &tokens)?;
        js_sys::Reflect::set(&result, &"errors".into(), &js_errors)?;
        js_sys::Reflect::set(&result, &"language".into(), &language.into())?;
        js_sys::Reflect::set(&result, &"processingTime".into(), &processing_time.into())?;
        
        Ok(result.into())
    }
}
