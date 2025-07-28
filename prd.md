### Technical Specification for Implementation

This document provides a detailed, step-by-step guide for constructing the interactive anatomogram visualization, based on the approved project plan.

#### 1. Project File Structure

To keep the project organized, we will use the following file structure:

```
/anatomogram-visualization/
|-- index.html              # The main HTML file
|-- css/
|   |-- style.css           # All custom styles
|-- js/
|   |-- main.js             # All D3 and application logic
|-- data/
|   |-- expression_data.json # Gene expression data
|   |-- uberon_id_map.json   # Mapping of UBERON IDs to readable names
|-- svg/
|   |-- homo_sapiens.male.svg   # The downloaded male anatomogram
|   |-- homo_sapiens.female.svg # The downloaded female anatomogram
```

#### 2. Pre-processing & Asset Preparation

* **SVG Cleaning (Recommended):** Before use, inspect both `.svg` files in a vector editor (like Inkscape) to remove any non-tissue paths, hidden layers, or metadata to ensure D3 only interacts with relevant tissue elements.
* **UBERON ID to Name Mapping:** Create the `uberon_id_map.json` file. This will be a simple key-value object. The data can be sourced from ontology files found in resources like the **CZI cellxgene-ontology-guide** (`https://github.com/chanzuckerberg/cellxgene-ontology-guide`).
    ```json
    {
      "UBERON_0002107": "Liver",
      "UBERON_0000955": "Brain",
      "UBERON_0002106": "Lung"
    }
    ```

#### 3. Data (`data/expression_data.json`)

* **Requirement:** Create a mock JSON file. The mock data should include expression values for both shared and sex-specific tissues (e.g., `UBERON_0001264` for Ovary, `UBERON_0000992` for Testis).
* **Data Normalization:** The application will assume that expression values are pre-normalized to a `[0, 1]` range for the default linear scale.

#### 4. HTML (`index.html`)

1.  **Header:** A title for the project.
2.  **Controls Wrapper:** A `div` to hold all UI elements.
    * **[New]** Sex Selector: `<label>View:</label><div id="sex-selector"><input type="radio" id="male" name="sex" value="male" checked><label for="male">Male</label><input type="radio" id="female" name="sex" value="female"><label for="female">Female</label></div>`
    * Gene Selector: `<label for="gene-selector">Gene:</label><select id="gene-selector"></select>`
    * Color Palette: `<label for="color-palette-selector">Palette:</label><select id="color-palette-selector"></select>`
    * Scale Type: `<label for="scale-type-selector">Scale:</label><select id="scale-type-selector"><option value="linear">Linear</option><option value="log">Logarithmic</option></select>`
    * Export Button: `<button id="export-svg-button">Export as SVG</button>`
3.  **Main Content Wrapper:**
    * Loading Indicator: `<div id="loading-indicator">Loading Visualization...</div>`
    * Visualization Container: `<div id="anatomogram-container"></div>`
4.  **Tooltip Element:** A hidden div for tooltips: `<div id="tooltip" class="tooltip"></div>`
5.  **Legend Wrapper:** A `<div id="legend">` for the color scale legend.
6.  **Scripts:** Links to D3.js and `main.js`.

#### 5. CSS (`css/style.css`)

1.  **Layout & UI:** Basic styles for layout, selectors, and buttons.
2.  **SVG Styling:**
    * Make the SVG responsive: `#anatomogram-container svg { width: 100%; height: auto; }`
    * Default `fill`, `stroke`, and `stroke-width` for all tissue paths.
    * A `:hover` effect on paths for interactivity.
3.  **Tooltip Styling:** `position: absolute; display: none;` etc.

#### 6. JavaScript (`js/main.js`)

1.  **Initial State:** Display the `#loading-indicator`.
2.  **Data Loading:** Use `Promise.all` to concurrently load `expression_data.json`, `uberon_id_map.json`, `homo_sapiens.male.svg`, and `homo_sapiens.female.svg`.
3.  **Initialization Function (`init(...)`):**
    * Called on successful data load. Hide the `#loading-indicator`.
    * Store all loaded data and both SVG documents in global variables.
    * **[New]** Call a new function `switchAnatomogram('male')` to perform the initial render.
    * Populate all selectors (gene, palette).
    * **Attach Event Listeners:**
        * `change` listeners for gene, palette, and scale type selectors. All will trigger a redraw by calling `update()`.
        * `change` listener for the new `#sex-selector`. This will call `switchAnatomogram()` with the selected value.
        * `click` listener for the export button.
4.  **[New] Anatomogram Switching Function (`switchAnatomogram(sex)`):**
    * Takes 'male' or 'female' as input.
    * Clears any existing SVG from `#anatomogram-container`.
    * Selects the appropriate SVG document from the stored global variables.
    * Appends a clone of the selected SVG document to the container.
    * Attaches the `mouseover`, `mousemove`, and `mouseout` listeners to the paths of the newly added SVG to ensure tooltips work.
    * Calls the main `update()` function to apply the current color styles.
5.  **Color Scale Function (`setColorScale(paletteName, scaleType)`):**
    * Creates and returns the appropriate D3 scale (linear or log) based on user selection.
    * Handles the domain for the log scale to avoid `log(0)` errors.
6.  **Update Function (`update()`):**
    * Reads the current state from all selectors (gene, palette, scale, **but not sex**).
    * Calls `setColorScale()` to get the correct, up-to-date scale.
    * Updates the legend based on the new scale.
    * Selects all paths in the *currently displayed* SVG and applies colors based on expression values.
7.  **Tooltip Functions (`onMouseOver`, `onMouseMove`, `onMouseOut`):**
    * Logic remains the same. They will operate on whichever SVG is currently in the DOM.
8.  **Export Function (`exportSVG()`):**
    * Logic remains the same. It will correctly serialize and download the currently visible SVG.
