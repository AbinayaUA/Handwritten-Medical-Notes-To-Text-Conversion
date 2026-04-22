🧠 Smart Prescription Reader 

 📌 Overview

This project is a web-based Smart Prescription Reader that allows users to upload medical prescriptions (images or PDFs) and extract structured information such as patient details, doctor name, medicines, and instructions.

The system uses AI-powered analysis (Google Gemini API) to interpret prescription data and present it in a clear, user-friendly format.

 🎯 Objective

The goal of this project is to simplify medical prescription understanding by converting unstructured handwritten or printed prescriptions into structured digital data.

⚙️ Features

* 📤 Upload prescription (JPG, PNG, PDF)
* 🔍 AI-based data extraction
* 🧾 Extracted details:

  * Patient Name
  * Doctor Name
  * Date
  * Medicines (with dosage, frequency, duration)
  * Instructions
    
* 📊 Clean and structured output display
* 📥 Download extracted data as JSON

 🧩 Project Structure

MINI_PROJ_NO_API/
│
├── index.html        # Main UI for upload and analysis
├── app.js            # Core logic + AI integration
├── style.css         # Styling and UI design
├── results.html      # Results display page
├── results.js        # Handles result rendering
└── images/           # Sample images 

🛠️ Technologies Used

* HTML5
* CSS3
* JavaScript (ES6)
* Google Gemini API
* PDF.js (for PDF rendering)

 🚀 How to Run

1. Open the project folder
2. Open `index.html` in your browser

🔑 Important Setup

Before running, update your API key in:

📄 `app.js`

const GEMINI_API_KEY = "YOUR_API_KEY_HERE";

👉 Without this, analysis will not work.

🧠 How It Works

* The user uploads a prescription file
* The file is converted into Base64 format 
* AI model processes the input and extracts structured JSON
* Data is displayed in a clean UI 
* Results can be downloaded or copied

 📊 Output Example

The system generates structured data like:


{
  "patient_name": "John Doe",
  "doctor_name": "Dr. Smith",
  "medicines": [
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "frequency": "Twice daily",
      "duration": "5 days"
    }
  ],
  "instructions": "Take after food",
  "date": "2026-04-08"
}

 ⚠️ Limitations

* Requires a valid Gemini API key
* Accuracy depends on prescription clarity
* Works best with readable images

 🔮 Future Enhancements
* Incorporate DeepSeek OCR running locally to ensure data privacy and eliminate reliance on cloud-based APIs
* Develop a hybrid OCR + AI pipeline for improved accuracy on complex and handwritten prescriptions
* Extend support for multiple languages and regional prescription formats
* Optimize system performance for real-time processing
* Enable secure storage and retrieval of analyzed prescription data

 💬 Conclusion

This project demonstrates how AI can be used to transform unstructured medical data into meaningful insights, improving accessibility and usability in healthcare applications.
