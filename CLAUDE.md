# CLAUDE.md for Anatomogram Visualization Project

This file provides context and instructions for working on the interactive gene expression anatomogram project.

---

## Core Project Files

The project is structured as follows. Refer to these files when making changes.

```
/anatomogram-visualization/
|-- index.html              # Main HTML structure and UI controls
|-- css/
|   |-- style.css           # All custom styles
|-- js/
|   |-- main.js             # All D3.js and application logic
|-- data/
|   |-- expression_data.json # Gene expression data
|   |-- uberon_id_map.json   # Maps UBERON IDs to human-readable names
|-- svg/
|   |-- homo_sapiens.male.svg   # Male anatomogram SVG
|   |-- homo_sapiens.female.svg # Female anatomogram SVG
```

---

## Key Libraries & Dependencies

- **D3.js (v7):** This is the core library for data visualization. Use the CDN link in `index.html`: `https://d3js.org/d3.v7.min.js`. All data-binding, DOM manipulation, and color scaling should use D3.

---

## Code Style & Guidelines

- **JavaScript:** Write clean, well-commented, modern JavaScript (ES6+).
- **D3:** Follow D3 v7 conventions. Use `Promise.all` for loading multiple data files concurrently.
- **CSS:** Keep styles organized. Use IDs for primary containers and classes for reusable styles.
- **HTML:** Maintain a clean separation of concerns. UI controls should be grouped together.

---

## Development Workflow & Core Logic

When asked to implement or modify features, follow this general workflow which is implemented in `js/main.js`.

1.  **Initial Setup (`DOMContentLoaded`):**
    - Display the `#loading-indicator`.
    - Use `Promise.all` to fetch all four data/SVG files (`expression_data.json`, `uberon_id_map.json`, `homo_sapiens.male.svg`, `homo_sapiens.female.svg`).

2.  **Initialization (`init` function):**
    - This function is called after all assets are loaded.
    - Hide the `#loading-indicator`.
    - Store all loaded data (JSONs and SVG documents) in global-level variables.
    - Populate the gene and color palette `<select>` dropdowns.
    - Attach all event listeners to the UI controls.
    - Perform the initial render by calling `switchAnatomogram('male')`.

3.  **Anatomogram Switching (`switchAnatomogram(sex)` function):**
    - Clears the `#anatomogram-container`.
    - Appends a clone of the correct SVG (male or female) to the container.
    - **IMPORTANT:** Attaches the tooltip event listeners (`mouseover`, `mousemove`, `mouseout`) to all `path` elements within the newly added SVG.
    - Calls the main `update()` function to apply colors.

4.  **Main Render Loop (`update()` function):**
    - This is the primary rendering function, called whenever a control's value changes.
    - It reads the current state from all UI selectors (sex, gene, palette, scale).
    - It creates the appropriate D3 color scale (linear or log). **You MUST handle the `log(0)` case** by mapping 0 values to the lowest color.
    - It calls `createLegend()` to update the color legend.
    - It selects all `path` elements in the currently displayed SVG and applies the `fill` color based on the expression value. If a tissue has no data, its fill should be the default grey (`#E0E0E0`).

5.  **Tooltip Logic:**
    - Implement three functions (`onMouseOver`, `onMouseMove`, `onMouseOut`).
    - `onMouseOver` must display the tooltip and populate it with the tissue name (from the UBERON map) and the precise expression value.
    - `onMouseMove` updates the tooltip's position to follow the cursor.
    - `onMouseOut` hides the tooltip.

6.  **Export Logic (`exportSVG` function):**
    - Serialize the currently displayed SVG element to a string.
    - Create a `Blob` and a downloadable link to save the SVG file. The filename should be based on the selected gene.

7.  **Legend Logic (`createLegend` function):**
    - This function takes a D3 color scale as input.
    - It generates a simple HTML legend (e.g., a series of colored divs and labels) inside the `#legend` container.
