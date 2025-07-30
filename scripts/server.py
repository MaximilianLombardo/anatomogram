#!/usr/bin/env python3
"""
Anatomogram Visualization Server

A development server for the anatomogram visualization tool that allows
loading custom expression data via command line arguments.
"""

import argparse
import http.server
import socketserver
import json
import os
import sys
from pathlib import Path

class ExpressionDataHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP handler that serves expression data from specified files"""
    
    def __init__(self, *args, expression_data=None, uberon_map=None, **kwargs):
        self.expression_data = expression_data
        self.uberon_map = uberon_map
        # Change to repository root for serving
        os.chdir(os.path.join(os.path.dirname(__file__), '..'))
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """Handle GET requests, intercepting data file requests"""
        if self.path == '/data/expression_data.json' and self.expression_data:
            self.send_json_file(self.expression_data)
        elif self.path == '/data/uberon_id_map.json' and self.uberon_map:
            self.send_json_file(self.uberon_map)
        elif self.path == '/' or self.path == '/index.html':
            # Serve index.html from src directory
            self.path = '/src/index.html'
            super().do_GET()
        elif self.path.endswith('.html') or self.path.endswith('.js') or self.path.endswith('.css'):
            # Serve other web files from src directory if not already prefixed
            if not self.path.startswith('/src/'):
                self.path = '/src' + self.path
            super().do_GET()
        else:
            # For all other requests, use default handler
            super().do_GET()
    
    def send_json_file(self, filepath):
        """Send a JSON file with appropriate headers"""
        try:
            with open(filepath, 'r') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(content.encode())
        except Exception as e:
            self.send_error(404, f"File not found: {e}")
    
    def log_message(self, format, *args):
        """Override to provide cleaner logging"""
        if args[1] == '200':
            # Only log successful requests for data files
            if '/data/' in args[0] or args[0].endswith('.html'):
                print(f"✓ {args[0]}")
        elif args[1] != '304':  # Don't log 'not modified' responses
            super().log_message(format, *args)

def validate_json_file(filepath, file_type):
    """Validate JSON file format and content"""
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        if file_type == 'expression':
            if 'genes' not in data:
                raise ValueError("Expression data must have 'genes' key")
            
            gene_count = len(data['genes'])
            tissue_counts = {}
            
            for gene, tissues in data['genes'].items():
                tissue_counts[gene] = len(tissues)
            
            print(f"✓ Loaded {gene_count} genes")
            print(f"  Sample: {list(data['genes'].keys())[:3]}...")
            print(f"  Tissues per gene: {list(tissue_counts.values())[:3]}...")
        
        elif file_type == 'uberon':
            print(f"✓ Loaded {len(data)} UBERON mappings")
            print(f"  Sample: {list(data.items())[:3]}...")
        
        return True
    
    except json.JSONDecodeError as e:
        print(f"✗ Invalid JSON in {filepath}: {e}")
        return False
    except Exception as e:
        print(f"✗ Error validating {filepath}: {e}")
        return False

def find_default_uberon_map():
    """Find the default UBERON mapping file"""
    possible_paths = [
        'data/sample/uberon_id_map.json',
        '../data/sample/uberon_id_map.json',
        'data/uberon_id_map.json',
        '../data/uberon_id_map.json'
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return os.path.abspath(path)
    
    return None

def main():
    parser = argparse.ArgumentParser(
        description='Anatomogram Visualization Server',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Use custom expression data
  python server.py -e my_expression_data.json
  
  # Use custom expression and UBERON mapping
  python server.py -e my_data.json -u my_uberon_map.json
  
  # Run on different port
  python server.py -e data.json -p 8080
  
Data Format:
  Expression data should be JSON with structure:
  {
    "genes": {
      "GENE1": {"UBERON_0000001": 0.5, ...},
      "GENE2": {...}
    }
  }
        '''
    )
    
    parser.add_argument('-e', '--expression-data', required=True,
                        help='Path to expression data JSON file')
    parser.add_argument('-u', '--uberon-map', 
                        help='Path to UBERON ID mapping JSON (uses default if not provided)')
    parser.add_argument('-p', '--port', type=int, default=8000,
                        help='Port to run server on (default: 8000)')
    
    args = parser.parse_args()
    
    # Convert to absolute paths
    expression_path = os.path.abspath(args.expression_data)
    
    # Validate expression data
    print("\n🧬 Validating expression data...")
    if not os.path.exists(expression_path):
        print(f"✗ Expression data file not found: {expression_path}")
        sys.exit(1)
    
    if not validate_json_file(expression_path, 'expression'):
        sys.exit(1)
    
    # Handle UBERON mapping
    if args.uberon_map:
        uberon_path = os.path.abspath(args.uberon_map)
        if not os.path.exists(uberon_path):
            print(f"✗ UBERON mapping file not found: {uberon_path}")
            sys.exit(1)
        if not validate_json_file(uberon_path, 'uberon'):
            sys.exit(1)
    else:
        uberon_path = find_default_uberon_map()
        if uberon_path:
            print(f"\n📖 Using default UBERON mapping: {uberon_path}")
            validate_json_file(uberon_path, 'uberon')
        else:
            print("\n⚠️  No UBERON mapping file found, using embedded mappings")
            uberon_path = None
    
    # Create handler with custom data paths
    handler = lambda *args, **kwargs: ExpressionDataHandler(
        *args, 
        expression_data=expression_path,
        uberon_map=uberon_path,
        **kwargs
    )
    
    # Start server
    try:
        with socketserver.TCPServer(("", args.port), handler) as httpd:
            print(f"\n🚀 Anatomogram Visualization Server")
            print(f"{'─' * 50}")
            print(f"Server: http://localhost:{args.port}")
            print(f"Expression data: {expression_path}")
            if uberon_path:
                print(f"UBERON mapping: {uberon_path}")
            print(f"\nPress Ctrl+C to stop the server")
            print(f"{'─' * 50}\n")
            
            httpd.serve_forever()
    
    except KeyboardInterrupt:
        print("\n\n✋ Server stopped.")
    except OSError as e:
        print(f"\n✗ Error starting server: {e}")
        if 'Address already in use' in str(e):
            print(f"  Port {args.port} is already in use. Try a different port with -p")
        sys.exit(1)

if __name__ == '__main__':
    main()