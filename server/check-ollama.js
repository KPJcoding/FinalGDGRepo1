
async function checkOllama() {
    try {
        const res = await fetch('http://localhost:11434/');
        if (res.ok) {
            console.log("Ollama is running!");
        } else {
            console.log("Ollama reachable but returned status:", res.status);
        }
    } catch (e) {
        console.log("Ollama not reachable:", e.message);
    }
}
checkOllama();
