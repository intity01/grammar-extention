// Dictionary builder CLI tool

use std::env;
use std::process;

// Import from the library crate
use grammar_checker_wasm::dict_builder::{
    build_dictionary_from_file, verify_dictionary, compress_dictionary, decompress_dictionary
};

fn main() {
    let args: Vec<String> = env::args().collect();
    
    if args.len() < 2 {
        print_usage();
        process::exit(1);
    }
    
    let command = &args[1];
    
    match command.as_str() {
        "build" => {
            if args.len() < 5 {
                eprintln!("Error: build command requires input, output, and language arguments");
                print_usage();
                process::exit(1);
            }
            
            let input = &args[2];
            let output = &args[3];
            let language = &args[4];
            
            match build_dictionary_from_file(input, output, language) {
                Ok(()) => {
                    println!("Dictionary built successfully!");
                    process::exit(0);
                }
                Err(e) => {
                    eprintln!("Error building dictionary: {}", e);
                    process::exit(1);
                }
            }
        }
        "verify" => {
            if args.len() < 3 {
                eprintln!("Error: verify command requires DAT file path");
                print_usage();
                process::exit(1);
            }
            
            let dat_path = &args[2];
            
            match verify_dictionary(dat_path) {
                Ok(()) => {
                    println!("Dictionary verified successfully!");
                    process::exit(0);
                }
                Err(e) => {
                    eprintln!("Error verifying dictionary: {}", e);
                    process::exit(1);
                }
            }
        }
        "compress" => {
            if args.len() < 4 {
                eprintln!("Error: compress command requires input and output arguments");
                print_usage();
                process::exit(1);
            }
            
            let input = &args[2];
            let output = &args[3];
            
            match compress_dictionary(input, output) {
                Ok(()) => {
                    println!("Dictionary compressed successfully!");
                    process::exit(0);
                }
                Err(e) => {
                    eprintln!("Error compressing dictionary: {}", e);
                    process::exit(1);
                }
            }
        }
        "decompress" => {
            if args.len() < 4 {
                eprintln!("Error: decompress command requires input and output arguments");
                print_usage();
                process::exit(1);
            }
            
            let input = &args[2];
            let output = &args[3];
            
            match decompress_dictionary(input, output) {
                Ok(()) => {
                    println!("Dictionary decompressed successfully!");
                    process::exit(0);
                }
                Err(e) => {
                    eprintln!("Error decompressing dictionary: {}", e);
                    process::exit(1);
                }
            }
        }
        "build-all" => {
            println!("Building all sample dictionaries...\n");
            
            let dictionaries = vec![
                ("dictionaries/thai-sample.txt", "dictionaries/thai.dat", "th"),
                ("dictionaries/english-sample.txt", "dictionaries/english.dat", "en"),
                ("dictionaries/japanese-sample.txt", "dictionaries/japanese.dat", "ja"),
            ];
            
            let mut success_count = 0;
            let mut fail_count = 0;
            
            for (input, output, lang) in &dictionaries {
                println!("Building {} dictionary...", lang);
                match build_dictionary_from_file(input, output, lang) {
                    Ok(()) => {
                        println!("✓ {} dictionary built successfully", lang);
                        success_count += 1;
                        
                        // Compress the dictionary
                        let compressed_output = format!("{}.br", output);
                        println!("Compressing {} dictionary...", lang);
                        match compress_dictionary(output, &compressed_output) {
                            Ok(()) => {
                                println!("✓ {} dictionary compressed successfully\n", lang);
                            }
                            Err(e) => {
                                eprintln!("✗ Failed to compress {} dictionary: {}\n", lang, e);
                                fail_count += 1;
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("✗ Failed to build {} dictionary: {}\n", lang, e);
                        fail_count += 1;
                    }
                }
            }
            
            println!("Summary: {} succeeded, {} failed", success_count, fail_count);
            
            if fail_count > 0 {
                process::exit(1);
            }
        }
        _ => {
            eprintln!("Error: Unknown command '{}'", command);
            print_usage();
            process::exit(1);
        }
    }
}

fn print_usage() {
    println!("Dictionary Builder Tool");
    println!();
    println!("Usage:");
    println!("  dict-builder build <input.txt> <output.dat> <language>");
    println!("  dict-builder verify <dictionary.dat>");
    println!("  dict-builder compress <input.dat> <output.dat.br>");
    println!("  dict-builder decompress <input.dat.br> <output.dat>");
    println!("  dict-builder build-all");
    println!();
    println!("Commands:");
    println!("  build       Build a dictionary from a text file");
    println!("  verify      Verify a built dictionary file");
    println!("  compress    Compress a dictionary with Brotli (quality 11)");
    println!("  decompress  Decompress a Brotli-compressed dictionary");
    println!("  build-all   Build and compress all sample dictionaries");
    println!();
    println!("Examples:");
    println!("  dict-builder build dictionaries/thai-sample.txt dictionaries/thai.dat th");
    println!("  dict-builder verify dictionaries/thai.dat");
    println!("  dict-builder compress dictionaries/thai.dat dictionaries/thai.dat.br");
    println!("  dict-builder build-all");
}
