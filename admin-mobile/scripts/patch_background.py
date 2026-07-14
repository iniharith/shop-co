import os
import re

app_dir = r"C:\Users\PRINTARA\Documents\GitHub\shop-co\admin-mobile\src\app\(app)"

for filename in os.listdir(app_dir):
    if filename.endswith(".tsx"):
        filepath = os.path.join(app_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if "LinearGradient" in content and "expo-linear-gradient" in content:
            # Add AppBackground import if missing
            if "AppBackground" not in content:
                content = re.sub(
                    r"(import\s+\{[^}]*\}\s+from\s+['\"]expo-linear-gradient['\"];?\n?)",
                    r"\1import AppBackground from '../../components/AppBackground';\n",
                    content
                )
            
            # Replace <LinearGradient colors={[colors.gradientStart, colors.gradientEnd, colors.gradientStart]}
            content = re.sub(
                r"<LinearGradient\s+colors=\{\[colors\.gradientStart,\s*colors\.gradientEnd,\s*colors\.gradientStart\]\}",
                r"<AppBackground",
                content
            )
            # Replace </LinearGradient>
            content = content.replace("</LinearGradient>", "</AppBackground>")
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
                
print("Done replacing LinearGradient.")
