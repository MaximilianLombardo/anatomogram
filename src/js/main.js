let expressionData = null;
let uberonIdMap = null;
let maleSvgDoc = null;
let femaleSvgDoc = null;

document.addEventListener('DOMContentLoaded', () => {
    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.style.display = 'block';

    Promise.all([
        d3.json('/data/expression_data.json'),
        d3.json('/data/uberon_id_map.json'),
        d3.xml('/assets/svg/homo_sapiens.male.svg'),
        d3.xml('/assets/svg/homo_sapiens.female.svg')
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

    // Get actual min/max values for the legend
    const values = Object.values(geneData).filter(v => typeof v === 'number');
    const minValue = d3.min(values) || 0;
    const maxValue = d3.max(values) || 1;

    createLegend(colorScale, selectedScale, minValue, maxValue, geneData);

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

function createLegend(colorScale, scaleType, minValue, maxValue, geneData) {
    const legendContainer = document.getElementById('legend');
    legendContainer.innerHTML = `<h3>Expression Level (${scaleType})</h3>`;

    const steps = 5;
    
    // For log scale, we need to handle the range differently
    if (scaleType === 'log') {
        const values = Object.values(geneData).filter(v => typeof v === 'number' && v > 0);
        const minPositive = d3.min(values) || 0.001;
        
        // Create log-spaced values
        const logMin = Math.log10(minPositive);
        const logMax = Math.log10(maxValue);
        
        for (let i = 0; i <= steps; i++) {
            const logValue = logMin + (logMax - logMin) * (i / steps);
            const value = Math.pow(10, logValue);
            
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';

            const colorBox = document.createElement('div');
            colorBox.className = 'legend-color';
            colorBox.style.backgroundColor = colorScale(value);

            const label = document.createElement('span');
            label.className = 'legend-label';
            // Format based on value magnitude
            if (value < 0.01 || value > 1000) {
                label.textContent = value.toExponential(2);
            } else {
                label.textContent = value.toFixed(3);
            }

            legendItem.appendChild(colorBox);
            legendItem.appendChild(label);
            legendContainer.appendChild(legendItem);
        }
        
        // Add zero value indicator if there are zero values
        if (Object.values(geneData).some(v => v === 0)) {
            const zeroItem = document.createElement('div');
            zeroItem.className = 'legend-item';
            
            const colorBox = document.createElement('div');
            colorBox.className = 'legend-color';
            colorBox.style.backgroundColor = colorScale(0);
            
            const label = document.createElement('span');
            label.className = 'legend-label';
            label.textContent = '0';
            
            zeroItem.appendChild(colorBox);
            zeroItem.appendChild(label);
            legendContainer.insertBefore(zeroItem, legendContainer.children[1]); // After title
        }
    } else {
        // Linear scale
        for (let i = 0; i <= steps; i++) {
            const value = minValue + (maxValue - minValue) * (i / steps);
            
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';

            const colorBox = document.createElement('div');
            colorBox.className = 'legend-color';
            colorBox.style.backgroundColor = colorScale(value);

            const label = document.createElement('span');
            label.className = 'legend-label';
            // Format based on value magnitude
            if (value < 0.01 || value > 1000) {
                label.textContent = value.toExponential(2);
            } else if (value < 1) {
                label.textContent = value.toFixed(3);
            } else {
                label.textContent = value.toFixed(2);
            }

            legendItem.appendChild(colorBox);
            legendItem.appendChild(label);
            legendContainer.appendChild(legendItem);
        }
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
    try {
        const svgElement = document.querySelector('#anatomogram-container svg');
        if (!svgElement) {
            alert('No SVG to export');
            return;
        }

        const selectedGene = document.getElementById('gene-selector').value;
        const selectedScale = document.getElementById('scale-type-selector').value;
        const selectedSex = document.querySelector('input[name="sex"]:checked').value;
        const legendElement = document.getElementById('legend');

        // Create a wrapper SVG that includes both anatomogram and legend
        const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        
        // Get original SVG viewBox for proper scaling
        const viewBoxAttr = svgElement.getAttribute('viewBox');
        console.log('ViewBox attribute:', viewBoxAttr);
        
        let originalWidth, originalHeight;
        if (viewBoxAttr && viewBoxAttr.trim()) {
            const viewBox = viewBoxAttr.split(' ');
            originalWidth = parseFloat(viewBox[2]) || 106;
            originalHeight = parseFloat(viewBox[3]) || 195;
        } else {
            // Fallback to width/height attributes
            originalWidth = parseFloat(svgElement.getAttribute('width')) || 106;
            originalHeight = parseFloat(svgElement.getAttribute('height')) || 195;
        }
        console.log('Original dimensions:', originalWidth, 'x', originalHeight);
    
    // Set target size for publication (anatomogram width)
    const targetAnatomogramWidth = 600;
    const scaleFactor = targetAnatomogramWidth / originalWidth;
    const targetAnatomogramHeight = originalHeight * scaleFactor;
    
    // Legend dimensions scaled appropriately
    const legendWidth = 250;
    const legendPadding = 40;
    const gap = 40;
    const svgPadding = 20;
    
    // Calculate total dimensions with padding
    const totalWidth = targetAnatomogramWidth + legendWidth + gap + (svgPadding * 2);
    const totalHeight = targetAnatomogramHeight + (svgPadding * 2);
    
    // Set wrapper dimensions and viewBox
    wrapper.setAttribute('width', totalWidth);
    wrapper.setAttribute('height', totalHeight);
    wrapper.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
    wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    wrapper.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    // Add metadata
    const metadata = document.createElementNS('http://www.w3.org/2000/svg', 'metadata');
    metadata.innerHTML = `
        <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                 xmlns:dc="http://purl.org/dc/elements/1.1/">
            <rdf:Description rdf:about="">
                <dc:title>Gene Expression Anatomogram - ${selectedGene}</dc:title>
                <dc:description>Expression levels for ${selectedGene} (${selectedScale} scale, ${selectedSex})</dc:description>
                <dc:date>${new Date().toISOString()}</dc:date>
                <dc:creator>Anatomogram Visualization Tool</dc:creator>
            </rdf:Description>
        </rdf:RDF>
    `;
    wrapper.appendChild(metadata);
    
    // Clone and process the anatomogram
    const anatomogramGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    anatomogramGroup.setAttribute('transform', `translate(${svgPadding}, ${svgPadding})`);
    const svgClone = svgElement.cloneNode(true);
    
    // Set the scaled dimensions on the cloned SVG
    svgClone.setAttribute('width', targetAnatomogramWidth);
    svgClone.setAttribute('height', targetAnatomogramHeight);
    if (viewBoxAttr) {
        svgClone.setAttribute('viewBox', viewBoxAttr);
    } else {
        svgClone.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
    }
    
    // Convert all computed styles to inline styles for the anatomogram
    const allElements = svgClone.querySelectorAll('*');
    allElements.forEach(elem => {
        const computedStyle = window.getComputedStyle(elem);
        if (computedStyle.fill && computedStyle.fill !== 'none' && computedStyle.fill !== 'rgb(0, 0, 0)') {
            elem.setAttribute('fill', computedStyle.fill);
        }
        if (computedStyle.stroke && computedStyle.stroke !== 'none') {
            elem.setAttribute('stroke', computedStyle.stroke);
        }
        if (computedStyle.strokeWidth) {
            elem.setAttribute('stroke-width', computedStyle.strokeWidth);
        }
        // Remove any class attributes to ensure styles are embedded
        elem.removeAttribute('class');
    });
    
    // Add the entire SVG to preserve scaling
    anatomogramGroup.appendChild(svgClone);
    wrapper.appendChild(anatomogramGroup);
    
    // Create legend as SVG
    const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    legendGroup.setAttribute('transform', `translate(${svgPadding + targetAnatomogramWidth + gap}, ${svgPadding + legendPadding})`);
    
    // Add legend title
    const legendTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    legendTitle.setAttribute('x', '0');
    legendTitle.setAttribute('y', '0');
    legendTitle.setAttribute('font-family', 'Arial, sans-serif');
    legendTitle.setAttribute('font-size', '20');
    legendTitle.setAttribute('font-weight', 'bold');
    legendTitle.textContent = `Expression Level (${selectedScale})`;
    legendGroup.appendChild(legendTitle);
    
    // Add legend items
    const legendItems = legendElement.querySelectorAll('.legend-item');
    legendItems.forEach((item, index) => {
        const colorBox = item.querySelector('.legend-color');
        const label = item.querySelector('.legend-label');
        
        if (colorBox && label) {
            const yPos = 40 + (index * 35);
            
            // Add color rectangle
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', '0');
            rect.setAttribute('y', yPos);
            rect.setAttribute('width', '40');
            rect.setAttribute('height', '25');
            rect.setAttribute('fill', colorBox.style.backgroundColor);
            rect.setAttribute('stroke', '#000');
            rect.setAttribute('stroke-width', '1');
            legendGroup.appendChild(rect);
            
            // Add label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '50');
            text.setAttribute('y', yPos + 18);
            text.setAttribute('font-family', 'Arial, sans-serif');
            text.setAttribute('font-size', '16');
            text.textContent = label.textContent;
            legendGroup.appendChild(text);
        }
    });
    
    wrapper.appendChild(legendGroup);
    
    // Serialize the complete SVG
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(wrapper);

    // Add XML declaration
    svgString = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + svgString;

    const blob = new Blob([svgString], {
        type: 'image/svg+xml;charset=utf-8'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `anatomogram_${selectedGene}_${selectedScale}_${selectedSex}.svg`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error('Error exporting SVG:', error);
        alert('Error exporting SVG. Please check the console for details.');
    }
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