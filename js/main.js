const mv = document.getElementById("mv");
const customAR = document.getElementById("customAR");
const playAnimBtn = document.getElementById("playAnim");
const bgm = document.getElementById("bgm");
const btnGroup = document.getElementById("btnGroup");
const visitBtn = document.getElementById("visitBtn");
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

let firstAnim = null;
let animStarted = false; // người dùng đã bấm Play Anim chưa
let inArSession = false; // đang trong AR session (theo dõi)

function showVisitBtn() {
  if (!visitBtn) return;
  // đảm bảo hiển thị + animation mượt
  visitBtn.style.display = "flex";
  visitBtn.style.pointerEvents = "auto";
  visitBtn.style.opacity = "0";
  visitBtn.style.transform = "translateY(8px)";

  // bắt repaint rồi bật transition
  requestAnimationFrame(() => {
    visitBtn.style.transition = "opacity .45s ease, transform .45s ease";
    visitBtn.style.opacity = "1";
    visitBtn.style.transform = "translateY(0)";
  });
  console.log("visitBtn: shown");
}

function hideVisitBtn() {
  if (!visitBtn) return;
  visitBtn.style.transition = "";
  visitBtn.style.display = "none";
  visitBtn.style.opacity = "";
  visitBtn.style.transform = "";
  visitBtn.style.pointerEvents = "none";
  console.log("visitBtn: hidden");
}

/* optional banner safe-check (giữ nguyên nếu dùng) */
setTimeout(() => {
  if (typeof textBanner !== "undefined" && textBanner) {
    textBanner.classList.add("show");
  }
}, 1000);

/* AR button -> activate */
customAR.addEventListener("click", async (event) => {
  event.preventDefault();
  try {
    await mv.activateAR();
  } catch (err) {
    console.log("Kích hoạt AR thất bại:", err);
  }

  if (isIOS && bgm && bgm.paused) {
    bgm.currentTime = 0;
    bgm
      .play()
      .catch((err) => console.log("Không phát được nhạc trên iOS:", err));
  }
});

/* Visibility change — dùng để phát hiện Quick Look (iOS) khi quay trở lại trang */
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    // nếu trước đó vào AR (inArSession true) => khi quay lại hiện nút
    if (inArSession) {
      showVisitBtn();
      inArSession = false;
    }
    // dừng nhạc khi trở về
    if (bgm) {
      bgm.pause();
      bgm.currentTime = 0;
    }
  }
});

/* ar-status: nhiều thiết bị/trình duyệt trả về giá trị khác nhau.
   Ta coi một số trạng thái là "đang trong AR" (presentingStates).
   Khi status không thuộc nhóm đó => coi là đã thoát AR => show button.
*/
mv.addEventListener("ar-status", (event) => {
  const status = event && event.detail && event.detail.status;
  console.log("ar-status:", status);

  const presentingStates = new Set([
    "session-started",
    "presenting",
    "object-placed",
    "tracking",
    "session-running",
  ]);

  if (presentingStates.has(status)) {
    inArSession = true;
    // nếu muốn ẩn nút khi vào AR thì uncomment:
    // hideVisitBtn();
  } else {
    // ra khỏi AR: hiển thị nút *Ghé Thăm*
    // Nếu user từng bấm PlayAnim, thì show khi anim kết thúc (animStarted === true)
    // Nếu chưa bấm PlayAnim (animStarted === false) thì vẫn show ngay khi thoát AR
    if (!animStarted || inArSession) {
      showVisitBtn();
    }
    inArSession = false;
  }

  // xử lý âm thanh / camera tuỳ trạng thái
  if (status === "session-started") {
    if (bgm) {
      bgm.currentTime = 0;
      bgm.play().catch(() => {});
    }
  }
  if (
    status === "not-presenting" ||
    status === "failed" ||
    status === "session-ended"
  ) {
    if (bgm) {
      bgm.pause();
      bgm.currentTime = 0;
    }
    try {
      mv.cameraOrbit = "45deg 90deg 2m";
    } catch (e) {
      /* ignore */
    }
  }
});

/* load model */
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
  hideVisitBtn(); // ẩn chắc khi load
});

/* nút Play Animation */
if (playAnimBtn) {
  playAnimBtn.addEventListener("click", () => {
    if (!firstAnim) {
      alert("Model chưa có animation!");
      return;
    }

    animStarted = true; // đánh dấu user đã bấm play
    hideVisitBtn(); // ẩn nút khi play lại

    mv.animationName = firstAnim;
    mv.animationLoop = false;
    mv.currentTime = 0;
    mv.play();

    const lockAtEnd = () => {
      const duration = mv.duration;
      const currentTime = mv.currentTime;

      if (duration && currentTime >= duration - 0.05) {
        mv.pause();
        showVisitBtn();
      } else {
        requestAnimationFrame(lockAtEnd);
      }
    };
    requestAnimationFrame(lockAtEnd);
  });
} else {
  console.warn();
}
