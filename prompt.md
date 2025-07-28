### Prompt for Code Generation

**Objective:** Create a complete, self-contained interactive gene expression visualization web application based on the detailed technical specifications provided.

**Instructions:**

Please generate the code for the following four files based on the project structure. Ensure the code is well-commented, clean, and directly follows the logic outlined in the specification.

**Project Structure to Follow:**

```
/anatomogram-visualization/
|-- index.html
|-- css/
|   |-- style.css
|-- js/
|   |-- main.js
|-- data/
|   |-- expression_data.json
|   |-- uberon_id_map.json
|-- svg/
|   |-- homo_sapiens.male.svg
|   |-- homo_sapiens.female.svg
```
*(You do not need to generate the SVG files, just assume they exist at the specified paths).*

---

### 1. `index.html`

Create the main HTML file with the following structure:
- A main title for the page.
- A controls `div` containing:
    - A radio button group (`sex-selector`) for 'Male' and 'Female' views, with 'Male' checked by default.
    - A `<select>` dropdown for genes (`gene-selector`).
    - A `<select>` dropdown for color palettes (`color-palette-selector`) with options: Viridis, Magma, Inferno.
    - A `<select>` dropdown for scale type (`scale-type-selector`) with options: Linear, Logarithmic.
    - A `<button>` to export the SVG (`export-svg-button`).
- A `div` for a loading message (`loading-indicator`).
- A `div` to contain the anatomogram SVG (`anatomogram-container`).
- A `div` for the tooltip (`tooltip`), initially hidden.
- A `div` for the color legend (`legend`).
- Script tags to include the D3.js library from a CDN (`https://d3js.org/d3.v7.min.js`) and the local `js/main.js` file.

---

### 2. `css/style.css`

Create the CSS file with the following styles:
- Basic page layout styles (e.g., `font-family`, centered content).
- Styling for the UI controls (selectors, buttons) to make them look clean and organized.
- Responsive styling for the SVG: it should take `100%` width of its container with `auto` height.
- Default styling for all `path` elements within the SVG: a light grey fill (e.g., `#E0E0E0`), a white stroke, and a thin stroke width.
- A `:hover` effect for the SVG paths to provide user feedback (e.g., change stroke color or opacity).
- Styling for the tooltip: `position: absolute`, hidden by default (`display: none`), with padding, a background color, and `pointer-events: none`.

---

### 3. `data/uberon_id_map.json`

Create a JSON file that maps a few sample UBERON IDs to human-readable names.

```json
{
  "UBERON_0002107": "Liver",
  "UBERON_0000955": "Brain",
  "UBERON_0002106": "Lung",
  "UBERON_0001264": "Ovary",
  "UBERON_0000992": "Testis",
  "UBERON_0002048": "Heart",
  "UBERON_0002113": "Kidney"
}
```

---

### 4. `data/expression_data.json`

Create a mock JSON file with sample gene expression data.
- Include at least 3-4 mock genes (e.g., "TP53", "EGFR", "MYC").
- For each gene, provide expression values (normalized between 0 and 1) for a variety of tissues, including both shared and sex-specific ones, using their UBERON IDs as keys.

---

### 5. `js/main.js`

Create the main JavaScript file using D3.js. The logic should proceed as follows:

1.  **Setup:** Use `DOMContentLoaded` to ensure the DOM is ready. Select all necessary DOM elements (selectors, containers, etc.).
2.  **Loading:**
    - Display the loading indicator.
    - Use `Promise.all` to fetch all necessary files: both SVGs, `expression_data.json`, and `uberon_id_map.json`.
3.  **Initialization (`init` function):**
    - Once all data is loaded, hide the loading indicator.
    - Store the loaded data (JSONs and SVG documents) in variables.
    - Populate the gene and color palette selectors from the loaded data.
    - Set up all event listeners for the UI controls (`change` for selectors, `click` for the button).
    - Perform the initial render by calling the `switchAnatomogram('male')` function.
4.  **`switchAnatomogram(sex)` function:**
    - This function is called when the sex is changed.
    - It should clear the `#anatomogram-container`.
    - It appends a clone of the correct SVG (male or female) to the container.
    - It attaches the necessary tooltip event listeners (`mouseover`, `mousemove`, `mouseout`) to all `path` elements within the new SVG.
    - It must call the main `update()` function to color the newly displayed anatomogram correctly.
5.  **`update()` function:**
    - This is the main rendering function, called whenever a control changes.
    - It should get the current values from all selectors (sex, gene, palette, scale).
    - It creates the appropriate D3 color scale (linear or log) based on the selections. Handle the `log(0)` case by mapping 0 values to the lowest color.
    - It updates the color legend.
    - It selects all `path` elements in the currently displayed SVG and applies the `fill` color based on the expression value for the selected gene. If a tissue has no data, it should revert to the default grey color.
6.  **Tooltip Logic:**
    - Implement three functions (`onMouseOver`, `onMouseMove`, `onMouseOut`) to be used as event listeners.
    - `onMouseOver` should make the tooltip visible and populate it with the tissue name (from the ID map) and the exact expression value.
    - `onMouseMove` should update the tooltip's position to follow the cursor.
    - `onMouseOut` should hide the tooltip.
7.  **Export Logic (`exportSVG` function):**
    - Implement the function to serialize the currently displayed SVG element to a string.
    - Create a `Blob` and a downloadable link to save the SVG file, naming it based on the selected gene.
8.  **Legend Logic (`createLegend` function):**
    - Implement a function that takes the current color scale and generates a simple HTML legend (e.g., a series of colored divs and labels).

Please ensure the final code is robust and handles all specified user interactions.
