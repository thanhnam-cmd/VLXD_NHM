import re
import os

with open('/tmp/pdf_texts/03_du_lieu_mau.txt', 'r', encoding='utf-8') as f:
    text = f.read()

pages = re.split(r'--\s*(\d+)\s+of\s+101\s*--', text)
page_dict = {int(pages[i]): pages[i+1].strip() for i in range(1, len(pages), 2)}

def clean_val(v):
    if v is None:
        return 'NULL'
    v = v.strip()
    if v == '' or v == 'NULL' or v == '-':
        return 'NULL'
    # escape single quotes
    v_esc = v.replace("'", "''")
    return f"'{v_esc}'"

def int_val(v):
    if v is None:
        return 'NULL'
    v = v.strip()
    if v == '' or v == 'NULL' or v == '-':
        return 'NULL'
    try:
        return str(int(v))
    except:
        return 'NULL'

# 1. cong_viec (42 rows)
# Page 48: id, hang_muc_id, du_an_id, ma_cong_viec
# Page 49: ten, mo_ta, khu_vuc_trien_khai
# Page 50: bat_dau_du_kien, ket_thuc_du_kien, trang_thai, nhan_su_chinh_id
# Page 51: thoi_diem_hoan_thanh, nguoi_xac_nhan_hoan_thanh_id, thoi_diem_huy, nguoi_huy_id
# Page 52: ly_do_huy, nguoi_tao_id, thoi_diem_tao
# Page 53: thoi_diem_cap_nhat, phien_ban

def parse_cong_viec():
    p48_lines = [l for l in page_dict[48].split('\n') if l.strip()][1:]
    p49_lines = [l for l in page_dict[49].split('\n') if l.strip()][1:]
    p50_lines = [l for l in page_dict[50].split('\n') if l.strip()][1:]
    p51_lines = [l for l in page_dict[51].split('\n') if l.strip()][1:]
    p52_lines = [l for l in page_dict[52].split('\n') if l.strip()][1:]
    p53_lines = [l for l in page_dict[53].split('\n') if l.strip()][1:]
    
    rows = []
    for i in range(len(p48_lines)):
        c48 = [x.strip() for x in p48_lines[i].split('\t') if x.strip()]
        cid, hmid, daid, macv = c48[0], c48[1], c48[2], c48[3]
        
        c49 = [x.strip() for x in p49_lines[i].split('\t') if x.strip()]
        ten = c49[0] if len(c49) > 0 else f'Công việc {macv}'
        mota = c49[1] if len(c49) > 1 else ''
        khuvuc = c49[2] if len(c49) > 2 else ''
        
        c50 = [x.strip() for x in p50_lines[i].split('\t') if x.strip()]
        # bat_dau_du_kien, ket_thuc_du_kien, trang_thai, nhan_su_chinh_id
        # datetime has spaces: '2026-06-14 08:00:00'
        # Let's inspect tokens in c50
        batdau = ''
        ketthuc = ''
        status = ''
        ns_chinh = 'NULL'
        if len(c50) >= 4:
            # find timestamps YYYY-MM-DD
            ts = re.findall(r'\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}', p50_lines[i])
            if len(ts) >= 2:
                batdau = ts[0]
                ketthuc = ts[1]
            rem = p50_lines[i]
            for t in ts:
                rem = rem.replace(t, '')
            tokens = [x.strip() for x in rem.split() if x.strip()]
            for tok in tokens:
                if tok in ['HOAN_THANH', 'DANG_THUC_HIEN', 'CHUA_BAT_DAU', 'HUY']:
                    status = tok
                elif tok.isdigit():
                    ns_chinh = tok
        if not status:
            status = 'DANG_THUC_HIEN'
            
        # c51: thoi_diem_hoan_thanh, nguoi_xac_nhan_hoan_thanh_id, thoi_diem_huy, nguoi_huy_id
        ts51 = re.findall(r'\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}', p51_lines[i])
        td_ht = ts51[0] if len(ts51) > 0 and status == 'HOAN_THANH' else None
        td_huy = ts51[0] if len(ts51) > 0 and status == 'HUY' else None
        
        # c52: ly_do_huy, nguoi_tao_id, thoi_diem_tao
        ts52 = re.findall(r'\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}', p52_lines[i])
        td_tao = ts52[0] if len(ts52) > 0 else '2026-06-01 08:00:00'
        
        # c53: thoi_diem_cap_nhat, phien_ban
        ts53 = re.findall(r'\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}', p53_lines[i])
        td_cn = ts53[0] if len(ts53) > 0 else td_tao
        
        rows.append({
            'id': cid,
            'hang_muc_id': hmid,
            'du_an_id': daid,
            'ma_cong_viec': macv,
            'ten': ten,
            'mo_ta': mota,
            'khu_vuc_trien_khai': khuvuc,
            'bat_dau_du_kien': batdau or '2026-06-14 08:00:00',
            'ket_thuc_du_kien': ketthuc or '2026-06-24 17:00:00',
            'trang_thai': status,
            'nhan_su_chinh_id': ns_chinh,
            'thoi_diem_hoan_thanh': td_ht,
            'nguoi_xac_nhan_hoan_thanh_id': '2' if td_ht else None,
            'thoi_diem_huy': td_huy,
            'nguoi_huy_id': '2' if td_huy else None,
            'ly_do_huy': 'Chủ đầu tư điều chỉnh phạm vi' if status == 'HUY' else None,
            'nguoi_tao_id': '2',
            'thoi_diem_tao': td_tao,
            'thoi_diem_cap_nhat': td_cn,
            'phien_ban': 0
        })
    return rows

print('Parsing test for cong_viec...')
cv_rows = parse_cong_viec()
print(f'Parsed {len(cv_rows)} cong_viec rows!')
for r in cv_rows[:3]:
    print(' ', r)
