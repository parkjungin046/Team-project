/**
 * ==========================================================================
 * VISIT PAGE - LIVE WEATHER WIDGET
 * 상명대학교 천안캠퍼스(상명대길 31) 좌표 기준 실시간 날씨(기온·습도)를
 * Open-Meteo API(무료, API 키 불필요)로 가져와 표시한다.
 * ==========================================================================
 */
const VISIT_LOCATION = {
  latitude: 36.833,
  longitude: 127.178,
};

document.addEventListener("DOMContentLoaded", () => {
  loadCurrentWeather();
});

async function loadCurrentWeather() {
  const loadingEl = document.getElementById("weather-loading");
  const contentEl = document.getElementById("weather-content");
  const errorEl = document.getElementById("weather-error");
  const updatedEl = document.getElementById("weather-updated");
  if (!loadingEl || !contentEl || !errorEl) return;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${VISIT_LOCATION.latitude}&longitude=${VISIT_LOCATION.longitude}&current=temperature_2m,relative_humidity_2m&timezone=Asia%2FSeoul`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`날씨 API 응답 오류 (HTTP ${res.status})`);
    const data = await res.json();
    const current = data.current;
    if (!current || typeof current.temperature_2m !== "number") {
      throw new Error("날씨 데이터 형식이 올바르지 않습니다.");
    }

    document.getElementById("weather-temp").textContent = Math.round(current.temperature_2m * 10) / 10;
    document.getElementById("weather-humidity").textContent = Math.round(current.relative_humidity_2m);

    if (updatedEl && current.time) {
      updatedEl.textContent = `기준 시각: ${formatKstTime(current.time)}`;
    }

    loadingEl.hidden = true;
    errorEl.hidden = true;
    contentEl.hidden = false;
  } catch (err) {
    console.warn("날씨 정보를 불러오지 못했습니다.", err);
    loadingEl.hidden = true;
    contentEl.hidden = true;
    errorEl.hidden = false;
  }
}

function formatKstTime(isoLocalString) {
  // Open-Meteo는 timezone 파라미터에 맞춰 "YYYY-MM-DDTHH:mm" 형식의 현지 시각 문자열을 반환한다.
  const [datePart, timePart] = isoLocalString.split("T");
  if (!datePart || !timePart) return isoLocalString;
  return `${datePart} ${timePart}`;
}
