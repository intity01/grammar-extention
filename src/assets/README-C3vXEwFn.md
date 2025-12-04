# Dictionary Data Sources

This directory contains dictionary data for the grammar checker extension.

## Dictionary Sources

### Thai Dictionary

- **Source**: Lexitron (NECTEC - National Electronics and Computer Technology Center)
- **URL**: https://www.nectec.or.th/corpus/index.php?league=pm
- **License**: Creative Commons Attribution-ShareAlike 3.0
- **Size**: ~40,000+ words
- **Format**: Text file with word entries
- **Download Instructions**:
  1. Visit the NECTEC Lexitron website
  2. Download the Thai dictionary data
  3. Extract and save as `thai-lexitron-raw.txt`
  4. Run the build script to convert to DAT format

### Japanese Dictionary

- **Source**: IPADIC (IPA Dictionary)
- **URL**: https://github.com/polm/ipadic-py or https://taku910.github.io/mecab/
- **License**: BSD-3-Clause
- **Size**: Compact version recommended
- **Format**: CSV format with morphological information
- **Download Instructions**:
  1. Clone the IPADIC repository or download from MeCab
  2. Extract the dictionary CSV files
  3. Save to `japanese-ipadic-raw/`
  4. Run the build script to convert to DAT format

### English Dictionary

- **Source**: Wiktionary + Hunspell dictionaries
- **Wiktionary URL**: https://dumps.wikimedia.org/enwiktionary/
- **Hunspell URL**: https://github.com/wooorm/dictionaries
- **License**: Various open licenses (CC-BY-SA for Wiktionary, GPL/LGPL for Hunspell)
- **Size**: Filtered to common words (~50,000 words)
- **Format**: Text file with word list
- **Download Instructions**:
  1. Download Wiktionary word list or Hunspell en_US dictionary
  2. Filter to common words (frequency-based)
  3. Save as `english-wiktionary-raw.txt`
  4. Run the build script to convert to DAT format

## Build Process

After downloading the raw dictionary files, use the build script to convert them to DAT format:

```bash
# Build all dictionaries
cargo run --manifest-path wasm/Cargo.toml --bin dict-builder

# Or build individually
cargo run --manifest-path wasm/Cargo.toml --bin dict-builder -- --lang thai
cargo run --manifest-path wasm/Cargo.toml --bin dict-builder -- --lang japanese
cargo run --manifest-path wasm/Cargo.toml --bin dict-builder -- --lang english
```

## Output Files

After building, the following files will be generated:

- `thai.dat` - Thai dictionary in DAT format
- `japanese.dat` - Japanese dictionary in DAT format
- `english.dat` - English dictionary in DAT format

These files will then be compressed with Brotli:

- `thai.dat.br` - Compressed Thai dictionary
- `japanese.dat.br` - Compressed Japanese dictionary
- `english.dat.br` - Compressed English dictionary

## Sample Data

For development and testing purposes, sample dictionaries with limited word lists are provided:

- `thai-sample.txt` - 100 common Thai words
- `japanese-sample.txt` - 100 common Japanese words
- `english-sample.txt` - 100 common English words

## Data Format

### Raw Dictionary Format

Each line in the raw dictionary file should contain:

```
word,value,metadata
```

Where:

- `word`: The dictionary word
- `value`: A numeric value (frequency, ID, etc.)
- `metadata`: Optional additional information (POS tags, etc.)

Example:

```
hello,1000,noun
world,950,noun
test,800,verb
```

## Notes

- Dictionary files are not included in the repository due to size
- Users must download and build dictionaries locally
- Sample dictionaries are provided for testing
- Production builds should use full dictionaries
