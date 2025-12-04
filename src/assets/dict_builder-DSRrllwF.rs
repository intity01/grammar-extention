// Dictionary builder tool
// Converts text dictionary files to DAT binary format

use std::fs::File;
use std::io::{BufRead, BufReader};

#[cfg(feature = "build-tools")]
use std::io::Read;

use crate::dat::{DATBuilder, DAT};

pub fn build_dictionary_from_file(
    input_path: &str,
    output_path: &str,
    language: &str,
) -> Result<(), String> {
    println!("Building dictionary from: {}", input_path);
    
    // Read words from file
    let words = read_dictionary_file(input_path)?;
    println!("Loaded {} words", words.len());
    
    // Build DAT
    let mut dat = DATBuilder::build(&words)?;
    dat.language = language.to_string();
    println!("Built DAT structure");
    
    // Write to file
    let mut file = File::create(output_path)
        .map_err(|e| format!("Failed to create output file: {}", e))?;
    dat.serialize(&mut file)
        .map_err(|e| format!("Failed to serialize DAT: {}", e))?;
    
    println!("Wrote DAT to: {}", output_path);
    println!("Memory usage: {} bytes", dat.memory_usage());
    
    Ok(())
}

fn read_dictionary_file(path: &str) -> Result<Vec<(String, u32)>, String> {
    let file = File::open(path)
        .map_err(|e| format!("Failed to open file: {}", e))?;
    let reader = BufReader::new(file);
    
    let mut words = Vec::new();
    
    for (line_num, line) in reader.lines().enumerate() {
        let line = line.map_err(|e| format!("Failed to read line {}: {}", line_num + 1, e))?;
        
        // Skip comments and empty lines
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        
        // Parse line: word,frequency
        let parts: Vec<&str> = line.split(',').collect();
        if parts.len() < 2 {
            eprintln!("Warning: Skipping invalid line {}: {}", line_num + 1, line);
            continue;
        }
        
        let word = parts[0].trim().to_string();
        let frequency: u32 = parts[1].trim().parse()
            .unwrap_or_else(|_| {
                eprintln!("Warning: Invalid frequency on line {}, using 1", line_num + 1);
                1
            });
        
        words.push((word, frequency));
    }
    
    Ok(words)
}

pub fn verify_dictionary(dat_path: &str) -> Result<(), String> {
    println!("Verifying dictionary: {}", dat_path);
    
    let mut file = File::open(dat_path)
        .map_err(|e| format!("Failed to open DAT file: {}", e))?;
    
    let dat = DAT::deserialize(&mut file)
        .map_err(|e| format!("Failed to deserialize DAT: {}", e))?;
    
    println!("Language: {}", dat.language);
    println!("Entry count: {}", dat.entry_count);
    println!("Memory usage: {} bytes", dat.memory_usage());
    println!("Base array size: {}", dat.base.len());
    println!("Check array size: {}", dat.check.len());
    println!("Values array size: {}", dat.values.len());
    
    Ok(())
}

#[cfg(feature = "build-tools")]
pub fn compress_dictionary(input_path: &str, output_path: &str) -> Result<(), String> {
    println!("Compressing dictionary: {}", input_path);
    
    // Read input file
    let mut input_file = File::open(input_path)
        .map_err(|e| format!("Failed to open input file: {}", e))?;
    let mut input_data = Vec::new();
    input_file.read_to_end(&mut input_data)
        .map_err(|e| format!("Failed to read input file: {}", e))?;
    
    let original_size = input_data.len();
    println!("Original size: {} bytes", original_size);
    
    // Compress with Brotli (quality 11 for maximum compression)
    let mut compressed_data = Vec::new();
    let mut compressor = brotli::CompressorWriter::new(&mut compressed_data, 4096, 11, 22);
    std::io::copy(&mut input_data.as_slice(), &mut compressor)
        .map_err(|e| format!("Failed to compress: {}", e))?;
    drop(compressor);
    
    let compressed_size = compressed_data.len();
    let ratio = (compressed_size as f64 / original_size as f64) * 100.0;
    
    println!("Compressed size: {} bytes ({:.1}% of original)", compressed_size, ratio);
    
    // Write compressed data
    let mut output_file = File::create(output_path)
        .map_err(|e| format!("Failed to create output file: {}", e))?;
    std::io::copy(&mut compressed_data.as_slice(), &mut output_file)
        .map_err(|e| format!("Failed to write compressed file: {}", e))?;
    
    println!("Wrote compressed dictionary to: {}", output_path);
    
    Ok(())
}

#[cfg(feature = "build-tools")]
pub fn decompress_dictionary(input_path: &str, output_path: &str) -> Result<(), String> {
    println!("Decompressing dictionary: {}", input_path);
    
    // Read compressed file
    let input_file = File::open(input_path)
        .map_err(|e| format!("Failed to open input file: {}", e))?;
    
    // Decompress
    let mut decompressor = brotli::Decompressor::new(input_file, 4096);
    let mut decompressed_data = Vec::new();
    decompressor.read_to_end(&mut decompressed_data)
        .map_err(|e| format!("Failed to decompress: {}", e))?;
    
    println!("Decompressed size: {} bytes", decompressed_data.len());
    
    // Write decompressed data
    let mut output_file = File::create(output_path)
        .map_err(|e| format!("Failed to create output file: {}", e))?;
    std::io::copy(&mut decompressed_data.as_slice(), &mut output_file)
        .map_err(|e| format!("Failed to write decompressed file: {}", e))?;
    
    println!("Wrote decompressed dictionary to: {}", output_path);
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn test_read_dictionary_file() {
        let mut temp_file = NamedTempFile::new().unwrap();
        writeln!(temp_file, "# Comment line").unwrap();
        writeln!(temp_file, "hello,100").unwrap();
        writeln!(temp_file, "world,200").unwrap();
        writeln!(temp_file, "").unwrap();
        writeln!(temp_file, "test,300").unwrap();
        temp_file.flush().unwrap();
        
        let words = read_dictionary_file(temp_file.path().to_str().unwrap()).unwrap();
        
        assert_eq!(words.len(), 3);
        assert_eq!(words[0], ("hello".to_string(), 100));
        assert_eq!(words[1], ("world".to_string(), 200));
        assert_eq!(words[2], ("test".to_string(), 300));
    }

    #[test]
    fn test_build_and_verify_dictionary() {
        let mut input_file = NamedTempFile::new().unwrap();
        writeln!(input_file, "apple,10").unwrap();
        writeln!(input_file, "banana,20").unwrap();
        writeln!(input_file, "cherry,30").unwrap();
        input_file.flush().unwrap();
        
        let output_file = NamedTempFile::new().unwrap();
        let output_path = output_file.path().to_str().unwrap();
        
        build_dictionary_from_file(
            input_file.path().to_str().unwrap(),
            output_path,
            "en"
        ).unwrap();
        
        // Verify the built dictionary
        let mut file = File::open(output_path).unwrap();
        let dat = DAT::deserialize(&mut file).unwrap();
        
        assert_eq!(dat.language, "en");
        assert_eq!(dat.entry_count, 3);
        assert_eq!(dat.lookup("apple"), Some(10));
        assert_eq!(dat.lookup("banana"), Some(20));
        assert_eq!(dat.lookup("cherry"), Some(30));
    }
}
