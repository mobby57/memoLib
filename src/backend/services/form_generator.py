class FormGenerator:
    def __init__(self):
        pass

    def generate_form(self, questions, form_type="general", language="fr"):
        steps = [
            {"question": q.get("question", ""), "type": q.get("type", "text")}
            for q in questions
        ]
        return {"id": f"form_{form_type}_{language}", "steps": steps}
