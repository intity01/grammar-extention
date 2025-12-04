// English tokenizer with simplified POS tagging
// Based on Brill Tagger principles (rule-based transformation)

use crate::dat::DAT;

#[derive(Debug, Clone, PartialEq)]
pub struct EnglishToken {
    pub text: String,
    pub start: usize,
    pub end: usize,
    pub pos: String, // Part-of-speech tag
}

/// Tokenize English text using whitespace and punctuation
pub fn tokenize_english(text: &str) -> Vec<EnglishToken> {
    if text.is_empty() {
        return Vec::new();
    }
    
    let mut tokens = Vec::new();
    let mut current_word = String::new();
    let mut word_start = 0;
    let mut pos = 0;
    
    for (_i, c) in text.chars().enumerate() {
        if c.is_whitespace() {
            if !current_word.is_empty() {
                tokens.push(EnglishToken {
                    text: current_word.clone(),
                    start: word_start,
                    end: pos,
                    pos: "UNKNOWN".to_string(),
                });
                current_word.clear();
            }
            pos += 1;
        } else if is_punctuation(c) {
            // Add current word if any
            if !current_word.is_empty() {
                tokens.push(EnglishToken {
                    text: current_word.clone(),
                    start: word_start,
                    end: pos,
                    pos: "UNKNOWN".to_string(),
                });
                current_word.clear();
            }
            
            // Add punctuation as separate token
            tokens.push(EnglishToken {
                text: c.to_string(),
                start: pos,
                end: pos + 1,
                pos: "PUNCT".to_string(),
            });
            pos += 1;
        } else {
            if current_word.is_empty() {
                word_start = pos;
            }
            current_word.push(c);
            pos += 1;
        }
    }
    
    // Add final word if any
    if !current_word.is_empty() {
        tokens.push(EnglishToken {
            text: current_word,
            start: word_start,
            end: pos,
            pos: "UNKNOWN".to_string(),
        });
    }
    
    tokens
}

/// Tokenize and apply POS tagging
pub fn tokenize_and_tag_english(text: &str, dict: Option<&DAT>) -> Vec<EnglishToken> {
    let mut tokens = tokenize_english(text);
    
    // Apply initial POS tags based on word characteristics
    for token in &mut tokens {
        if token.pos == "PUNCT" {
            continue;
        }
        
        token.pos = initial_tag(&token.text, dict);
    }
    
    // Apply transformation rules (simplified Brill Tagger)
    apply_transformation_rules(&mut tokens);
    
    tokens
}

/// Assign initial POS tag based on word characteristics
fn initial_tag(word: &str, dict: Option<&DAT>) -> String {
    let lower = word.to_lowercase();
    
    // Check dictionary if available
    if let Some(dict) = dict {
        if dict.contains(&lower) {
            // For simplicity, assume dictionary words are nouns
            // In a real implementation, the dictionary would store POS info
            return "NN".to_string();
        }
    }
    
    // Rule-based initial tagging
    if word.chars().all(|c| c.is_numeric()) {
        return "CD".to_string(); // Cardinal number
    }
    
    if word.ends_with("ing") {
        return "VBG".to_string(); // Verb, gerund
    }
    
    if word.ends_with("ed") {
        return "VBD".to_string(); // Verb, past tense
    }
    
    if word.ends_with("ly") {
        return "RB".to_string(); // Adverb
    }
    
    if word.ends_with("s") && word.len() > 2 {
        return "NNS".to_string(); // Noun, plural
    }
    
    // Check for common determiners
    match lower.as_str() {
        "the" | "a" | "an" => return "DT".to_string(),
        "is" | "are" | "was" | "were" | "be" | "been" | "being" => return "VB".to_string(),
        "and" | "or" | "but" => return "CC".to_string(), // Coordinating conjunction
        "in" | "on" | "at" | "to" | "for" | "with" | "from" => return "IN".to_string(), // Preposition
        "i" | "you" | "he" | "she" | "it" | "we" | "they" => return "PRP".to_string(), // Personal pronoun
        "my" | "your" | "his" | "her" | "its" | "our" | "their" => return "PRP$".to_string(), // Possessive pronoun
        _ => {}
    }
    
    // Default to noun
    "NN".to_string()
}

/// Apply transformation rules (simplified Brill Tagger approach)
fn apply_transformation_rules(tokens: &mut [EnglishToken]) {
    for i in 0..tokens.len() {
        // Rule: DT + NN -> DT + NN (already correct)
        // Rule: DT + VBG -> DT + NN (gerund after determiner is noun)
        if i > 0 && tokens[i-1].pos == "DT" && tokens[i].pos == "VBG" {
            tokens[i].pos = "NN".to_string();
        }
        
        // Rule: TO + VB -> TO + VB (infinitive)
        if i > 0 && tokens[i-1].text.to_lowercase() == "to" && tokens[i].pos.starts_with("VB") {
            tokens[i].pos = "VB".to_string();
        }
        
        // Rule: PRP + VBD -> PRP + VBD (pronoun + past tense verb)
        // Rule: PRP + VBG -> PRP + VBG (pronoun + gerund/present participle)
        
        // Rule: NN + VBD -> NN + VBD or NN + JJ (could be adjective)
        // This is complex and would need more context
        
        // Rule: Capitalize first word -> could be proper noun
        if i == 0 && tokens[i].text.chars().next().map(|c| c.is_uppercase()).unwrap_or(false) {
            if tokens[i].pos == "NN" {
                tokens[i].pos = "NNP".to_string(); // Proper noun
            }
        }
    }
}

fn is_punctuation(c: char) -> bool {
    matches!(c, '.' | ',' | '!' | '?' | ';' | ':' | '\'' | '"' | '(' | ')' | '[' | ']' | '{' | '}')
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::dat::DATBuilder;

    #[test]
    fn test_tokenize_simple() {
        let tokens = tokenize_english("Hello world");
        assert_eq!(tokens.len(), 2);
        assert_eq!(tokens[0].text, "Hello");
        assert_eq!(tokens[1].text, "world");
    }

    #[test]
    fn test_tokenize_with_punctuation() {
        let tokens = tokenize_english("Hello, world!");
        assert_eq!(tokens.len(), 4);
        assert_eq!(tokens[0].text, "Hello");
        assert_eq!(tokens[1].text, ",");
        assert_eq!(tokens[1].pos, "PUNCT");
        assert_eq!(tokens[2].text, "world");
        assert_eq!(tokens[3].text, "!");
    }

    #[test]
    fn test_tokenize_empty() {
        let tokens = tokenize_english("");
        assert_eq!(tokens.len(), 0);
    }

    #[test]
    fn test_tokenize_positions() {
        let tokens = tokenize_english("The cat");
        assert_eq!(tokens[0].start, 0);
        assert_eq!(tokens[0].end, 3);
        assert_eq!(tokens[1].start, 4);
        assert_eq!(tokens[1].end, 7);
    }

    #[test]
    fn test_pos_tagging_determiners() {
        let tokens = tokenize_and_tag_english("the cat", None);
        assert_eq!(tokens[0].pos, "DT");
        assert_eq!(tokens[1].pos, "NN");
    }

    #[test]
    fn test_pos_tagging_verbs() {
        let tokens = tokenize_and_tag_english("running jumped", None);
        // "running" at start of sentence is tagged as VBG initially
        assert_eq!(tokens[0].pos, "VBG");
        assert_eq!(tokens[1].pos, "VBD"); // "jumped" is past tense
    }

    #[test]
    fn test_pos_tagging_numbers() {
        let tokens = tokenize_and_tag_english("123 cats", None);
        assert_eq!(tokens[0].pos, "CD");
        assert_eq!(tokens[1].pos, "NNS");
    }

    #[test]
    fn test_pos_tagging_with_dict() {
        let words = vec![
            ("cat".to_string(), 100),
            ("dog".to_string(), 90),
        ];
        let dict = DATBuilder::build(&words).unwrap();
        
        let tokens = tokenize_and_tag_english("the cat", Some(&dict));
        assert_eq!(tokens[0].pos, "DT");
        assert_eq!(tokens[1].pos, "NN");
    }

    #[test]
    fn test_transformation_rules() {
        let tokens = tokenize_and_tag_english("the running", None);
        // "running" after "the" should be tagged as noun
        assert_eq!(tokens[1].pos, "NN");
    }

    #[test]
    fn test_proper_noun() {
        let tokens = tokenize_and_tag_english("John likes cats", None);
        assert_eq!(tokens[0].pos, "NNP"); // Proper noun (capitalized first word)
    }
}
