const mv = document.getElementById("mv");
const customAR = document.getElementById("customAR");
const playAnimBtn = document.getElementById("playAnim");
const bgm = document.getElementById("bgm");
const btnGroup = document.getElementById("btnGroup");
const visitBtn = document.getElementById("visitBtn");
const textBanner = document.querySelector(".text-banner");
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

let firstAnim = null;
let arActivated = false;

// Function to check AR support
function checkARSupport() {
  // Check for WebXR support
  if ("xr" in navigator) {
    return navigator.xr
      .isSessionSupported("immersive-ar")
      .then((supported) => {
        return supported;
      })
      .catch(() => {
        return false;
      });
  }

  // Check for iOS AR Quick Look support
  if (isIOS) {
    return new Promise((resolve) => {
      // iOS devices with iOS 12+ support AR Quick Look
      const iOSVersion = navigator.userAgent.match(/OS (\d+)_/);
      if (iOSVersion && parseInt(iOSVersion[1]) >= 12) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  // Check for Android ARCore support
  if (/Android/i.test(navigator.userAgent)) {
    return new Promise((resolve) => {
      // Basic Android AR support check
      resolve(true);
    });
  }

  // Default to false for unsupported devices
  return Promise.resolve(false);
}

// Function to show AR not supported message
function showARNotSupportedMessage() {
  // Create modal overlay
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    font-family: 'Nunito', sans-serif;
  `;

  // Create modal content
  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 15px;
    text-align: center;
    max-width: 350px;
    margin: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  `;

  // Create message
  const message = document.createElement("div");
  message.style.cssText = `
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 20px;
    line-height: 1.4;
  `;
  message.textContent = "Thiết bị của bạn không hỗ trợ AR";

  // Create close button
  const closeBtn = document.createElement("button");
  closeBtn.style.cssText = `
    background: #FF6B6B;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 25px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s ease;
  `;
  closeBtn.textContent = "Đóng";
  closeBtn.onmouseover = () => (closeBtn.style.background = "#FF5252");
  closeBtn.onmouseout = () => (closeBtn.style.background = "#FF6B6B");

  // Add click handler to close modal
  closeBtn.addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  // Add click handler to close modal when clicking overlay
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });

  // Assemble modal
  modalContent.appendChild(message);
  modalContent.appendChild(closeBtn);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
}

// Function to update banner text after countdown
function updateBannerText() {
  const bannerText = document.querySelector(".banner-text");
  if (bannerText) {
    bannerText.innerHTML = `
      Mẹ khám phá TRỌN VẸN 9 THÁNG trưởng thành của con tại "đổi quà" nhé
    `;
  }
}

setTimeout(() => {
  if (typeof textBanner !== "undefined" && textBanner) {
    textBanner.classList.add("show");
  }
}, 1000);

// Countdown for visit button
let countdownTime = 10;
let countdownInterval = null;

function startCountdown() {
  const btnText = visitBtn.querySelector(".btn-icon");
  const originalText = btnText.textContent;

  visitBtn.disabled = true;
  visitBtn.style.opacity = "0.6";
  visitBtn.style.cursor = "not-allowed";

  countdownInterval = setInterval(() => {
    btnText.textContent = `Đổi Quà (${countdownTime}s)`;
    countdownTime--;

    if (countdownTime < 0) {
      clearInterval(countdownInterval);
      visitBtn.disabled = false;
      visitBtn.style.opacity = "1";
      visitBtn.style.cursor = "pointer";
      btnText.textContent = originalText;
      // Update banner text after countdown completes
      updateBannerText();
    }
  }, 1000);
}

visitBtn.style.display = "flex";
visitBtn.classList.add("show");
startCountdown();

customAR.addEventListener("click", async (event) => {
  event.preventDefault();

  // Check AR support before activating
  try {
    const isARSupported = await checkARSupport();

    if (!isARSupported) {
      showARNotSupportedMessage();
      return;
    }

    await mv.activateAR();
    arActivated = true;
  } catch (err) {
    console.error("Kích hoạt AR thất bại:", err);
    // Show error message if AR activation fails
    showARNotSupportedMessage();
  }

  if (isIOS && bgm.paused) {
    bgm.currentTime = 0;
    bgm
      .play()
      .catch((err) => console.error("Không phát được nhạc trên iOS:", err));
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    bgm.pause();
    bgm.currentTime = 0;
  }
});

window.addEventListener("pagehide", () => {
  bgm.pause();
  bgm.currentTime = 0;
});

mv.addEventListener("load", () => {
  console.log("Model loaded");
  const animations = mv.availableAnimations;

  if (animations && animations.length > 0) {
    firstAnim = animations[0];
    mv.animationName = firstAnim;
    mv.animationLoop = false;
    mv.pause();
  } else {
    console.log("Không tìm thấy animation trong mô hình.");
  }

  mv.addEventListener("ar-status", (event) => {
    console.log("AR status:", event.detail.status);
    if (event.detail.status === "session-started") {
      bgm.currentTime = 0;
      bgm.play().catch((err) => console.error("Không phát được nhạc:", err));
    } else if (event.detail.status === "not-presenting") {
      bgm.pause();
      bgm.currentTime = 0;
      mv.cameraOrbit = "45deg 90deg 2m";
      showVisitButton();
    }
  });

  if (mv.getAttribute("ar-status") !== "session-started") {
    mv.setAttribute("ar-status", "not-presenting");
  }

  btnGroup.classList.add("show");
});

function showVisitButton() {
  if (!visitBtn.classList.contains("show")) {
    visitBtn.style.display = "flex";
    visitBtn.classList.add("show");
    console.log("Visit button shown");
  }
}

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

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && arActivated) {
    setTimeout(() => {
      if (mv.getAttribute("ar-status") === "not-presenting") {
        showVisitButton();
      }
    }, 500);
  }
});
