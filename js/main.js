const mv = document.getElementById("mv");
const customAR = document.getElementById("customAR");
const playAnimBtn = document.getElementById("playAnim");
const bgm = document.getElementById("bgm");
const btnGroup = document.getElementById("btnGroup");
const visitBtn = document.getElementById("visitBtn");
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

let firstAnim = null;

// Nút kích hoạt AR
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

// Xử lý âm thanh khi thoát AR hoặc ẩn trang
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    bgm.pause();
    bgm.currentTime = 0;
  }
});

mv.addEventListener("ar-status", (event) => {
  if (event.detail.status === "session-started") {
    bgm.currentTime = 0;
    bgm.play().catch((err) => console.log("Không phát được nhạc:", err));
  } else if (event.detail.status === "not-presenting") {
    bgm.pause();
    bgm.currentTime = 0;
    mv.cameraOrbit = "45deg 90deg 2m";
  }
});

window.addEventListener("pagehide", () => {
  bgm.pause();
  bgm.currentTime = 0;
});

mv.addEventListener("load", () => {
  const animations = mv.availableAnimations;

  if (animations && animations.length > 0) {
    firstAnim = animations[0];
    mv.animationName = firstAnim;
    mv.animationLoop = false;
    mv.pause(); // không chạy ngay
  } else {
    console.log("Không tìm thấy animation trong mô hình.");
  }

  btnGroup.classList.add("show");
});
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
