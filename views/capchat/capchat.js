let selectedImageId;

function imageClickHandler() {
    // Remove selected class from any previously selected image
    document.querySelectorAll(".selected").forEach((selectedImg) => {
        selectedImg.classList.remove("selected");
    });

    // Add selected class to the clicked image
    this.classList.add("selected");

    // Update selected image ID
    selectedImageId = this.dataset.id;
}

// Add click event listener to each image
document.querySelectorAll("#imageContainer img").forEach((img) => {
    img.addEventListener("click", imageClickHandler);
});

document.getElementById("confirmButton").addEventListener("click", function () {
    if (selectedImageId) {
        fetch('/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: selectedImageId })
        })
            .then(response => {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    return response.json();
                }
                throw new TypeError("Oops, we didn't get JSON!");
            })
            .then(data => {
                if (data.singular === false) {
                    resetTimerAndImages();
                } else if (data.redirect) {
                    window.location.href = data.redirect;
                }
            })
            .catch(error => console.error('Error:', error));
    } else {
        alert('Please select an image.');
    }
});



let timeleft;
let downloadTimer;
let initialTime = 30;

function startTimer(duration) {
    clearInterval(downloadTimer);
    timeleft = duration;
    downloadTimer = setInterval(function () {
        if (timeleft <= 0) {
            clearInterval(downloadTimer);
            resetTimerAndImages();
        } else {
            document.getElementById("progressBar").style.width = (timeleft * 100 / duration) + "%";
            document.getElementById("timer").innerHTML = timeleft + "s";
        }
        timeleft -= 1;
    }, 1000);
}

document.addEventListener('DOMContentLoaded', (event) => {
    startTimer(initialTime);
});

function resetTimerAndImages() {
    fetch('/newSet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })
        .then(response => response.json())
        .then(result => {
            // Update images
            const imageContainer = document.getElementById("imageContainer");
            imageContainer.innerHTML = ''; // clear the container first
            result.images.forEach((image, index) => {
                let imgDiv = document.createElement("div");
                imgDiv.style.flex = "1 1 25%";
                imgDiv.style.padding = "10px";

                let img = document.createElement("img");
                img.src = image.path;
                img.alt = "Image ID " + image.id;
                img.style.width = "100%";
                img.style.height = "auto";
                img.dataset.id = image.id;

                // Attach click event
                img.addEventListener("click", imageClickHandler);

                imgDiv.appendChild(img);
                imageContainer.appendChild(imgDiv);
            });

            // Update hint
            document.getElementById("hint").textContent = result.hint;

            // Reset timer
            if (initialTime > 5) {
                initialTime -= 5;
                startTimer(initialTime);
            } else {
                alert("No Human");
                location.reload();
            }

        })
        .catch(error => console.error('Error:', error));
}
