import os
import re

def add_dialog_description(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.jsx')):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                # If there's DialogTitle but no DialogDescription nearby
                if '<DialogTitle' in content and '<DialogDescription' not in content:
                    # Let's ensure it has DialogDescription imported
                    if 'DialogDescription' not in content and 'DialogTitle' in content:
                        content = re.sub(r'DialogTitle(,|\s|\})', r'DialogTitle, DialogDescription\1', content)
                    
                    # Add DialogDescription right after DialogTitle
                    # We'll match </DialogTitle> and replace it with </DialogTitle>\n<DialogDescription className="sr-only">Description</DialogDescription>
                    content = re.sub(
                        r'(</DialogTitle>)',
                        r'\1\n<DialogDescription className="sr-only">Dialog Content</DialogDescription>',
                        content
                    )
                    
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Patched {filepath}")

if __name__ == '__main__':
    add_dialog_description(r'C:\Users\PRINTARA\Documents\GitHub\shop-co\backend\admin\src\components')
