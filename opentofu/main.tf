from fastapi import FastAPI, Request
from prometheus_fastapi_instrumentator import Instrumentator
import uvicorn

app = FastAPI()

Instrumentator().instrument(app).expose(app)

votes = {"option_a": 0, "option_b": 0, "option_c": 0}

@app.get("/")
def read_root():
    return {"message": "Voting App API"}

@app.post("/vote/{option}")
async def cast_vote(option: str):
    if option in votes:
        votes[option] += 1
        return {"message": f"Voted for {option}!", "current_votes": votes}
    return {"error": "Invalid option"}, 404

@app.get("/results")
async def get_results():
    return votes

@app.get("/load")
def generate_load():
    for i in range(1000000):
        _ = i * i
    return {"message": "Load generated!"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)