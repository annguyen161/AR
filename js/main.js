const mv = document.getElementById("mv");
const customAR = document.getElementById("customAR");
const playAnimBtn = document.getElementById("playAnim");
const bgm = document.getElementById("bgm");
const btnGroup = document.getElementById("btnGroup");
const visitBtn = document.getElementById("visitBtn");
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

// Các phần tử mới cho các tính năng bổ sung
const pauseResumeBtn = document.createElement("button");
const restartAnimBtn = document.createElement("button");
const resetCameraBtn = document.createElement("button");
const loadingSpinner = document.createElement("div");

let firstAnim = null;
let arActivated = false; // Cờ để theo dõi xem AR đã được kích hoạt chưa
let isPaused = true; // Cờ để theo dõi trạng thái tạm dừng của animation

// Khởi tạo các phần tử giao diện mới với icon
pauseResumeBtn.innerHTML = '<i class="fas fa-play" title="Phát Animation"></i>';
pauseResumeBtn.style.display = "none";
restartAnimBtn.innerHTML =
  '<i class="fas fa-redo" title="Khởi động lại Animation"></i>';
restartAnimBtn.style.display = "none";
resetCameraBtn.innerHTML =
  '<i class="fas fa-undo" title="Đặt lại góc nhìn"></i>';
resetCameraBtn.style.display = "none";
loadingSpinner.textContent = "Đang tải mô hình...";
loadingSpinner.style.cssText =
  "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 16px; color: white; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 5px;";
btnGroup.appendChild(pauseResumeBtn);
btnGroup.appendChild(restartAnimBtn);
btnGroup.appendChild(resetCameraBtn);
document.body.appendChild(loadingSpinner);

// Cập nhật các nút hiện có để sử dụng icon
playAnimBtn.innerHTML = '<i class="fas fa-play" title="Phát Animation"></i>';
customAR.innerHTML = '<i class="fas fa-cube" title="Xem AR"></i>';
visitBtn.innerHTML = '<i class="fas fa-external-link-alt" title="Visit"></i>';

// Hiển thị banner văn bản sau 1 giây
setTimeout(() => {
  if (typeof textBanner !== "undefined" && textBanner) {
    textBanner.classList.add("show");
  }
}, 1000);

// Ẩn nút visit và các nút điều khiển khác ban đầu
visitBtn.style.display = "none";
visitBtn.classList.remove("show");
pauseResumeBtn.style.display = "none";
restartAnimBtn.style.display = "none";
resetCameraBtn.style.display = "none";

// Kiểm tra hỗ trợ AR và hiển thị thông báo dự phòng nếu không hỗ trợ
async function checkARSupport() {
  if (!mv.canActivateAR) {
    customAR.style.display = "none";
    const fallback = document.createElement("div");
    fallback.textContent =
      "Thiết bị này không hỗ trợ AR. Quét mã QR để xem trên thiết bị khác.";
    fallback.style.cssText = "color: red; font-size: 14px; margin-top: 10px;";
    btnGroup.appendChild(fallback);
    // Tùy chọn: tạo mã QR trỏ đến URL hiện tại
    console.log(
      "AR không được hỗ trợ. Hãy cân nhắc tạo mã QR cho: ",
      window.location.href
    );
  }
}

// Kích hoạt AR khi nhấn nút customAR
customAR.addEventListener("click", async (event) => {
  event.preventDefault();
  try {
    await mv.activateAR();
    arActivated = true; // Đặt cờ khi kích hoạt AR thành công
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

// Xử lý âm thanh khi thay đổi trạng thái hiển thị trang
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    bgm.pause();
    bgm.currentTime = 0;
  }
});

// Tạm dừng âm thanh khi trang bị ẩn
window.addEventListener("pagehide", () => {
  bgm.pause();
  bgm.currentTime = 0;
});

// Hàm hiển thị nút visit
function showVisitButton() {
  if (!visitBtn.classList.contains("show")) {
    visitBtn.style.display = "flex";
    visitBtn.classList.add("show");
    console.log("Đã hiển thị nút Visit");
  }
}

// Tải mô hình và khởi tạo animation/AR listener
mv.addEventListener("load", () => {
  console.log("Mô hình đã được tải");
  loadingSpinner.style.display = "none"; // Ẩn vòng quay tải
  const animations = mv.availableAnimations;

  if (animations && animations.length > 0) {
    firstAnim = animations[0];
    mv.animationName = firstAnim;
    mv.animationLoop = false;
    mv.pause();
    pauseResumeBtn.style.display = "inline-block";
    restartAnimBtn.style.display = "inline-block";
  } else {
    console.log("Không tìm thấy animation trong mô hình.");
    showVisitButton(); // Hiển thị nút visit nếu không có animation
  }

  resetCameraBtn.style.display = "inline-block";
  btnGroup.classList.add("show");
  checkARSupport();

  // Gắn listener trạng thái AR
  mv.addEventListener("ar-status", (event) => {
    console.log("Trạng thái AR:", event.detail.status);
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
});

// Phát animation khi nhấn nút playAnimBtn
playAnimBtn.addEventListener("click", () => {
  if (!firstAnim) {
    alert("Mô hình chưa có animation!");
    return;
  }

  mv.animationName = firstAnim;
  mv.animationLoop = false;
  mv.currentTime = 0;
  mv.play();
  isPaused = false;
  pauseResumeBtn.innerHTML =
    '<i class="fas fa-pause" title="Tạm dừng Animation"></i>';

  const lockAtEnd = () => {
    const duration = mv.duration;
    const currentTime = mv.currentTime;

    if (duration && currentTime >= duration - 0.1) {
      mv.pause();
      isPaused = true;
      pauseResumeBtn.innerHTML =
        '<i class="fas fa-play" title="Tiếp tục Animation"></i>';
      showVisitButton();
    } else {
      requestAnimationFrame(lockAtEnd);
    }
  };
  requestAnimationFrame(lockAtEnd);
});

// Tạm dừng/Tiếp tục animation
pauseResumeBtn.addEventListener("click", () => {
  if (!firstAnim) return;
  if (isPaused) {
    mv.play();
    isPaused = false;
    pauseResumeBtn.innerHTML =
      '<i class="fas fa-pause" title="Tạm dừng Animation"></i>';
  } else {
    mv.pause();
    isPaused = true;
    pauseResumeBtn.innerHTML =
      '<i class="fas fa-play" title="Tiếp tục Animation"></i>';
  }
});

// Khởi động lại animation
restartAnimBtn.addEventListener("click", () => {
  if (!firstAnim) return;
  mv.currentTime = 0;
  mv.play();
  isPaused = false;
  pauseResumeBtn.innerHTML =
    '<i class="fas fa-pause" title="Tạm dừng Animation"></i>';
});

// Đặt lại góc nhìn camera
resetCameraBtn.addEventListener("click", () => {
  mv.cameraOrbit = "45deg 90deg 2m";
  mv.cameraTarget = "auto auto auto";
  console.log("Đã đặt lại góc nhìn camera");
});

// Dự phòng cho việc quay lại từ AR
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && arActivated) {
    setTimeout(() => {
      if (mv.getAttribute("ar-status") === "not-presenting") {
        showVisitButton();
      }
    }, 500);
  }
});

// Hiển thị vòng quay tải ban đầu
mv.addEventListener("before-render", () => {
  if (!mv.modelIsVisible) {
    loadingSpinner.style.display = "block";
  }
});
