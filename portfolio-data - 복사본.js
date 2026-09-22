/**
 * ==========================================================================
 * 🌿 박정인 포트폴리오 데이터 설정 파일 (PORTFOLIO_DATA)
 * ==========================================================================
 * 이 파일에서 본인의 실제 정보, 프로젝트, 보유 기술, 활동 및 수상 내역을
 * 간편하게 수정하거나 추가할 수 있습니다.
 * 
 * 항목을 추가할 때는 기존 양식을 복사하여 쉼표(,)로 구분해 넣어주시면 됩니다.
 */

const PORTFOLIO_DATA = {
  // ------------------------------------------------------------------------
  // 1. 기본 프로필 정보 (HOME & ABOUT & CONTACT에 공통 반영)
  // ------------------------------------------------------------------------
  profile: {
    name: "박정인",
    enName: "Park Jung-in",
    department: "그린스마트시티학과",
    studentId: "24학번",
    status: "학부 재학",
    email: "sally10008@naver.com",
    phone: "010-82XX-XXXX",
    location: "대한민국 경기도 하남시",
    sloganBadge: "Green Smart City & Spatial Planner",
    mainHeadline: "데이터와 자연을 이어<br><span class=\"gradient-text\">더 살기 좋은 도시 공간</span>을<br>설계합니다.",
    subHeadline: "안녕하세요! <strong>24학번 그린스마트시티학과 박정인</strong>입니다.<br>GIS 공간정보 빅데이터 분석과 자연생태복원 기술을 융합하여,<br class=\"hide-mobile\">사람과 환경이 조화롭게 지속 가능한 스마트 도시의 내일을 연구하고 계획합니다.",
    quote: "“공간에 쌓이는 빅데이터를 이해하고, 자연 생태계의 복원력을 도시 인프라에 심어내는 전문가로 성장하고 있습니다.”",
    
    // 네비게이션 및 배너에 표시되는 공간 좌표계 정보
    crs: "EPSG:5186 (Korea Central Belt 2010)",
    coordinates: "LAT: 37.5393° N | LON: 127.2148° E",
    
    // 소셜 및 포트폴리오 링크
    socialLinks: {
      github: "https://github.com",
      notion: "https://notion.so",
      linkedin: "https://linkedin.com"
    }
  },

  // ------------------------------------------------------------------------
  // 2. 홈 히어로 통계 띠지 (실제 본인의 학업 현황에 맞게 수정 가능)
  // ------------------------------------------------------------------------
  heroStats: [
    { num: "24", unit: "학번", label: "그린스마트시티학과" },
    { num: "6", unit: "건", label: "수행한 공간 프로젝트" },
    { num: "4", unit: "분야", label: "공간·설계·생태 툴킷" },
    { num: "100", unit: "%", label: "문제 해결 및 탐구 열정" }
  ],

  // ------------------------------------------------------------------------
  // 3. ABOUT 섹션 데이터
  // ------------------------------------------------------------------------
  about: {
    // 소개 글 (단락별)
    bioParagraphs: [
      "현대 도시는 기후 위기, 열섬 현상, 녹지 단절, 급격한 도시화 등 다차원적인 환경적·공간적 과제에 직면해 있습니다. 저는 <strong>그린스마트시티학과</strong>에서 학업을 진행하며, 도시의 물리적 구조뿐만 아니라 그 속에 살아 숨 쉬는 <strong>자연 생태계와 첨단 스마트 인프라의 융합</strong>을 심도 있게 탐구하고 있습니다.",
      "특히 <strong>QGIS와 ArcGIS Pro를 활용한 공간정보 다기준 평가(MCE) 및 네트워크 분석</strong>, <strong>AutoCAD와 SketchUp을 통한 정밀 도면 및 친환경 공간 모델링</strong>을 지속적으로 연마하며, 이론에 머무르지 않고 실제 도시 공간의 문제를 해결하는 데이터 기반 공간 기획 능력을 기르고 있습니다."
    ],

    // 3대 핵심 가치 및 지향점
    coreValues: [
      {
        step: "01",
        title: "데이터 기반 공간 의사결정",
        desc: "GIS 공간 통계와 공공데이터를 결합하여 감각이 아닌 객관적 데이터로 입지를 선정하고 공간 구조를 분석합니다.",
        icon: "ph-chart-line-up"
      },
      {
        step: "02",
        title: "자연과 공존하는 생태 인프라",
        desc: "비오톱 복원, 바람길 조성, 저영향개발(LID) 기법을 도시 설계에 도입해 기후적응형 생태도시를 설계합니다.",
        icon: "ph-leaf"
      },
      {
        step: "03",
        title: "사람 중심 스마트시티 솔루션",
        desc: "교통약자 이동 편의와 친환경 스마트 모빌리티 연계 등 시민의 삶의 질을 실질적으로 높이는 공간을 기획합니다.",
        icon: "ph-devices"
      }
    ],

    // 관심 및 연구 분야 태그 목록 (추가/삭제 쉬움)
    interests: [
      "도시 공간구조 및 지구단위계획",
      "QGIS / ArcGIS 공간 통계 & 버퍼 분석",
      "자연생태복원 및 생태통로(Corridor) 복원",
      "기후변화 적응형 저영향개발(LID)",
      "탄소중립 스마트 녹색인프라",
      "보행환경 개선 및 스마트 가로설계",
      "Python & 공간 빅데이터 시각화",
      "환경영향평가 및 생태네트워크"
    ]
  },

  // ------------------------------------------------------------------------
  // 4. PROJECT 섹션 데이터 (새 프로젝트 추가 시 아래 배열에 새 객체를 추가하세요)
  // ------------------------------------------------------------------------
  projects: [
    {
      id: "p1",
      category: "gis eco", // 필터용 카테고리 (gis, smartcity, eco, research)
      categoryLabel: "GIS & 기후적응",
      themeColor: "green-theme", // visual header 테마 (green-theme, blue-theme, teal-theme, indigo-theme, slate-theme)
      period: "2024.09 - 2024.12 (캡스톤 디자인)",
      role: "팀장 / 공간 다기준 분석(MCE) 및 데이터 모델링 총괄",
      title: "서울시 도시열섬 완화를 위한 바람길 및 옥상녹화 우선입지 분석",
      summary: "기상청 지표면온도(LST) 데이터와 수치표고모델(DEM)을 QGIS 공간 다기준 분석(MCE)으로 결합하여 열환경 취약지 및 옥상녹화 최적지를 도출.",
      tools: ["QGIS", "Python (GeoPandas)", "ArcGIS DEM Raster", "기상청 지표면온도(LST)"],
      
      // 모달 상세 페이지 내용
      modalDetails: {
        background: "기후변화와 고밀도 도심 개발로 인해 서울 도심부의 열섬 현상(UHI)이 심화되고 있습니다. 특히 바람의 순환이 차단된 구도심 지역은 여름철 열대야 일수 증가와 노약자 온열질환 위험이 가중되고 있어, 데이터에 기반한 친환경 공간 복원 대책이 시급했습니다.",
        objectives: [
          "서울시 수치표고모델(DEM)과 건축물 높이 데이터를 활용한 도심 찬공기 생성원 및 바람길 유동 경로 도출",
          "Landsat 위성영상 지표면온도(LST) 데이터와 건물 노후도·옥상 가용면적 중첩 분석",
          "AHP(계층화 의사결정법) 가중치를 적용한 옥상녹화 우선 설치 대상지 10대 블록 최종 선정"
        ],
        methodology: [
          "<strong>데이터 수집 및 전처리:</strong> VWorld 연속지적도, 건물통합정보, 환경부 토지피복지도, Landsat-8 TIR 열적외선 밴드 처리",
          "<strong>바람길 분석:</strong> QGIS 지형분석 도구를 활용하여 주풍향(서남서풍) 대비 바람 유입 저해 건축물 장벽도 분석",
          "<strong>다기준 공간 평가(MCE):</strong> 지표온도 34°C 이상 지역, 옥상 면적 300㎡ 이상 평지붕 건물, 노인인구 밀집도를 레이어 가중합(Weighted Overlay)으로 산출",
          "<strong>시각화 및 제언:</strong> 녹색 인프라 연계를 위한 단계별 옥상정원 조성 로드맵 및 예상 온도 저감 효과(평균 1.2°C 저감) 시뮬레이션 제시"
        ],
        results: "도심 내 단절된 바람길 3개 주축을 발굴하고, 우선 추진이 필요한 공공/민간 건축물 옥상녹화 대상지 18개소를 우선순위화하여 제시했습니다. 본 프로젝트는 단과대학 캡스톤 경진대회에서 우수상을 수상하며 실무 적용 가능성을 인정받았습니다."
      }
    },
    {
      id: "p2",
      category: "smartcity eco",
      categoryLabel: "스마트 가로설계",
      themeColor: "blue-theme",
      period: "2024.04 - 2024.06 (도시설계 스튜디오)",
      role: "2D 도면(AutoCAD) 작도, 3D 매스 모델링(SketchUp), 패널 그래픽",
      title: "보행친화형 스마트 그린 모빌리티 & 가로공간 재생 마스터플랜",
      summary: "노후 구도심 이면도로를 대상으로 PM(개인형 이동장치) 전용 차선, 빗물침투 화단, 스마트 쉘터를 통합한 보행자 중심 가로 설계안 제시.",
      tools: ["AutoCAD", "SketchUp", "Adobe Photoshop", "Indesign", "Enscape"],
      modalDetails: {
        background: "보행로와 차도가 분리되지 않은 노후 역세권 상업·주거 혼합가로는 보행자의 안전 사고 위험이 높고, 무단 주차된 전동 킥보드(PM)로 인해 보행 환경이 심각하게 저해되어 있었습니다.",
        objectives: [
          "차량 중심 가로 구조를 보행자·PM 공존형 완전가로(Complete Streets) 구조로 재편",
          "가로변 빗물침투형 식재 띠(Bioswale) 및 투수성 친환경 포장 설계",
          "스마트 IoT 쉼터(미세먼지 정화, 스마트 충전, 비상벨)와 연계된 스마트 모빌리티 스테이션 배치"
        ],
        methodology: [
          "<strong>현장 보행량 및 유동 패턴 실측:</strong> 출퇴근 및 주말 시간대별 보행 밀도와 PM 이동 경로 트래킹",
          "<strong>AutoCAD 기반 단면 재구성:</strong> 기존 왕복 2차선(폭 12m)을 일방통행(1차선 3.5m)으로 축소하고, 보행 폭을 2m에서 4.5m로 대폭 확장",
          "<strong>SketchUp & Enscape 3D 투시도 제작:</strong> 스마트 쉘터, 포켓파크, 수목 식재 배치를 3D로 시각화하여 주민 및 심사위원 설명자료 완성"
        ],
        results: "보행자 전용 공간 확보율 120% 증가, 스마트 빗물저류 침투화단 도입으로 가로변 강우 유출량 35% 저감 모델을 제시하여 호평을 받았습니다."
      }
    },
    {
      id: "p3",
      category: "eco gis",
      categoryLabel: "자연생태복원",
      themeColor: "teal-theme",
      period: "2024.10 - 2024.11 (환경생태학 연구)",
      role: "현장 식생/조류 비오톱 조사 및 ArcGIS Pro 최소비용경로(Least-cost Path) 분석",
      title: "도심형 하천 수생태계 건강성 평가 및 생태통로 네트워크 설계",
      summary: "단절된 도심 하천 구간의 식생·조류 비오톱을 현장 조사하고, GIS 최소비용경로(Least-cost Path) 알고리즘을 적용한 생태 징검다리 복원안 도출.",
      tools: ["ArcGIS Pro", "현장 비오톱 조사", "Biotope Mapping", "QGIS", "Excel"],
      modalDetails: {
        background: "인공호안과 도로로 단절된 도심 하천 구간은 수변 야생동물의 이동이 차단되고 귀화식물이 번성하여 생태적 연속성이 심각하게 훼손되어 있었습니다.",
        objectives: [
          "대상 하천 구간(3.2km)의 비오톱 유형 분류 및 생태적 건강성 등급 평가(1~5등급)",
          "수변 소생물(조류, 양서파충류) 서식지 단절 지점 5개소 정밀 도출",
          "친환경 식생 매트, 징검다리형 거점 비오톱(Stepping Stone) 및 생태통로 복원 계획안 수립"
        ],
        methodology: [
          "<strong>비오톱 현장 조사:</strong> 수변 목본/초본 식생 피도 및 귀화식물(단풍잎돼지풀 등) 분포도 GPS 매핑",
          "<strong>공간 저항도(Resistance Surface) 모델링:</strong> 도로 폭, 조명 조도, 인간 간섭 요소를 반영한 생태 이동 비용 표면 구축",
          "<strong>ArcGIS Pro Cost Distance & Corridor Tool:</strong> 야생생물 최소 이동 저항선 및 핵심 복원 연결축 도출"
        ],
        results: "하천-근린공원 간 생태 단절 구간을 연결하는 3개소의 에코코리더(Eco-Corridor)와 다단 수변 식재 복원 설계를 도출했습니다."
      }
    },
    {
      id: "p4",
      category: "smartcity gis",
      categoryLabel: "스마트 수자원 (LID)",
      themeColor: "indigo-theme",
      period: "2024.05 - 2024.06 (스마트시티 솔루션)",
      role: "유역 수문 지형 분석 및 수치 표고 계산, 식생체류지 입지 모델링",
      title: "기후적응형 스마트 빗물순환(LID) 저류시설 최적 배치 시뮬레이션",
      summary: "집중호우 시 불투수면적 유출계수를 산출하고 지형 경사도와 배수 네트워크를 분석해 침수 취약지 내 식생체류지(Rain Garden) 최적 입지 선정.",
      tools: ["QGIS 수문분석", "LID 기법", "Python", "AutoCAD"],
      modalDetails: {
        background: "도심지 불투수면적 비율이 75%를 초과하는 고밀 저지대 지역은 국지성 집중호우 시 상습 침수 피해와 도시 하천 오염이 반복되는 취약성을 지니고 있습니다.",
        objectives: [
          "지형 경사, 토양 침투율, 불투수 면적을 고려한 유출 계수 정밀 산출",
          "공공 부지(공원, 공영주차장, 유휴지) 내 저영향개발(LID) 시설 최적 입지 우선순위 선정",
          "IoT 수위 센서와 연계된 스마트 배수 밸브 제어 개념 설계"
        ],
        methodology: [
          "<strong>QGIS Hydrology Analysis:</strong> DEM 기반 흐름 방향(Flow Direction) 및 집수 유역(Flow Accumulation) 계산",
          "<strong>침수 취약 지수 산정:</strong> 과거 침수 이력 데이터와 지형적 저지대 버퍼 중첩",
          "<strong>LID 공법 매칭:</strong> 공원 지역은 식생체류지(Rain Garden), 주차장은 투수블록 및 빗물 지하저류조 설계"
        ],
        results: "100년 빈도 강우 발생 시 첨두 유출량을 최대 28% 저감할 수 있는 8개 스마트 LID 거점을 도출하고 기술 제안서를 완성했습니다."
      }
    },
    {
      id: "p5",
      category: "eco research",
      categoryLabel: "탄소중립 · 인벤토리",
      themeColor: "green-theme",
      period: "2024.03 - 2024.05 (학술동아리 UrbanEco)",
      role: "수목 현장 전수조사 및 GIS 공간 DB 속성 구축, 탄소저장량 산정",
      title: "캠퍼스 탄소중립 수목 탄소흡수원 공간 매핑 및 정량화 연구",
      summary: "대학 캠퍼스 내 수목 420주의 흉고직경(DBH)과 수고, 수종을 전수 조사하여 GIS 속성 DB를 구축하고 연간 온실가스 흡수량 정량 산정.",
      tools: ["수목 인벤토리", "QGIS 매핑", "통계분석", "Photoshop"],
      modalDetails: {
        background: "대학 캠퍼스의 2050 탄소중립 달성을 위해 캠퍼스 내 녹지가 흡수·저장하는 탄소량을 정확하게 정량화하고 체계적인 관리 인벤토리를 구축할 필요성이 대두되었습니다.",
        objectives: [
          "교내 주요 수목 420주에 대한 수종, 흉고직경(DBH), 수고, 건강도 전수 조사",
          "국립산림과학원 수종별 바이오매스 확장계수를 적용한 연간 탄소 저장량 정량 산출",
          "QGIS 기반 캠퍼스 그린맵(Green Map) 웹 대시보드 기초 데이터셋 구축"
        ],
        methodology: [
          "<strong>모바일 현장 조사:</strong> GPS 기반 수목 위치 측위 및 사진 아카이빙",
          "<strong>탄소 저장량 공식 적용:</strong> 표준 상대성장식 활용 계산",
          "<strong>QGIS 공간 분포 시각화:</strong> 수목 수관투영면적(Canopy Cover) 버퍼링 및 구역별 탄소흡수 등급 심볼화"
        ],
        results: "캠퍼스 내 수목의 연간 총 탄소 저장량이 약 48.2톤에 달함을 규명하였으며, 고탄소흡수 수종(느티나무, 상수리나무)의 추가 식재 권장 구역을 지도화하여 학교 시설팀에 제안했습니다."
      }
    },
    {
      id: "p6",
      category: "gis smartcity research",
      categoryLabel: "공공데이터 & 복지",
      themeColor: "slate-theme",
      period: "2024.11 - 2024.12 (공간정보 데이터톤)",
      role: "데이터 크롤링, Python 공간 시각화, AHP 평가 모델링",
      title: "공공빅데이터 기반 교통약자 스마트 안심 쉼터 최적 입지 선정",
      summary: "고령 인구 밀집도, 버스 정류장 접근성, 복지관 거리 등을 Python 및 QGIS 공간 통계로 융합하고 AHP 계층분석을 통해 최적 설치 후보지 도출.",
      tools: ["Python Folium", "QGIS Buffer", "AHP 의사결정", "공공데이터"],
      modalDetails: {
        background: "폭염과 한파 등 극한 기후가 잦아짐에 따라 야외 활동 시 고령자, 장애인 등 교통약자의 이동 중 휴식 공간 부족 문제가 도시 복지의 주요 이슈로 떠올랐습니다.",
        objectives: [
          "65세 이상 고령 인구 밀도, 버스 정류소 대기 인원, 복지관 및 보건소 위치 공간 융합",
          "도보 5분(반경 300m) 이내 쉼터 미도달 음영 구역(Blind Spot) 정밀 추출",
          "스마트 냉난방, 혈압 측정 IoT 키오스크를 갖춘 스마트 안심 쉼터 최적 입지 5개소 제안"
        ],
        methodology: [
          "<strong>공공데이터 수집:</strong> 서울시 유동인구, 정류소 승하차 데이터, 경로당 위치 지오코딩(Geocoding)",
          "<strong>Python Folium 히트맵 분석:</strong> 인구 수요 밀집도와 기존 쉼터 버퍼 간 차집합(Difference) 연산",
          "<strong>AHP(전문가 쌍대비교) 가중치 부여:</strong> 수요성(0.45), 접근성(0.35), 시공 타당성(0.20) 종합 스코어링"
        ],
        results: "교통약자 접근 편의성을 극대화할 수 있는 최적 후보지 5곳을 도출하고 인터랙티브 웹 지도로 시각화하여 경진대회에서 큰 호평을 받았습니다."
      }
    }
  ],

  // ------------------------------------------------------------------------
  // 5. SKILLS 섹션 데이터 (소프트웨어 및 기술 역량)
  // ------------------------------------------------------------------------
  skills: [
    {
      category: "GIS & 공간정보 분석",
      engTag: "Spatial Data Analytics",
      iconClass: "gis-icon",
      icon: "ph-globe-hemisphere-east",
      desc: "공간 빅데이터 가공, 좌표계 변환, 다기준 입지 평가(MCE) 및 네트워크 버퍼 분석 능력",
      items: [
        { name: "QGIS", levelText: "심화 분석 및 MCE 가능", percent: 88 },
        { name: "ArcGIS Pro", levelText: "지형 공간 통계 / 3D 매핑", percent: 80 },
        { name: "Python (GeoPandas / Folium)", levelText: "데이터 정제 & 웹 지도 시각화", percent: 75 },
        { name: "공간데이터 수집 및 정제", levelText: "VWorld / 국가공간정보포털", percent: 90 }
      ]
    },
    {
      category: "도시설계 & CAD / 3D",
      engTag: "Urban Modeling & Drafting",
      iconClass: "cad-icon",
      icon: "ph-cube",
      desc: "도시 마스터플랜 및 가로 시설물 정밀 도면 작도, 지구단위 3D 공간 모델링 및 렌더링",
      items: [
        { name: "AutoCAD", levelText: "2D 평면도 / 가로단면도 작도", percent: 85 },
        { name: "SketchUp", levelText: "3D 공간 매스 및 시설물 모델링", percent: 82 },
        { name: "Enscape / V-Ray", levelText: "투시도 & 조감도 렌더링", percent: 70 },
        { name: "지구단위계획 도면 작성", levelText: "용도지역 및 배치 계획", percent: 80 }
      ]
    },
    {
      category: "그래픽 & 비주얼 패널",
      engTag: "Design & Presentation",
      iconClass: "viz-icon",
      icon: "ph-palette",
      desc: "도시계획 프레젠테이션 패널 디자인, 지도 리터칭 및 분석 다이어그램 인포그래픽 제작",
      items: [
        { name: "Adobe Photoshop", levelText: "분석 지도 및 조감도 리터칭", percent: 85 },
        { name: "Adobe Illustrator", levelText: "다이어그램 및 심볼 벡터화", percent: 80 },
        { name: "Adobe InDesign", levelText: "보고서 및 포트폴리오 조판", percent: 72 },
        { name: "MS PowerPoint / Canva", levelText: "피칭 자료 및 발표 기획", percent: 92 }
      ]
    },
    {
      category: "자연생태복원 & 환경연구",
      engTag: "Ecological & Field Survey",
      iconClass: "eco-icon",
      icon: "ph-flower-lotus",
      desc: "현장 식생/비오톱 조사, 생태통로 설계 기법, 저영향개발(LID) 수자원 환경 평가",
      items: [
        { name: "비오톱(Biotope) 현장조사", levelText: "식생 피도 조사 & 등급 평가", percent: 85 },
        { name: "자연생태복원 기법", levelText: "생태통로 및 친환경 식재 계획", percent: 78 },
        { name: "기후적응형 LID 공법", levelText: "식생체류지 & 빗물순환 설계", percent: 82 },
        { name: "환경영향평가 기초", levelText: "생태 네트워크 영향 분석", percent: 76 }
      ]
    }
  ],

  // ------------------------------------------------------------------------
  // 6. CAREER 섹션 데이터 (자격증, 대외활동, 수상)
  // ------------------------------------------------------------------------
  career: {
    // 자격증 및 교육 이수
    certifications: [
      {
        status: "prep", // "prep" (준비 중) 또는 "pass" (취득 완료)
        statusText: "준비 중",
        title: "자연생태복원기사 (기사)",
        org: "한국산업인력공단 (2025 취득 목표)",
        desc: "생태계 구조 및 기능, 환경계획, 생태복원공학 및 생태조사방법론 필기 집중 학습 중"
      },
      {
        status: "pass",
        statusText: "이수 완료",
        title: "QGIS 기반 공간정보 빅데이터 실무과정",
        org: "공간정보산업진흥원 (2024.08)",
        desc: "공간데이터 분석, 래스터 지형 분석 및 좌표계 변환 실무 40시간 이수"
      },
      {
        status: "pass",
        statusText: "취득 완료",
        title: "AutoCAD 공인 인증 자격 (ACU)",
        org: "Autodesk (2024.07)",
        desc: "2D 건축 및 도시 도면 작도, 레이어 관리 및 정밀 출력 능력 인증"
      },
      {
        status: "pass",
        statusText: "취득 완료",
        title: "컴퓨터활용능력 1급",
        org: "대한상공회의소 (2024.02)",
        desc: "고급 엑셀 데이터 분석, 매크로 및 관계형 데이터베이스(Access) 운용"
      }
    ],

    // 학술 활동 및 대외활동
    activities: [
      {
        period: "2024.03 - 현재",
        title: "그린스마트시티 학술 연구동아리 [UrbanEco]",
        org: "교내 전공 학술동아리 (GIS 팀원)",
        desc: "기후변화 대응 도시 열섬 완화 스터디 및 격주 공간정보 분석 세미나 발제 참여"
      },
      {
        period: "2024.07 - 2024.09",
        title: "청년 도시재생 & 생태거리 가로모니터링단",
        org: "지자체 도시재생지원센터",
        desc: "구도심 골목길 보행 안전성 및 녹지율 현장 모니터링 수행, 개선 제안서 제출"
      },
      {
        period: "2024.05 - 2024.06",
        title: "대학생 공간정보 데이터톤 (Datathon) 참가",
        org: "공간정보융합연구회",
        desc: "서울시 유동인구 및 공공데이터를 활용한 스마트 쉼터 최적 입지 모델 프로토타입 개발"
      },
      {
        period: "2024.04 - 2024.11",
        title: "도심 생태하천 모니터링 봉사단",
        org: "환경실천연합회",
        desc: "월 1회 수질 측정 및 하천변 수생식물·조류 서식지 관찰 기록 활동"
      }
    ],

    // 수상 및 학업 성과
    awards: [
      {
        period: "2024.12",
        title: "전공 캡스톤 디자인 아이디어 경진대회 [우수상]",
        org: "단과대학 학장상",
        desc: "‘QGIS 기반 도시열섬 취약지 분석 및 옥상녹화 우선입지 선정’ 프로젝트로 호평 수상"
      },
      {
        period: "2024.10",
        title: "스마트 그린도시 아이디어 공모전 [장려상]",
        org: "한국스마트도시학회 대학생부문",
        desc: "‘도심형 친환경 빗물순환 저류지 시스템 및 IoT 스마트 센서 연계안’ 제안"
      },
      {
        period: "2024.06",
        title: "2024-1학기 학업성적우수 장학",
        org: "대학교 본부",
        desc: "도시계획개론, 환경생태학, 기초GIS 등 전공 전과목 우수 성적 달성"
      }
    ]
  }
};
