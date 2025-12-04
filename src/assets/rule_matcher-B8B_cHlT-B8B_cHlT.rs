use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Grammar rule structure matching the JSON format
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GrammarRule {
    pub id: String,
    pub language: String,
    pub pattern: String,
    #[serde(rename = "errorType")]
    pub error_type: String,
    pub message: String,
    pub correction: String,
    pub severity: String,
    pub enabled: bool,
}

/// Grammar error detected by rule matching
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GrammarError {
    pub start: usize,
    pub end: usize,
    pub error_type: String,
    pub message: String,
    pub language: String,
    pub rule_id: String,
    pub original: String,
    pub correction: String,
}

/// Rule matcher with compiled regex cache
pub struct RuleMatcher {
    rules: Vec<GrammarRule>,
    regex_cache: HashMap<String, Regex>,
}

impl RuleMatcher {
    /// Create a new rule matcher from a list of rules
    pub fn new(rules: Vec<GrammarRule>) -> Result<Self, String> {
        let mut matcher = RuleMatcher {
            rules: Vec::new(),
            regex_cache: HashMap::new(),
        };
        
        // Compile and cache all regex patterns
        for rule in rules {
            if rule.enabled {
                // Try to compile the regex pattern
                match Regex::new(&rule.pattern) {
                    Ok(regex) => {
                        matcher.regex_cache.insert(rule.id.clone(), regex);
                        matcher.rules.push(rule);
                    }
                    Err(e) => {
                        // Log error but continue with other rules
                        #[cfg(target_arch = "wasm32")]
                        {
                            web_sys::console::warn_1(&format!(
                                "Failed to compile regex for rule {}: {}",
                                rule.id, e
                            ).into());
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        {
                            eprintln!("Failed to compile regex for rule {}: {}", rule.id, e);
                        }
                    }
                }
            }
        }
        
        Ok(matcher)
    }
    
    /// Match rules against text and return grammar errors
    pub fn match_rules(&self, text: &str, language: &str) -> Vec<GrammarError> {
        let mut errors = Vec::new();
        
        // Apply each rule that matches the language
        for rule in &self.rules {
            if rule.language != language {
                continue;
            }
            
            if let Some(regex) = self.regex_cache.get(&rule.id) {
                // Find all matches for this rule
                for mat in regex.find_iter(text) {
                    let matched_text = mat.as_str();
                    
                    // Generate correction
                    let correction = self.generate_correction(&rule, matched_text, &mat);
                    
                    errors.push(GrammarError {
                        start: mat.start(),
                        end: mat.end(),
                        error_type: rule.error_type.clone(),
                        message: rule.message.clone(),
                        language: rule.language.clone(),
                        rule_id: rule.id.clone(),
                        original: matched_text.to_string(),
                        correction,
                    });
                }
            }
        }
        
        errors
    }
    
    /// Generate correction for a matched error
    fn generate_correction(&self, rule: &GrammarRule, matched_text: &str, _mat: &regex::Match) -> String {
        // Check if correction contains capture group references
        if rule.correction.contains('$') {
            // Use regex replacement with capture groups
            if let Some(regex) = self.regex_cache.get(&rule.id) {
                return regex.replace(matched_text, rule.correction.as_str()).to_string();
            }
        }
        
        // Simple replacement
        rule.correction.clone()
    }
    
    /// Get the number of loaded rules
    pub fn rule_count(&self) -> usize {
        self.rules.len()
    }
    
    /// Get rules for a specific language
    pub fn get_rules_for_language(&self, language: &str) -> Vec<&GrammarRule> {
        self.rules.iter()
            .filter(|rule| rule.language == language)
            .collect()
    }
}

/// Load grammar rules from JSON string
pub fn load_rules_from_json(json_str: &str) -> Result<Vec<GrammarRule>, String> {
    #[derive(Deserialize)]
    struct RulesFile {
        rules: Vec<GrammarRule>,
    }
    
    let rules_file: RulesFile = serde_json::from_str(json_str)
        .map_err(|e| format!("Failed to parse rules JSON: {}", e))?;
    
    Ok(rules_file.rules)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_rule_matcher_creation() {
        let rules = vec![
            GrammarRule {
                id: "test_001".to_string(),
                language: "en".to_string(),
                pattern: r"\btest\b".to_string(),
                error_type: "test".to_string(),
                message: "Test error".to_string(),
                correction: "fixed".to_string(),
                severity: "error".to_string(),
                enabled: true,
            }
        ];
        
        let matcher = RuleMatcher::new(rules).unwrap();
        assert_eq!(matcher.rule_count(), 1);
    }
    
    #[test]
    fn test_simple_pattern_matching() {
        let rules = vec![
            GrammarRule {
                id: "test_001".to_string(),
                language: "en".to_string(),
                pattern: r"\btest\b".to_string(),
                error_type: "test".to_string(),
                message: "Test error".to_string(),
                correction: "fixed".to_string(),
                severity: "error".to_string(),
                enabled: true,
            }
        ];
        
        let matcher = RuleMatcher::new(rules).unwrap();
        let errors = matcher.match_rules("This is a test sentence", "en");
        
        assert_eq!(errors.len(), 1);
        assert_eq!(errors[0].original, "test");
        assert_eq!(errors[0].correction, "fixed");
    }
    
    #[test]
    fn test_language_filtering() {
        let rules = vec![
            GrammarRule {
                id: "en_001".to_string(),
                language: "en".to_string(),
                pattern: r"\btest\b".to_string(),
                error_type: "test".to_string(),
                message: "English error".to_string(),
                correction: "fixed".to_string(),
                severity: "error".to_string(),
                enabled: true,
            },
            GrammarRule {
                id: "th_001".to_string(),
                language: "th".to_string(),
                pattern: "ทดสอบ".to_string(),
                error_type: "test".to_string(),
                message: "Thai error".to_string(),
                correction: "แก้ไข".to_string(),
                severity: "error".to_string(),
                enabled: true,
            }
        ];
        
        let matcher = RuleMatcher::new(rules).unwrap();
        
        // Should only match English rule
        let errors = matcher.match_rules("This is a test", "en");
        assert_eq!(errors.len(), 1);
        assert_eq!(errors[0].language, "en");
        
        // Should only match Thai rule
        let errors = matcher.match_rules("นี่คือการทดสอบ", "th");
        assert_eq!(errors.len(), 1);
        assert_eq!(errors[0].language, "th");
    }
    
    #[test]
    fn test_capture_group_replacement() {
        let rules = vec![
            GrammarRule {
                id: "en_001".to_string(),
                language: "en".to_string(),
                pattern: r"\b(could|should|would)\s+of\b".to_string(),
                error_type: "grammar".to_string(),
                message: "Use 'have' instead of 'of'".to_string(),
                correction: "$1 have".to_string(),
                severity: "error".to_string(),
                enabled: true,
            }
        ];
        
        let matcher = RuleMatcher::new(rules).unwrap();
        let errors = matcher.match_rules("I could of done it", "en");
        
        assert_eq!(errors.len(), 1);
        assert_eq!(errors[0].original, "could of");
        assert_eq!(errors[0].correction, "could have");
    }
}
