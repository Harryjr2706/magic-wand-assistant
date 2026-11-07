const micButton = document.getElementById("micButton");
const orb = document.getElementById("orb");
const statusText = document.getElementById("status");

const transcript = document.getElementById("transcript");
const response = document.getElementById("response");

const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
let wakeRecognition;
let wakeModeEnabled = false;
let wakeListening = false;
let assistantActive = false;

let recognition;
let listening = false;

// Speak the assistant's response
function speak(text) {
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-IN";
    speech.rate = 1;

    window.speechSynthesis.speak(speech);
}

// Display and speak a response
function reply(text) {
    response.textContent = text;
    speak(text);
}

// Convert simple number words into numbers
function getNumber(value) {
    const words = {
        zero: 0, one: 1, two: 2, three: 3,
        four: 4, five: 5, six: 6, seven: 7,
        eight: 8, nine: 9, ten: 10
    };

    return words[value.toLowerCase()] ?? Number(value);
}

// Understand and execute commands
async function processCommand(command) {
    try {
        statusText.textContent = "Processing...";

        const response = await fetch(
            "/command",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    command: command
                })
            }
        );

        if (!response.ok) {
            throw new Error("Backend request failed");
        }

        const data = await response.json();

        reply(data.response);

if (data.timer_seconds) {
    setTimeout(() => {
        reply("Your timer is finished!");
    }, data.timer_seconds * 1000);
}

    } catch (error) {
        console.error("Command error:", error);
        reply("I couldn't connect to my Python brain. Please try again.");
    }
}

// Set up microphone and speech recognition
if (!SpeechRecognition) {
    statusText.textContent = "Speech recognition is not supported.";
    micButton.disabled = true;
} else {
    recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    micButton.addEventListener("click", () => {
        if (!listening) {
            try {
                recognition.start();
            } catch (error) {
                statusText.textContent = "Please try again.";
            }
        } else {
            recognition.stop();
        }
    });

    recognition.onstart = () => {
        listening = true;
        statusText.textContent = "Listening...";
        orb.classList.add("listening");
    };

    recognition.onresult = (event) => {
        let fullTranscript = "";
        let finalTranscript = "";

        for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript;

            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }

        transcript.textContent = fullTranscript;

        if (finalTranscript.trim()) {
            processCommand(finalTranscript.trim());
        }
    };

    recognition.onerror = (event) => {
        listening = false;
        statusText.textContent = "Error: " + event.error;
        orb.classList.remove("listening");
    };

    recognition.onend = () => {
        listening = false;
        orb.classList.remove("listening");

        if (wakeModeEnabled) {
            statusText.textContent = "Waiting for hey fairy...";

            const resumeWakeDetection = () => {
                if (window.speechSynthesis.speaking) {
                    setTimeout(resumeWakeDetection, 500);
                    return;
                }

                assistantActive = false;
                setTimeout(startWakeWordDetection, 800);
            };

            resumeWakeDetection();
        } else {
            statusText.textContent = "Ready when you are";
        }
    };}
    


    // MAGIC WAND WAKE-WORD DETECTOR

    function startWakeWordDetection() {
        if (!SpeechRecognition || wakeListening || assistantActive) {
            return;
        }

        wakeRecognition = new SpeechRecognition();

        wakeRecognition.lang = "en-IN";
        wakeRecognition.continuous = true;
        wakeRecognition.interimResults = true;

        wakeRecognition.onstart = () => {
            wakeListening = true;
            statusText.textContent = 'Listening for "Hey fairy"...';
        };

        wakeRecognition.onresult = (event) => {
            let heardText = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                heardText += event.results[i][0].transcript;
            }
            transcript.textContent="Wake detector heard:"+heardText;
            if (heardText.toLowerCase().includes("hey fairy")) {
                wakeRecognition.stop();
                wakeListening = false;

                assistantActive = true;
                statusText.textContent = "Yes? I'm listening...";

                recognition.start();
            }
        };

        wakeRecognition.onerror = (event) => {
            console.log("Wake-word error:", event.error);
        };

        wakeRecognition.onend = () => {
            wakeListening = false;

            if (!assistantActive) {
                setTimeout(startWakeWordDetection, 1000);
            }
        };

        try {
            wakeRecognition.start();
        } catch (error) {
            console.log("Could not start wake-word detection:", error);
        }
    }
    const wakeButton = document.getElementById("wakeButton");

    wakeButton.addEventListener("click", () => {
        if (!wakeListening && !assistantActive) {
            wakeModeEnabled = true;
            startWakeWordDetection();
            wakeButton.textContent = "Wake-word detection enabled";
        }
    });
    async function checkBackend() {
    try {
        const response = await fetch(
            "/status"
        );

        const data = await response.json();

        console.log("Backend connection:", data);
    } catch (error) {
        console.error("Backend connection failed:", error);
    }
}

checkBackend();