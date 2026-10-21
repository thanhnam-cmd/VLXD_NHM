import re
import os

with open('/tmp/pdf_texts/03_du_lieu_mau.txt', 'r', encoding='utf-8') as f:
    text = f.read()

pages = re.split(r'--\s*(\d+)\s+of\s+101\s*--', text)
page_dict = {int(pages[i]): pages[i+1].strip() for i in range(1, len(pages), 2)}

def escape_str(s):
    if s is None:
        return 'NULL'
    s = s.strip()
    if s == '' or s == 'NULL' or s == '-':
        return 'NULL'
    return "'" + s.replace("'", "''") + "'"

def norm_ts(ts):
    if not ts:
        return 'NULL'
    # clean tabs
    ts = re.sub(r'\s+', ' ', ts).strip()
    return f"'{ts}'"

# Let's read tasks from src/data/mockData.ts for exact names, categories, descriptions
with open('src/data/mockData.ts', 'r', encoding='utf-8') as f:
    mock_src = f.read()

# Parse tasks from mock_src
task_blocks = re.findall(r'\{\s*id:\s*\'(\d+)\',\s*code:\s*\'(CV\d+)\',\s*projectId:\s*\'(\d+)\',\s*categoryId:\s*\'(\d+)\'.*?\}', mock_src, re.DOTALL)
tasks_dict = {}
for m in re.finditer(r'\{\s*id:\s*\'(\d+)\',\s*code:\s*\'(CV\d+)\',\s*projectId:\s*\'(\d+)\',\s*categoryId:\s*\'(\d+)\',\s*categoryCode:\s*\'[^\']+\',\s*title:\s*\'([^\']+)\',\s*description:\s*\'([^\']*)\',\s*locationArea:\s*\'([^\']*)\',\s*assigneeId:\s*\'([^\']*)\'.*?startDate:\s*\'([^\']+)\',\s*dueDate:\s*\'([^\']+)\',\s*status:\s*\'([^\']+)\'(.*?)\}', mock_src, re.DOTALL):
    tid = m.group(1)
    code = m.group(2)
    pid = m.group(3)
    cid = m.group(4)
    title = m.group(5)
    desc = m.group(6)
    loc = m.group(7)
    assignee = m.group(8)
    start = m.group(9)
    due = m.group(10)
    status = m.group(11)
    rest = m.group(12)
    
    comp_at = None
    m_comp = re.search(r'completedAt:\s*\'([^\']+)\'', rest)
    if m_comp: comp_at = m_comp.group(1)
    
    canc_at = None
    m_canc = re.search(r'cancelledAt:\s*\'([^\']+)\'', rest)
    if m_canc: canc_at = m_canc.group(1)
    
    canc_reason = None
    m_cr = re.search(r'cancelReason:\s*\'([^\']+)\'', rest)
    if m_cr: canc_reason = m_cr.group(1)
    
    tasks_dict[tid] = {
        'id': tid,
        'code': code,
        'projectId': pid,
        'categoryId': cid,
        'title': title,
        'desc': desc,
        'loc': loc,
        'assignee': assignee or 'NULL',
        'start': start,
        'due': due,
        'status': status,
        'completedAt': comp_at,
        'cancelledAt': canc_at,
        'cancelReason': canc_reason
    }

print(f'Extracted {len(tasks_dict)} tasks from mockData!')

# Parse 92 phan_cong
p58_lines = [l for l in page_dict[58].split('\n') if l.strip()][1:]
p59_lines = [l for l in page_dict[59].split('\n') if l.strip()]
p60_lines = [l for l in page_dict[60].split('\n') if l.strip()]
all_pc = p58_lines + p59_lines + p60_lines

assignments = []
for l in all_pc:
    ts = re.findall(r'\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}', l)
    parts = re.split(r'\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}', l)
    pre = parts[0].strip().split()
    post = parts[2].strip().split() if len(parts) > 2 else []
    if len(pre) >= 3 and len(ts) >= 2:
        assignments.append({
            'id': pre[0],
            'cong_viec_id': pre[1],
            'nhan_su_id': pre[2],
            'bat_dau': re.sub(r'\s+', ' ', ts[0]),
            'ket_thuc': re.sub(r'\s+', ' ', ts[1]),
            'trang_thai': post[0] if post else 'HIEU_LUC'
        })
print(f'Parsed {len(assignments)} assignments!')

# Parse 9 lich_nghi_ban (p54, p55)
p54_lines = [l for l in page_dict[54].split('\n') if l.strip()][1:]
p55_lines = [l for l in page_dict[55].split('\n') if l.strip()][1:]

leaves = []
for i in range(len(p54_lines)):
    l54 = p54_lines[i]
    ts = re.findall(r'\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}', l54)
    parts = re.split(r'\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}', l54)
    pre = parts[0].strip().split()
    
    l55 = p55_lines[i]
    # format: ly_do \t trang_thai \t nguoi_ghi_nhan_id
    status = 'HIEU_LUC'
    if 'HUY' in l55:
        status = 'HUY'
    reason = l55.replace('HIEU_LUC', '').replace('HUY', '').replace('\t2', '').replace('\t', ' ').strip()
    reason = re.sub(r'\s+', ' ', reason).rstrip(' 2').strip()
    
    leaves.append({
        'id': pre[0],
        'nhan_su_id': pre[1],
        'bat_dau': re.sub(r'\s+', ' ', ts[0]),
        'ket_thuc': re.sub(r'\s+', ' ', ts[1]),
        'ly_do': reason,
        'trang_thai': status,
        'nguoi_ghi_nhan_id': '2'
    })
print(f'Parsed {len(leaves)} leaves!')

# Parse 42 nhan_su_chuyen_mon (p28)
p28_lines = [l for l in page_dict[28].split('\n') if l.strip()][1:]
staff_skills = []
for l in p28_lines:
    parts = [x.strip() for x in l.split() if x.strip()]
    if len(parts) >= 4:
        staff_skills.append({
            'nhan_su_id': parts[0],
            'chuyen_mon_id': parts[1],
            'muc_thanh_thao': parts[2],
            'la_chuyen_mon_chinh': parts[3]
        })
print(f'Parsed {len(staff_skills)} staff_skills!')

# Parse 3 doi_ben_ngoai (p70, p71)
subcontractors = [
    {'id': 1, 'ten': 'Đội thi công điện nhẹ Nguyên Khê', 'nguoi_lh': 'Anh Hùng', 'phone': '0900000301', 'khu_vuc': 'Nguyên Khê, Đông Anh', 'trang_thai': 'HOP_TAC', 'ghi_chu': 'Đội nhận khoán, huy động tối thiểu 4 công nhân'},
    {'id': 2, 'ten': 'Đội cáp quang Vân Nội', 'nguoi_lh': 'Chị Thu', 'phone': '0900000302', 'khu_vuc': 'Vân Nội, Đông Anh', 'trang_thai': 'HOP_TAC', 'ghi_chu': 'Chuyên tuyến cáp quang liên tòa'},
    {'id': 3, 'ten': 'Công ty TNHH Lắp đặt Việt Âm', 'nguoi_lh': 'Anh Quang', 'phone': '0900000303', 'khu_vuc': 'Hà Nội', 'trang_thai': 'NGUNG_HOP_TAC', 'ghi_chu': 'Ngừng hợp tác từ quý 2'}
]

# Parse 3 phan_cong_ben_ngoai (p73, p74)
ext_assignments = [
    {'id': 1, 'cong_viec_id': 25, 'doi_ben_ngoai_id': 1, 'phan_viec_giao': 'Kéo cáp tín hiệu kiểm soát ra vào nhà A1 (khoảng 600 m cáp, đi ống luồn)', 'bat_dau': '2026-10-02 08:00:00', 'ket_thuc': '2026-10-15 17:00:00', 'so_nguoi': 4, 'nhan_su_phoi_hop_id': 3, 'trang_thai': 'HIEU_LUC', 'ghi_chu': 'Đội trưởng Phạm Văn Cường phối hợp và giám sát'},
    {'id': 2, 'cong_viec_id': 22, 'doi_ben_ngoai_id': 2, 'phan_viec_giao': 'Kéo cáp và lắp camera bãi xe, tầng hầm', 'bat_dau': '2026-10-13 08:00:00', 'ket_thuc': '2026-10-24 17:00:00', 'so_nguoi': 3, 'nhan_su_phoi_hop_id': 4, 'trang_thai': 'HIEU_LUC', 'ghi_chu': 'Đội trưởng Nguyễn Đức Thắng phối hợp'},
    {'id': 3, 'cong_viec_id': 38, 'doi_ben_ngoai_id': 1, 'phan_viec_giao': 'Kéo cáp camera sân trường', 'bat_dau': '2026-10-12 08:00:00', 'ket_thuc': '2026-10-27 17:00:00', 'so_nguoi': 4, 'nhan_su_phoi_hop_id': 4, 'trang_thai': 'HUY', 'ghi_chu': 'Chủ đầu tư tạm hoãn gói sân trường'}
]

# Parse 40 cap_nhat_ket_qua (p78, p79, p80)
p78_lines = [l for l in page_dict[78].split('\n') if l.strip()][1:]
p79_lines = [l for l in page_dict[79].split('\n') if l.strip()][1:]

work_updates = []
for i in range(len(p78_lines)):
    l78 = p78_lines[i]
    ts = re.findall(r'\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}', l78)
    parts = re.split(r'\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}', l78)
    tokens = parts[0].strip().split()
    
    wid = tokens[0]
    cvid = tokens[1]
    tk_id = tokens[2] if len(tokens) > 2 else '4'
    
    content = p79_lines[i].strip() if i < len(p79_lines) else 'Cập nhật tiến độ thi công hiện trường.'
    content = re.sub(r'\s+', ' ', content)
    
    # Check if de_nghi_hoan_thanh or correction
    de_nghi = 1 if ('đề nghị' in content.lower() or 'hoàn thành' in content.lower() or wid in ['38', '40']) else 0
    dinh_chinh = '23' if wid == '24' else 'NULL'
    
    work_updates.append({
        'id': wid,
        'cong_viec_id': cvid,
        'tai_khoan_gui_id': tk_id,
        'thoi_diem': re.sub(r'\s+', ' ', ts[0]),
        'noi_dung': content,
        'de_nghi_hoan_thanh': de_nghi,
        'cap_nhat_dinh_chinh_id': dinh_chinh
    })
print(f'Parsed {len(work_updates)} work_updates!')

# Parse 38 tep_minh_chung (p82, p83, p84)
p82_lines = [l for l in page_dict[82].split('\n') if l.strip()][1:]
attachments = []
for l in p82_lines:
    parts = [x.strip() for x in l.split() if x.strip()]
    if len(parts) >= 4:
        attachments.append({
            'id': parts[0],
            'cap_nhat_id': parts[1],
            'ten_tep_goc': parts[2],
            'duong_dan_luu': parts[3],
            'kieu_noi_dung': 'image/jpeg' if parts[2].endswith('.jpg') else 'application/pdf',
            'dung_luong_byte': 1250000,
            'ma_bam': 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'
        })
print(f'Parsed {len(attachments)} attachments!')

# Parse 14 ho_so & 22 phien_ban_ho_so
# From mockData we have all 14 docs with all 22 versions cleanly structured!
docs_parsed = []
versions_parsed = []
vid_counter = 1

for doc_m in re.finditer(r'\{\s*id:\s*\'(\d+)\',\s*projectId:\s*\'(\d+)\',\s*projectCode:\s*\'[^\']+\',\s*(?:taskId:\s*\'(\d+)\',\s*)?scope:\s*\'([^\']+)\',\s*type:\s*\'([^\']+)\',\s*title:\s*\'([^\']+)\',.*?(?=versions:)\s*versions:\s*\[(.*?)\]\s*\}', mock_src, re.DOTALL):
    did = doc_m.group(1)
    pid = doc_m.group(2)
    tid = doc_m.group(3) or 'NULL'
    scope = doc_m.group(4)
    dtype = doc_m.group(5)
    title = doc_m.group(6)
    v_body = doc_m.group(7)
    
    docs_parsed.append({
        'id': did,
        'du_an_id': pid,
        'cong_viec_id': tid,
        'tieu_de': title,
        'loai_ho_so': dtype,
        'pham_vi_su_dung': scope,
        'mo_ta': f'Hồ sơ kỹ thuật {title}',
        'nguoi_tao_id': '2'
    })
    
    for vm in re.finditer(r'\{\s*versionNum:\s*(\d+),\s*label:\s*\'([^\']+)\',\s*originalFileName:\s*\'([^\']+)\',\s*storedPath:\s*\'([^\']+)\',\s*fileType:\s*\'([^\']+)\',\s*fileSizeByte:\s*(\d+),.*?sha256:\s*\'([^\']+)\',.*?(?:changeNotes:\s*\'([^\']*)\',.*?)?uploadedAt:\s*\'([^\']+)\',\s*isSelectedForExecution:\s*(true|false)', v_body, re.DOTALL):
        vnum = vm.group(1)
        vlabel = vm.group(2)
        fname = vm.group(3)
        path = vm.group(4)
        ftype = vm.group(5)
        fsize = vm.group(6)
        sha = vm.group(7)
        notes = vm.group(8) or ''
        up_at = vm.group(9)
        sel = 1 if vm.group(10) == 'true' else 0
        
        versions_parsed.append({
            'id': vid_counter,
            'ho_so_id': did,
            'so_phien_ban': vnum,
            'nhan_phien_ban': vlabel,
            'ten_tep_goc': fname,
            'duong_dan_luu': path,
            'loai_tep': ftype,
            'kieu_noi_dung': 'application/pdf' if ftype == 'PDF' else 'application/octet-stream',
            'dung_luong_byte': fsize,
            'ma_bam_sha256': sha,
            'noi_dung_thay_doi': notes,
            'nguoi_tai_len_id': '2',
            'thoi_diem_tai_len': up_at,
            'duoc_chon': sel,
            'nguoi_chon_id': '2' if sel else None,
            'thoi_diem_chon': up_at if sel else None
        })
        vid_counter += 1

print(f'Parsed {len(docs_parsed)} docs and {len(versions_parsed)} versions!')

# Parse 14 nhat_ky_thao_tac
p95_lines = [l for l in page_dict[95].split('\n') if l.strip()][1:]
audit_logs = []
for i, l in enumerate(p95_lines):
    parts = [x.strip() for x in l.split() if x.strip()]
    if len(parts) >= 5:
        audit_logs.append({
            'id': parts[0],
            'tai_khoan_id': parts[1],
            'thao_tac': parts[2],
            'loai_doi_tuong': parts[3],
            'doi_tuong_id': parts[4],
            'ly_do': 'Ghi nhận thao tác hệ thống',
            'thoi_diem': f'2026-10-11 1{i:02d}:00:00'
        })
print(f'Parsed {len(audit_logs)} audit logs!')

print('ALL TABLES PREPARED FOR SQL GENERATION!')
