document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const addFittingBtn = document.getElementById('addFitting');
    const removeFittingBtn = document.getElementById('removeFitting');
    const availableFittings = document.getElementById('availableFittings');
    const selectedFittings = document.getElementById('selectedFittings');
    const createFleetBtn = document.getElementById('createFleet');
    const fleetForm = document.getElementById('newFleetForm');
    const fleetModal = document.getElementById('newFleetModal');

    // Reset form when modal is closed
    fleetModal.addEventListener('hidden.bs.modal', function () {
        // Reset form fields
        fleetForm.reset();
        
        // Reset datetime field (not covered by form.reset())
        document.getElementById('fleetDateTime').value = '';
        
        // Reset custom EFT data
        document.getElementById('customEft').value = '';
        
        // Move all selected fittings back to available fittings
        Array.from(selectedFittings.options).forEach(option => {
            const newOption = document.createElement('option');
            newOption.value = option.value;
            newOption.text = option.text;
            availableFittings.add(newOption);
        });
        // Clear selected fittings
        selectedFittings.options.length = 0;
    });

    // Add fitting to selected list
    addFittingBtn.addEventListener('click', () => {
        Array.from(availableFittings.selectedOptions).forEach(option => {
            const newOption = document.createElement('option');
            newOption.value = option.value;
            newOption.text = option.text;
            selectedFittings.add(newOption);
            availableFittings.remove(option.index);
        });
    });

    // Remove fitting from selected list
    removeFittingBtn.addEventListener('click', () => {
        Array.from(selectedFittings.selectedOptions).forEach(option => {
            const newOption = document.createElement('option');
            newOption.value = option.value;
            newOption.text = option.text;
            availableFittings.add(newOption);
            selectedFittings.remove(option.index);
        });
    });

    // Handle form submission
    createFleetBtn.addEventListener('click', () => {
        const formData = {
            fleetType: document.querySelector('input[name="fleetType"]:checked').value,
            dateTime: document.getElementById('fleetDateTime').value,
            doctrine: document.getElementById('fleetDoctrine').value,
            objective: document.getElementById('fleetObjective').value,
            selectedFittings: Array.from(selectedFittings.options).map(opt => opt.value),
            customEft: document.getElementById('customEft').value
        };

        // Send data to server
        fetch('/api/fleet/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Close modal and refresh page
                const modal = bootstrap.Modal.getInstance(document.getElementById('newFleetModal'));
                modal.hide();
                window.location.reload();
            } else {
                alert('Error creating fleet: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to create fleet. Please try again.');
        });
    });
});
