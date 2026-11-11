import docx
import json
import re

def parse_structure_set3():
    doc = docx.Document('scratch_docs/TOEFL_ITP_Level_1_Mock_Test_Set_3.docx')
    paras = [p.text.strip() for p in doc.paragraphs]

    # 1. Answer Key from Table 0
    answers = {}
    table = doc.tables[0]
    for row in table.rows[1:]:
        cells = [c.text.strip() for c in row.cells]
        for i in range(0, len(cells), 2):
            if i+1 < len(cells) and cells[i]:
                answers[int(cells[i])] = cells[i+1]
    print(f"Extracted {len(answers)} answer keys.")

    # 2. Structure Candidate Questions 1 to 15
    struct_questions = {}
    for q_num in range(1, 16):
        pattern = re.compile(rf'^{q_num}\.\s*(.+)$')
        q_idx = None
        stem = ""
        for idx, p in enumerate(paras[:120]):
            m = pattern.match(p)
            if m:
                q_idx = idx
                stem = m.group(1).strip()
                break
        
        options = {}
        if q_idx is not None:
            for j in range(q_idx + 1, q_idx + 8):
                if j < len(paras):
                    if re.match(rf'^{q_num+1}\.\s+', paras[j]):
                        break
                    m_opt = re.match(r'^([A-D])\.\s*(.+)$', paras[j])
                    if m_opt:
                        opt_k = m_opt.group(1)
                        if opt_k not in options:
                            options[opt_k] = m_opt.group(2).strip()
                        if len(options) == 4:
                            break
        
        struct_questions[q_num] = {
            "stem": stem,
            "options": options
        }

    for q_num in range(1, 16):
        if len(struct_questions[q_num]["options"]) != 4:
            print(f"ERROR: Q{q_num} does not have 4 options: {struct_questions[q_num]}")

    # 3. Written Expression Candidate Questions 16 to 40
    we_questions = {}
    for q_num in range(16, 41):
        pattern = re.compile(rf'^{q_num}\.\s*(.+)$')
        labeled_line = ""
        for p in paras[110:150]:
            m = pattern.match(p)
            if m:
                labeled_line = m.group(1).strip()
                break
        
        parts = re.split(r'\s*\[([A-D])\]\s*', labeled_line)
        options = {}
        segments = []
        if len(parts) >= 9:
            prefix = parts[0]
            segments.append({"text": prefix})
            
            labelA, textA = parts[1], parts[2]
            labelB, textB = parts[3], parts[4]
            labelC, textC = parts[5], parts[6]
            labelD, textD_raw = parts[7], parts[8]
            
            options["A"] = textA
            options["B"] = textB
            options["C"] = textC
            options["D"] = textD_raw
            
            segments.append({"label": "A", "text": textA})
            segments.append({"label": "B", "text": textB})
            segments.append({"label": "C", "text": textC})
            segments.append({"label": "D", "text": textD_raw})
        
        we_questions[q_num] = {
            "labeled_sentence": labeled_line,
            "segments": segments,
            "options": options
        }

    # 4. Explanations for Structure (1 to 15)
    expl_struct = {}
    for q_num in range(1, 16):
        target = ""
        expl_text = ""
        completed = ""
        other_expl = ""
        
        for idx, p in enumerate(paras[155:250]):
            if p == f"{q_num} Answer {answers[q_num]}":
                cur = idx + 155 + 1
                while cur < len(paras) and not re.match(r'^\d+\s+Answer\s+[A-D]$', paras[cur]) and not paras[cur].startswith("Structure explanations") and not paras[cur].startswith("Written Expression explanations"):
                    line = paras[cur]
                    if line.startswith("Target:"):
                        target = line.replace("Target:", "").strip()
                    elif line.startswith("Completed sentence:"):
                        completed = line.replace("Completed sentence:", "").strip()
                    elif line.startswith("Other options:"):
                        other_expl = line.replace("Other options:", "").strip()
                    elif line:
                        expl_text += (" " + line if expl_text else line)
                    cur += 1
                break
        expl_struct[q_num] = {
            "target": target,
            "explanation": expl_text,
            "completed_sentence": completed,
            "other_options_explanation": other_expl
        }

    # 5. Explanations for Written Expression (16 to 40)
    expl_we = {}
    for q_num in range(16, 41):
        correction_orig = ""
        correction_repl = ""
        target = ""
        expl_text = ""
        corrected = ""
        
        for idx, p in enumerate(paras[240:360]):
            if p.startswith(f"{q_num} Answer {answers[q_num]}"):
                cur = idx + 240 + 1
                while cur < len(paras) and not re.match(r'^\d+\s+Answer\s+[A-D]$', paras[cur]) and not paras[cur].startswith("Written Expression explanations") and not paras[cur].startswith("Platform owner") and not paras[cur].startswith("Protected"):
                    line = paras[cur]
                    if line.startswith("Correction:"):
                        m_corr = re.match(r'^Correction:\s*(.+?)\s*→\s*(.+?)\.\s*Target:\s*(.+)$', line)
                        if m_corr:
                            correction_orig = m_corr.group(1).strip()
                            correction_repl = m_corr.group(2).strip()
                            target = m_corr.group(3).strip()
                        else:
                            c_part = line.replace("Correction:", "").strip()
                            if "Target:" in c_part:
                                c_sub, t_sub = c_part.split("Target:", 1)
                                target = t_sub.strip()
                                if "→" in c_sub:
                                    orig, repl = c_sub.split("→", 1)
                                    correction_orig = orig.strip()
                                    correction_repl = repl.strip().rstrip(".")
                    elif line.startswith("Corrected sentence:"):
                        corrected = line.replace("Corrected sentence:", "").strip()
                    elif line:
                        expl_text += (" " + line if expl_text else line)
                    cur += 1
                break
        expl_we[q_num] = {
            "target": target,
            "correction": {
                "original": correction_orig,
                "replacement": correction_repl
            },
            "explanation": expl_text,
            "corrected_sentence": corrected
        }

    # Build JSON structure
    result = {
        "title": "TOEFL ITP Level 1 — Structure and Written Expression — Mock Test Set 3",
        "form_id": "ITP1 SWE 003",
        "version": 1,
        "duration_seconds": 1500,
        "total_questions": 40,
        "scoring": {
            "correct": 1,
            "incorrect_or_unanswered": 0,
            "max_raw_score": 40,
            "official_scaled_score": False
        },
        "original_practice_not_official_ets": True,
        "sections": [
            {
                "id": "structure",
                "title": "Structure",
                "instructions": "Select the word or phrase that makes the sentence grammatically correct and complete.",
                "questions": []
            },
            {
                "id": "written_expression",
                "title": "Written Expression",
                "instructions": "Select the labeled part that must be changed to make the sentence grammatically correct.",
                "questions": []
            }
        ]
    }

    # Add Structure questions
    for q_num in range(1, 16):
        sq = struct_questions[q_num]
        eq = expl_struct[q_num]
        q_obj = {
            "id": f"SWE003 Q{q_num:02d}",
            "number": q_num,
            "type": "structure",
            "correct_answer": answers[q_num],
            "stem": sq["stem"],
            "options": sq["options"],
            "target": eq["target"],
            "explanation": eq["explanation"],
            "completed_sentence": eq["completed_sentence"],
            "other_options_explanation": eq["other_options_explanation"]
        }
        result["sections"][0]["questions"].append(q_obj)

    # Add Written Expression questions
    for q_num in range(16, 41):
        wq = we_questions[q_num]
        eq = expl_we[q_num]
        q_obj = {
            "id": f"SWE003 Q{q_num:02d}",
            "number": q_num,
            "type": "written_expression",
            "correct_answer": answers[q_num],
            "labeled_sentence": wq["labeled_sentence"],
            "segments": wq["segments"],
            "options": wq["options"],
            "correction": eq["correction"],
            "target": eq["target"],
            "explanation": eq["explanation"],
            "corrected_sentence": eq["corrected_sentence"]
        }
        result["sections"][1]["questions"].append(q_obj)

    out_path = 'scratch_docs/Practice_3_Structure_Complete.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"Successfully generated {out_path} with {len(result['sections'][0]['questions']) + len(result['sections'][1]['questions'])} questions!")

parse_structure_set3()
