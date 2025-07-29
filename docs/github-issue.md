# Implement Interactive Gene Expression Anatomogram Visualization

## Overview
Create an interactive web-based gene expression visualization using anatomogram SVGs that allows users to explore gene expression patterns across human tissues.

## Project Goals
- Display gene expression data on anatomical diagrams (anatomograms)
- Support both male and female anatomical views
- Provide interactive tooltips showing tissue names and expression values
- Allow users to switch between different genes and color schemes
- Enable export of visualizations as SVG files

## Technical Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Visualization**: D3.js v7
- **Data Format**: JSON for expression data and UBERON ID mappings
- **Assets**: SVG anatomograms from Expression Atlas

## Implementation Phases

### Phase 1: Setup & Assets
- [ ] Create project directory structure
- [ ] Download male/female anatomogram SVGs from Expression Atlas
- [ ] Clean SVGs to ensure UBERON ID attributes on tissue paths
- [ ] Create comprehensive UBERON ID to tissue name mapping
- [ ] Generate realistic mock gene expression data

### Phase 2: Core Implementation
- [ ] Build HTML structure with UI controls (sex selector, gene dropdown, color palettes, scale types)
- [ ] Implement responsive CSS layout and styling
- [ ] Create main.js with D3.js integration
- [ ] Implement SVG loading and dynamic switching between male/female views

### Phase 3: Visualization Features
- [ ] Implement color scaling (linear and logarithmic)
- [ ] Add interactive tooltips with tissue info
- [ ] Create dynamic color legend
- [ ] Handle sex-specific tissues appropriately

### Phase 4: Polish & Enhancement
- [ ] Add loading states and error handling
- [ ] Implement SVG export functionality
- [ ] Optimize performance for smooth interactions
- [ ] Add keyboard navigation support

### Phase 5: Testing & Refinement
- [ ] Test with various gene expression patterns
- [ ] Ensure cross-browser compatibility
- [ ] Validate accessibility features
- [ ] Performance optimization

## Key Features
1. **Sex-specific Views**: Toggle between male and female anatomograms
2. **Gene Selection**: Dropdown to choose different genes
3. **Color Palettes**: Multiple color schemes (Viridis, Magma, Inferno)
4. **Scale Types**: Linear and logarithmic scaling options
5. **Interactive Tooltips**: Show tissue name and expression value on hover
6. **Export**: Download current visualization as SVG

## File Structure
```
/anatomogram-visualization/
├── index.html              # Main HTML structure
├── css/
│   └── style.css          # Custom styles
├── js/
│   └── main.js            # D3.js and application logic
├── data/
│   ├── expression_data.json # Gene expression data
│   └── uberon_id_map.json   # UBERON ID to tissue name mapping
└── svg/
    ├── homo_sapiens.male.svg   # Male anatomogram
    └── homo_sapiens.female.svg # Female anatomogram
```

## Technical Considerations
- **Performance**: Efficient SVG manipulation with D3.js
- **Error Handling**: Graceful fallbacks for missing data
- **Accessibility**: ARIA labels and keyboard navigation
- **Responsive Design**: Works across different screen sizes

## Acceptance Criteria
- [ ] User can switch between male/female anatomograms
- [ ] User can select different genes from dropdown
- [ ] Tissues are colored based on expression values
- [ ] Tooltips show tissue name and expression value
- [ ] Color legend reflects current scale
- [ ] SVG can be exported with current visualization
- [ ] Application handles missing data gracefully
- [ ] Interface is responsive and accessible

## References
- [Expression Atlas Anatomograms](https://www.ebi.ac.uk/gxa/resources/anatomograms)
- [D3.js Documentation](https://d3js.org/)
- [UBERON Ontology](http://uberon.github.io/)