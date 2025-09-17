const mv = document.getElementById("mv");
const customAR = document.getElementById("customAR");
const bgm = document.getElementById("bgm");
const btnGroup = document.getElementById("btnGroup");
const visitBtn = document.getElementById("visitBtn");
const textBanner = document.querySelector(".text-banner");
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const isAndroid = /Android/i.test(navigator.userAgent);

// Cấu hình AR cho Android để cố định mô hình
if (isAndroid) {
  mv.addEventListener("ar-status", (event) => {
    if (event.detail.status === "session-started") {
      // Đảm bảo mô hình được cố định trong không gian AR
      mv.arScale = "fixed";
      mv.arPlacement = "floor";
      console.log("AR session started - Model fixed in space");
    }
  });
}

// Nút kích hoạt AR
customAR.addEventListener("click", async (event) => {
  event.preventDefault();
  try {
    // Cấu hình AR trước khi kích hoạt
    if (isAndroid) {
      mv.arScale = "fixed";
      mv.arPlacement = "floor";
    }
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
  }
});

window.addEventListener("pagehide", () => {
  bgm.pause();
  bgm.currentTime = 0;
});

mv.addEventListener("load", () => {
  const animations = mv.availableAnimations;

  if (animations && animations.length > 0) {
    mv.animationName = animations[0];
    mv.animationLoop = false;
    mv.play();

    const lockAtEnd = () => {
      const duration = mv.duration;
      const currentTime = mv.currentTime;

      if (duration && currentTime >= duration - 0.1) {
        mv.timeScale = 0.0;
      } else {
        requestAnimationFrame(lockAtEnd);
      }
    };

    requestAnimationFrame(lockAtEnd);
  } else {
    console.log("Không tìm thấy animation trong mô hình.");
  }

  btnGroup.classList.add("show");
  textBanner.classList.add("show");
  setTimeout(() => {
    visitBtn.style.display = "flex";
    visitBtn.classList.add("show");
  }, 10000);
});
