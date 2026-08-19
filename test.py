with open('index.html', 'rb') as f:
    text = f.read().decode('utf-8')
    print('Corrupted:', 'â€”' in text)
    print('Clean:', '—' in text)
