# Anatomogram Visualization

An interactive web-based tool for visualizing gene expression data on anatomical diagrams (anatomograms). This project provides a dynamic, color-coded representation of gene expression levels across different tissues and organs.

![Anatomogram Visualization](docs/screenshot.png)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technical Approach](#technical-approach)
- [Resources Used](#resources-used)
- [Installation](#installation)
- [Usage](#usage)
- [Data Format](#data-format)
- [Project Structure](#project-structure)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Overview

This visualization tool was developed to provide researchers with an intuitive way to explore gene expression patterns across human anatomy. It maps expression data to anatomical structures using the UBERON anatomy ontology, providing a standardized and scientifically accurate representation.

### Key Goals

1. **Intuitive Visualization**: Transform complex expression data into easily interpretable visual patterns
2. **Standardization**: Use UBERON ontology IDs for consistent tissue identification
3. **Flexibility**: Support custom expression datasets through command-line interface
4. **Accessibility**: Web-based interface requiring no installation for end users

## Features

- 🔄 **Dynamic Gene Selection**: Switch between different genes to compare expression patterns
- 👫 **Male/Female Anatomograms**: Separate visualizations for biological sex differences
- 🎨 **Multiple Color Palettes**: Choose from Viridis, Magma, or Inferno color schemes
- 📊 **Linear/Logarithmic Scaling**: Appropriate scaling for different data distributions
- 🔍 **Interactive Tooltips**: Hover over tissues to see precise expression values
- 💾 **SVG Export**: Download publication-ready vector graphics
- 📁 **Custom Data Support**: Load your own expression datasets via CLI

## Technical Approach

### Architecture

The application follows a client-server architecture:

1. **Frontend**: Pure JavaScript with D3.js for visualization
2. **Backend**: Python HTTP server with custom data routing
3. **Data Layer**: JSON-based expression data and UBERON mappings

### Implementation Details

#### SVG Manipulation
- Uses D3.js v7 for efficient SVG DOM manipulation
- Handles both individual paths and grouped elements (e.g., peripheral nerves)
- Removes inline styles that might override expression colors

#### Event Handling
- Implements event delegation for efficient tooltip management
- Supports complex SVG structures with nested elements
- Provides smooth hover interactions

#### Data Processing
- Normalizes expression values for consistent visualization
- Handles zero values in logarithmic scales
- Maps UBERON IDs to human-readable tissue names

## Resources Used

### 1. Anatomogram SVGs
- **Source**: [Expression Atlas Anatomogram](https://github.com/gxa/anatomogram)
- **License**: Apache License 2.0
- **Description**: High-quality anatomical SVG diagrams with embedded UBERON identifiers
- **Modifications**: Removed embedded license links for cleaner visualization

### 2. UBERON Ontology
- **Source**: [Uber-anatomy Ontology](https://uberon.github.io/)
- **Purpose**: Cross-species anatomical structure ontology
- **Usage**: Provides standardized identifiers for anatomical structures
- **Version**: Mappings based on UBERON release 2023-09-14

### 3. D3.js Library
- **Version**: 7.x
- **Purpose**: Data visualization and DOM manipulation
- **Features Used**:
  - Color scales (d3.interpolateViridis, etc.)
  - Data loading (d3.json, d3.xml)
  - DOM selection and manipulation
  - Scale functions (linear, logarithmic)

### 4. Expression Atlas
- **Reference**: [EMBL-EBI Expression Atlas](https://www.ebi.ac.uk/gxa/)
- **Inspiration**: Visualization approach and anatomogram concept
- **Note**: This is an independent implementation inspired by their work

## Installation

### Prerequisites

- Python 3.6 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Git (for cloning the repository)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/MaximilianLombardo/anatomogram.git
cd anatomogram
```

2. No additional dependencies required! The tool uses vanilla JavaScript and Python's built-in HTTP server.

## Usage

### Quick Start (Sample Data)

Run with the included sample data:

```bash
python scripts/server.py -e data/sample/expression_data.json
```

Then open http://localhost:8000 in your browser.

### Using Custom Expression Data

1. Prepare your expression data in the required JSON format (see [Data Format](#data-format))

2. Run the server with your data:
```bash
python scripts/server.py -e path/to/your/expression_data.json
```

3. Optionally specify a custom UBERON mapping:
```bash
python scripts/server.py -e your_data.json -u your_uberon_map.json
```

### Command Line Options

```
Usage: server.py [-h] -e EXPRESSION_DATA [-u UBERON_MAP] [-p PORT]

Options:
  -h, --help            Show help message
  -e, --expression-data Path to expression data JSON file (required)
  -u, --uberon-map     Path to UBERON ID mapping JSON (optional)
  -p, --port           Port to run server on (default: 8000)
```

### Examples

```bash
# Use custom data on default port
python scripts/server.py -e my_data.json

# Use custom data with custom UBERON mapping
python scripts/server.py -e my_data.json -u my_mapping.json

# Run on different port
python scripts/server.py -e my_data.json -p 8080
```

## Data Format

### Expression Data Structure

Your expression data must be a JSON file with this structure:

```json
{
  "genes": {
    "GENE_NAME_1": {
      "UBERON_0002107": 0.75,
      "UBERON_0000955": 0.82,
      "UBERON_0002048": 0.45,
      ...
    },
    "GENE_NAME_2": {
      ...
    }
  }
}
```

- **genes**: Top-level object containing all genes
- **GENE_NAME**: Keys are gene symbols (e.g., "TP53", "EGFR")
- **UBERON_ID**: Keys are UBERON ontology IDs
- **expression_value**: Numeric expression values (any scale)

### UBERON Mapping (Optional)

Custom tissue name mappings:

```json
{
  "UBERON_0002107": "Liver",
  "UBERON_0000955": "Brain",
  "UBERON_0002048": "Heart",
  ...
}
```

### Finding UBERON IDs

To see all available UBERON IDs in the anatomograms:

```bash
# List all UBERON IDs in male anatomogram
grep -o 'id="UBERON_[0-9]*"' assets/svg/homo_sapiens.male.svg | sort | uniq

# List all UBERON IDs in female anatomogram
grep -o 'id="UBERON_[0-9]*"' assets/svg/homo_sapiens.female.svg | sort | uniq
```

## Project Structure

```
anatomogram/
├── src/                      # Source code
│   ├── css/
│   │   └── style.css        # Application styles
│   ├── js/
│   │   └── main.js          # Core application logic
│   └── index.html           # Main application page
├── data/
│   └── sample/              # Sample data files
│       ├── expression_data.json
│       └── uberon_id_map.json
├── assets/
│   └── svg/                 # Anatomogram SVG files
│       ├── homo_sapiens.male.svg
│       ├── homo_sapiens.female.svg
│       └── LICENSE.md
├── scripts/
│   └── server.py           # Development server with CLI
├── docs/                   # Documentation
│   ├── CLAUDE.md          # AI assistant context
│   ├── prd.md             # Product requirements
│   └── prompt.md          # Original specification
└── README.md              # This file
```

## Development

### Running Tests

Currently, testing is manual. To test the application:

1. Run the server with sample data
2. Verify all genes load correctly
3. Test male/female switching
4. Verify tooltips work on all tissues
5. Test export functionality

### Known Issues

1. Some tissues may not have UBERON IDs in the SVG files
2. Peripheral nerves are grouped and share expression values
3. SVG export may not preserve all styling in some applications

### Future Enhancements

- [ ] Add data validation and error messages
- [ ] Support for CSV input format
- [ ] Comparative visualization (multiple genes side-by-side)
- [ ] Time-series expression data
- [ ] Integration with expression databases
- [ ] Tissue-specific zoom functionality

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Update documentation for new features
- Test across different browsers
- Ensure responsive design is maintained

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

- Anatomogram SVGs: Apache License 2.0 (Expression Atlas)
- D3.js: ISC License
- UBERON Ontology: CC-BY 3.0

## Acknowledgments

- [Expression Atlas](https://www.ebi.ac.uk/gxa/) team for the anatomogram concept
- [UBERON](https://uberon.github.io/) maintainers for the anatomy ontology
- [D3.js](https://d3js.org/) community for the visualization library

## Contact

For questions or support, please open an issue on GitHub.

---

*This tool was developed for research purposes. Always validate visualization results against your original data.*