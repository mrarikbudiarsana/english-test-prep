import docx
import json
import re

def parse_listening_set3():
    tp_doc = docx.Document('scratch_docs/TOEFL_ITP_Listening_Set_3_Teacher_Pack.docx')
    sb_doc = docx.Document('scratch_docs/TOEFL_ITP_Listening_Set_3_Student_Booklet.docx')

    # 1. Answer Key from Table
    answers = {}
    table = tp_doc.tables[0]
    for row in table.rows[1:]:
        cells = [c.text.strip() for c in row.cells]
        for i in range(0, len(cells), 2):
            if i+1 < len(cells) and cells[i]:
                answers[int(cells[i])] = cells[i+1]

    print(f"Extracted {len(answers)} answer keys.")

    # 2. Options from Student Booklet
    # Format in student booklet:
    # 1.
    # A.  ...
    # B.  ...
    # C.  ...
    # D.  ...
    options_by_q = {}
    current_q = None
    for p in sb_doc.paragraphs:
        txt = p.text.strip()
        if not txt:
            continue
        # Check if question number header like "1." or "31."
        m_q = re.match(r'^(\d+)\.?$', txt)
        if m_q:
            current_q = int(m_q.group(1))
            options_by_q[current_q] = {}
            continue
        
        m_opt = re.match(r'^([A-D])\.\s*(.+)$', txt)
        if m_opt and current_q:
            opt_letter = m_opt.group(1)
            opt_text = m_opt.group(2).strip()
            options_by_q[current_q][opt_letter] = opt_text

    print(f"Extracted options for {len(options_by_q)} questions from Student Booklet.")
    for q_num in range(1, 51):
        if q_num not in options_by_q or len(options_by_q[q_num]) != 4:
            print(f"WARNING: Question {q_num} options missing or not 4: {options_by_q.get(q_num)}")

    # 3. Explanations & Skills from Teacher Pack
    # Explanations start around P262: "Explanations 1 to 5", etc.
    # Pattern:
    # 1 Answer D
    # Skill: Implied problem
    # She will take notes on paper instead.
    # The woman cannot access her tablet ...
    # Teaching point: Listen for ...
    explanations_by_q = {}
    skills_by_q = {}
    
    tp_paras = [p.text.strip() for p in tp_doc.paragraphs]
    
    i = 0
    while i < len(tp_paras):
        txt = tp_paras[i]
        m_ans = re.match(r'^(\d+)\s+Answer\s+([A-D])$', txt)
        if m_ans:
            q_num = int(m_ans.group(1))
            ans_letter = m_ans.group(2)
            # Next should be Skill: ...
            i += 1
            skill = ""
            if i < len(tp_paras) and tp_paras[i].startswith("Skill:"):
                skill = tp_paras[i].replace("Skill:", "").strip()
                i += 1
            
            # Next is usually correct answer text line
            corr_text = ""
            if i < len(tp_paras):
                corr_text = tp_paras[i]
                i += 1
                
            # Next is detailed explanation
            expl_lines = []
            while i < len(tp_paras) and not tp_paras[i].startswith("Teaching point:") and not re.match(r'^\d+\s+Answer\s+[A-D]$', tp_paras[i]) and not tp_paras[i].startswith("Explanations "):
                if tp_paras[i]:
                    expl_lines.append(tp_paras[i])
                i += 1
            
            teaching_pt = ""
            if i < len(tp_paras) and tp_paras[i].startswith("Teaching point:"):
                teaching_pt = tp_paras[i]
                i += 1
                
            full_expl = " ".join(expl_lines)
            if teaching_pt:
                full_expl += " " + teaching_pt
                
            explanations_by_q[q_num] = full_expl
            skills_by_q[q_num] = skill
            continue
        i += 1

    print(f"Extracted explanations for {len(explanations_by_q)} questions.")
    for q_num in range(1, 51):
        if q_num not in explanations_by_q:
            print(f"WARNING: Explanation for Q{q_num} missing!")

    # 4. Part A Scripts & Questions
    # Items 1 to 30:
    # Item 1
    # Man: ...
    # Woman: ...
    # Narrator: What does the woman imply?
    part_a_data = {}
    for item_num in range(1, 31):
        # find "Item {item_num}"
        found_idx = None
        for idx, p in enumerate(tp_paras):
            if p == f"Item {item_num}":
                found_idx = idx
                break
        if found_idx is None:
            print(f"WARNING: Could not find Item {item_num} script!")
            continue
        
        script_lines = []
        narrator_q = ""
        idx = found_idx + 1
        while idx < len(tp_paras) and not tp_paras[idx].startswith(f"Item {item_num+1}") and not tp_paras[idx].startswith("Part B Instructions") and not tp_paras[idx].startswith("Part A Recording Scripts"):
            line = tp_paras[idx]
            if line.startswith("Narrator:"):
                narrator_q = line.replace("Narrator:", "").strip()
            elif line != "[Pause for the student to answer.]" and line:
                script_lines.append(line)
            idx += 1
            
        part_a_data[item_num] = {
            "transcript": "\n".join(script_lines),
            "question": narrator_q
        }

    print(f"Extracted Part A scripts for {len(part_a_data)} questions.")

    # 5. Part B Scripts & Questions
    # Conversation 1 Questions 31 to 34
    # Conversation 2 Questions 35 to 38
    part_b_data = {}
    
    # Conv 1
    c1_start = tp_paras.index("Conversation 1 Questions 31 to 34")
    c2_start = tp_paras.index("Conversation 2 Questions 35 to 38")
    part_c_start = tp_paras.index("Part C Instructions")
    
    c1_paras = tp_paras[c1_start+1:c2_start]
    c1_script = []
    c1_questions = {}
    for line in c1_paras:
        m_q = re.match(r'^(\d+)\.\s+Narrator:\s*(.+)$', line)
        if m_q:
            c1_questions[int(m_q.group(1))] = m_q.group(2).strip()
        elif line.startswith("Narrator: Questions thirty-one"):
            c1_script.append(line)
        elif line and not line.startswith("[Pause"):
            c1_script.append(line)
            
    c2_paras = tp_paras[c2_start+1:part_c_start]
    c2_script = []
    c2_questions = {}
    for line in c2_paras:
        m_q = re.match(r'^(\d+)\.\s+Narrator:\s*(.+)$', line)
        if m_q:
            c2_questions[int(m_q.group(1))] = m_q.group(2).strip()
        elif line.startswith("Narrator: Questions thirty-five"):
            c2_script.append(line)
        elif line and not line.startswith("[Pause"):
            c2_script.append(line)

    print(f"Extracted Conv 1: script length={len(c1_script)}, questions={list(c1_questions.keys())}")
    print(f"Extracted Conv 2: script length={len(c2_script)}, questions={list(c2_questions.keys())}")

    # 6. Part C Scripts & Questions
    # Talk 1 Questions 39 to 42
    # Talk 2 Questions 43 to 46
    # Talk 3 Questions 47 to 50
    t1_start = tp_paras.index("Talk 1 Questions 39 to 42")
    t2_start = tp_paras.index("Talk 2 Questions 43 to 46")
    t3_start = tp_paras.index("Talk 3 Questions 47 to 50")
    expl_start = tp_paras.index("Explanations 1 to 5")

    def parse_talk(start_idx, end_idx):
        paras = tp_paras[start_idx+1:end_idx]
        script = []
        questions = {}
        for line in paras:
            m_q = re.match(r'^(\d+)\.\s+Narrator:\s*(.+)$', line)
            if m_q:
                questions[int(m_q.group(1))] = m_q.group(2).strip()
            elif line.startswith("Narrator: Questions"):
                script.append(line)
            elif line and not line.startswith("[Pause") and not line.startswith("Narrator: This is the end"):
                script.append(line)
        return "\n".join(script), questions

    t1_script, t1_questions = parse_talk(t1_start, t2_start)
    t2_script, t2_questions = parse_talk(t2_start, t3_start)
    t3_script, t3_questions = parse_talk(t3_start, expl_start)

    print(f"Extracted Talk 1: script length={len(t1_script)}, questions={list(t1_questions.keys())}")
    print(f"Extracted Talk 2: script length={len(t2_script)}, questions={list(t2_questions.keys())}")
    print(f"Extracted Talk 3: script length={len(t3_script)}, questions={list(t3_questions.keys())}")

    # Build Complete JSON
    result = {
        "title": "Practice Test 3",
        "source_practice_set": "Practice Set 3",
        "total_questions": 50,
        "parts": [
            {
                "part": "A",
                "title": "Practice Test 3",
                "recordings": [],
                "questions": []
            },
            {
                "part": "B",
                "title": "Practice Test 3",
                "recordings": [
                    {
                        "id": "B1",
                        "title": "Conversation 1",
                        "questions": [31, 32, 33, 34],
                        "transcript": "\n".join(c1_script)
                    },
                    {
                        "id": "B2",
                        "title": "Conversation 2",
                        "questions": [35, 36, 37, 38],
                        "transcript": "\n".join(c2_script)
                    }
                ],
                "questions": []
            },
            {
                "part": "C",
                "title": "Practice Test 3",
                "recordings": [
                    {
                        "id": "C1",
                        "title": "Talk 1",
                        "questions": [39, 40, 41, 42],
                        "transcript": t1_script
                    },
                    {
                        "id": "C2",
                        "title": "Talk 2",
                        "questions": [43, 44, 45, 46],
                        "transcript": t2_script
                    },
                    {
                        "id": "C3",
                        "title": "Talk 3",
                        "questions": [47, 48, 49, 50],
                        "transcript": t3_script
                    }
                ],
                "questions": []
            }
        ]
    }

    # Populate Part A
    for q_num in range(1, 31):
        q_obj = {
            "number": q_num,
            "question": part_a_data[q_num]["question"],
            "options": options_by_q[q_num],
            "correct_answer": answers[q_num],
            "question_type": skills_by_q.get(q_num, "Listening comprehension"),
            "explanation": explanations_by_q[q_num],
            "transcript": part_a_data[q_num]["transcript"]
        }
        result["parts"][0]["questions"].append(q_obj)

    # Populate Part B
    all_b_q = {}
    all_b_q.update(c1_questions)
    all_b_q.update(c2_questions)
    for q_num in range(31, 39):
        rec_id = "B1" if q_num <= 34 else "B2"
        q_obj = {
            "number": q_num,
            "question": all_b_q[q_num],
            "options": options_by_q[q_num],
            "correct_answer": answers[q_num],
            "question_type": skills_by_q.get(q_num, "Listening comprehension"),
            "explanation": explanations_by_q[q_num],
            "recording_id": rec_id
        }
        result["parts"][1]["questions"].append(q_obj)

    # Populate Part C
    all_c_q = {}
    all_c_q.update(t1_questions)
    all_c_q.update(t2_questions)
    all_c_q.update(t3_questions)
    for q_num in range(39, 51):
        if q_num <= 42:
            rec_id = "C1"
        elif q_num <= 46:
            rec_id = "C2"
        else:
            rec_id = "C3"
        q_obj = {
            "number": q_num,
            "question": all_c_q[q_num],
            "options": options_by_q[q_num],
            "correct_answer": answers[q_num],
            "question_type": skills_by_q.get(q_num, "Listening comprehension"),
            "explanation": explanations_by_q[q_num],
            "recording_id": rec_id
        }
        result["parts"][2]["questions"].append(q_obj)

    out_path = 'scratch_docs/Practice_Test_3_Complete.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"Successfully generated {out_path} with {len(result['parts'][0]['questions']) + len(result['parts'][1]['questions']) + len(result['parts'][2]['questions'])} questions!")

parse_listening_set3()
