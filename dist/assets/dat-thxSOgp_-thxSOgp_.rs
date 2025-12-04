// Double-Array Trie (DAT) implementation
// Based on the algorithm by Aoe (1989)

use std::collections::HashMap;
use std::io::{Write, Read};

const MAGIC_NUMBER: u32 = 0x44415400; // 'DAT\0'
const VERSION: u32 = 1;

#[derive(Debug, Clone)]
pub struct DATBuilder {
    base: Vec<i32>,
    check: Vec<i32>,
    values: Vec<u32>,
    used: Vec<bool>,
}

#[derive(Debug, Clone)]
pub struct DAT {
    pub base: Vec<i32>,
    pub check: Vec<i32>,
    pub values: Vec<u32>,
    pub language: String,
    pub entry_count: u32,
}

#[derive(Debug, Clone)]
struct TrieNode {
    children: HashMap<u8, usize>,
    value: Option<u32>,
}

impl DATBuilder {
    pub fn new() -> Self {
        let mut builder = DATBuilder {
            base: vec![0; 1],
            check: vec![-1; 1],
            values: vec![u32::MAX; 1], // Use MAX as sentinel for "no value"
            used: vec![false; 1],
        };
        builder.used[0] = true;
        builder
    }

    /// Build DAT from a list of words
    pub fn build(words: &[(String, u32)]) -> Result<DAT, String> {
        if words.is_empty() {
            return Err("Cannot build DAT from empty word list".to_string());
        }

        // Sort words for efficient trie construction
        let mut sorted_words = words.to_vec();
        sorted_words.sort_by(|a, b| a.0.cmp(&b.0));

        // Build trie first
        let trie = Self::build_trie(&sorted_words);
        
        // Convert trie to DAT
        let mut builder = DATBuilder::new();
        builder.construct_dat(&trie, 0, 0)?;

        Ok(DAT {
            base: builder.base,
            check: builder.check,
            values: builder.values,
            language: String::new(),
            entry_count: words.len() as u32,
        })
    }

    fn build_trie(words: &[(String, u32)]) -> Vec<TrieNode> {
        let mut nodes = vec![TrieNode {
            children: HashMap::new(),
            value: None,
        }];

        for (word, value) in words {
            let mut current = 0;
            for &byte in word.as_bytes() {
                if !nodes[current].children.contains_key(&byte) {
                    let new_node = TrieNode {
                        children: HashMap::new(),
                        value: None,
                    };
                    nodes.push(new_node);
                    let new_idx = nodes.len() - 1;
                    nodes[current].children.insert(byte, new_idx);
                }
                current = *nodes[current].children.get(&byte).unwrap();
            }
            nodes[current].value = Some(*value);
        }

        nodes
    }

    fn construct_dat(&mut self, trie: &[TrieNode], trie_idx: usize, dat_idx: usize) -> Result<(), String> {
        let node = &trie[trie_idx];
        
        // Store value if this node has one
        if let Some(value) = node.value {
            self.ensure_capacity(dat_idx + 1);
            self.values[dat_idx] = value;
        }
        
        if node.children.is_empty() {
            // Leaf node
            return Ok(());
        }

        // Find base value for this node
        let chars: Vec<u8> = node.children.keys().copied().collect();
        let base = self.find_base(&chars)?;
        
        self.ensure_capacity(dat_idx + 1);
        self.base[dat_idx] = base;

        // Mark all child positions as used BEFORE recursing
        for &c in &chars {
            let child_dat_idx = (base + c as i32) as usize;
            self.ensure_capacity(child_dat_idx + 1);
            self.check[child_dat_idx] = dat_idx as i32;
            self.used[child_dat_idx] = true;
        }

        // Now process children recursively
        for (&c, &child_trie_idx) in &node.children {
            let child_dat_idx = (base + c as i32) as usize;
            self.construct_dat(trie, child_trie_idx, child_dat_idx)?;
        }

        Ok(())
    }

    fn find_base(&self, chars: &[u8]) -> Result<i32, String> {
        // Find a base value such that base + c is available for all c in chars
        let mut base = 1;
        loop {
            if base > 1_000_000 {
                return Err("Cannot find suitable base value".to_string());
            }

            let mut all_available = true;
            for &c in chars {
                let idx = (base + c as i32) as usize;
                // Check if this position would be valid and available
                if idx == 0 || (idx < self.used.len() && self.used[idx]) {
                    all_available = false;
                    break;
                }
            }

            if all_available {
                return Ok(base);
            }

            base += 1;
        }
    }

    fn ensure_capacity(&mut self, size: usize) {
        if size > self.base.len() {
            let new_size = size.max(self.base.len() * 2);
            self.base.resize(new_size, 0);
            self.check.resize(new_size, -1);
            self.values.resize(new_size, u32::MAX); // Use MAX as sentinel
            self.used.resize(new_size, false);
        }
    }
}

impl DAT {
    /// Lookup a word in the DAT
    pub fn lookup(&self, word: &str) -> Option<u32> {
        if word.is_empty() {
            return None;
        }
        
        let mut state = 0usize;
        
        for &byte in word.as_bytes() {
            if state >= self.base.len() {
                return None;
            }
            
            let next_state = (self.base[state] + byte as i32) as usize;
            
            if next_state >= self.check.len() || self.check[next_state] != state as i32 {
                return None;
            }
            
            state = next_state;
        }

        if state < self.values.len() && self.values[state] != u32::MAX {
            Some(self.values[state])
        } else {
            None
        }
    }

    /// Check if a word exists in the DAT
    pub fn contains(&self, word: &str) -> bool {
        self.lookup(word).is_some()
    }

    /// Serialize DAT to binary format
    pub fn serialize<W: Write>(&self, writer: &mut W) -> std::io::Result<()> {
        // Write header
        writer.write_all(&MAGIC_NUMBER.to_le_bytes())?;
        writer.write_all(&VERSION.to_le_bytes())?;
        
        // Write language (fixed 8 bytes)
        let mut lang_bytes = [0u8; 8];
        let lang_slice = self.language.as_bytes();
        let copy_len = lang_slice.len().min(8);
        lang_bytes[..copy_len].copy_from_slice(&lang_slice[..copy_len]);
        writer.write_all(&lang_bytes)?;
        
        // Write metadata
        writer.write_all(&self.entry_count.to_le_bytes())?;
        writer.write_all(&(self.base.len() as u32).to_le_bytes())?;
        writer.write_all(&(self.check.len() as u32).to_le_bytes())?;
        
        // Write BASE array
        for &val in &self.base {
            writer.write_all(&val.to_le_bytes())?;
        }
        
        // Write CHECK array
        for &val in &self.check {
            writer.write_all(&val.to_le_bytes())?;
        }
        
        // Write VALUES array
        for &val in &self.values {
            writer.write_all(&val.to_le_bytes())?;
        }
        
        Ok(())
    }

    /// Deserialize DAT from binary format
    pub fn deserialize<R: Read>(reader: &mut R) -> std::io::Result<Self> {
        // Read header
        let mut magic = [0u8; 4];
        reader.read_exact(&mut magic)?;
        if u32::from_le_bytes(magic) != MAGIC_NUMBER {
            return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                "Invalid DAT magic number",
            ));
        }
        
        let mut version = [0u8; 4];
        reader.read_exact(&mut version)?;
        
        // Read language
        let mut lang_bytes = [0u8; 8];
        reader.read_exact(&mut lang_bytes)?;
        let language = String::from_utf8_lossy(&lang_bytes)
            .trim_end_matches('\0')
            .to_string();
        
        // Read metadata
        let mut entry_count = [0u8; 4];
        reader.read_exact(&mut entry_count)?;
        let entry_count = u32::from_le_bytes(entry_count);
        
        let mut base_size = [0u8; 4];
        reader.read_exact(&mut base_size)?;
        let base_size = u32::from_le_bytes(base_size) as usize;
        
        let mut check_size = [0u8; 4];
        reader.read_exact(&mut check_size)?;
        let check_size = u32::from_le_bytes(check_size) as usize;
        
        // Read BASE array
        let mut base = Vec::with_capacity(base_size);
        for _ in 0..base_size {
            let mut val = [0u8; 4];
            reader.read_exact(&mut val)?;
            base.push(i32::from_le_bytes(val));
        }
        
        // Read CHECK array
        let mut check = Vec::with_capacity(check_size);
        for _ in 0..check_size {
            let mut val = [0u8; 4];
            reader.read_exact(&mut val)?;
            check.push(i32::from_le_bytes(val));
        }
        
        // Read VALUES array
        let mut values = Vec::with_capacity(base_size);
        for _ in 0..base_size {
            let mut val = [0u8; 4];
            reader.read_exact(&mut val)?;
            values.push(u32::from_le_bytes(val));
        }
        
        Ok(DAT {
            base,
            check,
            values,
            language,
            entry_count,
        })
    }

    /// Get memory usage in bytes
    pub fn memory_usage(&self) -> usize {
        self.base.len() * 4 + self.check.len() * 4 + self.values.len() * 4
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dat_build_and_lookup() {
        let words = vec![
            ("hello".to_string(), 1),
            ("world".to_string(), 2),
            ("hi".to_string(), 3),
        ];

        let dat = DATBuilder::build(&words).unwrap();
        
        assert_eq!(dat.lookup("hello"), Some(1));
        assert_eq!(dat.lookup("world"), Some(2));
        assert_eq!(dat.lookup("hi"), Some(3));
        assert_eq!(dat.lookup("goodbye"), None);
    }

    #[test]
    fn test_dat_simple_fruits() {
        let words = vec![
            ("apple".to_string(), 10),
            ("banana".to_string(), 20),
        ];

        let dat = DATBuilder::build(&words).unwrap();
        
        assert_eq!(dat.lookup("apple"), Some(10));
        assert_eq!(dat.lookup("banana"), Some(20));
    }

    #[test]
    fn test_dat_contains() {
        let words = vec![
            ("test".to_string(), 1),
            ("testing".to_string(), 2),
        ];

        let dat = DATBuilder::build(&words).unwrap();
        
        assert!(dat.contains("test"));
        assert!(dat.contains("testing"));
        assert!(!dat.contains("tes"));
        assert!(!dat.contains("testings"));
    }

    #[test]
    fn test_dat_serialization() {
        let words = vec![
            ("apple".to_string(), 10),
            ("banana".to_string(), 20),
            ("cherry".to_string(), 30),
        ];

        let mut dat = DATBuilder::build(&words).unwrap();
        dat.language = "en".to_string();
        
        // Serialize
        let mut buffer = Vec::new();
        dat.serialize(&mut buffer).unwrap();
        
        // Deserialize
        let mut cursor = std::io::Cursor::new(buffer);
        let loaded_dat = DAT::deserialize(&mut cursor).unwrap();
        
        assert_eq!(loaded_dat.language, "en");
        assert_eq!(loaded_dat.entry_count, 3);
        assert_eq!(loaded_dat.lookup("apple"), Some(10));
        assert_eq!(loaded_dat.lookup("banana"), Some(20));
        assert_eq!(loaded_dat.lookup("cherry"), Some(30));
    }

    #[test]
    fn test_dat_empty_words() {
        let words: Vec<(String, u32)> = vec![];
        let result = DATBuilder::build(&words);
        assert!(result.is_err());
    }

    #[test]
    fn test_dat_large_dictionary() {
        // Test with 1000 words
        let mut words = Vec::new();
        for i in 0..1000 {
            words.push((format!("word{}", i), i as u32));
        }

        let dat = DATBuilder::build(&words).unwrap();
        
        // Verify some lookups
        assert_eq!(dat.lookup("word0"), Some(0));
        assert_eq!(dat.lookup("word500"), Some(500));
        assert_eq!(dat.lookup("word999"), Some(999));
        assert_eq!(dat.lookup("word1000"), None);
    }
}
