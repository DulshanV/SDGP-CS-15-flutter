import fitz

files = [
    (r'C:\Users\Asus\Downloads\SDGP CW 2 - Implementation Report Template and Guidelines.pdf',
     r'C:\Users\Asus\Documents\GitHub\SDGP-CS-15-flutter\_cw2_template.txt'),
    (r'C:\Users\Asus\Downloads\SDGP CW 2 - 5COSC021C - Rubric V2 - 2025_26-IIT.xlsx - Sheet1.pdf',
     r'C:\Users\Asus\Documents\GitHub\SDGP-CS-15-flutter\_cw2_rubric.txt'),
    (r'C:\Users\Asus\Desktop\SDGP\SDGP8888\SDGP8888\SDGP\w2152987_20241953_CS15-CW1-Group.pdf',
     r'C:\Users\Asus\Documents\GitHub\SDGP-CS-15-flutter\_cw1_report.txt'),
]

for pdf_path, out_path in files:
    doc = fitz.open(pdf_path)
    with open(out_path, 'w', encoding='utf-8') as f:
        for page in doc:
            f.write(page.get_text())
            f.write('\n---PAGE_BREAK---\n')
    with open(out_path, 'r', encoding='utf-8') as f:
        size = len(f.read())
    print(f"Wrote {out_path}: {size} chars")
