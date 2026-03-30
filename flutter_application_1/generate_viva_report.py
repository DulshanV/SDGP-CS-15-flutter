import os
import html

project_path = r'c:\Users\Asus\Documents\GitHub\SDGP-CS-15-flutter\flutter_application_1\lib'
output_html = r'c:\Users\Asus\Documents\GitHub\SDGP-CS-15-flutter\flutter_application_1\viva_contributions.html'

files_to_include = [
    'config.dart',
    'main.dart',
    'models/category_model.dart',
    'models/pricing_model.dart',
    'models/search_result.dart',
    'models/user_model.dart',
    'screens/admin_dashboard.dart',
    'screens/favorites_page.dart',
    'screens/history_page.dart',
    'screens/home_page.dart',
    'screens/hs_code_detail_page.dart',
    'screens/intro_page.dart',
    'screens/login_page.dart',
    'screens/pricing_page.dart',
    'screens/profile_page.dart',
    'screens/recents_page.dart',
    'screens/search_page.dart',
    'screens/signup_page.dart',
    'services/api_service.dart',
    'services/auth_service.dart',
    'services/categories_service.dart',
    'services/favorites_service.dart',
    'services/pricing_service.dart',
    'services/search_history_service.dart',
    'theme/app_colors.dart',
    'theme/app_spacing.dart',
    'theme/app_theme.dart',
    'widgets/logo_app_bar.dart'
]

html_template_start = r"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CeylonHS Project - My Contributions</title>
    <!-- Google Fonts: Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
    <!-- Prism.js Syntax Highlighting -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet" />
    <style>
        :root {
            --primary-blue: #2A72D6;
            --text-heading: #1A1C1E;
            --text-body: #44474E;
            --bg-surface: #F9F9FB;
        }

        body {
            font-family: 'Inter', sans-serif;
            color: var(--text-body);
            background-color: #FFFFFF;
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
        }

        header {
            margin-bottom: 60px;
            border-bottom: 2px solid var(--bg-surface);
            padding-bottom: 30px;
        }

        h1 {
            font-size: 32px;
            font-weight: 700;
            color: var(--text-heading);
            margin: 0 0 10px 0;
        }

        h2 {
            font-size: 24px;
            font-weight: 600;
            color: var(--text-heading);
            margin: 40px 0 20px 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #E0E2E6;
        }

        .subtitle {
            font-size: 16px;
            color: var(--text-body);
            margin: 0;
        }

        .toc {
            background-color: var(--bg-surface);
            padding: 24px;
            border-radius: 12px;
            margin-bottom: 60px;
        }

        .toc h3 {
            margin-top: 0;
            font-size: 18px;
            color: var(--text-heading);
        }

        .toc ul {
            list-style: none;
            padding: 0;
            margin: 0;
            column-count: 2;
        }

        @media (max-width: 600px) {
            .toc ul { column-count: 1; }
        }

        .toc li {
            margin-bottom: 8px;
        }

        .toc a {
            text-decoration: none;
            color: var(--primary-blue);
            font-size: 14px;
            font-weight: 500;
        }

        .toc a:hover {
            text-decoration: underline;
        }

        .file-section {
            page-break-before: always;
            margin-bottom: 60px;
        }

        .file-path {
            font-family: 'JetBrains Mono', monospace;
            background: #F1F3F5;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 14px;
            color: #495057;
        }

        pre[class*="language-"] {
            border-radius: 12px;
            font-size: 13px;
            margin: 20px 0;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }

        /* Printing adjustments */
        @media print {
            body { background: white; }
            .container { max-width: 100%; padding: 0; }
            .toc { background: none; border: 1px solid #EEE; }
            pre[class*="language-"] { box-shadow: none; border: 1px solid #EEE; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>CeylonHS Project - My Contributions</h1>
            <p class="subtitle">Complete extract of custom logic, UI implementations, and core services for the viva presentation.</p>
        </header>

        <section class="toc">
            <h3>Table of Contents</h3>
            <ul>
"""

html_template_end = r"""
            </ul>
        </section>

        <main id="content">
            <!-- Code content will be injected here -->
        </main>
    </div>

    <!-- Prism.js Script -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-dart.min.js"></script>
</body>
</html>
"""

with open(output_html, 'w', encoding='utf-8') as f:
    f.write(html_template_start)
    
    # Write TOC items
    for i, rel_path in enumerate(files_to_include):
        anchor = f"file-{i}"
        f.write(f'                <li><a href="#{anchor}">{rel_path}</a></li>\n')
    
    f.write("""
            </ul>
        </section>

        <main id="content">
""")
    
    # Write File sections
    for i, rel_path in enumerate(files_to_include):
        full_path = os.path.join(project_path, rel_path.replace('/', os.sep))
        anchor = f"file-{i}"
        if os.path.exists(full_path):
            with open(full_path, 'r', encoding='utf-8') as cf:
                code_content = cf.read()
            
            f.write(f'<section id="{anchor}" class="file-section">\n')
            f.write(f'    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">\n')
            f.write(f'        <h2>{os.path.basename(rel_path)}</h2>\n')
            f.write(f'        <span class="file-path">lib/{rel_path}</span>\n')
            f.write(f'    </div>\n')
            f.write(f'    <pre><code class="language-dart">{html.escape(code_content)}</code></pre>\n')
            f.write(f'</section>\n\n')
        else:
            print(f"Warning: File not found: {full_path}")
            
    f.write(html_template_end)

print(f"Extraction complete. Output saved to {output_html}")
print("Tip: Open this file in Chrome or Edge and press Ctrl+P to Save as PDF.")
