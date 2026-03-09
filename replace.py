import os

directory = 'server'
for root, _, files in os.walk(directory):
    for filename in files:
        if filename.endswith('.ts'):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r') as f:
                content = f.read()
            if 'statusMessage:' in content:
                content = content.replace('statusMessage:', 'message:')
                with open(filepath, 'w') as f:
                    f.write(content)
print("Done")
