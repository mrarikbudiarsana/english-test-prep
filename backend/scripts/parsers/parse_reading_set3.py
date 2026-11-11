import docx
import json
import re

def parse_reading_set3():
    doc = docx.Document('scratch_docs/TOEFL_ITP_Level_1_Reading_Mock_Test_Set_3.docx')
    paras = [p.text.strip() for p in doc.paragraphs]

    # 1. Answer Key from Table 1
    answers = {}
    table = doc.tables[1]
    for row in table.rows[1:]:
        cells = [c.text.strip() for c in row.cells]
        for i in range(0, len(cells), 2):
            if i+1 < len(cells) and cells[i]:
                answers[int(cells[i])] = cells[i+1]
    print(f"Extracted {len(answers)} answer keys.")

    # 2. Passage topics from Table 2
    topics = {}
    table2 = doc.tables[2]
    for row in table2.rows[1:]:
        p_id = row.cells[0].text.strip()
        topic = row.cells[1].text.strip()
        topics[p_id] = topic
    print("Passage topics:", topics)

    # 3. Explanations (Questions 1 to 50)
    # Pattern:
    # Question 1  Answer D
    # ITP1-R-S03-Q01  |  Main idea  |  Intended difficulty M
    # Evidence: Whole passage.
    # A: ... B: ... C: ... D: ...
    explanations = {}
    for q_num in range(1, 51):
        for idx in range(320, len(paras)):
            line = paras[idx]
            if re.match(rf'^Question\s+{q_num}\s+Answer\s+[A-D]$', line):
                # Metadata line
                meta_line = paras[idx+1]
                m_meta = re.search(r'\|\s*([^|]+?)\s*\|\s*Intended difficulty\s+([EMH])', meta_line)
                skill = m_meta.group(1).strip() if m_meta else "Reading Comprehension"
                diff = m_meta.group(2).strip() if m_meta else "M"
                
                # Evidence line
                ev_line = paras[idx+2]
                evidence = ev_line.replace("Evidence:", "").strip() if ev_line.startswith("Evidence:") else ""
                
                # Options explanations line
                opt_expl_line = paras[idx+3]
                # Split "A: ... B: ... C: ... D: ..."
                opt_parts = re.split(r'\s*([A-D]):\s*', opt_expl_line)
                # opt_parts: ['', 'A', textA, 'B', textB, 'C', textC, 'D', textD]
                opt_dict = {}
                for k in range(1, len(opt_parts), 2):
                    opt_dict[opt_parts[k]] = opt_parts[k+1].strip()
                    
                explanations[q_num] = {
                    "skill": skill,
                    "intended_difficulty": diff,
                    "evidence": evidence,
                    "option_explanations": opt_dict
                }
                break

    print(f"Extracted explanations for {len(explanations)} questions.")

    # 4. Passages & Questions
    passages = []
    
    passage_defs = [
        (1, 1, 10, "P01"),
        (2, 11, 20, "P02"),
        (3, 21, 30, "P03"),
        (4, 31, 40, "P04"),
        (5, 41, 50, "P05"),
    ]

    for p_idx, start_q, end_q, p_code in passage_defs:
        start_str = f"Questions {start_q} to {end_q}"
        s_idx = paras.index(start_str)
        
        # Extract paragraphs [1], [2], [3], [4]
        p_paragraphs = []
        cur = s_idx + 1
        while cur < len(paras) and not paras[cur].startswith(f"Questions {start_q} to {start_q+4}"):
            line = paras[cur]
            m_p = re.match(r'^\[(\d+)\]\s*(.+)$', line)
            if m_p:
                p_paragraphs.append({
                    "number": int(m_p.group(1)),
                    "text": m_p.group(2).strip()
                })
            cur += 1
            
        # Extract questions
        p_questions = []
        for q_num in range(start_q, end_q + 1):
            # Find line starting with "{q_num}."
            q_line_idx = None
            for j in range(s_idx, s_idx + 100):
                if j < len(paras) and re.match(rf'^{q_num}\.\s*(.+)$', paras[j]):
                    q_line_idx = j
                    break
            
            if q_line_idx is None:
                print(f"WARNING: Q{q_num} not found in passage {p_code}!")
                continue
                
            q_text = re.match(rf'^{q_num}\.\s*(.+)$', paras[q_line_idx]).group(1).strip()
            
            # Options (A), (B), (C), (D)
            q_options = {}
            for j in range(q_line_idx + 1, q_line_idx + 10):
                if j < len(paras):
                    m_opt = re.match(r'^\(([A-D])\)\s*(.+)$', paras[j])
                    if m_opt:
                        q_options[m_opt.group(1)] = m_opt.group(2).strip()
                        if len(q_options) == 4:
                            break
                            
            expl = explanations.get(q_num, {})
            q_obj = {
                "id": f"ITP1-R-S03-Q{q_num:02d}",
                "number": q_num,
                "passage_id": f"ITP1-R-S03-{p_code}",
                "question": q_text,
                "options": q_options,
                "correct_answer": answers[q_num],
                "skill": expl.get("skill", "Reading Comprehension"),
                "intended_difficulty": expl.get("intended_difficulty", "M"),
                "evidence": expl.get("evidence", ""),
                "option_explanations": expl.get("option_explanations", {})
            }
            p_questions.append(q_obj)

        passages.append({
            "id": f"ITP1-R-S03-{p_code}",
            "start": start_q,
            "end": end_q,
            "internal_topic": topics.get(p_code, f"Passage {p_idx}"),
            "paragraphs": p_paragraphs,
            "questions": p_questions
        })

    result = {
        "test_id": "ITP1-R-S03",
        "title": "TOEFL ITP Level 1 Reading Mock Test Set 3",
        "publisher": "Learn English With Arik",
        "version": 1,
        "section": "Reading Comprehension",
        "time_limit_minutes": 55,
        "question_count": 50,
        "scoring": {
            "points_per_item": 1,
            "max_score": 50
        },
        "passages": passages
    }

    out_path = 'scratch_docs/Practice_3_Reading_Complete.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"Successfully generated {out_path} with {len(passages)} passages and {sum(len(p['questions']) for p in passages)} questions!")

parse_reading_set3()
