# Data Format Specification

This document describes the data formats used by the Anatomogram Visualization tool.

## Expression Data Format

Expression data must be provided as a JSON file with a specific structure.

### Structure

```json
{
  "genes": {
    "GENE_NAME_1": {
      "UBERON_ID_1": expression_value,
      "UBERON_ID_2": expression_value,
      ...
    },
    "GENE_NAME_2": {
      ...
    }
  }
}
```

### Fields

- **genes** (required): Top-level object containing all gene expression data
- **GENE_NAME**: String key representing the gene symbol (e.g., "TP53", "EGFR", "MYC")
- **UBERON_ID**: String key in format "UBERON_XXXXXXX" where X is a digit
- **expression_value**: Numeric value representing expression level (can be any scale)

### Example

```json
{
  "genes": {
    "TP53": {
      "UBERON_0002107": 0.72,
      "UBERON_0000955": 0.82,
      "UBERON_0002048": 0.61,
      "UBERON_0002113": 0.70
    },
    "EGFR": {
      "UBERON_0002107": 0.38,
      "UBERON_0000955": 0.35,
      "UBERON_0002048": 0.45,
      "UBERON_0002113": 0.82
    }
  }
}
```

### Notes on Expression Values

- Values can be in any numeric range (e.g., 0-1, 0-100, log2 fold change)
- The visualization will automatically scale values to the color range
- Zero and negative values are supported
- Missing tissues (UBERON IDs not in the data) will appear grey

## UBERON Mapping Format (Optional)

The UBERON mapping file provides human-readable names for anatomical structures.

### Structure

```json
{
  "UBERON_ID": "Tissue Name",
  ...
}
```

### Example

```json
{
  "UBERON_0002107": "Liver",
  "UBERON_0000955": "Brain", 
  "UBERON_0002048": "Heart",
  "UBERON_0002113": "Kidney",
  "UBERON_0002106": "Spleen",
  "UBERON_0001264": "Pancreas"
}
```

### Default Mapping

If no custom UBERON mapping is provided, the tool uses the default mapping in `data/sample/uberon_id_map.json`.

## Finding UBERON IDs

### List All Available IDs

To see all UBERON IDs available in the anatomogram SVGs:

```bash
# For male anatomogram
grep -o 'id="UBERON_[0-9]*"' ../assets/svg/homo_sapiens.male.svg | sort | uniq

# For female anatomogram  
grep -o 'id="UBERON_[0-9]*"' ../assets/svg/homo_sapiens.female.svg | sort | uniq
```

### Common UBERON IDs

| UBERON ID | Tissue Name |
|-----------|-------------|
| UBERON_0002107 | Liver |
| UBERON_0000955 | Brain |
| UBERON_0002048 | Heart |
| UBERON_0002113 | Kidney |
| UBERON_0002106 | Spleen |
| UBERON_0001264 | Pancreas |
| UBERON_0000992 | Ovary |
| UBERON_0000473 | Testis |
| UBERON_0001255 | Bladder |
| UBERON_0000945 | Stomach |
| UBERON_0001155 | Colon |
| UBERON_0002108 | Small Intestine |

### Sex-Specific Tissues

Some tissues are only present in one anatomogram:

**Male-specific:**
- UBERON_0000989 (Penis)
- UBERON_0002367 (Prostate)
- UBERON_0000998 (Seminal Vesicle)
- UBERON_0001301 (Epididymis)

**Female-specific:**
- UBERON_0000992 (Ovary)
- UBERON_0000995 (Uterus)
- UBERON_0001987 (Vagina)
- UBERON_0002412 (Cervix)
- UBERON_0003889 (Fallopian Tube)
- UBERON_0001295 (Endometrium)

## Data Preparation Tips

### From CSV

If your data is in CSV format, you can convert it to the required JSON format:

```python
import csv
import json

# Read CSV (assumes columns: gene, uberon_id, expression)
data = {"genes": {}}

with open('expression_data.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        gene = row['gene']
        uberon = row['uberon_id']
        expr = float(row['expression'])
        
        if gene not in data['genes']:
            data['genes'][gene] = {}
        
        data['genes'][gene][uberon] = expr

# Write JSON
with open('expression_data.json', 'w') as f:
    json.dump(data, f, indent=2)
```

### From Gene Expression Databases

Many databases provide expression data that can be converted:

1. **Expression Atlas**: Download data and map tissue names to UBERON IDs
2. **GTEx**: Use tissue mapping to convert GTEx tissue names to UBERON
3. **HPA**: Human Protein Atlas tissue names can be mapped to UBERON

### Data Validation

Before using your data, verify:

1. JSON is valid (use a JSON validator)
2. All UBERON IDs follow the correct format
3. Expression values are numeric
4. At least one gene is present
5. Each gene has at least one tissue

## Troubleshooting

### Common Issues

1. **"Error loading data"**: Check JSON syntax is valid
2. **Tissues appear grey**: Verify UBERON IDs match those in SVG
3. **Wrong tissue highlighted**: Check for typos in UBERON IDs
4. **Missing tissues**: Some tissues may not have UBERON IDs in the SVG

### Validation Script

You can validate your data file:

```bash
python -m json.tool your_data.json > /dev/null && echo "Valid JSON" || echo "Invalid JSON"
```

## Support

For questions about data formats, please open an issue on GitHub.