let expressionData = null;
let uberonIdMap = null;
let maleSvgDoc = null;
let femaleSvgDoc = null;

document.addEventListener('DOMContentLoaded', () => {
    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.style.display = 'block';
    
    Promise.all([
        d3.json('data/expression_data.json'),
        d3.json('data/uberon_id_map.json'),
        d3.xml('svg/homo_sapiens.male.svg'),
        d3.xml('svg/homo_sapiens.female.svg')
    ])
    .then(([exprData, idMap, maleSvg, femaleSvg]) => {
        expressionData = exprData;
        uberonIdMap = idMap;
        maleSvgDoc = maleSvg;
        femaleSvgDoc = femaleSvg;
        
        init();
    })
    .catch(error => {
        console.error('Error loading data:', error);
        loadingIndicator.textContent = 'Error loading data. Please ensure all files are present.';
    });
});

function init() {
    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.style.display = 'none';
    
    populateGeneSelector();
    
    attachEventListeners();
    
    switchAnatomogram('male');
}

function populateGeneSelector() {
    const geneSelector = document.getElementById('gene-selector');
    const genes = Object.keys(expressionData.genes);
    
    genes.forEach(gene => {
        const option = document.createElement('option');
        option.value = gene;
        option.textContent = gene;
        geneSelector.appendChild(option);
    });
}

function attachEventListeners() {
    document.querySelectorAll('input[name="sex"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            switchAnatomogram(e.target.value);
        });
    });
    
    document.getElementById('gene-selector').addEventListener('change', update);
    document.getElementById('color-palette-selector').addEventListener('change', update);
    document.getElementById('scale-type-selector').addEventListener('change', update);
    
    document.getElementById('export-svg-button').addEventListener('click', exportSVG);
}

function switchAnatomogram(sex) {
    const container = document.getElementById('anatomogram-container');
    container.innerHTML = '';
    
    const svgDoc = sex === 'male' ? maleSvgDoc : femaleSvgDoc;
    
    if (!svgDoc) {
        container.innerHTML = `<p>SVG file for ${sex} anatomogram not found. Please download from Expression Atlas.</p>`;
        return;
    }
    
    const svgNode = svgDoc.documentElement.cloneNode(true);
    container.appendChild(svgNode);
    
    d3.select(svgNode).selectAll('path').each(function() {
        const path = d3.select(this);
        path.on('mouseover', onMouseOver)
            .on('mousemove', onMouseMove)
            .on('mouseout', onMouseOut);
    });
    
    update();
}

function update() {
    const selectedGene = document.getElementById('gene-selector').value;
    const selectedPalette = document.getElementById('color-palette-selector').value;
    const selectedScale = document.getElementById('scale-type-selector').value;
    
    if (!selectedGene || !expressionData) return;
    
    const geneData = expressionData.genes[selectedGene];
    const colorScale = setColorScale(selectedPalette, selectedScale, geneData);
    
    createLegend(colorScale, selectedScale);
    
    const svg = d3.select('#anatomogram-container svg');
    let matchedCount = 0;
    let totalPaths = 0;
    let allUberonIds = [];
    
    // Find all elements with UBERON IDs (could be path, rect, ellipse, etc.)
    svg.selectAll('*[id^="UBERON"]').each(function() {
        const element = d3.select(this);
        const uberonId = element.attr('id');
        allUberonIds.push(uberonId);
        
        if (uberonId && geneData[uberonId] !== undefined) {
            matchedCount++;
            totalPaths++;
            const value = geneData[uberonId];
            element.style('fill', colorScale(value))
                   .style('stroke', '#ffffff')
                   .style('stroke-width', '0.5')
                   .attr('data-expression', value);
        } else if (uberonId) {
            totalPaths++;
            element.style('fill', '#E0E0E0')
                   .style('stroke', '#ffffff')
                   .style('stroke-width', '0.5')
                   .attr('data-expression', null);
        }
    });
    
    console.log(`Matched ${matchedCount} out of ${totalPaths} UBERON elements for gene ${selectedGene}`);
    console.log('Sample UBERON IDs found:', allUberonIds.slice(0, 10));
    
    // Also color any paths without UBERON IDs to default grey
    svg.selectAll('path').each(function() {
        const path = d3.select(this);
        if (!path.attr('id') || !path.attr('id').startsWith('UBERON')) {
            if (!path.attr('data-expression')) {
                path.style('fill', '#E0E0E0')
                    .style('stroke', '#ffffff')
                    .style('stroke-width', '0.5');
            }
        }
    });
}

function setColorScale(paletteName, scaleType, geneData) {
    const values = Object.values(geneData).filter(v => v > 0);
    const minValue = scaleType === 'log' ? d3.min(values) || 0.001 : 0;
    const maxValue = d3.max(Object.values(geneData)) || 1;
    
    let colorScheme;
    switch(paletteName) {
        case 'magma':
            colorScheme = d3.interpolateMagma;
            break;
        case 'inferno':
            colorScheme = d3.interpolateInferno;
            break;
        case 'viridis':
        default:
            colorScheme = d3.interpolateViridis;
    }
    
    let scale;
    if (scaleType === 'log') {
        scale = d3.scaleLog()
            .domain([minValue, maxValue])
            .range([0, 1])
            .clamp(true);
        
        return (value) => {
            if (value === 0) return colorScheme(0);
            return colorScheme(scale(value));
        };
    } else {
        scale = d3.scaleLinear()
            .domain([0, maxValue])
            .range([0, 1]);
        
        return (value) => colorScheme(scale(value));
    }
}

function createLegend(colorScale, scaleType) {
    const legendContainer = document.getElementById('legend');
    legendContainer.innerHTML = '<h3>Expression Level</h3>';
    
    const steps = 5;
    const maxValue = 1;
    
    for (let i = 0; i <= steps; i++) {
        const value = (maxValue / steps) * i;
        const displayValue = scaleType === 'log' && i === 0 ? '0' : value.toFixed(2);
        
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        
        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = colorScale(value);
        
        const label = document.createElement('span');
        label.className = 'legend-label';
        label.textContent = displayValue;
        
        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legendContainer.appendChild(legendItem);
    }
}

function onMouseOver(event) {
    const path = d3.select(this);
    let uberonId = path.attr('id') || path.attr('data-uberon-id');
    const expressionValue = path.attr('data-expression');
    
    // If the path doesn't have a UBERON ID, check its parent group
    if (!uberonId || !uberonId.startsWith('UBERON')) {
        const parentGroup = d3.select(this.parentNode);
        if (parentGroup.attr('id') && parentGroup.attr('id').startsWith('UBERON')) {
            uberonId = parentGroup.attr('id');
        }
    }
    
    const tooltip = document.getElementById('tooltip');
    
    if (uberonId && uberonIdMap[uberonId]) {
        const tissueName = uberonIdMap[uberonId];
        const value = expressionValue !== 'null' && expressionValue !== null ? 
            parseFloat(expressionValue).toFixed(3) : 'No data';
        
        tooltip.innerHTML = `
            <div class="tissue-name">${tissueName}</div>
            <div class="expression-value">Expression: ${value}</div>
        `;
        tooltip.style.display = 'block';
    }
}

function onMouseMove(event) {
    const tooltip = document.getElementById('tooltip');
    const offset = 10;
    
    tooltip.style.left = (event.pageX + offset) + 'px';
    tooltip.style.top = (event.pageY - tooltip.offsetHeight - offset) + 'px';
}

function onMouseOut() {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.display = 'none';
}

function exportSVG() {
    const svgElement = document.querySelector('#anatomogram-container svg');
    if (!svgElement) {
        alert('No SVG to export');
        return;
    }
    
    const selectedGene = document.getElementById('gene-selector').value;
    
    const svgClone = svgElement.cloneNode(true);
    
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgClone);
    
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `anatomogram_${selectedGene}_expression.svg`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(link.href);
}