const mv = document.getElementById("mv");
const customAR = document.getElementById("customAR");
const playAnimBtn = document.getElementById("playAnim");
const bgm = document.getElementById("bgm");
const btnGroup = document.getElementById("btnGroup");
const visitBtn = document.getElementById("visitBtn");
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

let firstAnim = null;

// Show text banner after 1 second
setTimeout(() => {
  if (textBanner) {
    textBanner.classList.add("show");
  }
}, 1000);

// Activate AR on customAR button click
customAR.addEventListener("click", async (event) => {
  event.preventDefault();
  try {
    await mv.activateAR();
  } catch (err) {
    console.log("Kích hoạt AR thất bại:", err);
  }

  if (isIOS && bgm.paused) {
    bgm.currentTime = 0;
    bgm
      .play()
      .catch((err) => console.log("Không phát được nhạc trên iOS:", err));
  }
});

// Handle audio on page visibility change
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    bgm.pause();
    bgm.currentTime = 0;
  }
});

// Handle AR status changes
mv.addEventListener("ar-status", (event) => {
  if (event.detail.status === "session-started") {
    bgm.currentTime = 0;
    bgm.play().catch((err) => console.log("Không phát được nhạc:", err));
  } else if (event.detail.status === "not-presenting") {
    bgm.pause();
    bgm.currentTime = 0;
    mv.cameraOrbit = "45deg 90deg 2m";

    // Show visit button regardless of animation state
    if (!visitBtn.classList.contains("show")) {
      visitBtn.style.display = "flex";
      visitBtn.classList.add("show");
    }
  }
});

// Pause audio on page hide
window.addEventListener("pagehide", () => {
  bgm.pause();
  bgm.currentTime = 0;
});

// Load model and initialize animations
mv.addEventListener("load", () => {
  const animations = mv.availableAnimations;

  if (animations && animations.length > 0) {
    firstAnim = animations[0];
    mv.animationName = firstAnim;
    mv.animationLoop = false;
    mv.pause(); // Do not play animation immediately
  } else {
    console.log("Không tìm thấy animation trong mô hình.");
    // Show visit button if no animations are available
    visitBtn.style.display = "flex";
    visitBtn.classList.add("show");
  }

  btnGroup.classList.add("show");
});

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
      visitBtn.style.display = "flex";
      visitBtn.classList.add("show");
    } else {
      requestAnimationFrame(lockAtEnd);
    }
  };
  requestAnimationFrame(lockAtEnd);
});
