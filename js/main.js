const mv = document.getElementById("mv");
const customAR = document.getElementById("customAR");
const playAnimBtn = document.getElementById("playAnim");
const bgm = document.getElementById("bgm");
const btnGroup = document.getElementById("btnGroup");
const visitBtn = document.getElementById("visitBtn");
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

let firstAnim = null;
let arActivated = false; // Flag to track if AR was entered

// Show text banner after 1 second (assuming textBanner is defined elsewhere)
setTimeout(() => {
  if (typeof textBanner !== "undefined" && textBanner) {
    textBanner.classList.add("show");
  }
}, 1000);

// Initially hide visit button
visitBtn.style.display = "none";
visitBtn.classList.remove("show");

// Activate AR on customAR button click
customAR.addEventListener("click", async (event) => {
  event.preventDefault();
  try {
    await mv.activateAR();
    arActivated = true; // Set flag on successful activation attempt
  } catch (err) {
    console.error("Kích hoạt AR thất bại:", err);
  }

  if (isIOS && bgm.paused) {
    bgm.currentTime = 0;
    bgm
      .play()
      .catch((err) => console.error("Không phát được nhạc trên iOS:", err));
  }
});

// Handle audio on page visibility change
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    bgm.pause();
    bgm.currentTime = 0;
  }
});

// Pause audio on page hide
window.addEventListener("pagehide", () => {
  bgm.pause();
  bgm.currentTime = 0;
});

// Load model and initialize animations/AR listener
mv.addEventListener("load", () => {
  console.log("Model loaded");
  const animations = mv.availableAnimations;

  if (animations && animations.length > 0) {
    firstAnim = animations[0];
    mv.animationName = firstAnim;
    mv.animationLoop = false;
    mv.pause(); // Do not play animation immediately
  } else {
    console.log("Không tìm thấy animation trong mô hình.");
  }

  // Attach AR status listener after load to ensure readiness
  mv.addEventListener("ar-status", (event) => {
    console.log("AR status:", event.detail.status);
    if (event.detail.status === "session-started") {
      bgm.currentTime = 0;
      bgm.play().catch((err) => console.error("Không phát được nhạc:", err));
    } else if (event.detail.status === "not-presenting") {
      bgm.pause();
      bgm.currentTime = 0;
      mv.cameraOrbit = "45deg 90deg 2m";

      // Show visit button on return from AR (regardless of animation)
      showVisitButton();
    }
  });

  // Set initial AR status if needed
  if (mv.getAttribute("ar-status") !== "session-started") {
    mv.setAttribute("ar-status", "not-presenting");
  }

  btnGroup.classList.add("show");
});

// Function to show visit button
function showVisitButton() {
  if (!visitBtn.classList.contains("show")) {
    visitBtn.style.display = "flex";
    visitBtn.classList.add("show");
    console.log("Visit button shown");
  }
}

// Play animation on playAnimBtn click
playAnimBtn.addEventListener("click", () => {
  if (!firstAnim) {
    alert("Model chưa có animation!");
    return;
  }

  mv.animationName = firstAnim;
  mv.animationLoop = false;
  mv.currentTime = 0;
  mv.play();

  const lockAtEnd = () => {
    const duration = mv.duration;
    const currentTime = mv.currentTime;

    if (duration && currentTime >= duration - 0.1) {
      mv.pause();
      showVisitButton();
    } else {
      requestAnimationFrame(lockAtEnd);
    }
  };
  requestAnimationFrame(lockAtEnd);
});

// Fallback: Show button if AR was activated but event didn't fire (e.g., on page focus after AR)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && arActivated) {
    // Small delay to ensure AR session has fully ended
    setTimeout(() => {
      if (mv.getAttribute("ar-status") === "not-presenting") {
        showVisitButton();
      }
    }, 500);
  }
});
