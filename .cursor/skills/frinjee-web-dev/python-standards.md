# Python Standards

## References
- https://docs.python.org/3/
- https://peps.python.org/pep-0008/
- https://docs.python-guide.org/
- https://realpython.com/
- https://numpy.org/doc/
- https://pillow.readthedocs.io/
- https://github.com/vinta/awesome-python#built-in-classes-enhancement
- https://github.com/vinta/awesome-python#functional-programming
- https://www.sakisk.me/tags/python/
- https://jakevdp.github.io/
- https://www.fullstackpython.com/
- https://norvig.com/

## General Philosophy
Generate compact, procedural, utility-oriented Python code optimized for readability, direct execution flow, binary/data manipulation clarity, and low abstraction overhead. Code should resemble reverse-engineering tools, binary parsers, image/data processing utilities, compact CLI utilities, filesystem-oriented tooling, and direct format manipulation scripts.

## Dependency Philosophy
Prefer Python standard library modules whenever possible. Introduce external dependencies only when they provide substantial practical value.

## Architecture Preference
Prefer procedural scripts and linear execution flow over class-heavy or framework-heavy designs. Favor explicit execution flow and procedural orchestration. Avoid unnecessary classes, dependency injection, enterprise architecture patterns, abstract base classes, service containers, excessive modularization, and framework scaffolding.

## String Quotes
ALWAYS use single quotes ' ' unless Python syntax, external formats, escaping complexity, or runtime requirements make double quotes absolutely necessary.

Preferred:  path = 'test.png'
Avoid:      path = "test.png"

## Spacing & Layout
- Prefer compact vertical spacing
- Separate logical execution stages with whitespace
- Use visually segmented procedural blocks
- Avoid excessively fragmented helper abstractions

## Function Design
Functions should perform one clear task. Use concise, descriptive names. Prefer direct execution clarity over abstraction purity.

Preferred:  def decompress(raw):
Avoid:      def perform_gzip_decompression_on_raw_binary_data(raw_bytes):

## Commenting Standards
- Use lowercase comments
- Keep comments concise and technical
- Favor shorthand phrasing where readability remains intact
- Explain intent, format structure, offsets, transforms, assumptions, or non-obvious logic
- Inline comments are acceptable when concise and technically useful
- Comment binary layouts, offsets, transformations, edge cases, and format quirks
- Do not comment trivial Python syntax or self-evident assignments

Preferred:  # nearest-neighbor upscale on encoded PNG bytes
Preferred:  for ch in range(3): # R G B
Avoid:      # Iterate through the RGB channels for processing.

## Execution Flow
Prefer: read -> validate -> process -> write

## CLI Standards
Use argparse for command-line tooling. Prefer concise switches and minimal CLI complexity.

Preferred:  p.add_argument('-f', required=True)

## Console Output
Console output should be concise, operational, and technical.

Preferred:  print(f'found gzip at offset {hex(gzip_offset)}')
Preferred:  print(f'done. {frame_count} frames saved')
Avoid:      print('Operation completed successfully.')

## Binary & Data Handling
- Prefer direct byte-level operations with explicit offsets and endianness
- Favor struct.unpack_from for binary parsing
- Preserve visibility of format structure in the implementation
- Prefer explicit transformations over opaque helper libraries
- Keep memory flow understandable and traceable

Preferred:  struct.unpack_from('<I', raw, 0x10)[0]

## Error Handling
Fail fast on fatal conditions. Use concise runtime validation. Prefer direct operational error messages. Avoid large exception hierarchies, verbose recovery systems, unnecessary traceback formatting, and excessive logging frameworks.

Preferred:
  print('[ERROR] no gzip stream found')
  sys.exit(1)

## Variable Naming
Prefer short, descriptive technical names. Technically accurate abbreviations are acceptable.

Preferred:  png_bytes, frame_h, pix_offset, row_stride
Avoid:      processed_image_binary_data

## Performance
Prefer straightforward efficient loops. Avoid unnecessary copies and transformations. Optimize deliberately when processing binary data, image data, compression/decompression, large frame sets, or large byte buffers. Avoid premature micro-optimization, unreadable performance hacks, and unnecessary concurrency abstractions.

## Output Format
Output should consist solely of generated Python code unless otherwise requested. Generated code must be immediately runnable, preserve procedural readability, maintain concise technical aesthetics, and avoid tutorial-style verbosity or excessive explanatory prose inside the code.

## Unconventional Methods
Any unconventional Python techniques or patterns referenced from the above sources must be logically sound and well-justified for implementation.
