document.addEventListener('DOMContentLoaded', () => {
    // Assuming your form has an ID of 'upload-form'
    const uploadForm = document.getElementById('upload-form');
    if (!uploadForm) {
        console.error('Upload form with ID "upload-form" not found.');
        return;
    }

    uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent the default form submission

        const submitButton = uploadForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = 'Saving...';

        // Assuming your form inputs have these IDs
        const projectName = document.getElementById('project-title').value;
        const language = document.getElementById('language').value;
        const code = document.getElementById('code-content').value;

        try {
            const response = await fetch('/api/save-to-github', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ projectName, language, code }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save to GitHub');
            }

            // Success! Show a success message and redirect.
            submitButton.innerHTML = '<i class="fa-solid fa-check"></i> Success!';
            
            setTimeout(() => {
                window.location.href = 'project.html'; // Redirect to the projects page
            }, 1500); // Wait 1.5s before redirecting

        } catch (error) {
            // On error, re-enable the button and show the error.
            console.error('Error saving project:', error);
            alert(`An error occurred: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    });
});