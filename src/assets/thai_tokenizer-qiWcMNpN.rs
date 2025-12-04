// Thai tokenizer using Maximal Matching with Backtracking
// Based on LibThai-compatible algorithm

use crate::dat::DAT;

const MAX_WORD_LEN: usize = 50; // Maximum Thai word length
const LOOKAHEAD_DEPTH: usize = 3; // How far to look ahead when verifying paths

#[derive(Debug, Clone, PartialEq)]
pub struct Token {
    pub text: String,
    pub start: usize,
    pub end: usize,
    pub is_known: bool, // Whether the word was found in dictionary
}

/// Tokenize Thai text using Maximal Matching with Backtracking
pub fn tokenize_thai(text: &str, dict: &DAT) -> Vec<Token> {
    if text.is_empty() {
        return Vec::new();
    }
    
    let chars: Vec<char> = text.chars().collect();
    let mut tokens = Vec::new();
    let mut pos = 0;
    
    while pos < chars.len() {
        // Try to find the longest match with lookahead verification
        if let Some((word_len, is_known)) = find_best_match(&chars, pos, dict) {
            let word: String = chars[pos..pos + word_len].iter().collect();
            tokens.push(Token {
                text: word,
                start: pos,
                end: pos + word_len,
                is_known,
            });
            pos += word_len;
        } else {
            // No match found, take single character as unknown word
            tokens.push(Token {
                text: chars[pos].to_string(),
                start: pos,
                end: pos + 1,
                is_known: false,
            });
            pos += 1;
        }
    }
    
    tokens
}

/// Find the best match at the current position using maximal matching with lookahead
fn find_best_match(chars: &[char], pos: usize, dict: &DAT) -> Option<(usize, bool)> {
    let remaining = chars.len() - pos;
    let max_len = remaining.min(MAX_WORD_LEN);
    
    // Try from longest to shortest
    for len in (1..=max_len).rev() {
        let candidate: String = chars[pos..pos + len].iter().collect();
        
        if dict.contains(&candidate) {
            // Found a match, verify we can continue from here
            if can_continue(chars, pos + len, dict, LOOKAHEAD_DEPTH) {
                return Some((len, true));
            }
        }
    }
    
    // No dictionary match found, but check if we can at least continue
    // Try single character as fallback
    if pos + 1 < chars.len() && can_continue(chars, pos + 1, dict, LOOKAHEAD_DEPTH) {
        return Some((1, false));
    }
    
    // Last resort: take single character
    Some((1, false))
}

/// Check if we can continue tokenizing from the given position
/// Uses lookahead to verify the path is not blocked
fn can_continue(chars: &[char], pos: usize, dict: &DAT, depth: usize) -> bool {
    // If we've reached the end, we can always continue
    if pos >= chars.len() {
        return true;
    }
    
    // If depth is 0, assume we can continue (base case)
    if depth == 0 {
        return true;
    }
    
    let remaining = chars.len() - pos;
    let max_len = remaining.min(MAX_WORD_LEN);
    
    // Try to find at least one valid word at this position
    for len in (1..=max_len).rev() {
        let candidate: String = chars[pos..pos + len].iter().collect();
        
        if dict.contains(&candidate) {
            // Found a word, recursively check if we can continue from there
            if can_continue(chars, pos + len, dict, depth - 1) {
                return true;
            }
        }
    }
    
    // Even if no dictionary word found, we can still continue with unknown words
    // This prevents getting stuck
    true
}

/// Alternative tokenization using greedy maximal matching (no backtracking)
/// Faster but less accurate than the backtracking version
pub fn tokenize_thai_greedy(text: &str, dict: &DAT) -> Vec<Token> {
    if text.is_empty() {
        return Vec::new();
    }
    
    let chars: Vec<char> = text.chars().collect();
    let mut tokens = Vec::new();
    let mut pos = 0;
    
    while pos < chars.len() {
        let mut best_len = 1;
        let mut is_known = false;
        
        let remaining = chars.len() - pos;
        let max_len = remaining.min(MAX_WORD_LEN);
        
        // Find longest match (greedy)
        for len in (1..=max_len).rev() {
            let candidate: String = chars[pos..pos + len].iter().collect();
            
            if dict.contains(&candidate) {
                best_len = len;
                is_known = true;
                break;
            }
        }
        
        let word: String = chars[pos..pos + best_len].iter().collect();
        tokens.push(Token {
            text: word,
            start: pos,
            end: pos + best_len,
            is_known,
        });
        pos += best_len;
    }
    
    tokens
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::dat::DATBuilder;

    fn create_test_dict() -> DAT {
        let words = vec![
            ("สวัสดี".to_string(), 100),
            ("ครับ".to_string(), 90),
            ("ค่ะ".to_string(), 90),
            ("ขอบคุณ".to_string(), 80),
            ("มาก".to_string(), 70),
            ("ไป".to_string(), 60),
            ("ที่".to_string(), 60),
            ("ไหน".to_string(), 50),
            ("ไปไหน".to_string(), 55),
            ("ได้".to_string(), 60),
            ("รับ".to_string(), 50),
            ("ได้รับ".to_string(), 65),
        ];
        
        DATBuilder::build(&words).unwrap()
    }

    #[test]
    fn test_tokenize_simple() {
        let dict = create_test_dict();
        let tokens = tokenize_thai("สวัสดีครับ", &dict);
        
        assert_eq!(tokens.len(), 2);
        assert_eq!(tokens[0].text, "สวัสดี");
        assert_eq!(tokens[0].is_known, true);
        assert_eq!(tokens[1].text, "ครับ");
        assert_eq!(tokens[1].is_known, true);
    }

    #[test]
    fn test_tokenize_with_unknown() {
        let dict = create_test_dict();
        let tokens = tokenize_thai("สวัสดีxyz", &dict);
        
        assert_eq!(tokens.len(), 4);
        assert_eq!(tokens[0].text, "สวัสดี");
        assert_eq!(tokens[0].is_known, true);
        // Unknown characters are tokenized individually
        assert_eq!(tokens[1].is_known, false);
        assert_eq!(tokens[2].is_known, false);
        assert_eq!(tokens[3].is_known, false);
    }

    #[test]
    fn test_tokenize_maximal_matching() {
        let dict = create_test_dict();
        // "ได้รับ" should be matched as one word, not "ได้" + "รับ"
        let tokens = tokenize_thai("ได้รับ", &dict);
        
        assert_eq!(tokens.len(), 1);
        assert_eq!(tokens[0].text, "ได้รับ");
        assert_eq!(tokens[0].is_known, true);
    }

    #[test]
    fn test_tokenize_empty() {
        let dict = create_test_dict();
        let tokens = tokenize_thai("", &dict);
        
        assert_eq!(tokens.len(), 0);
    }

    #[test]
    fn test_tokenize_greedy() {
        let dict = create_test_dict();
        let tokens = tokenize_thai_greedy("สวัสดีครับ", &dict);
        
        assert_eq!(tokens.len(), 2);
        assert_eq!(tokens[0].text, "สวัสดี");
        assert_eq!(tokens[1].text, "ครับ");
    }

    #[test]
    fn test_tokenize_positions() {
        let dict = create_test_dict();
        let tokens = tokenize_thai("สวัสดีครับ", &dict);
        
        assert_eq!(tokens[0].start, 0);
        assert_eq!(tokens[0].end, 6);
        assert_eq!(tokens[1].start, 6);
        assert_eq!(tokens[1].end, 10);
    }
}
