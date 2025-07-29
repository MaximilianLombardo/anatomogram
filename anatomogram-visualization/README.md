# Anatomogram Visualization

This is an interactive gene expression visualization tool that displays expression data on anatomical diagrams (anatomograms).

## Setup Instructions

### 1. Anatomogram SVG Files

The anatomogram SVG files are already included in this repository:
- Male anatomogram: `svg/homo_sapiens.male.svg`
- Female anatomogram: `svg/homo_sapiens.female.svg`

These files were obtained from the [Expression Atlas Anatomogram project](https://github.com/gxa/anatomogram) under the Apache License 2.0. See `svg/README.md` for attribution details.

### 2. Running the Application

1. Ensure all files are in place
2. Open `index.html` in a modern web browser
3. If running locally, you may need to use a local web server due to CORS restrictions:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   ```

## Features

- Switch between male and female anatomical views
- Select different genes to visualize
- Choose from multiple color palettes (Viridis, Magma, Inferno)
- Toggle between linear and logarithmic scales
- Interactive tooltips showing tissue names and expression values
- Export visualizations as SVG files

## Data Format

The application uses two JSON data files:

1. **expression_data.json**: Contains gene expression values mapped to UBERON IDs
2. **uberon_id_map.json**: Maps UBERON IDs to human-readable tissue names

## Customization

To add your own gene expression data:
1. Edit `data/expression_data.json`
2. Add new genes following the existing format
3. Ensure expression values are normalized (0-1 range recommended)

To add more tissues:
1. Edit `data/uberon_id_map.json`
2. Add mappings for any additional UBERON IDs present in your SVG files