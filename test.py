import base64

with open('engine.ps1', 'rb') as f:
    engine_bytes = f.read()

b64_str = base64.b64encode(engine_bytes).decode('ascii')

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1
content = content.replace(
    'echo  Done! Check Desktop for ShortcutVirusRemover_Report.txt',
    'echo  Done! You may close this window.'
)

# Fix 2
old_ps1_func = '''    function downloadPs1() {
      const url = 'engine.ps1';
      const a = document.createElement('a');
      a.href = url;
      a.download = 'engine.ps1';
      a.click();
    }'''

new_ps1_func = f'''    function downloadPs1() {{
      const base64 = `{b64_str}`;
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {{
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }}
      const byteArray = new Uint8Array(byteNumbers);
      downloadFile('engine.ps1', byteArray, 'application/octet-stream');
    }}'''

if old_ps1_func in content:
    content = content.replace(old_ps1_func, new_ps1_func)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Replacements applied successfully.')
else:
    print('Failed to find old_ps1_func in index.html')
