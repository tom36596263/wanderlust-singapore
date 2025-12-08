document.addEventListener("DOMContentLoaded", (event) => {
    
    // 註冊 GSAP Media Query 管理器
    let mm = gsap.matchMedia();

    // 取得所有跑馬燈區塊
    const bgBlocks = document.querySelectorAll(".marquee-background .marquee-block .marquee-wrapper");

    // --- 情境 A: 桌機版 (寬度 > 768px) ---
    // 效果：保持橫向向右跑，隨機速度
    mm.add("(min-width: 769px)", () => {
        bgBlocks.forEach((wrapper) => {
            // 初始設定：水平位置
            gsap.set(wrapper, { xPercent: -33.33, yPercent: 0 });

            // 隨機速度 15~25秒
            const randomDuration = Math.random() * (25 - 15) + 15;

            gsap.to(wrapper, {
                xPercent: 0,      // 向右跑
                repeat: -1,
                duration: randomDuration,
                ease: "none"
            });
        });
    });

    // --- 情境 B: 手機版 (寬度 <= 768px) ---
    // 效果：垂直向下跑 (瀑布流)，隨機速度
    mm.add("(max-width: 768px)", () => {
        bgBlocks.forEach((wrapper) => {
            // 初始設定：垂直位置 (因為文字轉直了，內容變很高，所以起始點設 -33%)
            gsap.set(wrapper, { xPercent: 0, yPercent: -33.33 });

            // 手機版速度稍微慢一點，避免暈眩 (20~40秒)
            const randomDuration = Math.random() * (40 - 20) + 20;

            gsap.to(wrapper, {
                yPercent: 0,      // 向下跑
                repeat: -1,
                duration: randomDuration,
                ease: "none"
            });
        });
    });

    // --- 中間層 SINGAPORE 大跑馬燈 (永遠保持橫向向左) ---
    // 這個不需要分裝置，因為方向一樣，只是 CSS 位置不同
    gsap.to(".scroll-big .marquee-wrapper", {
        xPercent: -25, 
        repeat: -1,
        duration: 30,  
        ease: "none"
    });

});