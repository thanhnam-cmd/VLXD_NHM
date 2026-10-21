with open('scripts/build_seed_file.py', 'r', encoding='utf-8') as f:
    text_seed = f.read()

pos = text_seed.find('out_lines = []')
seed_logic = text_seed[pos:]

with open('scripts/generate_full_sql.py', 'r', encoding='utf-8') as f:
    gen_code = f.read()

helpers = """
def esc(v):
    if v is None: return 'NULL'
    s = str(v).strip()
    if s == '' or s == 'NULL' or s == '-': return 'NULL'
    return "'" + s.replace("'", "''") + "'"

def norm_ts(ts):
    if not ts: return 'NULL'
    s = re.sub(r'\\s+', ' ', str(ts)).strip()
    return f"'{s}'"
"""

full_script = gen_code + "\n\n" + helpers + "\n\n" + seed_logic

with open('scripts/run_generate.py', 'w', encoding='utf-8') as f:
    f.write(full_script)

print("Created scripts/run_generate.py with helpers!")
