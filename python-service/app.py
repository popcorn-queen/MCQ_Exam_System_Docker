from fastapi import FastAPI
from pydantic import BaseModel
import json

app = FastAPI()

class Submission(BaseModel):
    answers: dict

@app.post("/grade")
def grade(submission: Submission):
    with open("questions.json") as f:
        questions = json.load(f)["questions"]

    total = 0
    max_score = 0
    details = []

    for q in questions:
        max_score += q["weight"]
        submitted = submission.answers.get(str(q["id"]))

        if q["type"] == "single":
            correct = submitted == q["correctAnswer"]
        elif q["type"] == "multiple":
            correct = set(submitted or []) == set(q["correctAnswer"])

        if correct:
            total += q["weight"]

        details.append({"questionId": q["id"], "correct": correct, "awarded": q["weight"] if correct else 0})

    percentage = (total / max_score) * 100 if max_score else 0

    return {"score": total, "max_score": max_score, "percentage": percentage, "details": details}