// Japanese tokenizer using character-based segmentation
// This is a simplified version that segments by character type
// For production, consider using Lindera with pre-built IPADIC dictionary

use crate::dat::DAT;

#[derive(Debug, Clone, PartialEq)]
pub struct JapaneseToken {
    pub text: String,
    pub start: usize,
    pub end: usize,
    pub pos: String,           // Part-of-speech tag (simplified)
    pub features: Vec<String>, // Morphological features
}

#[derive(Debug, Clone, Copy, PartialEq)]
enum CharType {
    Hiragana,
    Katakana,
    Kanji,
    Latin,
    Number,
    Punctuation,
    Other,
}

fn get_char_type(c: char) -> CharType {
    match c {
        '\u{3040}'..='\u{309F}' => CharType::Hiragana,
        '\u{30A0}'..='\u{30FF}' => CharType::Katakana,
        '\u{4E00}'..='\u{9FAF}' => CharType::Kanji,
        'a'..='z' | 'A'..='Z' => CharType::Latin,
        '0'..='9' => CharType::Number,
        '、' | '。' | '！' | '？' | ',' | '.' | '!' | '?' => CharType::Punctuation,
        _ => CharType::Other,
    }
}

/// Tokenize Japanese text using character-type-based segmentation
/// This is a simplified approach that groups consecutive characters of the same type
pub fn tokenize_japanese(text: &str) -> Result<Vec<JapaneseToken>, String> {
    if text.is_empty() {
        return Ok(Vec::new());
    }
    
    let chars: Vec<char> = text.chars().collect();
    let mut tokens = Vec::new();
    let mut start = 0;
    
    while start < chars.len() {
        let current_type = get_char_type(chars[start]);
        let mut end = start + 1;
        
        // Group consecutive characters of the same type
        while end < chars.len() && get_char_type(chars[end]) == current_type {
            end += 1;
        }
        
        let token_text: String = chars[start..end].iter().collect();
        let pos = match current_type {
            CharType::Hiragana => "Hiragana",
            CharType::Katakana => "Katakana",
            CharType::Kanji => "Kanji",
            CharType::Latin => "Latin",
            CharType::Number => "Number",
            CharType::Punctuation => "Punctuation",
            CharType::Other => "Other",
        }.to_string();
        
        tokens.push(JapaneseToken {
            text: token_text,
            start,
            end,
            pos,
            features: vec![],
        });
        
        start = end;
    }
    
    Ok(tokens)
}

/// Tokenize Japanese text with dictionary lookup for better accuracy
pub fn tokenize_japanese_with_dict(text: &str, dict: &DAT) -> Result<Vec<JapaneseToken>, String> {
    if text.is_empty() {
        return Ok(Vec::new());
    }
    
    let chars: Vec<char> = text.chars().collect();
    let mut tokens = Vec::new();
    let mut pos = 0;
    
    while pos < chars.len() {
        // Try to find longest match in dictionary
        let mut best_len = 1;
        let mut is_known = false;
        
        let remaining = chars.len() - pos;
        let max_len = remaining.min(20); // Max Japanese word length
        
        for len in (1..=max_len).rev() {
            let candidate: String = chars[pos..pos + len].iter().collect();
            if dict.contains(&candidate) {
                best_len = len;
                is_known = true;
                break;
            }
        }
        
        let token_text: String = chars[pos..pos + best_len].iter().collect();
        let char_type = get_char_type(chars[pos]);
        let pos_tag = if is_known {
            "Known"
        } else {
            match char_type {
                CharType::Hiragana => "Hiragana",
                CharType::Katakana => "Katakana",
                CharType::Kanji => "Kanji",
                CharType::Latin => "Latin",
                CharType::Number => "Number",
                CharType::Punctuation => "Punctuation",
                CharType::Other => "Other",
            }
        }.to_string();
        
        tokens.push(JapaneseToken {
            text: token_text,
            start: pos,
            end: pos + best_len,
            pos: pos_tag,
            features: vec![],
        });
        
        pos += best_len;
    }
    
    Ok(tokens)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::dat::DATBuilder;

    #[test]
    fn test_tokenize_simple() {
        let tokens = tokenize_japanese("こんにちは").unwrap();
        assert_eq!(tokens.len(), 1);
        assert_eq!(tokens[0].text, "こんにちは");
        assert_eq!(tokens[0].pos, "Hiragana");
    }

    #[test]
    fn test_tokenize_with_kanji() {
        let tokens = tokenize_japanese("日本語").unwrap();
        assert_eq!(tokens.len(), 1);
        assert_eq!(tokens[0].text, "日本語");
        assert_eq!(tokens[0].pos, "Kanji");
    }

    #[test]
    fn test_tokenize_mixed() {
        let tokens = tokenize_japanese("私は学生です").unwrap();
        assert!(tokens.len() >= 3);
        
        // Verify positions are sequential
        for i in 1..tokens.len() {
            assert_eq!(tokens[i].start, tokens[i-1].end);
        }
        
        // Reconstruct text
        let reconstructed: String = tokens.iter().map(|t| t.text.as_str()).collect();
        assert_eq!(reconstructed, "私は学生です");
    }

    #[test]
    fn test_tokenize_empty() {
        let tokens = tokenize_japanese("").unwrap();
        assert_eq!(tokens.len(), 0);
    }

    #[test]
    fn test_tokenize_katakana() {
        let tokens = tokenize_japanese("カタカナ").unwrap();
        assert_eq!(tokens.len(), 1);
        assert_eq!(tokens[0].text, "カタカナ");
        assert_eq!(tokens[0].pos, "Katakana");
    }

    #[test]
    fn test_tokenize_with_punctuation() {
        let tokens = tokenize_japanese("こんにちは。").unwrap();
        assert_eq!(tokens.len(), 2);
        assert_eq!(tokens[0].pos, "Hiragana");
        assert_eq!(tokens[1].pos, "Punctuation");
    }

    #[test]
    fn test_tokenize_with_dict() {
        let words = vec![
            ("日本".to_string(), 100),
            ("語".to_string(), 90),
            ("学生".to_string(), 80),
        ];
        let dict = DATBuilder::build(&words).unwrap();
        
        let tokens = tokenize_japanese_with_dict("日本語", &dict).unwrap();
        assert!(tokens.len() >= 2);
        
        // "日本" should be recognized as a known word
        assert_eq!(tokens[0].text, "日本");
        assert_eq!(tokens[0].pos, "Known");
    }

    #[test]
    fn test_char_type_detection() {
        assert_eq!(get_char_type('あ'), CharType::Hiragana);
        assert_eq!(get_char_type('ア'), CharType::Katakana);
        assert_eq!(get_char_type('漢'), CharType::Kanji);
        assert_eq!(get_char_type('A'), CharType::Latin);
        assert_eq!(get_char_type('5'), CharType::Number);
        assert_eq!(get_char_type('。'), CharType::Punctuation);
    }
}
