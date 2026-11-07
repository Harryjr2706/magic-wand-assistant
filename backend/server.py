from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from pydantic import BaseModel


app = FastAPI(title="Magic Wand API")

# Allow the website to communicate with Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "Magic Wand backend is running!"
    }

@app.get("/status")
def status():
    return {
        "assistant": "Magic Wand",
        "status": "online"
    }
class CommandRequest(BaseModel):
    command: str


@app.post("/command")
def process_command(data: CommandRequest):

    import re

    command = data.command.lower().strip()

    # TIME
    if "time" in command and "timer" not in command:
        answer = "The time is " + datetime.now().strftime("%I:%M %p")

    # DATE
    elif "date" in command or "today" in command:
        answer = "Today's date is " + datetime.now().strftime("%d %B %Y")

    # GREETING
    elif "hello" in command or "hi" in command:
        answer = "Hello! I am Magic Wand. How can I help you?"

        # TIMER
    elif "timer" in command:
        match = re.search(
            r"(\d+)\s*(seconds?|minutes?)",
            command
        )

        if match:
            amount = int(match.group(1))
            unit = match.group(2)

            if 1 <= amount <= 60:
                seconds = amount * (
                    60 if unit.startswith("minute") else 1
                )
                answer = f"Timer started for {amount} {unit}."
            else:
                answer = "Please choose a timer between one and sixty units."
                seconds = None
        else:
            answer = "Please specify the timer duration."
            seconds = None

    # CALCULATOR
    else:
        match = re.search(
            r"(-?\d+(?:\.\d+)?)\s*(plus|minus|times|multiplied by|divided by|into)\s*(-?\d+(?:\.\d+)?)",
            command
        )

        if match:
            first = float(match.group(1))
            operator = match.group(2)
            second = float(match.group(3))

            if operator == "plus":
                result = first + second
            elif operator == "minus":
                result = first - second
            elif operator in ["times", "multiplied by", "into"]:
                result = first * second
            elif second == 0:
                result = None
                answer = "Division by zero is not possible."
            else:
                result = first / second

            if result is not None:
                answer = "The answer is " + str(result)

        else:
            answer = "I heard you say: " + data.command

    result = {
        "command": data.command,
        "response": answer
    }

    if "timer" in command and "seconds" in locals() and seconds:
        result["timer_seconds"] = seconds

    return result