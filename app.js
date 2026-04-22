import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// --- API CONFIGURATION ---
const GEMINI_API_KEY = "...";

// Elements
const fileInput = document.getElementById('file-input');
const dropzone = document.getElementById('dropzone');
const previewContainer = document.getElementById('preview-container');
const filePreview = document.getElementById('file-preview');
const removeFileBtn = document.getElementById('remove-file');
const analyzeBtn = document.getElementById('analyze-btn');
const loadingState = document.getElementById('loading-state');
const loadingText = document.getElementById('loading-text');
const statusLog = document.getElementById('status-log');
const debugLogs = document.getElementById('debug-logs');
const resultSection = document.getElementById('result-section');
const noResultsPlaceholder = document.getElementById('no-results');
const medicineTags = document.getElementById('medicine-tags');
const discoverModelsBtn = document.getElementById('discover-models-btn');

// State
let selectedFile = null;
let base64Data = null;
let mimeType = null;

// Helper: Logging
function log(msg, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${msg}`;
    console.log(entry);

    // Update Debug Console
    const logDiv = document.createElement('div');
    logDiv.className = `log-entry ${type === 'error' ? 'log-error' : type === 'success' ? 'log-success' : ''}`;
    logDiv.textContent = entry;
    debugLogs.appendChild(logDiv);
    debugLogs.scrollTop = debugLogs.scrollHeight;

    // Update Loading Status Log
    const statusDiv = document.createElement('div');
    statusDiv.className = logDiv.className;
    statusDiv.textContent = msg;
    statusLog.appendChild(statusDiv);
    statusLog.scrollTop = statusLog.scrollHeight;
}

// Initialize PDF.js
log("Initializing PDF.js worker...");
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// --- Events ---
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});

dropzone.addEventListener('dragover', () => dropzone.classList.add('active'));
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('active'));
dropzone.addEventListener('drop', (e) => {
    dropzone.classList.remove('active');
    handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', (e) => {
    handleFile(e.target.files[0]);
});

removeFileBtn.addEventListener('click', () => {
    log("Resetting application state.");
    selectedFile = null;
    base64Data = null;
    mimeType = null;
    filePreview.innerHTML = '';
    previewContainer.classList.add('hidden');
    dropzone.classList.remove('hidden');
    resultSection.classList.add('hidden');
    noResultsPlaceholder.classList.remove('hidden');
    statusLog.innerHTML = '';
    analyzeBtn.disabled = true;
});

analyzeBtn.addEventListener('click', analyzePrescription);

discoverModelsBtn.addEventListener('click', listPossibleModels);

// --- File Handling ---
async function handleFile(file) {
    if (!file) return;
    log(`File selected: ${file.name} (${file.type}, ${file.size} bytes)`);

    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        log("Invalid file type.", "error");
        alert('Please upload a JPG, PNG, or PDF file.');
        return;
    }

    selectedFile = file;
    mimeType = file.type;
    dropzone.classList.add('hidden');
    previewContainer.classList.remove('hidden');
    filePreview.innerHTML = '<p>Loading preview...</p>';

    if (file.type === 'application/pdf') {
        log("Processing PDF file...");
        const url = URL.createObjectURL(file);
        try {
            const pdf = await pdfjsLib.getDocument(url).promise;
            log(`PDF loaded. Pages: ${pdf.numPages}`);
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 2.0 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport }).promise;
            log("PDF page rendered to canvas.");

            filePreview.innerHTML = '';
            filePreview.appendChild(canvas);

            base64Data = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
            mimeType = 'image/jpeg';
            log("Base64 string generated from PDF.");
            analyzeBtn.disabled = false;
        } catch (error) {
            log(`PDF Error: ${error.message}`, "error");
            filePreview.innerHTML = '<p class="error">Error loading PDF</p>';
        }
    } else {
        log("Processing image file...");
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            filePreview.innerHTML = '';
            filePreview.appendChild(img);
            base64Data = e.target.result.split(',')[1];
            log(`Base64 string generated (Length: ${base64Data.length})`);
            analyzeBtn.disabled = false;
        };
        reader.onerror = (e) => log("FileReader error.", "error");
        reader.readAsDataURL(file);
    }
}

// --- Gemini AI ---
async function analyzePrescription() {
    log("Starting analysis...");

    const apiKey = GEMINI_API_KEY;
    if (!apiKey || apiKey === "PASTE_YOUR_API_KEY_HERE" || apiKey.length < 10) {
        log("API Key missing or invalid.", "error");
        alert('Please check your GEMINI_API_KEY in app.js');
        return;
    }

    if (!base64Data) {
        log("No image data available for analysis.", "error");
        alert('No file found. Please upload again.');
        return;
    }

    // UI States
    analyzeBtn.disabled = true;
    loadingState.classList.remove('hidden');
    loadingText.textContent = "🔍 Contacting Gemini 1.5 Flash...";
    statusLog.innerHTML = "";
    resultSection.classList.add('hidden');
    noResultsPlaceholder.classList.add('hidden');

    try {
        log("Initializing GoogleGenerativeAI...");
        const genAI = new GoogleGenerativeAI(apiKey);

        // The winner: gemini-2.5-flash is confirmed working for your account and region.
        const modelsToTry = ["gemini-2.5-flash"];
        let lastError = null;
        let success = false;

        for (const modelName of modelsToTry) {
            try {
                log(`Attempting analysis with model: ${modelName}...`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        temperature: 0.1,
                        topP: 1,
                        topK: 1,
                        maxOutputTokens: 2048,
                    },
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                    ]
                });

                const prompt = `You are a medical data extraction expert. 
                Extract the following fields from this medical prescription image or PDF:
                - patient_name
                - doctor_name
                - medicines (a list of objects with: name, dosage, frequency, duration)
                - instructions (general advice)
                - date
                
                Rules:
                1. If a field is not found or illegible, set it to "N/A".
                2. Provide ONLY valid JSON in your response. No markdown.
                3. Be as accurate as possible with handwritten names.`;

                const result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: mimeType
                        }
                    }
                ]);

                const response = await result.response;
                const text = response.text();

                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error("No JSON in response.");

                const data = JSON.parse(jsonMatch[0]);
                log(`Success with model: ${modelName}!`, "success");
                displayResults(data);
                success = true;
                break; // Exit loop on success
            } catch (err) {
                lastError = err;
                log(`Model ${modelName} failed: ${err.message}`, "info");
                continue; // Try next model
            }
        }

        if (!success) {
            throw lastError || new Error("All supported models failed.");
        }

    } catch (error) {
        log(`CRITICAL ERROR: ${error.message}`, "error");

        if (error.message.includes("429")) {
            log("TIP: 'Quota Exceeded' (429) usually means this model is restricted for your key.", "error");
            log("ACTION: Go to https://aistudio.google.com/ and check which model is active in your 'Free' plan.", "success");
        } else if (error.message.includes("404")) {
            log("TIP: '404' means the model name is outdated or not available in your region.", "error");
        }

        alert('Analysis failed. Try checking the Debug Console for tips.');
        noResultsPlaceholder.classList.remove('hidden');
    } finally {
        analyzeBtn.disabled = false;
        loadingState.classList.add('hidden');
    }
}

function displayResults(data) {
    log("Rendering results to screen...");
    resultSection.classList.remove('hidden');
    noResultsPlaceholder.classList.add('hidden');

    document.getElementById('output-patient').textContent = data.patient_name || 'N/A';
    document.getElementById('output-doctor').textContent = data.doctor_name || 'N/A';
    document.getElementById('output-date').textContent = data.date || 'N/A';
    document.getElementById('output-instructions').textContent = data.instructions || 'N/A';

    medicineTags.innerHTML = '';
    if (data.medicines && data.medicines.length > 0) {
        data.medicines.forEach(m => {
            if (m.name && m.name !== "N/A") {
                const pill = document.createElement('div');
                pill.className = 'pill-badge';
                pill.innerHTML = `
                    <span class="pill-name">${m.name}</span>
                    <span class="pill-info">${[m.dosage, m.frequency, m.duration].filter(v => v && v !== "N/A").join(' • ')}</span>
                `;
                medicineTags.appendChild(pill);
            }
        });
    }

    if (medicineTags.innerHTML === '') {
        medicineTags.innerHTML = '<span class="text-muted">No specific medicines found.</span>';
    }

    document.getElementById('download-json').onclick = () => {
        log("Downloading JSON file...");
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prescription_${Date.now()}.json`;
        a.click();
    };

    log("Done!", "success");
}

async function listPossibleModels() {
    log("Querying Gemini API for supported models...");
    const apiKey = GEMINI_API_KEY;
    if (!apiKey || apiKey.length < 10) {
        log("Cannot list models: API Key is missing or invalid.", "error");
        return;
    }

    try {
        // Since many versions of the SDK don't expose listModels cleanly to the web,
        // we use the direct REST API approach for discovery.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            log("--- AVAILABLE MODELS FOUND ---", "success");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    const shortName = m.name.replace('models/', '');
                    log(`> ${shortName} (${m.displayName})`, "success");
                }
            });
            log("TIP: Use one of these names in app.js if analysis fails.", "success");
        } else {
            log("No models returned. Response: " + JSON.stringify(data), "error");
        }
    } catch (error) {
        log(`Discovery Failed: ${error.message}`, "error");
    }
}
