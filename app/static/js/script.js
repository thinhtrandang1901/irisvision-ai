// =========================================
// IRISVISION AI — LUXURY INTRO
// =========================================

document.addEventListener("DOMContentLoaded", () => {

    const introScreen = document.getElementById("intro-screen");
    const enterAppBtn = document.getElementById("enter-app-btn");

    if (!introScreen) {
        return;
    }

    /* -------------------------------
       TẠO HẠT SÁNG BAY
    -------------------------------- */

    const particlesContainer = document.createElement("div");

    particlesContainer.className = "intro-particles";

    introScreen.appendChild(particlesContainer);

    for (let i = 0; i < 32; i++) {

        const particle = document.createElement("span");

        particle.className = "intro-particle";

        const sizeType = i % 8;

        if (sizeType === 0) {
            particle.classList.add("large");
        }

        if (sizeType === 1 || sizeType === 2) {
            particle.classList.add("small");
        }

        particle.style.left = `${Math.random() * 100}%`;

        particle.style.animationDuration =
            `${5 + Math.random() * 7}s`;

        particle.style.animationDelay =
            `${Math.random() * 5}s`;

        particlesContainer.appendChild(particle);
    }


    /* -------------------------------
       TẠO VÒNG ÁNH SÁNG
    -------------------------------- */

    const ringOne = document.createElement("div");

    ringOne.className = "luxury-ring ring-one";

    introScreen.appendChild(ringOne);


    const ringTwo = document.createElement("div");

    ringTwo.className = "luxury-ring ring-two";

    introScreen.appendChild(ringTwo);


    /* -------------------------------
       NÚT VÀO APP
    -------------------------------- */

    if (enterAppBtn) {

        enterAppBtn.addEventListener("click", () => {

            introScreen.classList.add("hidden");

            setTimeout(() => {

                introScreen.style.display = "none";

            }, 800);

        });

    }

});
document.addEventListener("DOMContentLoaded", () => {
    const predictButton = document.getElementById("predict-btn");
    const sampleButton = document.getElementById("sample-btn");
    const resultContent = document.getElementById("result-content");
    const themeToggle = document.getElementById("theme-toggle");
    const clearHistoryButton = document.getElementById("clear-history");

    let predictionHistory = JSON.parse(
        localStorage.getItem("irisPredictionHistory") || "[]"
    );

    let totalPredictions = Number(
        localStorage.getItem("irisTotalPredictions") || "0"
    );

    const flowerInfo = {
        setosa: {
            name: "Iris Setosa",
            image: "/static/images/setosa.jpg",
            description:
                "Iris Setosa thường có cánh hoa nhỏ và dễ nhận diện qua đặc điểm hình thái."
        },

        versicolor: {
            name: "Iris Versicolor",
            image: "/static/images/versicolor.jpg",
            description:
                "Iris Versicolor có kích thước cánh hoa trung bình và đặc điểm hình thái riêng."
        },

        virginica: {
            name: "Iris Virginica",
            image: "/static/images/virginica.jpg",
            description:
                "Iris Virginica thường có cánh hoa lớn hơn và chiều dài cánh hoa nổi bật."
        }
    };

    // ==============================
    // NÚT DỰ ĐOÁN
    // ==============================

    if (predictButton) {
        predictButton.addEventListener("click", async () => {
            const sepalLength = Number(
                document.getElementById("sepal_length").value
            );

            const sepalWidth = Number(
                document.getElementById("sepal_width").value
            );

            const petalLength = Number(
                document.getElementById("petal_length").value
            );

            const petalWidth = Number(
                document.getElementById("petal_width").value
            );

            if (
                !sepalLength ||
                !sepalWidth ||
                !petalLength ||
                !petalWidth
            ) {
                alert("Vui lòng nhập đầy đủ thông tin!");
                return;
            }

            predictButton.disabled = true;
            predictButton.textContent = "Đang dự đoán...";

            try {
                const response = await fetch("/predict", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        sepal_length: sepalLength,
                        sepal_width: sepalWidth,
                        petal_length: petalLength,
                        petal_width: petalWidth
                    })
                });

                if (!response.ok) {
                    throw new Error("API trả về lỗi!");
                }

                const result = await response.json();

                displayResult(result);

            } catch (error) {
                console.error("Lỗi:", error);

                resultContent.innerHTML = `
                    <div class="error-message">
                        Không thể kết nối đến mô hình.
                        Vui lòng kiểm tra lại server.
                    </div>
                `;

            } finally {
                predictButton.disabled = false;
                predictButton.textContent = "Dự đoán";
            }
        });
    }

    // ==============================
    // HIỂN THỊ KẾT QUẢ
    // ==============================

    function displayResult(result) {
        let prediction = result.prediction;

        if (Array.isArray(prediction)) {
            prediction = prediction[0];
        }

        const flowerKey = String(prediction)
            .toLowerCase()
            .replace("iris-", "")
            .replace("iris ", "")
            .trim();

        const flower = flowerInfo[flowerKey] || {
            name: prediction,
            image: "",
            description: "Mô hình đã hoàn thành dự đoán."
        };

        const probabilities = result.probabilities || {};

        const probabilityValues = Object.values(probabilities)
            .map(Number)
            .filter((value) => !isNaN(value));

        let bestProbability = 1;

        if (probabilityValues.length > 0) {
            bestProbability = Math.max(...probabilityValues);

            if (bestProbability > 1) {
                bestProbability = bestProbability / 100;
            }
        }

        const confidence = (bestProbability * 100).toFixed(2);

        let html = `
            <div class="prediction-box">

                <div class="result-badge">
                    ✓ AI PREDICTION
                </div>

                ${
                    flower.image
                        ? `
                    <img
                        src="${flower.image}"
                        alt="${flower.name}"
                        class="result-flower-image"
                    >
                    `
                        : ""
                }

                <div class="prediction-label">
                    Loài hoa được nhận diện
                </div>

                <h2 class="prediction-name">
                    ${flower.name}
                </h2>

                <p class="flower-description">
                    ${flower.description}
                </p>

                <div class="confidence-card">

                    <div class="confidence-header">
                        <span>Độ tin cậy mô hình</span>
                        <strong>${confidence}%</strong>
                    </div>

                    <div class="progress">
                        <div
                            class="progress-bar"
                            style="width: ${confidence}%"
                        ></div>
                    </div>

                </div>

                <h4>Xác suất dự đoán</h4>
        `;

        for (const [name, probabilityValue] of Object.entries(
            probabilities
        )) {
            let percentageValue = Number(probabilityValue);

            if (percentageValue <= 1) {
                percentageValue = percentageValue * 100;
            }

            const percentage = percentageValue.toFixed(2);

            html += `
                <div class="probability-item">

                    <div class="probability-header">
                        <span>${name}</span>
                        <strong>${percentage}%</strong>
                    </div>

                    <div class="progress">
                        <div
                            class="progress-bar ${String(name).toLowerCase()}"
                            style="width: ${percentage}%"
                        ></div>
                    </div>

                </div>
            `;
        }

        html += `
            </div>
        `;

        resultContent.innerHTML = html;

        addToHistory(
            flower.name,
            flower.image,
            confidence
        );
    }

    // ==============================
    // LỊCH SỬ DỰ ĐOÁN
    // ==============================

    function addToHistory(name, image, confidence) {
        const historyItem = {
            name: name,
            image: image,
            confidence: confidence,
            time: new Date().toLocaleTimeString("vi-VN")
        };

        predictionHistory.unshift(historyItem);

        if (predictionHistory.length > 5) {
            predictionHistory.pop();
        }

        totalPredictions++;

        localStorage.setItem(
            "irisPredictionHistory",
            JSON.stringify(predictionHistory)
        );

        localStorage.setItem(
            "irisTotalPredictions",
            String(totalPredictions)
        );

        renderHistory();
    }

    function renderHistory() {
        const historyContainer =
            document.getElementById("history-list");

        if (!historyContainer) {
            return;
        }

        if (predictionHistory.length === 0) {
            historyContainer.innerHTML =
                "<p>Chưa có lịch sử dự đoán.</p>";
            return;
        }

        historyContainer.innerHTML = predictionHistory
            .map(
                (item) => `
                <div class="history-item">

                    ${
                        item.image
                            ? `<img src="${item.image}" alt="${item.name}">`
                            : ""
                    }

                    <div>
                        <strong>${item.name}</strong>
                        <p>Độ tin cậy: ${item.confidence}%</p>
                        <small>${item.time}</small>
                    </div>

                </div>
            `
            )
            .join("");
    }

    if (clearHistoryButton) {
        clearHistoryButton.addEventListener("click", () => {
            predictionHistory = [];

            localStorage.setItem(
                "irisPredictionHistory",
                JSON.stringify([])
            );

            renderHistory();
        });
    }

    // ==============================
    // NÚT MẪU DỮ LIỆU
    // ==============================

    if (sampleButton) {
        sampleButton.addEventListener("click", () => {
            document.getElementById("sepal_length").value = "5.1";
            document.getElementById("sepal_width").value = "3.5";
            document.getElementById("petal_length").value = "1.4";
            document.getElementById("petal_width").value = "0.2";
        });
    }

    // ==============================
    // CHẾ ĐỘ SÁNG / TỐI
    // ==============================

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");

            const isDarkMode =
                document.body.classList.contains("dark-mode");

            localStorage.setItem(
                "irisDarkMode",
                String(isDarkMode)
            );
        });
    }

    const savedDarkMode =
        localStorage.getItem("irisDarkMode") === "true";

    if (savedDarkMode) {
        document.body.classList.add("dark-mode");
    }

    // ==============================
    // KHỞI TẠO
    // ==============================

    renderHistory();
});
// =========================================================
// IRISVISION AI — DASHBOARD MOTION EFFECT
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    const animatedSections = document.querySelectorAll(
        ".hero-card, .studio, .history-card, .gallery-section, .model-dashboard, .footer"
    );

    if (!("IntersectionObserver" in window)) {
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {

            entries.forEach((entry) => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("section-visible");

                    observer.unobserve(entry.target);
                }

            });

        },
        {
            threshold: 0.12
        }
    );

    animatedSections.forEach((section) => {
        section.classList.add("section-hidden");
        observer.observe(section);
    });

});
// =========================================================
// IRISVISION AI — ANIMATED BACKGROUND
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    const background = document.createElement("div");

    background.className = "ambient-background";

    /* GRID */
    const grid = document.createElement("div");

    grid.className = "ambient-grid";

    background.appendChild(grid);


    /* LIGHT STREAK 1 */
    const streakOne = document.createElement("div");

    streakOne.className = "ambient-light-streak";

    background.appendChild(streakOne);


    /* LIGHT STREAK 2 */
    const streakTwo = document.createElement("div");

    streakTwo.className =
        "ambient-light-streak two";

    background.appendChild(streakTwo);


    /* FLOATING CIRCLES */

    const circleOne = document.createElement("div");
    circleOne.className = "ambient-circle one";
    background.appendChild(circleOne);


    const circleTwo = document.createElement("div");
    circleTwo.className = "ambient-circle two";
    background.appendChild(circleTwo);


    const circleThree = document.createElement("div");
    circleThree.className = "ambient-circle three";
    background.appendChild(circleThree);


    /* PARTICLES */

    const particles = document.createElement("div");

    particles.className = "background-particles";

    for (let i = 0; i < 35; i++) {

        const particle =
            document.createElement("span");

        particle.className =
            "background-particle";

        const type = i % 7;

        if (type === 0) {
            particle.classList.add("large");
        }

        if (type === 1 || type === 2) {
            particle.classList.add("small");
        }

        particle.style.left =
            `${Math.random() * 100}%`;

        particle.style.animationDuration =
            `${7 + Math.random() * 10}s`;

        particle.style.animationDelay =
            `${Math.random() * 8}s`;

        particles.appendChild(particle);
    }

    background.appendChild(particles);


    /* MINI STARS */

    for (let i = 0; i < 24; i++) {

        const star =
            document.createElement("span");

        star.className = "ambient-star";

        star.style.left =
            `${Math.random() * 100}%`;

        star.style.top =
            `${Math.random() * 100}%`;

        star.style.animationDelay =
            `${Math.random() * 4}s`;

        star.style.animationDuration =
            `${2 + Math.random() * 3}s`;

        background.appendChild(star);
    }


    /* Đưa background vào trang */
    document.body.prepend(background);

});