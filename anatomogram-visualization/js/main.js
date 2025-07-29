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

    // Perform the initial render
    switchAnatomogram('male');
}

function populateGeneSelector() {
    const geneSelector = document.getElementById('gene-selector');
    // Ensure expressionData.genes exists before trying to get keys
    const genes = expressionData && expressionData.genes ? Object.keys(expressionData.genes) : [];

    genes.forEach(gene => {
        const option = document.createElement('option');
        option.value = gene;
        option.textContent = gene;
        geneSelector.appendChild(option);
    });
}

function attachEventListeners() {
    // Listeners for UI controls - these are attached once and are persistent
    document.querySelectorAll('input[name="sex"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            switchAnatomogram(e.target.value);
        });
    });

    document.getElementById('gene-selector').addEventListener('change', update);
    document.getElementById('color-palette-selector').addEventListener('change', update);
    document.getElementById('scale-type-selector').addEventListener('change', update);
    document.getElementById('export-svg-button').addEventListener('click', exportSVG);
    document.getElementById('debug-button').addEventListener('click', showDebugInfo);

    // *** FIX: Use Event Delegation for Tooltips ***
    // Attach one set of listeners to the container. This is more efficient and
    // robust than attaching listeners to every single path on every redraw.
    // D3's .on() method handles this perfectly.
    const container = d3.select('#anatomogram-container');
    container
        .on('mouseover', onMouseOver)
        .on('mousemove', onMouseMove)
        .on('mouseout', onMouseOut);
}

function switchAnatomogram(sex) {
    const container = document.getElementById('anatomogram-container');
    container.innerHTML = ''; // Clear previous SVG

    const svgDoc = sex === 'male' ? maleSvgDoc : femaleSvgDoc;

    if (!svgDoc) {
        container.innerHTML = `<p>Error: SVG for ${sex} not loaded.</p>`;
        return;
    }

    // Append a clone of the loaded SVG document
    const svgNode = svgDoc.documentElement.cloneNode(true);
    container.appendChild(svgNode);

    // *** FIX: The event listeners are now on the container, so we don't need to re-attach them here.
    // This makes the switcher simpler and more reliable.

    // Call update to color the new SVG
    update();
}

function update() {
    const selectedGene = document.getElementById('gene-selector').value;
    const selectedPalette = document.getElementById('color-palette-selector').value;
    const selectedScale = document.getElementById('scale-type-selector').value;

    if (!selectedGene || !expressionData || !expressionData.genes) return;

    const geneData = expressionData.genes[selectedGene];
    const colorScale = setColorScale(selectedPalette, selectedScale, geneData);

    createLegend(colorScale, selectedScale);

    const svg = d3.select('#anatomogram-container svg');
    let matchedCount = 0;
    
    // *** FIX: Robustly handle both <path> and <g> elements with UBERON IDs ***
    svg.selectAll('*[id^="UBERON"]').each(function() {
        const element = d3.select(this);
        const uberonId = element.attr('id');
        const node = element.node(); // Get the raw DOM node
        const expressionValue = geneData[uberonId];

        if (expressionValue !== undefined) {
            matchedCount++;
            const fillColor = colorScale(expressionValue);

            // Store the expression data on the element for the tooltip
            element.attr('data-expression', expressionValue);

            // Check if the element is a group or a direct path/shape
            if (node.tagName.toLowerCase() === 'g') {
                // Remove any inline style that might block fill on the group
                const currentStyle = element.attr('style');
                if (currentStyle && currentStyle.includes('fill:none')) {
                    element.attr('style', currentStyle.replace(/fill:\s*none\s*;?/g, ''));
                }
                // If it's a group, apply the fill to all its children paths/shapes
                element.selectAll('path, rect, circle, polygon, ellipse').style('fill', fillColor);
            } else {
                // If it's a path or other shape, apply the fill directly
                element.style('fill', fillColor);
            }
        } else {
             // If no data, ensure it's grey and has no expression data attribute
             element.attr('data-expression', null);
             if (node.tagName.toLowerCase() === 'g') {
                // Remove any inline style that might block fill on the group
                const currentStyle = element.attr('style');
                if (currentStyle && currentStyle.includes('fill:none')) {
                    element.attr('style', currentStyle.replace(/fill:\s*none\s*;?/g, ''));
                }
                element.selectAll('path, rect, circle, polygon, ellipse').style('fill', '#E0E0E0');
            } else {
                element.style('fill', '#E0E0E0');
            }
        }
    });

    console.log(`Successfully colored ${matchedCount} tissues for gene ${selectedGene}`);
}


function setColorScale(paletteName, scaleType, geneData) {
    const values = Object.values(geneData).filter(v => typeof v === 'number');
    const maxValue = d3.max(values) || 1;

    let colorInterpolator;
    switch (paletteName) {
        case 'magma':
            colorInterpolator = d3.interpolateMagma;
            break;
        case 'inferno':
            colorInterpolator = d3.interpolateInferno;
            break;
        case 'viridis':
        default:
            colorInterpolator = d3.interpolateViridis;
    }

    if (scaleType === 'log') {
        const positiveValues = values.filter(v => v > 0);
        const minPositiveValue = d3.min(positiveValues) || 0.001;
        
        const logScale = d3.scaleLog()
            .domain([minPositiveValue, maxValue])
            .range([0, 1])
            .clamp(true);

        return (value) => {
            if (value <= 0) return colorInterpolator(0); // Color for 0 or negative values
            return colorInterpolator(logScale(value));
        };
    } else {
        const linearScale = d3.scaleLinear()
            .domain([0, maxValue])
            .range([0, 1]);

        return (value) => colorInterpolator(linearScale(value));
    }
}

function createLegend(colorScale, scaleType) {
    const legendContainer = document.getElementById('legend');
    legendContainer.innerHTML = '<h3>Expression Level</h3>';

    const steps = 5;
    const maxValue = 1;

    for (let i = 0; i <= steps; i++) {
        const value = (maxValue / steps) * i;
        // For the legend, we just show the 0-1 scale visually
        const displayValue = value.toFixed(2);

        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';

        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        // The color is derived from the value (0-1) passed to the scale function
        colorBox.style.backgroundColor = colorScale(value);

        const label = document.createElement('span');
        label.className = 'legend-label';
        label.textContent = displayValue;

        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legendContainer.appendChild(legendItem);
    }
}

// *** FIX: onMouseOver now uses the event object from the delegated listener ***
function onMouseOver(event) {
    // event.target is the actual element the mouse is over (e.g., a specific <path>)
    let targetElement = event.target;
    let tissueElement = null;
    
    // Walk up the DOM tree to find an element with UBERON ID
    while (targetElement && targetElement !== document.body) {
        if (targetElement.id && targetElement.id.startsWith('UBERON')) {
            tissueElement = targetElement;
            break;
        }
        targetElement = targetElement.parentElement;
    }
    
    if (!tissueElement) return; // Exit if no UBERON element is found
    
    const d3TissueElement = d3.select(tissueElement);
    const uberonId = tissueElement.id;
    const expressionValue = d3TissueElement.attr('data-expression');
    
    const tooltip = d3.select('#tooltip');

    if (uberonId && uberonIdMap[uberonId]) {
        const tissueName = uberonIdMap[uberonId];
        const valueText = (expressionValue && expressionValue !== 'null')
            ? `Expression: ${parseFloat(expressionValue).toFixed(3)}`
            : 'Expression: No data';

        tooltip.style('display', 'block')
            .html(`
                <div class="tissue-name">${tissueName}</div>
                <div class="expression-value">${valueText}</div>
            `);
    }
}

function onMouseMove(event) {
    const tooltip = d3.select('#tooltip');
    const offset = 15;
    tooltip.style('left', (event.pageX + offset) + 'px')
           .style('top', (event.pageY - offset) + 'px');
}

function onMouseOut() {
    d3.select('#tooltip').style('display', 'none');
}


function exportSVG() {
    const svgElement = document.querySelector('#anatomogram-container svg');
    if (!svgElement) {
        alert('No SVG to export');
        return;
    }

    const selectedGene = document.getElementById('gene-selector').value;

    // Create a clone to avoid modifying the live SVG
    const svgClone = svgElement.cloneNode(true);
    
    // Explicitly set width and height for better compatibility
    const bounds = svgElement.getBoundingClientRect();
    d3.select(svgClone)
        .attr('width', bounds.width)
        .attr('height', bounds.height);

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgClone);

    // Add XML declaration and DOCTYPE for stricter SVG format
    svgString = '<?xml version="1.0" standalone="no"?>\r\n' + svgString;

    const blob = new Blob([svgString], {
        type: 'image/svg+xml;charset=utf-8'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `anatomogram_${selectedGene}_expression.svg`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(link.href);
}

function showDebugInfo() {
    const svg = d3.select('#anatomogram-container svg');
    const selectedGene = document.getElementById('gene-selector').value;
    
    if (!selectedGene || !expressionData) {
        alert('Please select a gene first');
        return;
    }
    
    const geneData = expressionData.genes[selectedGene];
    let allUberonIds = [];
    let matchedIds = [];
    let unmatchedIds = [];
    
    // Find all UBERON IDs in the SVG
    svg.selectAll('*[id^="UBERON"]').each(function() {
        const element = d3.select(this);
        const uberonId = element.attr('id');
        if (uberonId) {
            allUberonIds.push(uberonId);
            if (geneData[uberonId] !== undefined) {
                matchedIds.push(uberonId);
            } else {
                unmatchedIds.push(uberonId);
            }
        }
    });
    
    const debugInfo = `
Debug Information for ${selectedGene}:
=====================================
Total UBERON elements in SVG: ${allUberonIds.length}
Matched (have expression data): ${matchedIds.length}
Unmatched (missing data): ${unmatchedIds.length}

Unmatched UBERON IDs:
${unmatchedIds.join('\n')}

Sample matched IDs:
${matchedIds.slice(0, 10).join('\n')}
    `;
    
    // Try multiple console methods
    console.log(debugInfo);
    console.info(debugInfo);
    console.warn('Debug Info:', debugInfo);
    
    // Also create a downloadable text file with the debug info
    const blob = new Blob([debugInfo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'anatomogram-debug-info.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    alert(`Debug information has been downloaded as 'anatomogram-debug-info.txt'\n\nSummary:\n- Total tissues: ${allUberonIds.length}\n- With data: ${matchedIds.length}\n- Missing data: ${unmatchedIds.length}`);
}