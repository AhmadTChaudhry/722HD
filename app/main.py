import os
import psycopg2
import uvicorn
from fastapi import FastAPI, Request
from prometheus_fastapi_instrumentator import Instrumentator

DB_HOST = os.getenv("DB_HOST", "postgres-service")
DB_NAME = os.getenv("DB_NAME", "votes_db")
DB_USER = os.getenv("DB_USER", "voteuser")
DB_PASSWORD = os.getenv("DB_PASSWORD") 

app = FastAPI()

Instrumentator().instrument(app).expose(app)

def get_db_connection():
    """
    Establishes and returns a new connection to the PostgreSQL database.
    Raises a ValueError if the database password is not set.
    """
    if not DB_PASSWORD:
        raise ValueError("FATAL: DB_PASSWORD environment variable not set.")
    
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return conn
    except psycopg2.OperationalError as e:
        print(f"ERROR: Could not connect to the database: {e}")
        raise

@app.on_event("startup")
def startup_event():
    """
    On application startup, this function connects to the database and ensures
    the 'votes' table exists, creating it if necessary. This makes the app
    self-initializing.
    """
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS votes (
                option_name VARCHAR(255) PRIMARY KEY,
                vote_count INTEGER NOT NULL DEFAULT 0
            );
        """)
        
        cur.execute("""
            INSERT INTO votes (option_name, vote_count) VALUES
            ('option_a', 0), ('option_b', 0), ('option_c', 0)
            ON CONFLICT (option_name) DO NOTHING;
        """)
        
        conn.commit()
        cur.close()
        print("Database table 'votes' is ready.")
    except Exception as e:
        print(f"ERROR: Could not initialize database table: {e}")
    finally:
        if conn:
            conn.close()

@app.get("/")
def read_root():
    return {"message": "Voting App API"}

@app.post("/vote/{option}")
async def cast_vote(option: str):
    """
    Increments the vote count for a given option in the database.
    This operation is atomic, preventing race conditions when multiple pods vote at once.
    """
    if option not in ["option_a", "option_b", "option_c"]:
        return {"error": "Invalid option"}, 404
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE votes SET vote_count = vote_count + 1 WHERE option_name = %s",
        (option,)
    )
    conn.commit()
    cur.close()
    conn.close()
    
    return {"message": f"Voted for {option}!"}

@app.get("/results")
async def get_results():
    """
    Retrieves the current vote counts for all options from the database.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT option_name, vote_count FROM votes;")
    results = cur.fetchall()
    cur.close()
    conn.close()
    
    return {row[0]: row[1] for row in results}

@app.get("/load")
def generate_load():
    """A simple endpoint to generate CPU load for testing autoscaling."""
    for i in range(1000000):
        _ = i * i
    return {"message": "Load generated!"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)