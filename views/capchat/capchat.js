let selectedImageId;
let timeleft;
let downloadTimer;
let initialTime = 30;

// Add click event listener to each image
document.querySelectorAll("#imageContainer img").forEach((img) => {
    img.addEventListener("click", function () {
        // Remove selected class from any previously selected image
        document.querySelectorAll(".selected").forEach((selectedImg) => {
            selectedImg.classList.remove("selected");
        });

        // Add selected class to the clicked image
        img.classList.add("selected");

        // Update selected image ID
        selectedImageId = img.dataset.id;
    });
});

document.getElementById("confirmButton").addEventListener("click", function () {
    if (selectedImageId) {
        fetch('/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: selectedImageId })
        })
            .then(response => response.json())
            .then(result => {
                if (result === 'retry' && initialTime > 5) {
                    initialTime -= 5;
                    clearInterval(downloadTimer);
                    startTimer(initialTime);
                    loadNewImages();
                }
                alert(result);
            })
            .catch(error => console.error('Error:', error));
    } else {
        alert('Please select an image.');
    }
});

function startTimer(duration) {
    timeleft = duration;
    downloadTimer = setInterval(function () {
        if (timeleft <= 0) {
            clearInterval(downloadTimer);
            fetch('/endOfTime', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })
                .then(response => response.text())
                .then(result => {
                    alert(result);

                    // Fetch new images from the server
                    loadNewImages();

                    if (initialTime <= 5) {
                        // refreshing the page
                        location.reload();
                    } else {
                        // reduce the time by 5 seconds and restart timer
                        initialTime -= 5;
                        startTimer(initialTime);
                    }
                })
                .catch(error => console.error('Error:', error));

        } else {
            document.getElementById("progressBar").style.width = (timeleft * 100 / duration) + "%";
            document.getElementById("timer").innerHTML = timeleft + "s";
        }
        timeleft -= 1;
    }, 1000);
}

function loadNewImages() {
    fetch('/newImages')
    .then(response => response.text())
    .then(data => {
      document.getElementById('imageContainer').innerHTML = data;
  
      document.querySelectorAll("#imageContainer img").forEach((img) => {
        img.addEventListener("click", imageClickListener);
      });
    });
  }

document.addEventListener('DOMContentLoaded', (event) => {
    startTimer(initialTime);
});
