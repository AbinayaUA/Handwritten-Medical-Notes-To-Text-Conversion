document.addEventListener('DOMContentLoaded', () => {
    // Read data from sessionStorage
    const savedData = sessionStorage.getItem('prescriptionData');
    
    if (!savedData) {
        // Redirection if no data (e.g., user accessed page directly)
        window.location.href = 'index.html';
        return;
    }

    try {
        const data = JSON.parse(savedData);
        renderResults(data);
    } catch (e) {
        console.error('Error parsing data:', e);
        alert('Error loading data.');
        window.location.href = 'index.html';
    }
});

function renderResults(data) {
    // Elements
    const patientEl = document.getElementById('output-patient');
    const doctorEl = document.getElementById('output-doctor');
    const dateEl = document.getElementById('output-date');
    const instructionsEl = document.getElementById('output-instructions');
    const medicineTags = document.getElementById('medicine-tags');

    // Fill textual values
    patientEl.textContent = data.patient_name || 'Not found';
    doctorEl.textContent = data.doctor_name || 'Not found';
    dateEl.textContent = data.date || 'Not found';
    instructionsEl.textContent = data.instructions || 'No specific instructions found.';

    // Medicines
    medicineTags.innerHTML = '';
    if (data.medicines && data.medicines.length > 0) {
        data.medicines.forEach(m => {
            const pill = document.createElement('div');
            pill.className = 'pill-badge';
            pill.innerHTML = `
                <span class="pill-name">${m.name || 'Unknown Medicine'}</span>
                <span class="pill-info">${[m.dosage, m.frequency, m.duration].filter(Boolean).join(' • ')}</span>
            `;
            medicineTags.appendChild(pill);
        });
    } else {
        medicineTags.innerHTML = '<p class="text-muted">No medicines identified.</p>';
    }

    // Export Actions
    document.getElementById('copy-json').onclick = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        alert('JSON copied to clipboard!');
    };

    document.getElementById('download-json').onclick = () => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prescription_${data.patient_name || 'data'}.json`;
        a.click();
    };
}
