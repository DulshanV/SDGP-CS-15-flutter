import os

project_path = r'c:\Users\Asus\Documents\GitHub\SDGP-CS-15-flutter\flutter_application_1\lib'
output_file = r'c:\Users\Asus\Documents\GitHub\SDGP-CS-15-flutter\flutter_application_1\viva_contributions.md'

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

with open(output_file, 'w', encoding='utf-8') as f:
    f.write("# CeylonHS Project - My Contributions\n\n")
    f.write("This document contains all the custom logic, UI implementations, and features developed for the Project.\n\n")
    f.write("---\n\n")
    
    for relative_path in files_to_include:
        full_path = os.path.join(project_path, relative_path.replace('/', os.sep))
        if os.path.exists(full_path):
            f.write(f"## File: {relative_path}\n\n")
            f.write("```dart\n")
            with open(full_path, 'r', encoding='utf-8') as cf:
                f.write(cf.read())
            f.write("\n```\n\n")
            f.write("---\n\n")
        else:
            print(f"Warning: File not found: {full_path}")

print(f"Extraction complete. Output saved to {output_file}")
